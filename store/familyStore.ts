import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { FamilyMember, Transaction, Medication, MedicalRecord, DietPlan } from '../types';

interface FamilyStore {
  members: FamilyMember[];
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  fetchMembers: () => Promise<void>;
  addMember: (member: Omit<FamilyMember, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateMember: (memberId: string, updates: Partial<FamilyMember>) => Promise<void>;
  removeMember: (memberId: string) => Promise<void>;
  addMedication: (memberId: string, medication: Omit<Medication, 'id' | 'member_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateMedication: (memberId: string, medicationId: string, updates: Partial<Medication>) => Promise<void>;
  removeMedication: (memberId: string, medicationId: string) => Promise<void>;
  addMedicalRecord: (memberId: string, record: Omit<MedicalRecord, 'id' | 'member_id' | 'created_at'>) => Promise<void>;
  updateMedicalRecord: (memberId: string, recordId: string, updates: Partial<MedicalRecord>) => Promise<void>;
  removeMedicalRecord: (memberId: string, recordId: string) => Promise<void>;
  transferMoney: (fromId: string, toId: string, amount: number, description?: string, paymentProof?: string) => Promise<void>;
  getTransactionHistory: (memberId: string) => Promise<Transaction[]>;
  addDietPlan: (memberId: string, plan: Omit<DietPlan, 'id' | 'member_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateDietPlan: (memberId: string, planId: string, updates: Partial<DietPlan>) => Promise<void>;
  generateHealthRecommendations: (memberId: string) => Promise<string[]>;
  fetchTransactions: () => Promise<void>;
}

export const useFamilyStore = create<FamilyStore>((set, get) => ({
  members: [],
  transactions: [],
  isLoading: false,
  error: null,

  fetchMembers: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) throw new Error('Not authenticated');

      const { data: members, error } = await supabase
        .from('family_members')
        .select(`
          *,
          medical_records (*),
          medications (*),
          diet_plans (*),
          emergency_contacts (*)
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      // Fetch transactions after members are loaded
      const { data: transactions, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .or(`from_id.in.(${members?.map(m => m.id).join(',')}),to_id.in.(${members?.map(m => m.id).join(',')})`)
        .order('created_at', { ascending: false });

      if (txError) throw txError;

      set({ 
        members: members || [],
        transactions: transactions || []
      });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchTransactions: async () => {
    try {
      const { members } = get();
      if (!members.length) return;

      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('*')
        .or(`from_id.in.(${members.map(m => m.id).join(',')}),to_id.in.(${members.map(m => m.id).join(',')})`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ transactions: transactions || [] });
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  },

  addDietPlan: async (memberId, planData) => {
    try {
      const { data: plan, error } = await supabase
        .from('diet_plans')
        .insert([{ ...planData, member_id: memberId }])
        .select()
        .single();

      if (error) throw error;

      // Update local state
      set((state) => ({
        members: state.members.map((member) =>
          member.id === memberId
            ? {
                ...member,
                diet_plans: [...(member.diet_plans || []), plan]
              }
            : member
        )
      }));
    } catch (error) {
      console.error('Failed to add diet plan:', error);
      throw error;
    }
  },

  updateDietPlan: async (memberId, planId, updates) => {
    try {
      const { error } = await supabase
        .from('diet_plans')
        .update(updates)
        .eq('id', planId)
        .eq('member_id', memberId);

      if (error) throw error;

      set((state) => ({
        members: state.members.map((member) =>
          member.id === memberId && member.diet_plans
            ? {
                ...member,
                diet_plans: member.diet_plans.map((plan) =>
                  plan.id === planId ? { ...plan, ...updates } : plan
                ),
              }
            : member
        ),
      }));
    } catch (error) {
      console.error('Failed to update diet plan:', error);
      throw error;
    }
  },

  generateHealthRecommendations: async (memberId) => {
    try {
      const member = get().members.find(m => m.id === memberId);
      if (!member) return [];

      const medicalHistory = member.medical_records?.map(record => ({
        type: record.type,
        description: record.description,
        date: record.date
      }));

      const medications = member.medications?.map(med => ({
        name: med.name,
        dosage: med.dosage,
        frequency: med.frequency
      }));

      // Call Supabase Edge Function for AI recommendations
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/health-recommendations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          medicalHistory,
          medications,
          healthStatus: member.health_status
        })
      });

      if (!response.ok) throw new Error('Failed to generate recommendations');
      
      const { recommendations } = await response.json();
      
      // Update member with new recommendations
      await supabase
        .from('family_members')
        .update({ recommendations })
        .eq('id', memberId);

      set((state) => ({
        members: state.members.map((m) =>
          m.id === memberId
            ? { ...m, recommendations }
            : m
        ),
      }));

      return recommendations;
    } catch (error) {
      console.error('Error generating recommendations:', error);
      return [];
    }
  },

  addMember: async (memberData) => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) throw new Error('Not authenticated');

      const { data: member, error } = await supabase
        .from('family_members')
        .insert([{ ...memberData, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      if (!member) throw new Error('Failed to create member');

      set((state) => ({ members: [...state.members, member] }));
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  updateMember: async (memberId, updates) => {
    try {
      const { error } = await supabase
        .from('family_members')
        .update(updates)
        .eq('id', memberId);

      if (error) throw error;

      set((state) => ({
        members: state.members.map((m) =>
          m.id === memberId ? { ...m, ...updates } : m
        )
      }));
    } catch (error) {
      console.error('Failed to update member:', error);
      throw error;
    }
  },

  removeMember: async (memberId) => {
    try {
      const { error } = await supabase
        .from('family_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      set((state) => ({
        members: state.members.filter((m) => m.id !== memberId)
      }));
    } catch (error) {
      console.error('Failed to remove member:', error);
      throw error;
    }
  },

  addMedication: async (memberId, medicationData) => {
    set({ isLoading: true, error: null });
    try {
      const { data: medication, error } = await supabase
        .from('medications')
        .insert([{ ...medicationData, member_id: memberId }])
        .select()
        .single();

      if (error) throw error;
      if (!medication) throw new Error('Failed to add medication');

      // Generate new health recommendations after adding medication
      await get().generateHealthRecommendations(memberId);

      set((state) => ({
        members: state.members.map((member) =>
          member.id === memberId
            ? {
                ...member,
                medications: [...(member.medications || []), medication],
              }
            : member
        ),
      }));
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  updateMedication: async (memberId, medicationId, updates) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase
        .from('medications')
        .update(updates)
        .eq('id', medicationId)
        .eq('member_id', memberId);

      if (error) throw error;

      // Generate new health recommendations after updating medication
      await get().generateHealthRecommendations(memberId);

      set((state) => ({
        members: state.members.map((member) =>
          member.id === memberId && member.medications
            ? {
                ...member,
                medications: member.medications.map((med) =>
                  med.id === medicationId ? { ...med, ...updates } : med
                ),
              }
            : member
        ),
      }));
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  removeMedication: async (memberId, medicationId) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase
        .from('medications')
        .delete()
        .eq('id', medicationId)
        .eq('member_id', memberId);

      if (error) throw error;

      // Generate new health recommendations after removing medication
      await get().generateHealthRecommendations(memberId);

      set((state) => ({
        members: state.members.map((member) =>
          member.id === memberId && member.medications
            ? {
                ...member,
                medications: member.medications.filter(
                  (med) => med.id !== medicationId
                ),
              }
            : member
        ),
      }));
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  addMedicalRecord: async (memberId, recordData) => {
    set({ isLoading: true, error: null });
    try {
      const { data: record, error } = await supabase
        .from('medical_records')
        .insert([{ ...recordData, member_id: memberId }])
        .select()
        .single();

      if (error) throw error;
      if (!record) throw new Error('Failed to add medical record');

      // Generate new health recommendations after adding medical record
      await get().generateHealthRecommendations(memberId);

      set((state) => ({
        members: state.members.map((member) =>
          member.id === memberId
            ? {
                ...member,
                medical_records: [...(member.medical_records || []), record],
              }
            : member
        ),
      }));
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  updateMedicalRecord: async (memberId, recordId, updates) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase
        .from('medical_records')
        .update(updates)
        .eq('id', recordId)
        .eq('member_id', memberId);

      if (error) throw error;

      // Generate new health recommendations after updating medical record
      await get().generateHealthRecommendations(memberId);

      set((state) => ({
        members: state.members.map((member) =>
          member.id === memberId && member.medical_records
            ? {
                ...member,
                medical_records: member.medical_records.map((record) =>
                  record.id === recordId ? { ...record, ...updates } : record
                ),
              }
            : member
        ),
      }));
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  removeMedicalRecord: async (memberId, recordId) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase
        .from('medical_records')
        .delete()
        .eq('id', recordId)
        .eq('member_id', memberId);

      if (error) throw error;

      // Generate new health recommendations after removing medical record
      await get().generateHealthRecommendations(memberId);

      set((state) => ({
        members: state.members.map((member) =>
          member.id === memberId && member.medical_records
            ? {
                ...member,
                medical_records: member.medical_records.filter(
                  (record) => record.id !== recordId
                ),
              }
            : member
        ),
      }));
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  transferMoney: async (fromId, toId, amount, description, paymentProof) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase
        .from('transactions')
        .insert([{
          from_id: fromId,
          to_id: toId,
          amount,
          description,
          payment_proof: paymentProof,
          status: 'completed'
        }]);

      if (error) throw error;

      // Update balances
      const { members } = get();
      const fromMember = members.find(m => m.id === fromId);
      const toMember = members.find(m => m.id === toId);

      if (fromMember && toMember) {
        await Promise.all([
          supabase
            .from('family_members')
            .update({ balance: (fromMember.balance || 0) - amount })
            .eq('id', fromId),
          supabase
            .from('family_members')
            .update({ balance: (toMember.balance || 0) + amount })
            .eq('id', toId)
        ]);
      }

      // Refresh members and transactions
      await get().fetchMembers();
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  getTransactionHistory: async (memberId) => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .or(`from_id.eq.${memberId},to_id.eq.${memberId}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      set({ error: (error as Error).message });
      return [];
    }
  },
}));