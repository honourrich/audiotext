import { corsHeaders } from "@shared/cors.ts";

interface AudioTranscribeRequest {
  audioFile: string; // base64 encoded audio file
  fileName: string;
  fileSize: number;
}

interface AudioTranscribeResponse {
  success: boolean;
  transcript?: string;
  error?: string;
  processingSteps?: string[];
}

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const WHISPER_FILE_SIZE_LIMIT = 25 * 1024 * 1024; // OpenAI's actual limit is 25MB

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Audio transcribe request received');
    
    // Check API key first
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY') || Deno.env.get('VITE_OPENAI_API_KEY');
    if (!openaiApiKey) {
      console.error('OpenAI API key not found in environment');
      console.log('Available env vars:', Object.keys(Deno.env.toObject()));
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'OpenAI API key not configured. Please check your environment variables.',
          processingSteps: ['API key validation failed']
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    console.log('OpenAI API key found, length:', openaiApiKey.length);
    
    const requestBody = await req.json();
    const { audioFile, fileName, fileSize }: AudioTranscribeRequest = requestBody;

    console.log(`Processing file: ${fileName}, size: ${fileSize} bytes`);

    if (!audioFile || !fileName) {
      console.error('Missing required fields');
      return new Response(
        JSON.stringify({ success: false, error: 'Audio file and filename are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const processingSteps: string[] = [];

    // Check file size
    if (fileSize > MAX_FILE_SIZE) {
      const errorMsg = `File size ${Math.round(fileSize / 1024 / 1024)}MB exceeds the 100MB limit`;
      console.error(errorMsg);
      processingSteps.push(errorMsg);
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `${errorMsg}. Please use a smaller file or compress it before uploading.`,
          processingSteps
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    processingSteps.push("Preparing audio file for transcription");
    console.log('Decoding base64 audio file');

    // Decode base64 audio file with error handling
    let audioBuffer: Uint8Array;
    try {
      audioBuffer = Uint8Array.from(atob(audioFile), c => c.charCodeAt(0));
      console.log(`Audio buffer created, size: ${audioBuffer.length} bytes`);
    } catch (decodeError) {
      console.error('Failed to decode base64 audio:', decodeError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to decode audio file. Please ensure the file is valid.',
          processingSteps: [...processingSteps, 'Failed to decode audio file']
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    let transcript = '';

    // For simplicity and reliability, let's process all files directly first
    // If it fails due to size, then we'll try segmentation
    try {
      console.log('Attempting direct transcription first');
      processingSteps.push("Sending to OpenAI Whisper API");
      transcript = await transcribeAudioBuffer(audioBuffer, fileName, openaiApiKey);
    } catch (directError) {
      console.log('Direct transcription failed:', directError);
      
      // If file is too large, try segmentation
      if (audioBuffer.length > WHISPER_FILE_SIZE_LIMIT) {
        console.log(`Large file detected (${Math.round(audioBuffer.length / 1024 / 1024)}MB). Using segmentation...`);
        processingSteps.push(`Large file detected. Processing in segments...`);
        transcript = await transcribeInSegments(audioBuffer, fileName, processingSteps, openaiApiKey);
      } else {
        // If it's not a size issue, re-throw the error
        throw directError;
      }
    }

    processingSteps.push("Transcription completed successfully");
    console.log('Transcription completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        transcript: transcript.trim(),
        processingSteps
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Audio transcription error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Transcription failed: ${errorMessage}`,
        processingSteps: ['Error occurred during processing']
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function transcribeAudioBuffer(audioBuffer: Uint8Array, fileName: string, apiKey: string): Promise<string> {
  console.log(`Transcribing audio buffer of size: ${audioBuffer.length} bytes`);
  
  // Create form data for Whisper API
  const formData = new FormData();
  const audioBlob = new Blob([audioBuffer], { type: getAudioMimeType(fileName) });
  formData.append('file', audioBlob, fileName);
  formData.append('model', 'whisper-1');
  formData.append('response_format', 'text');
  
  console.log(`Making request to OpenAI Whisper API...`);
  console.log(`File name: ${fileName}, MIME type: ${getAudioMimeType(fileName)}`);
  console.log(`API key length: ${apiKey.length}, starts with: ${apiKey.substring(0, 7)}...`);
  
  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
    body: formData,
  });
  
  console.log(`OpenAI API response status: ${response.status}`);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Whisper API error: ${response.status} - ${errorText}`);
    
    // Provide more specific error messages
    let userError = `OpenAI API error (${response.status})`;
    if (response.status === 401) {
      userError = 'Invalid OpenAI API key. Please check your API key configuration.';
    } else if (response.status === 413) {
      userError = 'Audio file is too large for OpenAI Whisper API.';
    } else if (response.status === 429) {
      userError = 'OpenAI API rate limit exceeded. Please try again in a few minutes.';
    } else if (response.status === 400) {
      userError = 'Invalid audio file format or corrupted file.';
    }
    
    throw new Error(userError);
  }
  
  const transcript = await response.text();
  console.log(`Transcription successful, length: ${transcript.length} characters`);
  console.log(`First 100 chars: ${transcript.substring(0, 100)}...`);
  return transcript;
}

async function transcribeInSegments(audioBuffer: Uint8Array, fileName: string, processingSteps: string[], apiKey: string): Promise<string> {
  // Use smaller segments for better reliability
  const segmentSize = Math.floor(WHISPER_FILE_SIZE_LIMIT * 0.7); // Use 70% of limit for safety
  const numSegments = Math.ceil(audioBuffer.length / segmentSize);
  
  console.log(`Segmentation: ${numSegments} segments of max ${segmentSize} bytes each`);
  processingSteps.push(`Processing in ${numSegments} segments...`);
  
  const transcripts: string[] = [];
  
  for (let i = 0; i < numSegments; i++) {
    const start = i * segmentSize;
    const end = Math.min(start + segmentSize, audioBuffer.length);
    const segment = audioBuffer.slice(start, end);
    
    console.log(`Processing segment ${i + 1}/${numSegments}, size: ${segment.length} bytes`);
    processingSteps.push(`Processing segment ${i + 1} of ${numSegments}...`);
    
    try {
      const segmentFileName = `segment_${i + 1}.${getFileExtension(fileName)}`;
      const segmentTranscript = await transcribeAudioBuffer(segment, segmentFileName, apiKey);
      
      if (segmentTranscript && segmentTranscript.trim().length > 0) {
        transcripts.push(segmentTranscript.trim());
      }
      
      console.log(`Segment ${i + 1} transcribed successfully`);
      
      // Add delay between requests to avoid rate limiting
      if (i < numSegments - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
      }
    } catch (error) {
      console.error(`Error transcribing segment ${i + 1}:`, error);
      processingSteps.push(`Warning: Segment ${i + 1} failed - continuing with others`);
      // Continue with other segments
    }
  }
  
  if (transcripts.length === 0) {
    throw new Error('All segments failed to transcribe. The audio file may be corrupted or in an unsupported format.');
  }
  
  processingSteps.push(`Successfully transcribed ${transcripts.length} of ${numSegments} segments`);
  console.log(`Combining ${transcripts.length} transcripts`);
  
  // Combine all transcripts with proper spacing
  return transcripts.join(' ').trim();
}

function getAudioMimeType(fileName: string): string {
  const extension = getFileExtension(fileName).toLowerCase();
  
  switch (extension) {
    case 'mp3':
      return 'audio/mpeg';
    case 'wav':
      return 'audio/wav';
    case 'm4a':
      return 'audio/mp4';
    case 'flac':
      return 'audio/flac';
    case 'ogg':
      return 'audio/ogg';
    case 'aac':
      return 'audio/aac';
    case 'webm':
      return 'audio/webm';
    default:
      return 'audio/mpeg'; // Default fallback
  }
}

function getFileExtension(fileName: string): string {
  return fileName.toLowerCase().split('.').pop() || 'mp3';
}