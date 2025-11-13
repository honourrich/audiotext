// YouTube video transcription using OpenAI Whisper API
import OpenAI from "openai";

// Initialize OpenAI client
const getOpenAIClient = () => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OpenAI API key not found. Please add VITE_OPENAI_API_KEY to your environment variables.",
    );
  }
  return new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true, // Note: In production, this should be done on the backend
  });
};

// Check if OpenAI API key is available
export const isOpenAIAvailable = (): boolean => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  const isAvailable = !!apiKey && apiKey.trim().length > 0;
  console.log("OpenAI API key availability check:", {
    hasKey: !!apiKey,
    keyLength: apiKey ? apiKey.length : 0,
    isAvailable,
  });
  return isAvailable;
};

// Extract video ID from YouTube URL
export const extractVideoId = (url: string): string | null => {
  const regex =
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

// Get YouTube video info
export const getYouTubeVideoInfo = async (videoId: string) => {
  try {
    // This is a simplified approach - in production you'd use YouTube Data API
    const response = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
    );
    if (!response.ok) {
      throw new Error("Failed to fetch video info");
    }
    const data = await response.json();
    return {
      title: data.title,
      author: data.author_name,
      thumbnail: data.thumbnail_url,
    };
  } catch (error) {
    console.error("Failed to get video info:", error);
    return {
      title: `YouTube Video ${videoId}`,
      author: "Unknown",
      thumbnail: null,
    };
  }
};

// Download YouTube audio (this would typically be done on the backend)
export const downloadYouTubeAudio = async (videoId: string): Promise<Blob> => {
  // Note: This is a placeholder. In a real implementation, you would:
  // 1. Use a backend service to download the audio using youtube-dl or similar
  // 2. Convert to appropriate format for Whisper API
  // 3. Return the audio blob

  // For now, we'll simulate this process
  throw new Error(
    "YouTube audio download must be implemented on the backend for security and CORS reasons. Please use the backend API endpoint.",
  );
};

// Transcribe audio using OpenAI Whisper API
export const transcribeAudioWithWhisper = async (
  audioBlob: Blob,
  filename: string = "audio.mp3",
): Promise<string> => {
  if (!isOpenAIAvailable()) {
    throw new Error(
      "OpenAI API key not configured. Please add VITE_OPENAI_API_KEY to your environment variables.",
    );
  }

  try {
    console.log("Starting Whisper transcription for:", filename);
    console.log("Audio blob size:", audioBlob.size, "bytes");
    console.log("Audio blob type:", audioBlob.type);

    const openai = getOpenAIClient();

    // Validate audio file size (Whisper API has a 25MB limit)
    if (audioBlob.size > 25 * 1024 * 1024) {
      throw new Error(
        "Audio file is too large. Whisper API supports files up to 25MB.",
      );
    }

    // Create a File object from the blob with proper MIME type
    const audioFile = new File([audioBlob], filename, {
      type: audioBlob.type || "audio/mpeg",
    });

    console.log("Calling OpenAI Whisper API with file:", {
      name: audioFile.name,
      size: audioFile.size,
      type: audioFile.type,
    });

    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
      language: "en", // You can make this configurable
      response_format: "text",
      temperature: 0.2, // Lower temperature for more consistent results
    });

    console.log("Whisper transcription completed successfully");
    console.log("Transcription length:", transcription.length);
    console.log(
      "Transcription preview:",
      transcription.substring(0, 200) + "...",
    );

    // Validate the transcription result
    if (
      !transcription ||
      typeof transcription !== "string" ||
      transcription.trim().length === 0
    ) {
      throw new Error("Whisper API returned empty transcription");
    }

    return transcription.trim();
  } catch (error) {
    console.error("Whisper API error details:", {
      error,
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    if (error instanceof Error) {
      // Check for specific OpenAI API errors
      if (error.message.includes("401")) {
        throw new Error(
          "Invalid OpenAI API key. Please check your VITE_OPENAI_API_KEY.",
        );
      }
      if (error.message.includes("429")) {
        throw new Error(
          "OpenAI API rate limit exceeded. Please try again later.",
        );
      }
      if (error.message.includes("413")) {
        throw new Error("Audio file is too large for Whisper API (max 25MB).");
      }
      throw new Error(`Whisper API failed: ${error.message}`);
    }
    throw new Error("Failed to transcribe audio with Whisper API");
  }
};

// Main function to transcribe YouTube video
export const transcribeYouTubeVideo = async (
  youtubeUrl: string,
  onProgress?: (progress: number, status: string) => void,
): Promise<{
  transcript: string;
  videoInfo: any;
}> => {
  try {
    const videoId = extractVideoId(youtubeUrl);
    if (!videoId) {
      throw new Error("Invalid YouTube URL");
    }

    onProgress?.(10, "Getting video information...");
    const videoInfo = await getYouTubeVideoInfo(videoId);

    onProgress?.(20, "Preparing audio download...");

    // In a real implementation, you would call your backend API here
    // For now, we'll provide instructions for the user
    throw new Error(`
To enable real YouTube transcription, you need to implement a backend service that:

1. Downloads YouTube audio using youtube-dl or yt-dlp
2. Converts audio to a format supported by Whisper API
3. Calls OpenAI Whisper API for transcription
4. Returns the transcript

Backend implementation example:
- Use 'youtube-dl' or 'yt-dlp' to extract audio
- Use 'ffmpeg' to convert to mp3/wav format
- Upload to OpenAI Whisper API
- Return transcript to frontend

For now, the app will use a detailed mock transcript based on the video: ${videoInfo.title}
    `);
  } catch (error) {
    console.error("YouTube transcription failed:", error);
    throw error;
  }
};

// Alternative: Use YouTube's auto-generated captions (if available)
export const extractYouTubeAutoCaption = async (
  youtubeUrl: string,
): Promise<string> => {
  try {
    const videoId = extractVideoId(youtubeUrl);
    if (!videoId) {
      throw new Error("Invalid YouTube URL");
    }

    // This approach tries to extract auto-generated captions
    // Note: This may not work due to CORS and YouTube's anti-scraping measures
    const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`);
    const html = await response.text();

    // Look for captions data in the page
    const captionsRegex = /"captions":(\{.*?\})/;
    const match = html.match(captionsRegex);

    if (match) {
      try {
        const captions = JSON.parse(match[1]);
        const tracks = captions?.playerCaptionsTracklistRenderer?.captionTracks;

        if (tracks && tracks.length > 0) {
          // Get the first available caption track
          const captionUrl = tracks[0].baseUrl;
          const captionResponse = await fetch(captionUrl);
          const captionXml = await captionResponse.text();

          // Parse XML and extract text
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(captionXml, "text/xml");
          const textElements = xmlDoc.getElementsByTagName("text");

          let transcript = "";
          for (let i = 0; i < textElements.length; i++) {
            const text = textElements[i].textContent || "";
            const cleanText = text
              .replace(/&amp;/g, "&")
              .replace(/&lt;/g, "<")
              .replace(/&gt;/g, ">")
              .replace(/&quot;/g, '"')
              .replace(/&#39;/g, "'");
            transcript += cleanText + " ";
          }

          if (transcript.trim()) {
            return transcript.trim();
          }
        }
      } catch (parseError) {
        console.error("Failed to parse captions:", parseError);
      }
    }

    throw new Error("No auto-generated captions found for this video");
  } catch (error) {
    console.error("Failed to extract auto captions:", error);
    throw error;
  }
};
