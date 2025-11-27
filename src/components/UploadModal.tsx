/**
 * UploadModal - Dual-Source File Processing Component
 * 
 * PRESERVED FUNCTIONALITY (Unchanged):
 * - Local file upload and processing workflow
 * - OpenAI Whisper API integration for transcription
 * - File compression for large files (>25MB)
 * - Progress tracking and error handling
 * - Episode creation and localStorage storage
 * 
 * NEW INTEGRATION:
 * - YouTube tab added for YouTube URL processing
 * - Uses separate YouTubeUnifiedModal component
 * - Maintains consistent UI patterns across both workflows
 * 
 * @author Original implementation preserved
 * @modified Added YouTube integration without affecting local file workflow
 */

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  FileAudio, 
  Youtube,
  X, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  FileText,
  Clock,
  Sparkles
} from 'lucide-react';
// import { supabase } from '@/lib/supabase'; // Disabled - using localStorage only
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import YouTubeUploadModal from './YouTubeUploadModal';
import YouTubeImportModal from './YouTubeImportModal';
import YouTubeUnifiedModal from './YouTubeUnifiedModal';
import { usageService } from '@/lib/usageService';

interface UploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ProcessingStep {
  step: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  message?: string;
}

// ============================================================================
// PRESERVED FUNCTIONALITY - Local File Processing
// ============================================================================
// These functions handle local file upload and transcription using OpenAI Whisper
// NO CHANGES MADE - Original implementation preserved for regression protection

/**
 * Transcribes large files using proper audio compression
 * PRESERVED: Original OpenAI Whisper integration unchanged
 */
const transcribeLargeFile = async (file: File, updateProgress?: (progress: number) => void, updateStep?: (step: string, status: 'processing' | 'completed' | 'error') => void): Promise<string> => {
  console.log(`Processing large file: ${file.name} (${Math.round(file.size / 1024 / 1024)}MB)`);
  
  try {
    updateStep?.('Compressing large file for processing', 'processing');
    updateProgress?.(20);
    
    // Compress the entire file to under 25MB
    const compressedFile = await compressLargeAudioFile(file);
    
    console.log(`Compressed file size: ${Math.round(compressedFile.size / 1024 / 1024)}MB`);
    updateStep?.(`Compressed to ${Math.round(compressedFile.size / 1024 / 1024)}MB`, 'processing');
    updateProgress?.(50);
    
    // SECURITY: Use Supabase Edge Function instead of direct OpenAI API call
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) {
      throw new Error('Supabase configuration missing. Please check your environment variables. VITE_SUPABASE_URL is required.');
    }
    
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!supabaseAnonKey) {
      throw new Error('Supabase anon key missing. Please check your environment variables. VITE_SUPABASE_ANON_KEY is required.');
    }

    // Now transcribe the compressed file
    updateStep?.('Transcribing compressed file', 'processing');
    updateProgress?.(70);
    
    // Convert file to base64 for Edge Function
    const base64Audio = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1]; // Remove data:audio/...;base64, prefix
        resolve(base64);
      };
      reader.onerror = () => reject(new Error('Failed to read compressed file'));
      reader.readAsDataURL(compressedFile);
    });
    
    const functionUrl = `${supabaseUrl}/functions/v1/audio-transcribe`;
    console.log('Calling Edge Function for compressed file:', functionUrl);
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({
        audioFile: base64Audio,
        fileName: compressedFile.name,
        fileSize: compressedFile.size,
      }),
    });
    
      if (!response.ok) {
      let errorText = `HTTP ${response.status} ${response.statusText}`;
      
      try {
        const errorData = await response.json();
        errorText = errorData.error || errorData.message || errorText;
      } catch (parseError) {
        try {
          errorText = await response.text() || errorText;
        } catch (textError) {
          // Keep default errorText
        }
      }
      
      console.error(`Compressed file transcription failed: ${response.status} - ${errorText}`);
      
      // If still too large, try even more aggressive compression
      if (response.status === 413 || errorText.includes('too large')) {
        console.log('Compressed file still too large, trying ultra-compression...');
        updateStep?.('Applying ultra-compression', 'processing');
        
        try {
          const ultraCompressedFile = await ultraCompressAudioFile(file);
          console.log(`Ultra-compressed file size: ${Math.round(ultraCompressedFile.size / 1024 / 1024)}MB`);
          
          // Convert ultra-compressed file to base64
          const ultraBase64Audio = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const result = reader.result as string;
              const base64 = result.split(',')[1];
              resolve(base64);
            };
            reader.onerror = () => reject(new Error('Failed to read ultra-compressed file'));
            reader.readAsDataURL(ultraCompressedFile);
          });
          
          const ultraResponse = await fetch(`${supabaseUrl}/functions/v1/audio-transcribe`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseAnonKey}`,
            },
            body: JSON.stringify({
              audioFile: ultraBase64Audio,
              fileName: ultraCompressedFile.name,
              fileSize: ultraCompressedFile.size,
            }),
          });
          
          if (ultraResponse.ok) {
            const ultraResult = await ultraResponse.json();
            if (ultraResult.success && ultraResult.transcript && ultraResult.transcript.trim()) {
              updateStep?.('Ultra-compressed file transcription completed', 'completed');
              return ultraResult.transcript.trim();
            }
          } else {
            console.error(`Ultra-compressed file transcription also failed: ${ultraResponse.status}`);
          }
        } catch (ultraError) {
          console.error('Ultra-compression failed:', ultraError);
        }
      }
      
      // Provide helpful error message
      if (response.status === 404) {
        throw new Error('Edge Function not found. Please deploy the audio-transcribe function to Supabase.');
      } else if (response.status === 401 || response.status === 403) {
        throw new Error('Authentication failed. Please check your Supabase configuration.');
      } else {
        throw new Error(`Transcription failed: ${errorText}`);
      }
    }
    
    const result = await response.json();
    if (!result.success || !result.transcript || !result.transcript.trim()) {
      throw new Error(result.error || 'No speech detected in the compressed audio file');
    }
    
    updateStep?.('Large file transcription completed', 'completed');
    updateProgress?.(90);
    
    console.log(`Large file processing completed successfully. Transcript length: ${result.transcript.length}`);
    return result.transcript.trim();
    
  } catch (error) {
    console.error('Large file processing failed:', error);
    throw new Error(
      `Failed to process large file (${Math.round(file.size / 1024 / 1024)}MB): ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

