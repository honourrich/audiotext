# YouTube Data API v3 Module

## Overview

The YouTube Data API v3 module provides official access to YouTube's metadata API to fetch video information including duration, title, and description. This module is designed to run before or parallel to caption extraction for optimal performance.

## Features

✅ **Official YouTube Data API v3 Integration**
- Uses Google's official YouTube Data API v3
- Fetches `contentDetails.duration`, `snippet.title`, and `snippet.description`
- Handles API quotas and rate limiting
- Comprehensive error handling

✅ **Robust Duration Extraction**
- Parses ISO 8601 duration format (PT4M13S)
- Returns duration in seconds
- Handles edge cases and malformed data

✅ **Fallback Strategy**
- Falls back to oEmbed API if YouTube Data API fails
- Graceful degradation when API key is unavailable
- Always returns valid metadata

✅ **Modular Design**
- Can be used independently or integrated with other services
- Clean API interface
- Easy to test and maintain

## Architecture

### Module Structure

```
supabase/functions/youtube-data-api/
├── index.ts                    # Main module with all functions
└── README.md                   # This documentation
```

### Key Functions

1. **`fetchYouTubeVideoMetadata(options)`** - Core function with explicit API key
2. **`fetchYouTubeVideoMetadataAuto(videoId)`** - Automatic API key from environment
3. **`fetchMultipleVideoMetadata(videoIds, apiKey)`** - Batch processing
4. **`parseYouTubeDuration(duration)`** - Duration parsing utility

## API Reference

### Types

```typescript
interface YouTubeVideoMetadata {
  videoId: string;
  title: string;
  description: string;
  duration: number; // in seconds
  publishedAt?: string;
  channelTitle?: string;
  thumbnailUrl?: string;
}

interface YouTubeApiResponse {
  success: boolean;
  metadata?: YouTubeVideoMetadata;
  error?: string;
}

interface YouTubeApiOptions {
  videoId: string;
  apiKey: string;
}
```

### Core Functions

#### `fetchYouTubeVideoMetadata(options)`

Fetches video metadata using explicit API key.

```typescript
const result = await fetchYouTubeVideoMetadata({
  videoId: 'dQw4w9WgXcQ',
  apiKey: 'YOUR_API_KEY'
});

if (result.success) {
  console.log('Title:', result.metadata.title);
  console.log('Duration:', result.metadata.duration);
  console.log('Description:', result.metadata.description);
}
```

#### `fetchYouTubeVideoMetadataAuto(videoId)`

Fetches video metadata using API key from environment variables.

```typescript
const result = await fetchYouTubeVideoMetadataAuto('dQw4w9WgXcQ');

if (result.success) {
  console.log('Duration:', result.metadata.duration);
}
```

#### `fetchMultipleVideoMetadata(videoIds, apiKey)`

Batch fetch metadata for multiple videos.

```typescript
const results = await fetchMultipleVideoMetadata(
  ['video1', 'video2', 'video3'],
  'YOUR_API_KEY'
);

results.forEach((result, index) => {
  if (result.success) {
    console.log(`Video ${index + 1}:`, result.metadata.title);
  }
});
```

## Integration with Main Function

### Before Integration

The main function used a mixed approach:
- oEmbed API for title (no duration)
- YouTube Data API inline (duplicated code)
- Manual duration parsing

### After Integration

The main function now uses the modular approach:

```typescript
// Import the module
import { fetchYouTubeVideoMetadataAuto } from '../youtube-data-api/index.ts';

// Use in metadata function
async function getVideoMetadata(videoId: string) {
  const result = await fetchYouTubeVideoMetadataAuto(videoId);
  
  if (result.success && result.metadata) {
    return {
      title: result.metadata.title,
      duration: result.metadata.duration,
      description: result.metadata.description
    };
  }
  
  // Fallback to oEmbed
  // ...
}
```

## Processing Flow

### 1. Metadata Fetching (Primary)

```
User submits YouTube URL
  ↓
Extract video ID
  ↓
Call YouTube Data API v3
  ↓
Fetch contentDetails.duration, snippet.title, snippet.description
  ↓
Parse duration from ISO 8601 format
  ↓
Return structured metadata
```

### 2. Fallback Strategy

```
YouTube Data API fails
  ↓
Try oEmbed API
  ↓
Get title only (no duration)
  ↓
Return partial metadata
  ↓
Duration will be estimated from captions later
```

### 3. Error Handling

```typescript
// API quota exceeded
if (response.status === 403) {
  return { success: false, error: 'YouTube API quota exceeded' };
}

// Video not found
if (response.status === 404) {
  return { success: false, error: 'Video not found or private' };
}

// Network error
catch (error) {
  return { success: false, error: `Network error: ${error.message}` };
}
```

## Configuration

### Environment Variables

```bash
# Required for full functionality
YOUTUBE_API_KEY=your_youtube_api_key_here

# Optional - for debugging
YOUTUBE_API_DEBUG=true
```

### API Key Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable YouTube Data API v3
4. Create credentials (API Key)
5. Set the API key in your environment

### Quota Management

- YouTube Data API v3 has daily quotas
- Each video metadata request costs 1 unit
- Default quota: 10,000 units/day
- Monitor usage in Google Cloud Console

## Usage Examples

### Basic Usage

