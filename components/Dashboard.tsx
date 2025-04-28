import React, { useEffect } from 'react';
import { Activity, Users, Wallet, AlertTriangle, QrCode } from 'lucide-react';
import { useFamilyStore } from '../store/familyStore';
import AddFamilyMember from './AddFamilyMember';
import { format } from 'date-fns';

export default function Dashboard() {
  const { members, isLoading, error, fetchMembers } = useFamilyStore();

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const stats = {
    needsAttention: members.filter((m) => m.health_status === 'Needs Attention').length,
    totalBalance: members.reduce((sum, m) => sum + (m.balance || 0), 0),
    activeMembers: members.length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-50 text-red-800 p-4 rounded-lg">
          <p className="font-medium">Error loading family members</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Family Dashboard</h2>
        <AddFamilyMember />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Health Alerts</p>
              <p className="text-2xl font-bold text-gray-900">{stats.needsAttention}</p>
            </div>
            <Activity className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Balance</p>
              <p className="text-2xl font-bold text-gray-900">₹{stats.totalBalance}</p>
            </div>
            <Wallet className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Family Members</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeMembers}</p>
            </div>
            <Users className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Family Members</h3>
          <div className="space-y-4">
            {members.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-500" />
                    </div>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{member.name}</p>
                    <div className="text-sm text-gray-500 space-y-1">
                      <p>{member.relation}</p>
                      <p>Born: {format(new Date(member.date_of_birth), 'MMM d, yyyy')}</p>
                      {member.blood_group && <p>Blood Group: {member.blood_group}</p>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Balance</p>
                    <p className="font-medium text-gray-900">₹{member.balance || 0}</p>
                    {member.upi_qr_code && (
                      <button
                        onClick={() => window.open(member.upi_qr_code, '_blank')}
                        className="flex items-center text-blue-600 hover:text-blue-700 mt-2"
                      >
                        <QrCode className="w-4 h-4 mr-1" />
                        <span>View QR</span>
                      </button>
                    )}
                  </div>
                  {member.health_status === 'Needs Attention' && (
                    <div className="flex items-center text-amber-500">
                      <AlertTriangle className="w-5 h-5 mr-2" />
                      <span className="text-sm font-medium">Needs Attention</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}