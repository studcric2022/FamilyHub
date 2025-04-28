import React, { useState } from 'react';
import { useFamilyStore } from '../store/familyStore';
import { Apple, Utensils, Clock, Plus, Scale, Target } from 'lucide-react';
import AddDietPlanModal from './AddDietPlanModal';
import WeeklyMess from './WeeklyMess';
import EditDietPlanModal from './EditDietPlanModal';
import AIDietRecommendations from './AIDietRecommendations';
import type { DietPlan } from '../types';

export default function DietPlanner() {
  const { members } = useFamilyStore();
  const [selectedMember, setSelectedMember] = useState('');
  const [showAddPlan, setShowAddPlan] = useState(false);
  const [showWeeklyMess, setShowWeeklyMess] = useState(false);
  const [showEditPlan, setShowEditPlan] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<DietPlan | null>(null);

  const handleWeeklyMessSave = async (weeklyMess: any) => {
    try {
      // Call the Supabase Edge Function to generate diet plans
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-diet-plan`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          weeklyMess,
          weightGoal: {
            type: 'maintain',
            currentWeight: 55,
            targetWeight: 70
          },
          dietaryRestrictions: []
        })
      });

      if (!response.ok) throw new Error('Failed to generate diet plan');
      
      const data = await response.json();
      console.log('Generated diet plan:', data);
      
      setShowWeeklyMess(false);
    } catch (error) {
      console.error('Error generating diet plan:', error);
    }
  };

  const handleAIRecommendations = (recommendations: any) => {
    if (showAddPlan) {
      // Handle recommendations in AddDietPlanModal instead
      return;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Diet Planner</h2>
        {selectedMember && (
          <button
            onClick={() => setShowAddPlan(true)}
            className="flex items-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
          >
            <Plus className="w-5 h-5" />
            <span>Create Diet Plan</span>
          </button>
        )}
      </div>

      {/* Member Selection */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <label className="block text-sm font-medium text-gray-700">Select Family Member</label>
        <select
          value={selectedMember}
          onChange={(e) => setSelectedMember(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-300 focus:ring focus:ring-green-200"
        >
          <option value="">Choose a member</option>
          {members.map(member => (
            <option key={member.id} value={member.id}>
              {member.name} ({member.relation})
            </option>
          ))}
        </select>
      </div>

      {/* Active Diet Plan */}
      {selectedMember && members.find(m => m.id === selectedMember)?.diet_plans?.[0] && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Current Diet Plan</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-600">Calories</p>
              <p className="text-2xl font-bold text-green-700">
                {members.find(m => m.id === selectedMember)?.diet_plans?.[0].calories} kcal
              </p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-600">Protein</p>
              <p className="text-2xl font-bold text-blue-700">
                {members.find(m => m.id === selectedMember)?.diet_plans?.[0].protein}g
              </p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-sm text-yellow-600">Carbs</p>
              <p className="text-2xl font-bold text-yellow-700">
                {members.find(m => m.id === selectedMember)?.diet_plans?.[0].carbs}g
              </p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-sm text-red-600">Fat</p>
              <p className="text-2xl font-bold text-red-700">
                {members.find(m => m.id === selectedMember)?.diet_plans?.[0].fat}g
              </p>
            </div>
          </div>

          {/* Meal Schedule */}
          <div className="space-y-6">
            {['breakfast', 'lunch', 'dinner', 'snacks'].map(mealType => (
              <div key={mealType} className="border-t pt-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Utensils className="w-5 h-5 text-gray-500" />
                  <h4 className="font-medium text-gray-700 capitalize">{mealType}</h4>
                </div>
                <ul className="space-y-2">
                  {members.find(m => m.id === selectedMember)
                    ?.diet_plans?.[0].meals[mealType]
                    .map((item: string, index: number) => (
                      <li key={index} className="flex items-center space-x-2">
                        <Apple className="w-4 h-4 text-green-500" />
                        <span>{item}</span>
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Recommendations & Restrictions */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Recommendations</h4>
              <ul className="space-y-2">
                {members.find(m => m.id === selectedMember)
                  ?.diet_plans?.[0].recommendations
                  .map((rec: string, index: number) => (
                    <li key={index} className="text-sm text-gray-600">• {rec}</li>
                  ))}
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Restrictions</h4>
              <ul className="space-y-2">
                {members.find(m => m.id === selectedMember)
                  ?.diet_plans?.[0].restrictions
                  .map((res: string, index: number) => (
                    <li key={index} className="text-sm text-red-600">• {res}</li>
                  ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Add Diet Plan Modal */}
      {showAddPlan && selectedMember && (
        <AddDietPlanModal
          onClose={() => setShowAddPlan(false)}
          memberId={selectedMember}
        />
      )}

      <div className="flex justify-between items-center">
        <button
          onClick={() => setShowWeeklyMess(!showWeeklyMess)}
          className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
        >
          {showWeeklyMess ? 'View Diet Plans' : 'Update Weekly Mess'}
        </button>
      </div>

      {showWeeklyMess ? (
        <WeeklyMess onSave={handleWeeklyMessSave} />
      ) : (
        <div className="grid gap-6">
          {members.map((member) => (
            <div key={member.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                      <Utensils className="w-6 h-6 text-green-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">{member.name}</h3>
                      <p className="text-sm text-gray-500">{member.relation}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedMember(member.id);
                      setShowAddPlan(true);
                    }}
                    className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                  >
                    Add Diet Plan
                  </button>
                </div>

                {member.diet_plans && member.diet_plans.length > 0 ? (
                  <div className="space-y-6">
                    {member.diet_plans.map((plan) => (
                      <div key={plan.id} className="border rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center space-x-2 mb-3">
                              <Scale className="w-5 h-5 text-gray-500" />
                              <h4 className="font-medium text-gray-700">Daily Nutrition Goals</h4>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Calories</span>
                                <span className="font-medium">{plan.calories} kcal</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Protein</span>
                                <span className="font-medium">{plan.protein}g</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Carbs</span>
                                <span className="font-medium">{plan.carbs}g</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Fat</span>
                                <span className="font-medium">{plan.fat}g</span>
                              </div>
                            </div>
                          </div>

                          <div className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center space-x-2 mb-3">
                              <Target className="w-5 h-5 text-gray-500" />
                              <h4 className="font-medium text-gray-700">Recommendations</h4>
                            </div>
                            {plan.recommendations.length > 0 ? (
                              <ul className="space-y-2">
                                {plan.recommendations.map((recommendation, index) => (
                                  <li key={index} className="text-gray-600">{recommendation}</li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-gray-500 text-sm">No recommendations available</p>
                            )}
                          </div>
                        </div>

                        <div className="mt-6">
                          <h4 className="font-medium text-gray-700 mb-4">Meal Plan</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {Object.entries(plan.meals).map(([meal, items]) => (
                              <div key={meal} className="border rounded-lg p-4">
                                <h5 className="font-medium text-gray-700 capitalize mb-2">{meal}</h5>
                                <ul className="space-y-1">
                                  {items.map((item, index) => (
                                    <li key={index} className="text-gray-600 text-sm">{item}</li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Utensils className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No diet plans available</p>
                    <p className="text-sm text-gray-400">Create a new diet plan to get started</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedMember && (
        <AIDietRecommendations
          memberId={selectedMember}
          onRecommendationsGenerated={handleAIRecommendations}
        />
      )}

      {/* Edit Modal */}
      {showEditPlan && selectedPlan && (
        <EditDietPlanModal
          onClose={() => {
            setShowEditPlan(false);
            setSelectedPlan(null);
          }}
          dietPlan={selectedPlan}
          memberId={selectedMember}
        />
      )}
    </div>
  );
}