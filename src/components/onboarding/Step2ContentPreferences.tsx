import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  User, 
  GraduationCap, 
  Laugh, 
  Briefcase,
  Calendar,
  Clock,
  Target,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';

const CONTENT_TYPES = [
  {
    id: 'interview',
    title: 'Interview',
    description: 'Conversations with guests',
    icon: <Users className="w-6 h-6" />,
    color: 'bg-blue-500'
  },
  {
    id: 'solo',
    title: 'Solo',
    description: 'Single-host content',
    icon: <User className="w-6 h-6" />,
    color: 'bg-purple-500'
  },
  {
    id: 'educational',
    title: 'Educational',
    description: 'Teaching and tutorials',
    icon: <GraduationCap className="w-6 h-6" />,
    color: 'bg-green-500'
  },
  {
    id: 'comedy',
    title: 'Comedy',
    description: 'Entertainment and humor',
    icon: <Laugh className="w-6 h-6" />,
    color: 'bg-amber-500'
  },
  {
    id: 'business',
    title: 'Business',
    description: 'Professional and corporate',
    icon: <Briefcase className="w-6 h-6" />,
    color: 'bg-red-500'
  }
];

const PUBLISHING_FREQUENCIES = [
  { id: 'daily', label: 'Daily', description: '7+ episodes per week' },
  { id: 'weekly', label: 'Weekly', description: '1-2 episodes per week' },
  { id: 'biweekly', label: 'Bi-weekly', description: '2-3 episodes per month' },
  { id: 'monthly', label: 'Monthly', description: '1 episode per month' },
  { id: 'irregular', label: 'Irregular', description: 'No set schedule' }
];

const EPISODE_LENGTHS = [
  { id: 'short', label: '5-15 minutes', description: 'Quick content' },
  { id: 'medium', label: '15-45 minutes', description: 'Standard episodes' },
  { id: 'long', label: '45-90 minutes', description: 'In-depth discussions' },
  { id: 'extended', label: '90+ minutes', description: 'Long-form content' }
];

interface Step2ContentPreferencesProps {
  onNext: () => void;
  onBack: () => void;
}

const Step2ContentPreferences: React.FC<Step2ContentPreferencesProps> = ({ onNext, onBack }) => {
  const [selectedTypes, setSelectedTypes] = React.useState<string[]>([]);
  const [frequency, setFrequency] = React.useState<string>('');
  const [length, setLength] = React.useState<string>('');

  const handleTypeToggle = (typeId: string) => {
    const newTypes = selectedTypes.includes(typeId)
      ? selectedTypes.filter(t => t !== typeId)
      : [...selectedTypes, typeId];
    
    setSelectedTypes(newTypes);
  };

  const handleFrequencySelect = (frequencyId: string) => {
    setFrequency(frequencyId);
  };

  const handleLengthSelect = (lengthId: string) => {
    setLength(lengthId);
  };

  const handleContinue = () => {
    if (selectedTypes.length === 0 || !frequency || !length) return;
    onNext();
  };

  const isValid = selectedTypes.length > 0 && frequency && length;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-foreground">Content Preferences</h2>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Help us understand your content style so we can create the perfect templates and suggestions for you.
        </p>
      </div>

      {/* Content Types */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-blue-600" />
            <span>What type of content do you create?</span>
          </CardTitle>
          <p className="text-muted-foreground">Select all that apply - this helps us optimize our AI for your style</p>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4">
            {CONTENT_TYPES.map((type) => (
              <div
                key={type.id}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedTypes.includes(type.id)
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                    : 'border-input hover:border-muted-foreground'
                }`}
                onClick={() => handleTypeToggle(type.id)}
              >
                <div className={`${type.color} rounded-lg p-2 text-white w-fit mb-3`}>
                  {type.icon}
                </div>
                <h3 className="font-semibold text-foreground mb-1">{type.title}</h3>
                <p className="text-sm text-muted-foreground">{type.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Publishing Frequency */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-green-600" />
            <span>How often do you publish?</span>
          </CardTitle>
          <p className="text-muted-foreground">This helps us estimate your processing needs and suggest workflows</p>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {PUBLISHING_FREQUENCIES.map((freq) => (
              <div
                key={freq.id}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  frequency === freq.id
                    ? 'border-green-500 bg-green-50 dark:bg-green-950'
                    : 'border-input hover:border-muted-foreground'
                }`}
                onClick={() => handleFrequencySelect(freq.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-foreground">{freq.label}</h3>
                  {frequency === freq.id && (
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{freq.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Episode Length */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-purple-600" />
            <span>What's your typical episode length?</span>
          </CardTitle>
          <p className="text-muted-foreground">Helps us provide accurate processing time estimates</p>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {EPISODE_LENGTHS.map((len) => (
              <div
                key={len.id}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  length === len.id
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-950'
                    : 'border-input hover:border-muted-foreground'
                }`}
                onClick={() => handleLengthSelect(len.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-foreground">{len.label}</h3>
                  {length === len.id && (
                    <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{len.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Processing Estimate */}
      {isValid && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900">Estimated Processing Time</h3>
                <p className="text-blue-700">
                  Based on your preferences, expect {length === 'short' ? '1-2' : length === 'medium' ? '2-5' : length === 'long' ? '5-8' : '8-12'} minutes 
                  per episode for complete show notes generation.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} className="px-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button 
          onClick={handleContinue}
          disabled={!isValid}
          className="px-8"
        >
          Continue
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default Step2ContentPreferences;