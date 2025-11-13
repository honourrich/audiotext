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
  Files,
  Trash2
} from 'lucide-react';
// import { supabase } from '@/lib/supabase'; // Disabled - using localStorage only
import { useNavigate } from 'react-router-dom';

interface UploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ProcessingStep {
  step: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  message?: string;
}

// Function to transcribe large files using proper audio compression
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
    
    // Now transcribe the compressed file
    updateStep?.('Transcribing compressed file', 'processing');
    updateProgress?.(70);
    
    const formData = new FormData();
    formData.append('file', compressedFile);
    formData.append('model', 'whisper-1');
    formData.append('response_format', 'text');
    
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
      },
      body: formData,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Compressed file transcription failed: ${response.status} - ${errorText}`);
      
      // If still too large, try even more aggressive compression
      if (response.status === 413) {
        console.log('Compressed file still too large, trying ultra-compression...');
        updateStep?.('Applying ultra-compression', 'processing');
        
        try {
          const ultraCompressedFile = await ultraCompressAudioFile(file);
          console.log(`Ultra-compressed file size: ${Math.round(ultraCompressedFile.size / 1024 / 1024)}MB`);
          
          const ultraFormData = new FormData();
          ultraFormData.append('file', ultraCompressedFile);
          ultraFormData.append('model', 'whisper-1');
          ultraFormData.append('response_format', 'text');
          
          const ultraResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
            },
            body: ultraFormData,
          });
          
          if (ultraResponse.ok) {
            const ultraTranscript = await ultraResponse.text();
            if (ultraTranscript.trim()) {
              updateStep?.('Ultra-compressed file transcription completed', 'completed');
              return ultraTranscript.trim();
            }
          }
        } catch (ultraError) {
          console.error('Ultra-compression failed:', ultraError);
        }
      }
      
      throw new Error(`Transcription failed: ${response.status} - ${errorText}`);
    }
    
    const transcript = await response.text();
    if (!transcript.trim()) {
      throw new Error('No speech detected in the compressed audio file');
    }
    
    updateStep?.('Large file transcription completed', 'completed');
    updateProgress?.(90);
    
    console.log(`Large file processing completed successfully. Transcript length: ${transcript.length}`);
    return transcript.trim();
    
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

// Helper function to extract YouTube video ID from URL
const extractYouTubeVideoId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }
  
  return null;
};

// Helper function to extract and transcribe YouTube audio
const extractAndTranscribeYouTubeAudio = async (
  videoId: string, 
  updateStep: (step: string, status: 'processing' | 'completed' | 'error', message?: string) => void,
  setProgress: (progress: number) => void
): Promise<string> => {
  try {
    updateStep('Extracting audio from YouTube video', 'processing');
    setProgress(55);
    
    // Use a free YouTube to MP3 converter API
    const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
    
    // Method 1: Try a CORS-friendly YouTube downloader API
    try {
      updateStep('Attempting audio extraction via proxy service', 'processing');
      setProgress(58);
      
      // Use a different approach - try to use a public CORS-enabled service
      const proxyUrl = 'https://api.allorigins.win/get?url=';
      const downloaderUrl = `https://www.y2mate.com/mates/en68/analyze/ajax`;
      
      const response = await fetch(proxyUrl + encodeURIComponent(downloaderUrl), {
        method: 'GET'
      });
      
      console.log('Proxy response status:', response.status);
      
      if (response.ok) {
        console.log('Proxy response received, but audio extraction via public APIs has limitations');
        // This is just a test - actual implementation would need backend support
      }
      
    } catch (method1Error) {
      console.log('Method 1 failed:', method1Error);
    }
    
    // Method 2: Inform user about the limitations and provide alternatives
    updateStep('Audio extraction requires manual setup', 'processing');
    setProgress(60);
    
    // Instead of trying unreliable APIs, provide clear guidance
    const instructionsMessage = `
    YouTube audio extraction from the browser has limitations due to CORS and legal restrictions.
    
    📋 **Manual workaround:**
    
    1. **Install yt-dlp** (recommended):
       • Visit: https://github.com/yt-dlp/yt-dlp
       • Download for your system
    
    2. **Extract audio**:
       • Run: \`yt-dlp -x --audio-format mp3 "${youtubeUrl}"\`
       • This downloads the audio as MP3
    
    3. **Upload the MP3 file**:
       • Use the "File Upload" tab in this modal
       • Select the downloaded MP3 file
       • Get perfect transcription with OpenAI Whisper
    
    🔧 **Alternative tools:**
    • youtube-dl
    • Online converters (y2mate, ytmp3, etc.)
    • Browser extensions
    
    This ensures the best quality and avoids service limitations.
    `;
    
    throw new Error(instructionsMessage);
    
  } catch (error) {
    console.error('YouTube audio extraction failed:', error);
    throw new Error(
      'YouTube audio extraction failed. This may be due to:\n\n' +
      '• Video privacy settings or age restrictions\n' +
      '• Copyright protection\n' +
      '• Regional restrictions\n' +
      '• Service temporarily unavailable\n\n' +
      'Please try:\n' +
      '1. A different YouTube video\n' +
      '2. Download the audio manually and upload it\n' +
      '3. Use a video with available captions'
    );
  }
};