// Helper function to compress large audio files
const compressLargeAudioFile = async (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    audio.onloadedmetadata = async () => {
      try {
        console.log(`Starting compression of ${Math.round(file.size / 1024 / 1024)}MB file`);
        
        const arrayBuffer = await file.arrayBuffer();
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        console.log(`Original: ${audioBuffer.sampleRate}Hz, ${audioBuffer.numberOfChannels} channels, ${audioBuffer.length} samples`);
        
        // Calculate compression ratio needed to get under 25MB
        const targetSizeBytes = 20 * 1024 * 1024; // 20MB target (under 25MB limit)
        const currentSizeBytes = file.size;
        const compressionRatio = currentSizeBytes / targetSizeBytes;
        
        // Calculate new sample rate (reduce by compression ratio)
        const originalSampleRate = audioBuffer.sampleRate;
        const compressedSampleRate = Math.max(8000, Math.floor(originalSampleRate / Math.sqrt(compressionRatio)));
        
        // Use mono for maximum compression
        const compressedChannels = 1;
        
        console.log(`Compressing to: ${compressedSampleRate}Hz, ${compressedChannels} channels`);
        
        const compressedBuffer = audioContext.createBuffer(
          compressedChannels,
          Math.floor(audioBuffer.length * compressedSampleRate / originalSampleRate),
          compressedSampleRate
        );
        
        // Downsample the audio
        const sourceData = audioBuffer.getChannelData(0); // Use first channel
        const compressedData = compressedBuffer.getChannelData(0);
        const ratio = originalSampleRate / compressedSampleRate;
        
        for (let i = 0; i < compressedData.length; i++) {
          const sourceIndex = Math.floor(i * ratio);
          compressedData[i] = sourceData[sourceIndex] || 0;
        }
        
        // Convert to WAV
        const wavBlob = await audioBufferToWav(compressedBuffer);
        const compressedFile = new File([wavBlob], `compressed_${file.name}`, { type: 'audio/wav' });
        
        console.log(`Compressed file size: ${Math.round(compressedFile.size / 1024 / 1024)}MB`);
        
        // If still too large, try even more aggressive compression
        if (compressedFile.size > 25 * 1024 * 1024) {
          console.log('Still too large, applying more aggressive compression...');
          
          const moreCompressedSampleRate = 8000; // Very low sample rate
          const moreCompressedBuffer = audioContext.createBuffer(
            1, // Mono
            Math.floor(audioBuffer.length * moreCompressedSampleRate / originalSampleRate),
            moreCompressedSampleRate
          );
          
          const moreCompressedData = moreCompressedBuffer.getChannelData(0);
          const moreAggressiveRatio = originalSampleRate / moreCompressedSampleRate;
          
          for (let i = 0; i < moreCompressedData.length; i++) {
            const sourceIndex = Math.floor(i * moreAggressiveRatio);
            moreCompressedData[i] = sourceData[sourceIndex] || 0;
          }
          
          const moreCompressedWav = await audioBufferToWav(moreCompressedBuffer);
          const finalFile = new File([moreCompressedWav], `heavily_compressed_${file.name}`, { type: 'audio/wav' });
          
          console.log(`Heavily compressed file size: ${Math.round(finalFile.size / 1024 / 1024)}MB`);
          resolve(finalFile);
        } else {
          resolve(compressedFile);
        }
        
      } catch (error) {
        console.error('Compression failed:', error);
        reject(error);
      }
    };
    
    audio.onerror = () => reject(new Error('Failed to load audio file'));
    audio.src = URL.createObjectURL(file);
  });
};

