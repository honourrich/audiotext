import React, { useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  Play,
  FileAudio,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Loader2,
  X
} from 'lucide-react';
import { useOnboarding } from '@/hooks/useOnboarding';

interface Step4FirstContentProps {
  onNext: () => void;
  onBack: () => void;
}

const Step4FirstContent: React.FC<Step4FirstContentProps> = ({ onNext, onBack }) => {
  const { onboarding, updateFirstContentData, trackEvent } = useOnboarding();
  const previousType = onboarding?.first_content_data?.type;
  const initialOption = previousType === 'audio' || previousType === 'demo' ? previousType : null;
  
  const [selectedOption, setSelectedOption] = React.useState<'audio' | 'demo' | null>(initialOption);
  const [uploadedFile, setUploadedFile] = React.useState<File | null>(null);
  const [dragActive, setDragActive] = React.useState(false);
  const [urlError, setUrlError] = React.useState<string>('');
  const [fileError, setFileError] = React.useState<string>('');


  const validateAudioFile = (file: File): boolean => {
    const allowedTypes = ['audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/m4a'];
    const maxSize = 100 * 1024 * 1024; // 100MB
    
    if (!allowedTypes.includes(file.type)) {
      setFileError('Please upload an MP3, M4A, or WAV file');
      return false;
    }
    
    if (file.size > maxSize) {
      setFileError('File size must be under 100MB');
      return false;
    }
    
    setFileError('');
    return true;
  };

  const handleOptionSelect = async (option: 'audio' | 'demo') => {
    setSelectedOption(option);
    setUrlError('');
    setFileError('');
    await trackEvent('content_option_selected', { option });
  };


  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateAudioFile(file)) {
        setUploadedFile(file);
        trackEvent('file_dropped', { fileName: file.name, fileSize: file.size });
      }
    }
  }, [trackEvent]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateAudioFile(file)) {
        setUploadedFile(file);
        trackEvent('file_selected', { fileName: file.name, fileSize: file.size });
      }
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setFileError('');
  };

  const handleContinue = async () => {
    let contentData: any = { type: selectedOption };

    if (selectedOption === 'audio') {
      if (!uploadedFile) {
        setFileError('Please select an audio file');
        return;
      }
      contentData.file_name = uploadedFile.name;
      contentData.file_size = uploadedFile.size;
    }

    await updateFirstContentData(contentData);
    onNext();
  };

  const isValid = selectedOption === 'demo' || 
    (selectedOption === 'audio' && uploadedFile && !fileError);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-foreground">Upload Your First Content</h2>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Let's process your first piece of content to show you the power of audiotext. 
          Choose from the options below to get started.
        </p>
      </div>

      {/* Content Options */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Audio Upload */}
        <Card 
          className={`cursor-pointer transition-all ${
            selectedOption === 'audio' 
              ? 'ring-2 ring-blue-500 shadow-lg' 
              : 'hover:shadow-md'
          }`}
          onClick={() => handleOptionSelect('audio')}
        >
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileAudio className="w-8 h-8 text-blue-600" />
            </div>
            <CardTitle>Upload Audio File</CardTitle>
            <p className="text-muted-foreground text-sm">
              Upload your podcast episode or audio content
            </p>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Supports MP3, M4A, WAV</li>
              <li>• Up to 100MB file size</li>
              <li>• Best quality results</li>
            </ul>
          </CardContent>
        </Card>


        {/* Demo Content */}
        <Card 
          className={`cursor-pointer transition-all ${
            selectedOption === 'demo' 
              ? 'ring-2 ring-green-500 shadow-lg' 
              : 'hover:shadow-md'
          }`}
          onClick={() => handleOptionSelect('demo')}
        >
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Play className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle>Try Demo Content</CardTitle>
            <p className="text-muted-foreground text-sm">
              See audiotext in action with sample content
            </p>
            <Badge className="bg-green-100 text-green-800 mt-2">Recommended</Badge>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Instant results</li>
              <li>• No upload required</li>
              <li>• Perfect for testing</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Audio File Upload Interface */}
      {selectedOption === 'audio' && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Audio File</CardTitle>
            <p className="text-muted-foreground">Drag and drop your audio file or click to browse</p>
          </CardHeader>
          <CardContent>
            {!uploadedFile ? (
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' 
                    : 'border-input hover:border-muted-foreground'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium text-foreground mb-2">
                  Drop your audio file here
                </p>
                <p className="text-muted-foreground mb-4">
                  or click to browse your files
                </p>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="audio-upload"
                />
                <Button asChild>
                  <label htmlFor="audio-upload" className="cursor-pointer">
                    Choose File
                  </label>
                </Button>
                <p className="text-sm text-muted-foreground mt-4">
                  Supports MP3, M4A, WAV files up to 100MB
                </p>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-900">{uploadedFile.name}</p>
                      <p className="text-sm text-green-700">
                        {(uploadedFile.size / (1024 * 1024)).toFixed(1)} MB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveFile}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
            {fileError && (
              <div className="flex items-center space-x-2 mt-4 text-red-600">
                <AlertCircle className="w-4 h-4" />
                <p className="text-sm">{fileError}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}


      {/* Demo Content Info */}
      {selectedOption === 'demo' && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                <Play className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-green-900">Demo Content Ready</h3>
                <p className="text-green-700">
                  We'll use a sample podcast episode to demonstrate all features including 
                  transcription, summaries, chapters, and personalized show notes.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Processing Info */}
      {isValid && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Loader2 className="w-5 h-5 text-blue-600" />
              <div>
                <h4 className="font-medium text-blue-900">What happens next?</h4>
                <p className="text-blue-800 text-sm">
                  We'll process your content using AI transcription and generate personalized 
                  show notes, summaries, and chapters based on your preferences.
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
          {selectedOption === 'demo' ? 'Try Demo' : 'Process Content'}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default Step4FirstContent;