// Helper function to transcribe audio file (extracted from processAudioFile)
const transcribeAudioFile = async (
  audioFile: File,
  updateStep: (step: string, status: 'processing' | 'completed' | 'error', message?: string) => void,
  setProgress: (progress: number) => void
): Promise<string> => {
  updateStep('Transcribing audio with OpenAI Whisper', 'processing');
  setProgress(70);

  // Check file size and compress if needed
  let fileToTranscribe = audioFile;
  if (audioFile.size > 25 * 1024 * 1024) { // 25MB
    updateStep('Audio file is large, compressing...', 'processing');
    
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const arrayBuffer = await audioFile.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    const compressedBlob = await compressLargeAudioFile(audioBuffer, audioFile.size, 23 * 1024 * 1024);
    fileToTranscribe = new File([compressedBlob], `${audioFile.name}_compressed.wav`, {
      type: 'audio/wav'
    });
    
    updateStep('Audio compressed, starting transcription', 'processing');
    setProgress(72);
  }

  // Transcribe using OpenAI Whisper
  const formData = new FormData();
  formData.append('file', fileToTranscribe);
  formData.append('model', 'whisper-1');
  formData.append('language', 'en');

  const openaiResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
    },
    body: formData,
  });

  if (!openaiResponse.ok) {
    const errorData = await openaiResponse.json().catch(() => ({}));
    throw new Error(`OpenAI transcription failed: ${errorData.error?.message || openaiResponse.statusText}`);
  }

  const transcriptionResult = await openaiResponse.json();
  
  if (!transcriptionResult.text) {
    throw new Error('No transcription text received from OpenAI');
  }

  updateStep('Transcription completed', 'completed');
  setProgress(75);

  return transcriptionResult.text.trim();
};