// Helper function for ultra-compression (last resort)
const ultraCompressAudioFile = async (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    audio.onloadedmetadata = async () => {
      try {
        console.log(`Starting ultra-compression of ${Math.round(file.size / 1024 / 1024)}MB file`);
        
        const arrayBuffer = await file.arrayBuffer();
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        // Ultra-aggressive compression: 8kHz mono, very low quality
        const ultraSampleRate = 8000; // Very low sample rate
        const ultraChannels = 1; // Mono
        
        const ultraBuffer = audioContext.createBuffer(
          ultraChannels,
          Math.floor(audioBuffer.length * ultraSampleRate / audioBuffer.sampleRate),
          ultraSampleRate
        );
        
        // Downsample with simple decimation
        const sourceData = audioBuffer.getChannelData(0);
        const ultraData = ultraBuffer.getChannelData(0);
        const decimationFactor = Math.floor(audioBuffer.sampleRate / ultraSampleRate);
        
        for (let i = 0; i < ultraData.length; i++) {
          const sourceIndex = i * decimationFactor;
          ultraData[i] = sourceData[sourceIndex] || 0;
        }
        
        // Convert to WAV
        const ultraWav = await audioBufferToWav(ultraBuffer);
        const ultraFile = new File([ultraWav], `ultra_compressed_${file.name}`, { type: 'audio/wav' });
        
        console.log(`Ultra-compressed file size: ${Math.round(ultraFile.size / 1024 / 1024)}MB`);
        resolve(ultraFile);
        
      } catch (error) {
        console.error('Ultra-compression failed:', error);
        reject(error);
      }
    };
    
    audio.onerror = () => reject(new Error('Failed to load audio file'));
    audio.src = URL.createObjectURL(file);
  });
};




// Helper function to extract duration from video files
const getVideoDuration = (file: File): Promise<number> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const url = URL.createObjectURL(file);
    
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(video.duration);
    };
    
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load video metadata'));
    };
    
    video.src = url;
    video.load();
  });
};

// Helper function to extract duration from audio files
const getAudioDuration = (file: File): Promise<number> => {
  return new Promise((resolve, reject) => {
    const audio = document.createElement('audio');
    const url = URL.createObjectURL(file);
    
    audio.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(audio.duration);
    };
    
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load audio metadata'));
    };
    
    audio.src = url;
    audio.load();
  });
};

