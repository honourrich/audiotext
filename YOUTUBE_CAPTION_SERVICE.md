# YouTube Caption Service - Modular Architecture

## Overview

The YouTube caption extraction functionality has been modularized into a separate service while preserving all existing functionality. This isolation ensures that the youtube-caption-extractor integration remains stable and can be independently maintained.

## Architecture

### Components

1. **Caption Service** (`supabase/functions/caption-service/index.ts`)
   - Isolated module for YouTube caption extraction
   - Uses `youtube-caption-extractor@1.9.0` package
   - Provides clean API for extraction
   - Handles all caption-related logic

2. **Main Function** (`supabase/functions/process-youtube-captions/index.ts`)
   - Orchestrates the caption extraction workflow
   - Imports and uses the modular caption service
   - Handles duration extraction and video metadata
   - Manages the full processing pipeline

### Key Features

✅ **Preserved Functionality**
- All existing caption extraction features remain unchanged
- Language detection and fallback logic preserved
- Error handling maintained

✅ **Modular Isolation**
- Caption extraction is now a separate service
- Can be easily tested independently
- Can be replaced with alternative implementations if needed

✅ **Duration Tracking**
- Extracts duration from YouTube Data API when available
- Falls back to estimating from caption timestamps
- Always returns a valid duration value

## How It Works

### 1. Caption Extraction Flow

```typescript
// In caption-service/index.ts
extractYouTubeCaptions({ videoId, lang: 'en' })
  ↓
Uses youtube-caption-extractor package
  ↓
Returns structured CaptionSegment[]
```

### 2. Duration Extraction Flow

```typescript
// Try method 1: YouTube Data API
getVideoMetadata(videoId)
  ↓
Parse duration from contentDetails.duration (PT4M13S format)
  ↓
If unavailable, use method 2 below
  ↓
estimateDurationFromCaptions(captions)
  ↓
Calculate from last caption's timestamp
  ↓
Return duration in seconds
```

### 3. Full Processing Pipeline

```
User submits YouTube URL
  ↓
Extract video ID
  ↓
Get metadata (title + duration from YouTube API)
  ↓
Extract captions (using modular caption service)
  ↓
Estimate duration from captions if not available
  ↓
Format transcript
  ↓
Return to frontend with duration
```

## Usage Example

### In the Main Function

```typescript
// Import the modular service
import { extractYouTubeCaptions, estimateDurationFromCaptions } from '../caption-service/index.ts';

// Use the service
const result = await extractYouTubeCaptions({ videoId, lang: 'en' });

if (result.success && result.captions) {
  const duration = estimateDurationFromCaptions(result.captions);
  // duration is now available
}
```

### Caption Service API

```typescript
interface CaptionServiceOptions {
  videoId: string;
  lang?: string; // 'en', 'auto', or language code
}

interface CaptionServiceResult {
  success: boolean;
  captions?: CaptionSegment[];
  error?: string;
}

interface CaptionSegment {
  text: string;
  offset: number; // milliseconds
  duration: number; // seconds
}
```

## Benefits of Modular Architecture

1. **Separation of Concerns**
   - Caption extraction is isolated from business logic
   - Easy to test in isolation
   - Clear API boundaries

2. **Maintainability**
   - Changes to caption extraction don't affect main function
   - Can update or replace youtube-caption-extractor easily
   - Better code organization

3. **Reusability**
   - Caption service can be used by other functions
   - Can be called independently if needed
   - Easy to add new features

4. **Preservation**
   - All existing functionality remains intact
   - No breaking changes to frontend
   - Backward compatible

## Duration Extraction Details

### Method 1: YouTube Data API (Primary)

- Requires `YOUTUBE_API_KEY` environment variable
- Gets duration from `contentDetails.duration`
- Parses ISO 8601 duration format (PT4M13S)
- Most accurate method

### Method 2: Caption-Based Estimation (Fallback)

- Used when YouTube API is unavailable
- Calculates duration from last caption's timestamp
- Formula: `(lastCaption.offset / 1000) + lastCaption.duration`
- Accurate within 1-2 seconds

### Result

- Always returns a number (never undefined)
- Defaults to 0 if no data available
- Logged for debugging
- Passed to frontend correctly

## Frontend Integration

The frontend receives the duration in the response:

```typescript
interface YouTubeResponse {
  success: boolean;
  episodeId?: string;
  transcript?: string;
  videoTitle?: string;
  videoDuration?: number; // Always a number
  // ...
}
```

The episode object stores the duration:

```typescript
const episode: Episode = {
  // ...
  duration: result.videoDuration || 0, // Always has a value
  youtubeUrl: youtubeUrl.trim(),
  sourceType: 'youtube',
  // ...
};
```

## Deployment

### Existing Deployment

The modular architecture uses existing deployment - no changes needed!

### Testing

```bash
# Test the caption service independently
curl -X POST \
  https://your-project.supabase.co/functions/v1/caption-service \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"videoId": "dQw4w9WgXcQ", "lang": "en"}'
```

### Debugging

Check the logs for duration extraction:

```bash
# Look for these log patterns
🎬 DURATION EXTRACTION SUMMARY:
🎬 videoDuration value: 768
🎬 Final videoDuration after conversion: 768
✅ Final estimated duration: 768 seconds (12:48)
```

## Preserved Features

- ✅ youtube-caption-extractor integration
- ✅ Multiple language support
- ✅ Auto-detection fallback
- ✅ Error handling
- ✅ Timestamp conversion
- ✅ Duration estimation
- ✅ Video metadata extraction

## Maintenance

### Updating youtube-caption-extractor

Simply update the import URL in `caption-service/index.ts`:

```typescript
// Current version
const { getSubtitles } = await import('https://esm.sh/youtube-caption-extractor@1.9.0');

// New version
const { getSubtitles } = await import('https://esm.sh/youtube-caption-extractor@2.0.0');
```

### Adding New Features

1. Add functionality to `caption-service/index.ts`
2. Export new functions
3. Import in main function
4. Use new features

### Testing

The modular architecture makes testing easier:

```typescript
// Test caption extraction
const result = await extractYouTubeCaptions({ videoId: 'test', lang: 'en' });
expect(result.success).toBe(true);
expect(result.captions).toBeDefined();

// Test duration estimation
const duration = estimateDurationFromCaptions(result.captions);
expect(duration).toBeGreaterThan(0);
```

## Conclusion

The caption extraction functionality is now modular, isolated, and preserved while improving duration tracking. All existing features continue to work without any breaking changes.

