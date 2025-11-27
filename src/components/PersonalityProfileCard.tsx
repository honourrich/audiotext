import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Brain, BarChart3, User, Target } from 'lucide-react';
import { PersonalityProfile } from '../lib/personalization';

interface PersonalityProfileCardProps {
  profile?: PersonalityProfile;
  showDetails?: boolean;
}

export default function PersonalityProfileCard({ profile, showDetails = true }: PersonalityProfileCardProps) {
  if (!profile) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="w-5 h-5 text-blue-600" />
            <span>Personality Profile</span>
            <Badge variant="secondary" className="ml-auto">
              No analysis yet
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            We haven&apos;t analyzed your writing style yet. Process a few episodes to unlock personality insights.
          </p>
        </CardContent>
      </Card>
    );
  }

  const personalityTraits = [
    { 
      key: 'openness', 
      label: 'Openness', 
      description: 'Creativity and openness to new experiences',
      color: 'bg-blue-500'
    },
    { 
      key: 'conscientiousness', 
      label: 'Conscientiousness', 
      description: 'Organization and attention to detail',
      color: 'bg-green-500'
    },
    { 
      key: 'extraversion', 
      label: 'Extraversion', 
      description: 'Social energy and assertiveness',
      color: 'bg-purple-500'
    },
    { 
      key: 'agreeableness', 
      label: 'Agreeableness', 
      description: 'Cooperation and trust in others',
      color: 'bg-orange-500'
    },
    { 
      key: 'neuroticism', 
      label: 'Neuroticism', 
      description: 'Emotional stability and stress response',
      color: 'bg-red-500'
    }
  ];

  const getPersonalityInsight = (trait: string, score: number): string => {
    const level = score > 0.7 ? 'High' : score > 0.4 ? 'Moderate' : 'Low';
    
    const insights = {
      openness: {
        High: 'Creative and imaginative writing style',
        Moderate: 'Balanced approach to new ideas',
        Low: 'Practical and conventional approach'
      },
      conscientiousness: {
        High: 'Detailed and well-structured content',
        Moderate: 'Organized with some flexibility',
        Low: 'Spontaneous and flexible style'
      },
      extraversion: {
        High: 'Energetic and engaging tone',
        Moderate: 'Balanced social engagement',
        Low: 'Thoughtful and introspective style'
      },
      agreeableness: {
        High: 'Collaborative and supportive tone',
        Moderate: 'Diplomatic communication style',
        Low: 'Direct and analytical approach'
      },
      neuroticism: {
        High: 'Emotionally expressive content',
        Moderate: 'Balanced emotional expression',
        Low: 'Calm and stable tone'
      }
    };

    return insights[trait as keyof typeof insights]?.[level as keyof typeof insights.openness] || '';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Brain className="w-5 h-5 text-blue-600" />
          <span>Personality Profile</span>
          <Badge variant="secondary" className="ml-auto">
            {profile.analyzed_episodes} episodes analyzed
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Big 5 Personality Traits */}
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900">Big Five Personality Traits</h3>
          <div className="grid gap-4">
            {personalityTraits.map((trait) => {
              const score = profile[trait.key as keyof PersonalityProfile] as number;
              const percentage = Math.round(score * 100);
              
              return (
                <div key={trait.key} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-medium">{trait.label}</span>
                      {showDetails && (
                        <p className="text-xs text-gray-600">{trait.description}</p>
                      )}
                    </div>
                    <span className="text-sm font-medium">{percentage}%</span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                  {showDetails && (
                    <p className="text-xs text-gray-500 italic">
                      {getPersonalityInsight(trait.key, score)}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Writing Style Metrics */}
        <div className="space-y-4 pt-4 border-t">
          <h3 className="font-medium text-gray-900 flex items-center space-x-2">
            <BarChart3 className="w-4 h-4" />
            <span>Writing Style Metrics</span>
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {profile.avg_sentence_length}
              </div>
              <div className="text-xs text-gray-600">Avg. Sentence Length</div>
            </div>
            
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {Math.round(profile.vocabulary_complexity * 100)}%
              </div>
              <div className="text-xs text-gray-600">Vocabulary Complexity</div>
            </div>
            
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round(profile.formality_score * 100)}%
              </div>
              <div className="text-xs text-gray-600">Formality Score</div>
            </div>
            
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {Math.round(profile.enthusiasm_score * 100)}%
              </div>
              <div className="text-xs text-gray-600">Enthusiasm Level</div>
            </div>
          </div>
        </div>

        {/* Analysis Summary */}
        {showDetails && (
          <div className="space-y-2 pt-4 border-t">
            <h3 className="font-medium text-gray-900 flex items-center space-x-2">
              <Target className="w-4 h-4" />
              <span>Content Personalization Impact</span>
            </h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>• Generated content will match your {profile.formality_score > 0.6 ? 'formal' : 'casual'} communication style</p>
              <p>• Sentence length will average around {profile.avg_sentence_length} words</p>
              <p>• {profile.enthusiasm_score > 0.6 ? 'Enthusiastic' : 'Measured'} tone will be maintained</p>
              <p>• {profile.technical_depth > 0.6 ? 'Technical depth' : 'Accessible language'} will be prioritized</p>
            </div>
          </div>
        )}

        {/* Last Analysis Date */}
        <div className="text-xs text-gray-500 pt-2 border-t">
          Last analyzed: {new Date(profile.last_analysis_at).toLocaleDateString()}
        </div>
      </CardContent>
    </Card>
  );
}