```typescript
import { fetchYouTubeVideoMetadataAuto } from '../youtube-data-api/index.ts';

const result = await fetchYouTubeVideoMetadataAuto('dQw4w9WgXcQ');

if (result.success) {
  const { title, duration, description } = result.metadata;
  console.log(`${title} (${Math.floor(duration / 60)}:${duration % 60})`);
}
```

### Error Handling

```typescript
const result = await fetchYouTubeVideoMetadataAuto('invalid_video_id');

if (!result.success) {
  switch (result.error) {
    case 'YouTube API quota exceeded':
      // Handle quota exceeded
      break;
    case 'Video not found or private':
      // Handle private/unavailable video
      break;
    default:
      // Handle other errors
      break;
  }
}
```

### Batch Processing

```typescript
const videoIds = ['video1', 'video2', 'video3'];
const results = await fetchMultipleVideoMetadata(videoIds, apiKey);

const successful = results.filter(r => r.success);
const failed = results.filter(r => !r.success);

console.log(`Successfully fetched ${successful.length}/${videoIds.length} videos`);
```

## Performance Considerations

### Parallel Processing

The module is designed to run before or parallel to caption extraction:

```typescript
// Sequential (current implementation)
const metadata = await getVideoMetadata(videoId);
const captions = await extractCaptions(videoId);

// Parallel (future optimization)
const [metadata, captions] = await Promise.all([
  getVideoMetadata(videoId),
  extractCaptions(videoId)
]);
```

### Caching

Consider implementing caching for frequently accessed videos:

```typescript
// Simple in-memory cache
const metadataCache = new Map();

async function getCachedMetadata(videoId: string) {
  if (metadataCache.has(videoId)) {
    return metadataCache.get(videoId);
  }
  
  const result = await fetchYouTubeVideoMetadataAuto(videoId);
  if (result.success) {
    metadataCache.set(videoId, result.metadata);
  }
  
  return result;
}
```

## Testing

### Unit Tests

```typescript
// Test duration parsing
import { parseYouTubeDuration } from '../youtube-data-api/index.ts';

test('parseYouTubeDuration', () => {
  expect(parseYouTubeDuration('PT4M13S')).toBe(253);
  expect(parseYouTubeDuration('PT1H30M45S')).toBe(5445);
  expect(parseYouTubeDuration('PT0S')).toBe(0);
});
```

### Integration Tests

```typescript
// Test with real API
test('fetchYouTubeVideoMetadataAuto', async () => {
  const result = await fetchYouTubeVideoMetadataAuto('dQw4w9WgXcQ');
  
  expect(result.success).toBe(true);
  expect(result.metadata.title).toBeDefined();
  expect(result.metadata.duration).toBeGreaterThan(0);
});
```

## Monitoring and Debugging

### Logging

The module provides comprehensive logging:

```
[YouTube API] Fetching metadata for video: dQw4w9WgXcQ
[YouTube API] Making request to: https://www.googleapis.com/youtube/v3/videos?id=dQw4w9WgXcQ&part=contentDetails,snippet&key=API_KEY_HIDDEN
[YouTube API] ✅ Successfully extracted metadata:
[YouTube API] - Title: Rick Astley - Never Gonna Give You Up
[YouTube API] - Duration: 253 seconds (4:13)
[YouTube API] - Channel: Rick Astley
[YouTube API] - Description length: 1234 characters
```

### Error Monitoring

Monitor these error patterns:

- `YouTube API quota exceeded` - Need to increase quota
- `Video not found or private` - User submitted invalid URL
- `Network error` - Connectivity issues
- `API key not configured` - Missing environment variable

## Migration Guide

### From Old Implementation

**Before:**
```typescript
// Mixed approach with inline API calls
const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=contentDetails,snippet&key=${apiKey}`);
// Manual parsing and error handling
```

**After:**
```typescript
// Clean modular approach
import { fetchYouTubeVideoMetadataAuto } from '../youtube-data-api/index.ts';
const result = await fetchYouTubeVideoMetadataAuto(videoId);
```

### Benefits

1. **Cleaner Code** - No more inline API calls
2. **Better Error Handling** - Centralized error management
3. **Reusability** - Can be used by other functions
4. **Testability** - Easy to unit test
5. **Maintainability** - Single source of truth for YouTube API logic

## Future Enhancements

### Planned Features

1. **Caching Layer** - Redis-based caching for metadata
2. **Rate Limiting** - Built-in rate limiting and retry logic
3. **Batch Optimization** - Optimized batch processing
4. **Analytics** - Usage tracking and analytics
5. **Webhooks** - Real-time updates for video changes

### API Extensions

```typescript
// Future API extensions
interface ExtendedYouTubeVideoMetadata extends YouTubeVideoMetadata {
  viewCount?: number;
  likeCount?: number;
  commentCount?: number;
  tags?: string[];
  categoryId?: string;
  defaultLanguage?: string;
  availableLanguages?: string[];
}
```

## Conclusion

The YouTube Data API v3 module provides a robust, modular solution for fetching video metadata. It integrates seamlessly with the existing caption extraction workflow while providing better error handling, cleaner code, and improved maintainability.

The module ensures that duration tracking works reliably by using the official YouTube API as the primary source, with intelligent fallbacks to ensure the system continues to function even when the API is unavailable.