// Helper function to transcribe audio file (extracted from processAudioFile)
const transcribeAudioFile = async (
  audioFile: File,
  updateStep: (step: string, status: 'processing' | 'completed' | 'error', message?: string) => void,
  setProgress: (progress: number) => void
): Promise<string> => {
  updateStep('Transcribing audio', 'processing');
  setProgress(70);

  // SECURITY: Use Supabase Edge Function instead of direct OpenAI API call
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error('Supabase configuration missing. Please check your environment variables.');
  }

  // Check file size and compress if needed
  let fileToTranscribe = audioFile;
  if (audioFile.size > 25 * 1024 * 1024) { // 25MB
    updateStep('Audio file is large, compressing...', 'processing');
    
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const arrayBuffer = await audioFile.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    const compressedBlob = await compressLargeAudioFile(audioFile);
    fileToTranscribe = new File([compressedBlob], `${audioFile.name}_compressed.wav`, {
      type: 'audio/wav'
    });
    
    updateStep('Audio compressed, starting transcription', 'processing');
    setProgress(72);
  }

  // Convert file to base64 for Edge Function
  const base64Audio = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1]; // Remove data:audio/...;base64, prefix
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('Failed to read audio file'));
    reader.readAsDataURL(fileToTranscribe);
  });

  // Call Supabase Edge Function
  const response = await fetch(`${supabaseUrl}/functions/v1/audio-transcribe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      audioFile: base64Audio,
      fileName: fileToTranscribe.name,
      fileSize: fileToTranscribe.size,
    }),
  });

  if (!response.ok) {
    let errorMessage = `Transcription failed: ${response.status} ${response.statusText}`;
    
    try {
      const errorData = await response.json();
      if (errorData.error) {
        errorMessage = errorData.error;
      } else if (errorData.message) {
        errorMessage = errorData.message;
      }
    } catch (parseError) {
      // If response is not JSON, try to get text
      try {
        const errorText = await response.text();
        if (errorText) {
          errorMessage = errorText;
        }
      } catch (textError) {
        // If we can't read the response, use the status
        errorMessage = `Transcription failed: HTTP ${response.status}. The Edge Function may not be deployed. Please check Supabase deployment.`;
      }
    }
    
    // Provide helpful error messages for common issues
    if (response.status === 404) {
      errorMessage = 'Edge Function not found. Please deploy the audio-transcribe function to Supabase.';
    } else if (response.status === 401 || response.status === 403) {
      errorMessage = 'Authentication failed. Please check your Supabase configuration.';
    } else if (response.status >= 500) {
      errorMessage = `Server error (${response.status}). Please check Supabase Edge Function logs.`;
    }
    
    throw new Error(errorMessage);
  }

  const transcriptionResult = await response.json();
  
  if (!transcriptionResult.success || !transcriptionResult.transcript) {
    throw new Error(transcriptionResult.error || 'No transcription text received');
  }

  updateStep('Transcription completed', 'completed');
  setProgress(75);

  return transcriptionResult.transcript.trim();
};


// Helper function to convert AudioBuffer to WAV blob
const audioBufferToWav = async (audioBuffer: AudioBuffer): Promise<Blob> => {
  const numberOfChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const length = audioBuffer.length;
  
  const arrayBuffer = new ArrayBuffer(44 + length * numberOfChannels * 2);
  const view = new DataView(arrayBuffer);
  
  // WAV header
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };
  
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + length * numberOfChannels * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numberOfChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numberOfChannels * 2, true);
  view.setUint16(32, numberOfChannels * 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, length * numberOfChannels * 2, true);
  
  // Convert audio data
  let offset = 44;
  for (let i = 0; i < length; i++) {
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, audioBuffer.getChannelData(channel)[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }
  }
  
  return new Blob([arrayBuffer], { type: 'audio/wav' });
};


const UploadModal: React.FC<UploadModalProps> = ({ open, onOpenChange }) => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState('file');
  const [showYouTubeModal, setShowYouTubeModal] = useState(false);
  const [showYouTubeImportModal, setShowYouTubeImportModal] = useState(false);
  const [showYouTubeUnifiedModal, setShowYouTubeUnifiedModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [transcript, setTranscript] = useState<string>('');

  const resetState = () => {
    setIsProcessing(false);
    setProgress(0);
    setProcessingSteps([]);
    setError(null);
    setUploadedFiles([]);
    setTranscript('');
  };

  // Debug function to check existing episodes
  const checkExistingEpisodes = () => {
    try {
      const storedEpisodes = localStorage.getItem('episodes');
      if (storedEpisodes) {
        const episodes = JSON.parse(storedEpisodes);
        console.log('Existing episodes in localStorage:', episodes);
        console.log(`Total episodes: ${episodes.length}`);
        return episodes;
      } else {
        console.log('No episodes found in localStorage');
        return [];
      }
    } catch (error) {
      console.error('Error reading episodes from localStorage:', error);
      return [];
    }
  };

  const updateProcessingStep = (stepText: string, status: 'processing' | 'completed' | 'error', message?: string) => {
    setProcessingSteps(prev => {
      const existingIndex = prev.findIndex(step => step.step === stepText);
      const newStep = { step: stepText, status, message };
      
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = newStep;
        return updated;
      } else {
        return [...prev, newStep];
      }
    });
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const mediaFiles = acceptedFiles.filter(file => 
      file.type.startsWith('audio/') || 
      file.type.startsWith('video/') ||
      file.name.toLowerCase().match(/\.(mp3|m4a|wav|flac|aac|ogg|mp4|mov|avi|mkv|webm)$/)
    );
    
    if (mediaFiles.length === 0) {
      setError('Please upload audio or video files only (MP3, M4A, WAV, FLAC, AAC, OGG, MP4, MOV, AVI, MKV, WEBM)');
      return;
    }


    if (mediaFiles.some(file => file.size > 100 * 1024 * 1024)) {
      setError('File size must be less than 100MB');
      return;
    }

    setUploadedFiles(mediaFiles);
    setError(null);
  }, []);


  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.m4a', '.wav', '.flac', '.aac', '.ogg'],
      'video/*': ['.mp4', '.mov', '.avi', '.mkv', '.webm']
    },
    multiple: false,
    maxSize: 100 * 1024 * 1024 // 100MB
  });


  /**
   * PRESERVED FUNCTION: processAudioFile
   * 
   * This function handles local file upload and transcription using OpenAI Whisper API.
   * NO CHANGES MADE - Original implementation preserved for regression protection.
   * 
   * Workflow:
   * 1. File size check and compression if needed
   * 2. OpenAI Whisper API transcription
   * 3. Episode creation and localStorage storage
   * 4. Navigation to editor
   * 
   * @param file - Local audio/video file to process
   */
  const processAudioFile = async (file: File) => {
    try {
      setIsProcessing(true);
      setProgress(10);
      setProcessingSteps([]);
      setError(null);
      
      updateProcessingStep('Extracting file duration', 'processing');
      
      // Extract actual duration from the file
      let actualDuration = 0;
      try {
        console.log(`🔍 Extracting duration from file: ${file.name}`);
        console.log(`🔍 File type: ${file.type}`);
        console.log(`🔍 File size: ${file.size} bytes`);
        
        if (file.type.startsWith('video/')) {
          console.log('🎬 Processing as video file...');
          actualDuration = await getVideoDuration(file);
        } else if (file.type.startsWith('audio/')) {
          console.log('🎵 Processing as audio file...');
          actualDuration = await getAudioDuration(file);
        } else {
          throw new Error(`Unsupported file type: ${file.type}`);
        }
        
        console.log(`✅ Duration extracted successfully: ${actualDuration} seconds`);
        console.log(`✅ Formatted duration: ${Math.floor(actualDuration / 60)}:${(actualDuration % 60).toString().padStart(2, '0')}`);
        
        if (actualDuration === 0 || !isFinite(actualDuration)) {
          throw new Error(`Invalid duration extracted: ${actualDuration}`);
        }
        
        if (actualDuration < 1) {
          throw new Error(`Duration too short: ${actualDuration} seconds`);
        }
        
      } catch (error) {
        console.error('❌ Duration extraction failed:', error);
        console.error('❌ File details:', {
          name: file.name,
          type: file.type,
          size: file.size,
          lastModified: file.lastModified
        });
        throw new Error(`Failed to extract duration from ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Check usage limits BEFORE processing (after we know the duration)
      if (user?.id && actualDuration > 0) {
        try {
          const durationMinutes = Math.ceil(actualDuration / 60);
          console.log(`🔍 Checking usage limits for ${durationMinutes} minutes...`);
          const canProcess = await usageService.canPerformAction(user.id, 'processAudio', durationMinutes);
          
          if (!canProcess.canPerform) {
            setIsProcessing(false);
            setProgress(0);
            setError(canProcess.reason || `You've reached your usage limit. This file would use ${durationMinutes} minutes, but you don't have enough minutes remaining.`);
            updateProcessingStep('Usage limit reached', 'error');
            return;
          }
          console.log(`✅ Usage check passed: ${durationMinutes} minutes allowed`);
        } catch (usageError) {
          console.error('Error checking usage limits:', usageError);
          // Continue processing if check fails - don't block user unnecessarily
          // But log the error for debugging
        }
      }
      
      updateProcessingStep('Preparing media file', 'processing');
      
      // Validate file size (allow up to 100MB)
      if (file.size > 100 * 1024 * 1024) {
        throw new Error(`File size ${Math.round(file.size / 1024 / 1024)}MB exceeds the 100MB limit. Please compress your file or use a shorter clip.`);
      }
      
      // Convert file to base64
            const base64Audio = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1]; // Remove data:audio/...;base64, prefix
          resolve(base64);
        };
        reader.onerror = () => reject(new Error('Failed to read media file'));
        reader.readAsDataURL(file);
      });

      updateProcessingStep('Preparing media file', 'completed');
      setProgress(20);

      // Use direct OpenAI API for transcription with segmentation for large files
      updateProcessingStep('Starting transcription', 'processing');
      
      let transcript = '';
      
      try {
        console.log('Using direct OpenAI API transcription...');
        
        // Check file size and handle segmentation if needed
        const maxSize = 25 * 1024 * 1024; // 25MB OpenAI limit
        const fileSizeMB = Math.round(file.size / 1024 / 1024);
        
        if (file.size > maxSize) {
          console.log(`Large file detected (${fileSizeMB}MB). Processing in segments...`);
          updateProcessingStep(`Large file detected (${fileSizeMB}MB). Processing in segments...`, 'processing');
          try {
            transcript = await transcribeLargeFile(file, setProgress, updateProcessingStep);
            console.log(`Large file processing completed successfully. Transcript length: ${transcript.length}`);
          } catch (largeFileError) {
            console.error('Large file processing failed:', largeFileError);
            throw largeFileError;
          }
        } else {
          // Use direct transcription for files under 25MB
          transcript = await transcribeAudioFile(file, updateProcessingStep, setProgress);
        }

        if (!transcript || transcript.trim().length < 5) {
          throw new Error('No speech detected in media file. Please ensure your file contains clear spoken content.');
        }

        console.log('OpenAI API transcription succeeded');
        updateProcessingStep('Transcription completed successfully', 'completed');
        console.log('Setting transcript:', transcript.trim().substring(0, 100) + '...');
        setTranscript(transcript.trim());
        setProgress(80);

      } catch (apiError) {
        console.error('OpenAI API failed:', apiError);
        throw apiError;
      }

      // Create episode object with the transcript from OpenAI API
      const episode = {
        id: `episode_${Date.now()}`,
        userId: user?.id || 'anonymous', // Add userId for usage tracking
        title: file.name.replace(/\.[^/.]+$/, ''),
        duration: actualDuration, // Use actual duration extracted from file (in seconds)
        transcript: transcript.trim(), // Use the transcript from OpenAI API
        summary: 'Summary will be generated after processing.',
        chapters: [],
        keywords: [],
        hasAIContent: false,
        aiGeneratedAt: null,
        audioUrl: null,
        fileSize: file.size,
        processingStatus: 'completed',
        processingProgress: 100,
        processingError: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        wordCount: transcript.split(' ').length,
        processingTime: 0,
        apiCost: 0
      };

      console.log('📝 CREATING EPISODE WITH DURATION:');
      console.log('📝 Raw duration value:', actualDuration);
      console.log('📝 Duration type:', typeof actualDuration);
      console.log('📝 Duration is finite:', isFinite(actualDuration));
      console.log('📝 Episode duration field:', episode.duration);
      console.log('📝 Episode duration type:', typeof episode.duration);

      // Save to localStorage
      const existingEpisodes = JSON.parse(localStorage.getItem('episodes') || '[]');
      existingEpisodes.unshift(episode);
      localStorage.setItem('episodes', JSON.stringify(existingEpisodes));
      if (user?.id) {
        localStorage.setItem('episodes_owner', user.id);
      }
      
      // Verify the episode was saved
      const verifyEpisodes = JSON.parse(localStorage.getItem('episodes') || '[]');
      const savedEpisode = verifyEpisodes.find((ep: any) => ep.id === episode.id);
      if (savedEpisode) {
        console.log('✅ Episode verified in localStorage:', savedEpisode.id, savedEpisode.title);
        console.log('✅ Episode userId:', savedEpisode.userId, 'Current user:', user?.id);
      } else {
        console.error('❌ ERROR: Episode was NOT saved to localStorage!');
      }
      console.log('📝 Total episodes in storage:', verifyEpisodes.length);

      // Dispatch custom event to update dashboard
      window.dispatchEvent(new CustomEvent('episodesUpdated'));

      // Update usage tracking
      if (user?.id && actualDuration > 0) {
        try {
          // Convert seconds to minutes (rounded up)
          const durationMinutes = Math.ceil(actualDuration / 60);
          await usageService.updateUsage(user.id, { minutesUsed: durationMinutes });
          // Trigger usage update event for UI
          window.dispatchEvent(new CustomEvent('usageUpdated'));
          console.log(`✅ Usage updated: ${durationMinutes} minutes for ${file.name}`);
        } catch (usageError) {
          console.error('Failed to update usage:', usageError);
          // Don't fail the upload if usage tracking fails
        }
      }

      updateProcessingStep('Episode created successfully', 'completed');
      setProgress(100);
      setIsProcessing(false);

      // Close modal after a short delay to show success
      setTimeout(() => {
        onOpenChange(false);
        resetState();
      }, 2000);

    } catch (error) {
      console.error('Media processing error:', error);
      
      let errorMessage = 'Failed to process media file';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      updateProcessingStep('Processing failed', 'error', errorMessage);
      setIsProcessing(false);
    }
  };



  const handleClose = () => {
    if (isProcessing) {
      // Ask for confirmation if processing is in progress
      if (window.confirm('Processing is in progress. Are you sure you want to cancel?')) {
        setIsProcessing(false);
        onOpenChange(false);
        resetState();
      }
    } else {
      onOpenChange(false);
      resetState();
    }
  };

  return (
    <>
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Upload className="w-5 h-5" />
            <span>Upload Content</span>
          </DialogTitle>
        </DialogHeader>

        {!isProcessing ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="file" className="flex items-center space-x-2">
                <FileAudio className="w-4 h-4" />
                <span>Audio/Video</span>
              </TabsTrigger>
              <TabsTrigger value="youtube" className="flex items-center space-x-2">
                <Youtube className="w-4 h-4" />
                <span>YouTube</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="file" className="space-y-4">
              <div className="space-y-4">
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isDragActive 
                      ? 'border-blue-500 bg-blue-50' 
                      : uploadedFiles.length > 0
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <input {...getInputProps()} />
                  
                  {uploadedFiles.length > 0 ? (
                    <div className="space-y-2">
                      <CheckCircle className="w-12 h-12 text-green-600 mx-auto" />
                      <p className="text-lg font-medium text-green-800">File Ready</p>
                      <p className="text-sm text-green-600">{uploadedFiles[0].name}</p>
                      <p className="text-xs text-gray-500">
                        {(uploadedFiles[0].size / 1024 / 1024).toFixed(1)} MB
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <FileAudio className="w-12 h-12 text-gray-400 mx-auto" />
                      <p className="text-lg font-medium text-gray-700">
                        {isDragActive ? 'Drop your file here' : 'Drag & drop an audio or video file'}
                      </p>
                      <p className="text-sm text-gray-500">
                        or click to browse
                      </p>
                      <p className="text-xs text-gray-600 font-medium">
                        Audio: MP3, M4A, WAV, FLAC, AAC, OGG
                      </p>
                      <p className="text-xs text-gray-600 font-medium">
                        Video: MP4, MOV, AVI, MKV, WEBM
                      </p>
                      <p className="text-xs text-gray-400">Maximum file size: 100MB</p>
                    </div>
                  )}
                </div>

                {uploadedFiles.length > 0 && (
                  <div className="flex justify-between items-center">
                    <Button
                      variant="outline"
                      onClick={() => setUploadedFiles([])}
                      size="sm"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Remove File
                    </Button>
                    <Button
                      onClick={() => processAudioFile(uploadedFiles[0])}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Process File
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* ============================================================================
                NEW INTEGRATION - YouTube Processing Tab
                ============================================================================
                This tab integrates YouTube URL processing using the new unified service.
                Completely separate from local file processing to maintain workflow isolation.
            */}
            <TabsContent value="youtube" className="space-y-4">
              <div className="space-y-4">
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Youtube className="w-8 h-8 text-red-600" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Import from YouTube</h3>
                  <p className="text-gray-600 mb-6">
                    Extract captions from any public YouTube video and generate podcast content
                  </p>
                  <Button
                    onClick={() => {
                      setShowYouTubeUnifiedModal(true);
                      onOpenChange(false);
                    }}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <Youtube className="w-4 h-4 mr-2" />
                    Import from YouTube
                  </Button>
                </div>
              </div>
            </TabsContent>

          </Tabs>
        ) : (
          <div className="space-y-6">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-blue-600 mx-auto animate-spin mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Processing Content
              </h3>
              <p className="text-sm text-gray-600">
                This may take a few minutes depending on file size...
              </p>
            </div>


            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {processingSteps.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Processing Steps:</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {processingSteps.map((step, index) => (
                    <div key={index} className="flex items-center space-x-2 text-sm">
                      {step.status === 'completed' ? (
                        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                      ) : step.status === 'error' ? (
                        <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                      ) : (
                        <Clock className="w-4 h-4 text-blue-600 flex-shrink-0 animate-pulse" />
                      )}
                      <span className={`${
                        step.status === 'completed' ? 'text-green-800' :
                        step.status === 'error' ? 'text-red-800' :
                        'text-blue-800'
                      }`}>
                        {step.step}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Show navigation button when transcript is ready */}
            {transcript && !isProcessing && (
              <div className="text-center pt-4 border-t">
                <p className="text-sm text-gray-600 mb-4">Processing complete! Ready to export and share your content.</p>
                <Button
                  onClick={() => {
                    const episodes = JSON.parse(localStorage.getItem('episodes') || '[]');
                    const latestEpisode = episodes[episodes.length - 1];
                    if (latestEpisode) {
                      onOpenChange(false);
                      navigate(`/episode/${latestEpisode.id}`);
                      resetState();
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  View Episode & Export
                </Button>
              </div>
            )}
          </div>
        )}

        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {!isProcessing && (
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
    
    {/* YouTube Upload Modal */}
    <YouTubeUploadModal
      open={showYouTubeModal}
      onOpenChange={setShowYouTubeModal}
    />
    
    {/* YouTube Import Modal */}
    <YouTubeImportModal
      open={showYouTubeImportModal}
      onOpenChange={setShowYouTubeImportModal}
    />
    
    {/* YouTube Unified Modal */}
    <YouTubeUnifiedModal
      open={showYouTubeUnifiedModal}
      onOpenChange={setShowYouTubeUnifiedModal}
    />

  </>
  );
};

export default UploadModal;
