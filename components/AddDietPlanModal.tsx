import React, { useState } from 'react';
import { X, Plus, Minus, Scale, Target } from 'lucide-react';
import { useFamilyStore } from '../store/familyStore';
import type { DietPlan } from '../types';

interface AddDietPlanModalProps {
  onClose: () => void;
  memberId: string;
}

export default function AddDietPlanModal({ onClose, memberId }: AddDietPlanModalProps) {
  const addDietPlan = useFamilyStore(state => state.addDietPlan);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [formData, setFormData] = useState({
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    start_date: new Date().toISOString(),
    end_date: undefined,
    meals: {
      breakfast: [''],
      lunch: [''],
      dinner: [''],
      snacks: ['']
    },
    recommendations: [''],
    restrictions: ['']
  });

  const addField = (field: 'breakfast' | 'lunch' | 'dinner' | 'snacks' | 'recommendations' | 'restrictions') => {
    if (field === 'recommendations' || field === 'restrictions') {
      setFormData({
        ...formData,
        [field]: [...formData[field], '']
      });
    } else {
      setFormData({
        ...formData,
        meals: {
          ...formData.meals,
          [field]: [...formData.meals[field], '']
        }
      });
    }
  };

  const removeField = (field: 'breakfast' | 'lunch' | 'dinner' | 'snacks' | 'recommendations' | 'restrictions', index: number) => {
    if (field === 'recommendations' || field === 'restrictions') {
      const newArray = [...formData[field]];
      newArray.splice(index, 1);
      setFormData({
        ...formData,
        [field]: newArray
      });
    } else {
      const newArray = [...formData.meals[field]];
      newArray.splice(index, 1);
      setFormData({
        ...formData,
        meals: {
          ...formData.meals,
          [field]: newArray
        }
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberId) return;

    setLoading(true);
    try {
      const planData: Omit<DietPlan, 'id' | 'member_id' | 'created_at' | 'updated_at'> = {
        ...formData,
        calories: parseInt(formData.calories),
        protein: parseInt(formData.protein),
        carbs: parseInt(formData.carbs),
        fat: parseInt(formData.fat),
        end_date: undefined,
        meals: {
          breakfast: formData.meals.breakfast.filter(item => item.trim() !== ''),
          lunch: formData.meals.lunch.filter(item => item.trim() !== ''),
          dinner: formData.meals.dinner.filter(item => item.trim() !== ''),
          snacks: formData.meals.snacks.filter(item => item.trim() !== '')
        },
        recommendations: formData.recommendations.filter(item => item.trim() !== ''),
        restrictions: formData.restrictions.filter(item => item.trim() !== '')
      };

      await addDietPlan(memberId, planData);
      onClose();
    } catch (error) {
      console.error('Failed to add diet plan:', error);
      alert('Failed to create diet plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateAIRecommendations = async () => {
    setAiLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-diet-plan`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          weeklyMess: formData.meals,
          weightGoal: {
            type: 'maintain',
            currentWeight: 70,
            targetWeight: 70
          },
          dietaryRestrictions: formData.restrictions
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate recommendations');
      }

      const data = await response.json();
      
      // अपडेट recommendations
      setFormData(prev => ({
        ...prev,
        recommendations: [...prev.recommendations, ...data.recommendations || []]
      }));

    } catch (error) {
      console.error('Error:', error);
      alert('Failed to generate AI recommendations. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Create Diet Plan</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Macros */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Calories</label>
              <input
                type="number"
                required
                value={formData.calories}
                onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                placeholder="kcal"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Protein</label>
              <input
                type="number"
                required
                value={formData.protein}
                onChange={(e) => setFormData({ ...formData, protein: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                placeholder="g"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Carbs</label>
              <input
                type="number"
                required
                value={formData.carbs}
                onChange={(e) => setFormData({ ...formData, carbs: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                placeholder="g"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Fat</label>
              <input
                type="number"
                required
                value={formData.fat}
                onChange={(e) => setFormData({ ...formData, fat: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                placeholder="g"
              />
            </div>
          </div>

          {/* Meals */}
          {(['breakfast', 'lunch', 'dinner', 'snacks'] as const).map(mealType => (
            <div key={mealType}>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700 capitalize">{mealType}</label>
                <button
                  type="button"
                  onClick={() => addField(mealType)}
                  className="text-green-600 hover:text-green-700"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              {formData.meals[mealType].map((item, index) => (
                <div key={index} className="flex items-center space-x-2 mt-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => {
                      const newMeals = { ...formData.meals };
                      newMeals[mealType][index] = e.target.value;
                      setFormData({ ...formData, meals: newMeals });
                    }}
                    className="flex-1 rounded-md border-gray-300 shadow-sm"
                    placeholder={`Add ${mealType} item`}
                  />
                  <button
                    type="button"
                    onClick={() => removeField(mealType, index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          ))}

          {/* AI Recommendations Button */}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={generateAIRecommendations}
              disabled={aiLoading}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 flex items-center space-x-2"
            >
              {aiLoading ? (
                <>
                  <span className="animate-spin">⚪</span>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <span>✨</span>
                  <span>Get AI Recommendations</span>
                </>
              )}
            </button>
          </div>

          {/* Recommendations Section */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">Recommendations</label>
              <button
                type="button"
                onClick={() => addField('recommendations')}
                className="text-green-600 hover:text-green-700"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            {formData.recommendations.map((item, index) => (
              <div key={index} className="flex items-center space-x-2 mt-2">
                <input
                  type="text"
                  value={item}
                  onChange={(e) => {
                    const newArray = [...formData.recommendations];
                    newArray[index] = e.target.value;
                    setFormData({ ...formData, recommendations: newArray });
                  }}
                  className="flex-1 rounded-md border-gray-300 shadow-sm"
                  placeholder="Add recommendation"
                />
                <button
                  type="button"
                  onClick={() => removeField('recommendations', index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Minus className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>

          {/* Restrictions */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">Restrictions</label>
              <button
                type="button"
                onClick={() => addField('restrictions')}
                className="text-green-600 hover:text-green-700"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            {formData.restrictions.map((item, index) => (
              <div key={index} className="flex items-center space-x-2 mt-2">
                <input
                  type="text"
                  value={item}
                  onChange={(e) => {
                    const newArray = [...formData.restrictions];
                    newArray[index] = e.target.value;
                    setFormData({ ...formData, restrictions: newArray });
                  }}
                  className="flex-1 rounded-md border-gray-300 shadow-sm"
                  placeholder="Add restriction"
                />
                <button
                  type="button"
                  onClick={() => removeField('restrictions', index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Minus className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Plan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 