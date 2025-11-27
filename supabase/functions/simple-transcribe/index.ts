import { corsHeaders } from "@shared/cors.ts";

interface SimpleTranscribeRequest {
  audioFile: string;
  fileName: string;
  fileSize: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Simple transcribe fallback service called');
    
    const { audioFile, fileName, fileSize }: SimpleTranscribeRequest = await req.json();

    if (!audioFile || !fileName) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check API key
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY') || Deno.env.get('VITE_OPENAI_API_KEY');
    
    if (!openaiApiKey) {
      console.error('OpenAI API key not found in environment');
      // SECURITY: Removed logging of available env vars to prevent information leakage
      return new Response(
        JSON.stringify({ success: false, error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // SECURITY: Removed logging of API key length to prevent information leakage

    // For files larger than 25MB, we'll reject and suggest compression
    if (fileSize > 25 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `File size ${Math.round(fileSize / 1024 / 1024)}MB is too large for the fallback service. Please compress your audio file to under 25MB and try again.`,
          processingSteps: ['File too large for fallback processing']
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Decode and process the audio file
    const audioBuffer = Uint8Array.from(atob(audioFile), c => c.charCodeAt(0));
    
    // Create form data for Whisper API
    const formData = new FormData();
    const audioBlob = new Blob([audioBuffer], { type: getAudioMimeType(fileName) });
    formData.append('file', audioBlob, fileName);
    formData.append('model', 'whisper-1');
    formData.append('response_format', 'verbose_json');

    console.log(`Calling OpenAI Whisper API for file: ${fileName}, size: ${audioBuffer.length} bytes`);

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Whisper API error: ${response.status} - ${errorText}`);
      
      let userFriendlyError = 'Transcription service temporarily unavailable';
      if (response.status === 413) {
        userFriendlyError = 'File is too large for transcription. Please compress your audio file and try again.';
      } else if (response.status === 429) {
        userFriendlyError = 'Service is busy. Please wait a moment and try again.';
      } else if (response.status === 400) {
        userFriendlyError = 'Audio file format not supported or file is corrupted. Please try a different file.';
      } else if (response.status === 401) {
        userFriendlyError = 'API authentication failed. Please contact support.';
      }
      
      return new Response(
        JSON.stringify({ success: false, error: userFriendlyError }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = await response.json();
    console.log(`Transcription successful, length: ${result.text?.length || 0} characters`);
    
    if (!result.text || result.text.trim().length < 5) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No speech detected in audio file. Please ensure your file contains clear spoken content.' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract text without timestamps
    let transcript = result.text;
    if (result.segments) {
      transcript = result.segments
        .map((segment: any) => segment.text)
        .join(' ');
    }

    return new Response(
      JSON.stringify({
        success: true,
        transcript: transcript.trim(),
        processingSteps: ['Audio transcribed successfully using fallback service']
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Simple transcribe error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Transcription service error. Please try again or contact support if the problem persists.' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function getAudioMimeType(fileName: string): string {
  const extension = fileName.toLowerCase().split('.').pop();
  
  switch (extension) {
    case 'mp3': return 'audio/mpeg';
    case 'wav': return 'audio/wav';
    case 'm4a': return 'audio/mp4';
    case 'flac': return 'audio/flac';
    case 'ogg': return 'audio/ogg';
    case 'aac': return 'audio/aac';
    default: return 'audio/mpeg';
  }
}