import React, { useState } from 'react';
import { Brain, Loader } from 'lucide-react';
import { useFamilyStore } from '../store/familyStore';
import { OpenAI } from 'openai';

interface AIDietRecommendationsProps {
  memberId: string;
  onRecommendationsGenerated: (recommendations: any) => void;
}

const openai = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: 'sk-e07a154cdea64da490f6adff30ee3b88',
  dangerouslyAllowBrowser: true
});

export default function AIDietRecommendations({ memberId, onRecommendationsGenerated }: AIDietRecommendationsProps) {
  const [loading, setLoading] = useState(false);
  const { members } = useFamilyStore();
  const member = members.find(m => m.id === memberId);

  const generateRecommendations = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer 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`,
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            {
              role: "system",
              content: "You are a professional nutritionist. Provide specific, actionable diet recommendations."
            },
            {
              role: "user",
              content: `Generate diet recommendations based on the following details:
                Current meals: ${JSON.stringify(member?.diet_plans?.[0]?.meals || {})}
                Restrictions: ${member?.diet_plans?.[0]?.restrictions?.join(', ') || 'None'}
                Health Status: ${member?.health_status || 'Healthy'}
                Please provide 5 specific, actionable diet recommendations.`
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      const recommendations = data.choices[0].message.content
        .split('\n')
        .filter(Boolean)
        .map(rec => rec.trim());

      onRecommendationsGenerated({ recommendations });
    } catch (error) {
      console.error('Error generating recommendations:', error);
      alert('Failed to generate recommendations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4">
      <button
        onClick={generateRecommendations}
        disabled={loading}
        className="flex items-center space-x-2 px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader className="w-5 h-5 animate-spin" />
            <span>Generating...</span>
          </>
        ) : (
          <>
            <Brain className="w-5 h-5" />
            <span>Get AI Recommendations</span>
          </>
        )}
      </button>
    </div>
  );
} 