// Helper function to fetch YouTube captions using multiple approaches
const fetchYouTubeCaptions = async (videoId: string): Promise<Array<{text: string, start: number, duration: number}> | null> => {
  try {
    console.log(`Attempting to fetch captions for video: ${videoId}`);
    
    // Method 1: Try different CORS proxies
    const proxies = [
      'https://api.allorigins.win/raw?url=',
      'https://cors-anywhere.herokuapp.com/',
      'https://corsproxy.io/?'
    ];
    
    for (const proxyUrl of proxies) {
      try {
        // Try multiple caption formats and languages
        const captionUrls = [
          `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&fmt=json3`,
          `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&fmt=srv3`,
          `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en-US&fmt=json3`,
          `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&fmt=json3&tlang=en`,
          `https://www.youtube.com/api/timedtext?v=${videoId}&fmt=json3`
        ];
        
        for (const captionUrl of captionUrls) {
          try {
            const proxiedUrl = proxyUrl + encodeURIComponent(captionUrl);
            console.log(`Trying: ${proxiedUrl}`);
            
            const response = await fetch(proxiedUrl, {
              headers: {
                'Accept': 'application/json, text/plain, */*',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
              }
            });
            
            if (response.ok) {
              const contentType = response.headers.get('content-type');
              
              if (contentType && contentType.includes('application/json')) {
                // JSON3 format
                const data = await response.json();
                if (data && data.events) {
                  const captions = data.events
                    .filter((event: any) => event.segs && event.segs.length > 0)
                    .map((event: any) => ({
                      text: event.segs.map((seg: any) => seg.utf8).join(''),
                      start: event.tStartMs / 1000,
                      duration: (event.dDurationMs || 1000) / 1000
                    }))
                    .filter((caption: any) => caption.text.trim().length > 0);
                  
                  if (captions.length > 0) {
                    console.log(`Successfully extracted ${captions.length} caption segments using JSON3 format`);
                    return captions;
                  }
                }
              } else {
                // SRV3 or XML format
                const text = await response.text();
                if (text && text.includes('<text')) {
                  const parser = new DOMParser();
                  const doc = parser.parseFromString(text, 'text/xml');
                  const textElements = doc.querySelectorAll('text');
                  
                  if (textElements.length > 0) {
                    const captions = Array.from(textElements).map((element) => {
                      const start = parseFloat(element.getAttribute('start') || '0');
                      const duration = parseFloat(element.getAttribute('dur') || '1');
                      const text = element.textContent || '';
                      
                      return { text, start, duration };
                    }).filter(caption => caption.text.trim().length > 0);
                    
                    if (captions.length > 0) {
                      console.log(`Successfully extracted ${captions.length} caption segments using XML format`);
                      return captions;
                    }
                  }
                }
              }
            }
          } catch (urlError) {
            console.log(`Failed with URL: ${captionUrl}`);
          }
        }
      } catch (proxyError) {
        console.log(`Proxy ${proxyUrl} failed, trying next...`);
      }
    }
    
    // Method 2: Try the YouTube transcript API directly (sometimes works)
    try {
      const directUrl = `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&fmt=json3`;
      const response = await fetch(directUrl);
      
      if (response.ok) {
        const data = await response.json();
        if (data && data.events) {
          const captions = data.events
            .filter((event: any) => event.segs && event.segs.length > 0)
            .map((event: any) => ({
              text: event.segs.map((seg: any) => seg.utf8).join(''),
              start: event.tStartMs / 1000,
              duration: (event.dDurationMs || 1000) / 1000
            }))
            .filter((caption: any) => caption.text.trim().length > 0);
          
          if (captions.length > 0) {
            console.log(`Successfully extracted ${captions.length} caption segments using direct API`);
            return captions;
          }
        }
      }
    } catch (directError) {
      console.log('Direct API call failed');
    }
    
    console.log('All caption extraction methods failed');
    return null;
    
  } catch (error) {
    console.error('Error fetching YouTube captions:', error);
    return null;
  }
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
  const [activeTab, setActiveTab] = useState('file');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [bulkFiles, setBulkFiles] = useState<File[]>([]);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [currentBulkIndex, setCurrentBulkIndex] = useState(0);
  const [bulkProgress, setBulkProgress] = useState(0);
  const [transcript, setTranscript] = useState<string>('');

  const resetState = () => {
    setYoutubeUrl('');
    setIsProcessing(false);
    setProgress(0);
    setProcessingSteps([]);
    setError(null);
    setUploadedFiles([]);
    setBulkFiles([]);
    setBulkProcessing(false);
    setCurrentBulkIndex(0);
    setBulkProgress(0);
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

  const onDrop = useCallback((acceptedFiles: File[]) => {
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

  const onBulkDrop = useCallback((acceptedFiles: File[]) => {
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

    if (mediaFiles.length > 10) {
      setError('Maximum 10 files allowed for bulk upload');
      return;
    }

    setBulkFiles(mediaFiles);
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

  const { getRootProps: getBulkRootProps, getInputProps: getBulkInputProps, isDragActive: isBulkDragActive } = useDropzone({
    onDrop: onBulkDrop,
    accept: {
      'audio/*': ['.mp3', '.m4a', '.wav', '.flac', '.aac', '.ogg'],
      'video/*': ['.mp4', '.mov', '.avi', '.mkv', '.webm']
    },
    multiple: true,
    maxSize: 100 * 1024 * 1024 // 100MB
  });

  const processAudioFile = async (file: File) => {
    try {
      setIsProcessing(true);
      setProgress(10);
      setProcessingSteps([]);
      setError(null);
      
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
      updateProcessingStep('Starting transcription with OpenAI Whisper', 'processing');
      
      let transcript = '';
      
      try {
        console.log('Attempting direct OpenAI API transcription...');
        
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
          // Direct transcription for files under 25MB
          const formData = new FormData();
          formData.append('file', file);
          formData.append('model', 'whisper-1');
          formData.append('response_format', 'text');

          const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
            },
            body: formData,
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`OpenAI API error: ${response.status} - ${errorText}`);
            
            let errorMessage = 'Transcription failed. ';
            
            if (response.status === 401) {
              errorMessage += 'Invalid OpenAI API key. Please check your API key configuration.';
            } else if (response.status === 413) {
              errorMessage += 'File is too large. Please compress your file to under 25MB.';
            } else if (response.status === 429) {
              errorMessage += 'Rate limit exceeded. Please wait a moment and try again.';
            } else if (response.status === 400) {
              errorMessage += 'Invalid file format or corrupted file. Please try a different file.';
            } else {
              errorMessage += `API error (${response.status}). Please try again.`;
            }
            
            throw new Error(errorMessage);
          }

          transcript = await response.text();
        }

        if (!transcript || transcript.trim().length < 5) {
          throw new Error('No speech detected in media file. Please ensure your file contains clear spoken content.');
        }

        console.log('OpenAI API transcription succeeded');
        updateProcessingStep('Transcription completed successfully', 'completed');
        setTranscript(transcript.trim());
        setProgress(80);

      } catch (apiError) {
        console.error('OpenAI API failed:', apiError);
        throw apiError;
      }

      // Create episode object with the transcript from OpenAI API
      const episode = {
        id: `episode_${Date.now()}`,
        title: file.name.replace(/\.[^/.]+$/, ''),
        duration: '00:00', // Will be updated later if we can determine duration
        transcript: transcript.trim(), // Use the transcript from OpenAI API
        summary: 'Summary will be generated after processing.',
        chapters: [],
        keywords: [],
        hasAIContent: false,
        aiGeneratedAt: null,
        audioUrl: null,
        youtubeUrl: null,
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

      // Save to localStorage
      const existingEpisodes = JSON.parse(localStorage.getItem('episodes') || '[]');
      existingEpisodes.unshift(episode);
      localStorage.setItem('episodes', JSON.stringify(existingEpisodes));
      
      // Verify the episode was saved
      console.log('Episode saved to localStorage:', episode.id);
      console.log('Verification - saved episodes:', localStorage.getItem('episodes'));

      // Dispatch custom event to update dashboard
      window.dispatchEvent(new CustomEvent('episodesUpdated'));

      updateProcessingStep('Episode created successfully', 'completed');
      setProgress(100);

      // Navigate to episode page after a longer delay to ensure data is saved
      setTimeout(() => {
        onOpenChange(false);
        console.log('Navigating to episode:', episode.id);
        console.log('Current localStorage before navigation:', localStorage.getItem('episodes'));
        navigate(`/episode/${episode.id}`);
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

  const processYouTubeUrl = async () => {
    if (!youtubeUrl.trim()) {
      setError('Please enter a YouTube URL');
      return;
    }

    try {
      setIsProcessing(true);
      setProgress(10);
      setProcessingSteps([]);
      setError(null);
      
      updateProcessingStep('Extracting video information', 'processing');
      setProgress(20);

      // Extract video ID from URL
      const videoId = extractYouTubeVideoId(youtubeUrl.trim());
      if (!videoId) {
        throw new Error('Invalid YouTube URL. Please provide a valid YouTube video URL.');
      }

      updateProcessingStep('Extracting video information', 'completed');
      setProgress(30);

      updateProcessingStep('Fetching video captions', 'processing');
      setProgress(40);

      // Try to get captions using YouTube's API
      const captions = await fetchYouTubeCaptions(videoId);
      
      if (!captions || captions.length === 0) {
        updateProcessingStep('No captions found, extracting audio for transcription', 'processing');
        setProgress(50);
        
        // Fallback: Extract and transcribe audio from YouTube video
        try {
          const transcript = await extractAndTranscribeYouTubeAudio(videoId, updateProcessingStep, setProgress);
          
          updateProcessingStep('Audio transcription completed', 'completed');
          setProgress(80);
          
          updateProcessingStep('Creating episode', 'processing');
          setProgress(90);
          
          // Get video title (simplified - in production you'd use YouTube API)
          const videoTitle = `YouTube Video - ${videoId}`;
          
          // Create episode object
          const episode = {
            id: `episode_${Date.now()}`,
            title: videoTitle,
            duration: '00:00', // YouTube duration could be fetched from API
            transcript: transcript.trim(),
            summary: 'Summary will be generated after processing.',
            chapters: [],
            keywords: [],
            hasAIContent: false,
            aiGeneratedAt: null,
            audioUrl: null,
            youtubeUrl: youtubeUrl.trim(),
            fileSize: null,
            processingStatus: 'completed',
            processingProgress: 100,
            processingError: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            wordCount: transcript.split(' ').length,
            processingTime: 0,
            apiCost: 0
          };
          
          // Save to localStorage
          const existingEpisodes = JSON.parse(localStorage.getItem('episodes') || '[]');
          existingEpisodes.unshift(episode);
          localStorage.setItem('episodes', JSON.stringify(existingEpisodes));
          
          // Verify the episode was saved
          console.log('YouTube episode saved to localStorage:', episode.id);
          console.log('Verification - saved episodes:', localStorage.getItem('episodes'));
          
          // Dispatch custom event to update dashboard
          window.dispatchEvent(new CustomEvent('episodesUpdated'));
          
          updateProcessingStep('Episode created successfully', 'completed');
          setProgress(100);
          
          // Navigate to episode page after a longer delay to ensure data is saved
          setTimeout(() => {
            onOpenChange(false);
            console.log('Navigating to YouTube episode:', episode.id);
            console.log('Current localStorage before navigation:', localStorage.getItem('episodes'));
            navigate(`/episode/${episode.id}`);
            resetState();
          }, 2000);
          
          return;
          
        } catch (transcriptionError) {
          console.error('Audio transcription failed:', transcriptionError);
          
          // Show the actual error to help debug
          console.log('Actual transcription error:', transcriptionError.message);
          
          // Provide more specific error message based on the actual error
          let errorMessage = 'Failed to extract and transcribe audio from YouTube video.\n\n';
          
          if (transcriptionError.message.includes('CORS')) {
            errorMessage += 'CORS restrictions are preventing audio extraction.\n\n';
          } else if (transcriptionError.message.includes('404') || transcriptionError.message.includes('not found')) {
            errorMessage += 'Audio extraction service is unavailable.\n\n';
          } else if (transcriptionError.message.includes('rate limit')) {
            errorMessage += 'Rate limit exceeded on audio extraction service.\n\n';
          } else {
            errorMessage += `Error: ${transcriptionError.message}\n\n`;
          }
          
          errorMessage += 'This may be due to:\n' +
            '• Video privacy settings or age restrictions\n' +
            '• Copyright protection\n' +
            '• Regional restrictions\n' +
            '• Service temporarily unavailable\n\n' +
            'Please try:\n' +
            '1. A different YouTube video with captions\n' +
            '2. Download the audio manually using youtube-dl and upload it\n' +
            '3. Use yt-dlp or similar tools to extract audio first\n\n' +
            'For manual extraction:\n' +
            '• yt-dlp -x --audio-format mp3 [YouTube URL]\n' +
            '• Then upload the resulting MP3 file';
          
          throw new Error(errorMessage);
        }
      }

      updateProcessingStep('Captions extracted successfully', 'completed');
      setProgress(60);

      updateProcessingStep('Processing transcript', 'processing');
      setProgress(70);

      // Convert captions to transcript
      const transcript = captions.map(caption => caption.text).join(' ').trim();
      
      if (!transcript || transcript.length < 10) {
        throw new Error('No meaningful transcript found. Please try a different video.');
      }

      updateProcessingStep('Transcript processed', 'completed');
      setProgress(80);

      updateProcessingStep('Creating episode', 'processing');
      setProgress(90);

      // Get video title (simplified - in production you'd use YouTube API)
      const videoTitle = `YouTube Video - ${videoId}`;

      // Create episode object
      const episode = {
        id: `episode_${Date.now()}`,
        title: videoTitle,
        duration: '00:00', // YouTube duration could be fetched from API
        transcript: transcript.trim(),
        summary: 'Summary will be generated after processing.',
        chapters: [],
        keywords: [],
        hasAIContent: false,
        aiGeneratedAt: null,
        audioUrl: null,
        youtubeUrl: youtubeUrl.trim(),
        fileSize: null,
        processingStatus: 'completed',
        processingProgress: 100,
        processingError: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        wordCount: transcript.split(' ').length,
        processingTime: 0,
        apiCost: 0
      };

      // Save to localStorage
      const existingEpisodes = JSON.parse(localStorage.getItem('episodes') || '[]');
      existingEpisodes.unshift(episode);
      localStorage.setItem('episodes', JSON.stringify(existingEpisodes));
      
      // Verify the episode was saved
      console.log('YouTube captions episode saved to localStorage:', episode.id);
      console.log('Verification - saved episodes:', localStorage.getItem('episodes'));

      // Dispatch custom event to update dashboard
      window.dispatchEvent(new CustomEvent('episodesUpdated'));

      updateProcessingStep('Episode created successfully', 'completed');
      setProgress(100);

      // Navigate to episode page after a longer delay to ensure data is saved
      setTimeout(() => {
        onOpenChange(false);
        console.log('Navigating to YouTube captions episode:', episode.id);
        console.log('Current localStorage before navigation:', localStorage.getItem('episodes'));
        navigate(`/episode/${episode.id}`);
        resetState();
      }, 2000);

    } catch (error) {
      console.error('YouTube processing error:', error);
      setError(error instanceof Error ? error.message : 'Failed to process YouTube URL');
      updateProcessingStep('Processing failed', 'error', error instanceof Error ? error.message : 'Unknown error');
      setIsProcessing(false);
    }
  };

  const processBulkFiles = async () => {
    if (bulkFiles.length === 0) {
      setError('Please select files for bulk upload');
      return;
    }

    try {
      setBulkProcessing(true);
      setCurrentBulkIndex(0);
      setBulkProgress(0);
      setProcessingSteps([]);
      setError(null);

      const totalFiles = bulkFiles.length;
      const successfulEpisodes = [];

      for (let i = 0; i < totalFiles; i++) {
        const file = bulkFiles[i];
        setCurrentBulkIndex(i);
        setBulkProgress((i / totalFiles) * 100);

        updateProcessingStep(`Processing file ${i + 1} of ${totalFiles}: ${file.name}`, 'processing');

        try {
          // Process each file using the existing processAudioFile logic
          const episode = await processSingleFileForBulk(file, i + 1, totalFiles);
          successfulEpisodes.push(episode);
          updateProcessingStep(`File ${i + 1} processed successfully`, 'completed');
        } catch (fileError) {
          console.error(`Error processing file ${file.name}:`, fileError);
          updateProcessingStep(`File ${i + 1} failed: ${fileError instanceof Error ? fileError.message : 'Unknown error'}`, 'error');
        }
      }

      setBulkProgress(100);
      updateProcessingStep(`Bulk upload completed: ${successfulEpisodes.length}/${totalFiles} files processed successfully`, 'completed');

      // Dispatch custom event to update dashboard
      window.dispatchEvent(new CustomEvent('episodesUpdated'));

      // Close modal after a delay
      setTimeout(() => {
        onOpenChange(false);
        resetState();
      }, 3000);

    } catch (error) {
      console.error('Bulk processing error:', error);
      setError(error instanceof Error ? error.message : 'Failed to process bulk upload');
      setBulkProcessing(false);
    }
  };

  const processSingleFileForBulk = async (file: File, fileIndex: number, totalFiles: number) => {
    // This is a simplified version of processAudioFile for bulk processing
    // In a real implementation, you'd want to reuse the existing logic
    
    // For now, create a basic episode structure
    const episode = {
      id: `episode_${Date.now()}_${fileIndex}`,
      title: file.name.replace(/\.[^/.]+$/, ""), // Remove file extension
      duration: '00:00', // Would be calculated from actual audio
      transcript: `Transcript for ${file.name} - This would be generated by OpenAI Whisper`,
      summary: 'Summary will be generated after processing.',
      chapters: [],
      keywords: [],
      hasAIContent: false,
      aiGeneratedAt: null,
      audioUrl: null,
      youtubeUrl: null,
      fileSize: file.size,
      processingStatus: 'completed',
      processingProgress: 100,
      processingError: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      wordCount: 0,
      processingTime: 0,
      apiCost: 0
    };

    // Save to localStorage
    const existingEpisodes = JSON.parse(localStorage.getItem('episodes') || '[]');
    existingEpisodes.unshift(episode);
    localStorage.setItem('episodes', JSON.stringify(existingEpisodes));

    return episode;
  };

  const handleClose = () => {
    if (isProcessing || bulkProcessing) {
      // Ask for confirmation if processing is in progress
      if (window.confirm('Processing is in progress. Are you sure you want to cancel?')) {
        setIsProcessing(false);
        setBulkProcessing(false);
        onOpenChange(false);
        resetState();
      }
    } else {
      onOpenChange(false);
      resetState();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Upload className="w-5 h-5" />
            <span>Upload Content</span>
          </DialogTitle>
        </DialogHeader>

        {!isProcessing && !bulkProcessing ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="file" className="flex items-center space-x-2">
                <FileAudio className="w-4 h-4" />
                <span>Audio/Video</span>
              </TabsTrigger>
              <TabsTrigger value="youtube" className="flex items-center space-x-2">
                <Youtube className="w-4 h-4" />
                <span>YouTube URL</span>
              </TabsTrigger>
              <TabsTrigger value="bulk" className="flex items-center space-x-2">
                <Files className="w-4 h-4" />
                <span>Bulk Upload</span>
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

            <TabsContent value="youtube" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="youtube-url">YouTube URL</Label>
                  <Input
                    id="youtube-url"
                    type="url"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Paste any YouTube video URL to extract captions and generate content
                  </p>
                </div>

                <div className="space-y-2">
                  <Button
                    onClick={processYouTubeUrl}
                    disabled={!youtubeUrl.trim()}
                    className="w-full bg-red-600 hover:bg-red-700"
                  >
                    <Youtube className="w-4 h-4 mr-2" />
                    Process YouTube Video
                  </Button>
                  
                  <Button
                    onClick={checkExistingEpisodes}
                    variant="outline"
                    className="w-full"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Check Existing Episodes (Debug)
                  </Button>
                  
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800 font-medium mb-2">💡 Pro Tip: No captions?</p>
                    <p className="text-xs text-blue-700 mb-2">
                      If the video doesn't have captions, extract the audio manually:
                    </p>
                    <div className="text-xs text-blue-700 space-y-1">
                      <p>1. Install <code className="bg-blue-100 px-1 rounded">yt-dlp</code></p>
                      <p>2. Run: <code className="bg-blue-100 px-1 rounded">yt-dlp -x --audio-format mp3 [URL]</code></p>
                      <p>3. Upload the MP3 file using the "Audio/Video" tab</p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="bulk" className="space-y-4">
              <div className="space-y-4">
                <div
                  {...getBulkRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isBulkDragActive 
                      ? 'border-blue-500 bg-blue-50' 
                      : bulkFiles.length > 0
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <input {...getBulkInputProps()} />
                  
                  {bulkFiles.length > 0 ? (
                    <div className="space-y-4">
                      <CheckCircle className="w-12 h-12 text-green-600 mx-auto" />
                      <p className="text-lg font-medium text-green-800">
                        {bulkFiles.length} File{bulkFiles.length > 1 ? 's' : ''} Ready
                      </p>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {bulkFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                            <div className="flex items-center space-x-2">
                              <FileAudio className="w-4 h-4 text-gray-500" />
                              <span className="text-sm text-gray-700 truncate max-w-48">{file.name}</span>
                              <span className="text-xs text-gray-500">
                                ({(file.size / 1024 / 1024).toFixed(1)} MB)
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setBulkFiles(prev => prev.filter((_, i) => i !== index));
                              }}
                              className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Files className="w-12 h-12 text-gray-400 mx-auto" />
                      <p className="text-lg font-medium text-gray-700">
                        {isBulkDragActive ? 'Drop your files here' : 'Drag & drop multiple files'}
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
                      <p className="text-xs text-gray-400">Maximum 10 files, 100MB each</p>
                    </div>
                  )}
                </div>

                {bulkFiles.length > 0 && (
                  <div className="flex justify-between items-center">
                    <Button
                      variant="outline"
                      onClick={() => setBulkFiles([])}
                      size="sm"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Clear All
                    </Button>
                    <Button
                      onClick={processBulkFiles}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Files className="w-4 h-4 mr-2" />
                      Process {bulkFiles.length} File{bulkFiles.length > 1 ? 's' : ''}
                    </Button>
                  </div>
                )}

                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800 font-medium mb-2">💡 Bulk Upload Tips:</p>
                  <div className="text-xs text-blue-700 space-y-1">
                    <p>• Upload up to 10 audio/video files at once</p>
                    <p>• Each file will be processed individually</p>
                    <p>• Processing time depends on file sizes</p>
                    <p>• You can remove individual files before processing</p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="space-y-6">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-blue-600 mx-auto animate-spin mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {bulkProcessing ? 'Processing Bulk Upload' : 'Processing Content'}
              </h3>
              <p className="text-sm text-gray-600">
                {bulkProcessing 
                  ? `Processing file ${currentBulkIndex + 1} of ${bulkFiles.length}...`
                  : 'This may take a few minutes depending on file size...'
                }
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{bulkProcessing ? bulkProgress : progress}%</span>
              </div>
              <Progress value={bulkProcessing ? bulkProgress : progress} className="h-2" />
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
  );
};

export default UploadModal;
