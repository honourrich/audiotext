# YouTube Integration API Documentation

## Overview

This document provides comprehensive API documentation for the new YouTube integration features, clearly marking preserved vs new functionality for maintainability and onboarding.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Dual-Source Processing                       │
├─────────────────────────────────────────────────────────────────┤
│  Local Files (PRESERVED)        │  YouTube Videos (NEW)         │
│  ┌─────────────────────────┐   │  ┌─────────────────────────┐   │
│  │   UploadModal.tsx        │   │  │ YouTubeUnifiedModal.tsx │   │
│  │                         │   │  │                         │   │
│  │ • File upload           │   │  │ • URL input             │   │
│  │ • OpenAI Whisper API    │   │  │ • Unified service       │   │
│  │ • Compression           │   │  │ • Usage enforcement     │   │
│  │ • Episode creation      │   │  │ • Error handling        │   │
│  └─────────────────────────┘   │  └─────────────────────────┘   │
│                                 │                                │
│  ┌─────────────────────────┐   │  ┌─────────────────────────┐   │
│  │   UsageService.ts       │   │  │ YouTube Unified Service │   │
│  │                         │   │  │                         │   │
│  │ • Duration tracking     │   │  │ • Metadata + Captions   │   │
│  │ • Monthly limits        │   │  │ • Parallel processing  │   │
│  │ • Free vs Pro           │   │  │ • Graceful fallback     │   │
│  └─────────────────────────┘   │  └─────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Preserved Functionality (Unchanged)

### UploadModal.tsx - Local File Processing

**Status**: ✅ PRESERVED - No changes made to existing workflow

**Key Functions**:
```typescript
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
 */
const processAudioFile = async (file: File) => {
  // Original implementation unchanged
};
```

**Features Preserved**:
- ✅ File upload via drag & drop or file picker
- ✅ OpenAI Whisper API integration
- ✅ Large file compression (>25MB)
- ✅ Bulk upload processing
- ✅ Progress tracking and error handling
- ✅ Episode creation and localStorage storage
- ✅ Navigation to editor

### UsageService.ts - Core Usage Tracking

**Status**: ✅ PRESERVED - Core functionality unchanged

**Key Functions**:
```typescript
/**
 * PRESERVED FUNCTION: getCurrentUsage
 * Gets current usage for the month from database
 */
async getCurrentUsage(userId: string): Promise<UsageLimits>

/**
 * PRESERVED FUNCTION: updateUsage
 * Updates usage when user processes audio or uses GPT
 */
async updateUsage(userId: string, update: UsageUpdate): Promise<boolean>

/**
 * PRESERVED FUNCTION: canPerformAction
 * Check if user can perform an action (within limits)
 */
async canPerformAction(userId: string, action: 'processAudio' | 'useGpt', amount: number = 1)
```

## New Functionality (YouTube Integration)

### YouTube Unified Service

**File**: `supabase/functions/youtube-unified/index.ts`

**Status**: 🆕 NEW MODULE - Complete YouTube processing solution

**Architecture**:
```
YouTube URL Input
  ↓
Extract Video ID
  ↓
┌─────────────────────────────────────┐
│ Parallel Processing                 │
│ ├── YouTube Data API (metadata)    │
│ └── Caption Service (captions)     │
└─────────────────────────────────────┘
  ↓
Combine Results
  ↓
Return Unified Response
```

**Main Function**:
```typescript
/**
 * NEW FUNCTION: processYouTubeVideoUnified
 * 
 * Orchestrates parallel processing of YouTube metadata and captions
 * 
 * @param videoId - YouTube video ID extracted from URL
 * @param lang - Language code for caption extraction (default: 'en')
 * @returns Unified response with metadata and captions
 */
async function processYouTubeVideoUnified(
  videoId: string, 
  lang: string = 'en'
): Promise<YouTubeUnifiedResponse>
```

**Response Interface**:
```typescript
interface YouTubeUnifiedResponse {
  success: boolean;
  videoId?: string;
  metadata?: {
    title: string;
    description: string;
    duration: number; // in seconds
    publishedAt?: string;
    channelTitle?: string;
    thumbnailUrl?: string;
  };
  captions?: CaptionSegment[];
  transcript?: string; // Combined caption text
  error?: string;
  warning?: string; // Warning message for fallback scenarios
  processingTime?: number; // in milliseconds
  hasEstimatedDuration?: boolean; // True if duration was estimated from captions
}
```

### YouTube Data API Module

**File**: `supabase/functions/youtube-data-api/index.ts`

**Status**: 🆕 NEW MODULE - YouTube Data API v3 integration

**Key Functions**:
```typescript
/**
 * NEW FUNCTION: fetchYouTubeVideoMetadata
 * 
 * Fetch video metadata from YouTube Data API v3 with retry logic
 * 
 * @param options - Configuration object with videoId and apiKey
 * @param retryCount - Current retry attempt (default: 0)
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @returns Promise<YouTubeApiResponse> - Structured response with metadata or error
 */
export async function fetchYouTubeVideoMetadata(
  options: YouTubeApiOptions,
  retryCount: number = 0,
  maxRetries: number = 3
): Promise<YouTubeApiResponse>
```

**Features**:
- ✅ Retry logic with exponential backoff
- ✅ Timeout handling (10 seconds)
- ✅ Error handling for quota exceeded, video not found
- ✅ Duration parsing from ISO 8601 format
- ✅ Graceful fallback to oEmbed if API fails

### Caption Service Module

**File**: `supabase/functions/caption-service/index.ts`

**Status**: 🆕 NEW MODULE - YouTube caption extraction

**Key Functions**:
```typescript
/**
 * NEW FUNCTION: extractYouTubeCaptions
 * 
 * Extract captions from YouTube video using youtube-caption-extractor
 * 
 * @param options - Configuration object with videoId and lang
 * @returns Promise<CaptionResponse> - Structured response with captions or error
 */
export async function extractYouTubeCaptions(
  options: CaptionOptions
): Promise<CaptionResponse>

/**
 * NEW FUNCTION: estimateDurationFromCaptions
 * 
 * Estimate video duration from caption segments
 * 
 * @param captions - Array of caption segments
 * @returns Estimated duration in seconds
 */
export function estimateDurationFromCaptions(captions: CaptionSegment[]): number
```

**Features**:
- ✅ Language fallback (en → auto)
- ✅ Error handling for videos without captions
- ✅ Duration estimation from captions
- ✅ Special character and Unicode support

### Enhanced Usage Service

**File**: `src/lib/usageService.ts`

**Status**: 🔄 ENHANCED - YouTube duration enforcement added

**New Functions**:
```typescript
/**
 * NEW FUNCTION: canProcessYouTubeVideo
 * 
 * Check if user can process a YouTube video based on its duration
 * 
 * @param userId - User ID for usage tracking
 * @param videoDurationSeconds - Video duration in seconds from YouTube API
 * @returns Object with processing permission and reason
 */
async canProcessYouTubeVideo(
  userId: string, 
  videoDurationSeconds: number
): Promise<{ canProcess: boolean; reason?: string; estimatedDuration?: string }>

/**
 * NEW FUNCTION: updateUsageAfterYouTubeVideo
 * 
 * Update usage after processing a YouTube video
 * 
 * @param userId - User ID for usage tracking
 * @param videoDurationSeconds - Video duration in seconds from YouTube API
 * @returns Success status of the update operation
 */
async updateUsageAfterYouTubeVideo(
  userId: string, 
  videoDurationSeconds: number
): Promise<boolean>
```

### YouTube Unified Modal

**File**: `src/components/YouTubeUnifiedModal.tsx`

**Status**: 🆕 NEW COMPONENT - YouTube processing UI

**Features**:
- ✅ YouTube URL input and validation
- ✅ Language selection for captions
- ✅ Usage limit enforcement with warnings
- ✅ Progress tracking and error handling
- ✅ Copy/download transcript functionality
- ✅ Upgrade prompts for Free users
- ✅ Estimated duration indicators

**Key Props**:
```typescript
interface YouTubeUnifiedModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
```

## API Endpoints

### YouTube Unified Service

**Endpoint**: `POST /functions/v1/youtube-unified`

**Request**:
```typescript
interface YouTubeUnifiedRequest {
  youtubeUrl: string;    // Required: YouTube video URL
  userId?: string;       // Optional: User ID
  lang?: string;         // Optional: Language for captions (default: 'en')
}
```

**Response**:
```typescript
interface YouTubeUnifiedResponse {
  success: boolean;
  videoId?: string;
  metadata?: {
    title: string;
    description: string;
    duration: number; // in seconds
    publishedAt?: string;
    channelTitle?: string;
    thumbnailUrl?: string;
  };
  captions?: CaptionSegment[];
  transcript?: string;
  error?: string;
  warning?: string;
  processingTime?: number;
  hasEstimatedDuration?: boolean;
}
```

**Example Usage**:
```typescript
const response = await fetch('/functions/v1/youtube-unified', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({
    youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    lang: 'en'
  })
});

const result = await response.json();
```

## Error Handling

### YouTube Data API Errors

| Error Code | Description | Handling |
|------------|-------------|----------|
| 403 | Quota exceeded | Log error, continue with captions, show warning |
| 404 | Video not found | Return error, block processing |
| 429 | Rate limit | Retry with exponential backoff |
| 500/503 | Server error | Retry with exponential backoff |
| Timeout | Request timeout | Retry with exponential backoff |

### Caption Service Errors

| Error Type | Description | Handling |
|------------|-------------|----------|
| No captions | Video has no captions | Return error, continue with metadata |
| Language fail | Specified language not available | Fallback to auto-detect |
| Network error | Connection issues | Return error, continue with metadata |

### Usage Limit Errors

| Scenario | Description | Handling |
|----------|-------------|----------|
| Over limit | Video exceeds remaining minutes | Block processing, show upgrade prompt |
| API failure | Duration unavailable | Allow processing, show warning |
| Network error | Usage check fails | Allow processing, log error |

## Usage Limits

### Free Plan
- **Monthly Limit**: 30 minutes of video processing
- **Enforcement**: Before processing starts
- **Error Message**: "This video is X minutes long, but you only have Y minutes remaining this month. Upgrade to Pro for unlimited processing."

### Pro Plan
- **Monthly Limit**: Unlimited
- **Enforcement**: None
- **Error Message**: N/A

## Integration Points

### Frontend Integration

**Upload Modal**:
```typescript
// YouTube tab integration
<TabsContent value="youtube">
  <Button onClick={() => setShowYouTubeModal(true)}>
    Process YouTube Video
  </Button>
</TabsContent>

// Separate modal for YouTube processing
<YouTubeUnifiedModal 
  open={showYouTubeModal}
  onOpenChange={setShowYouTubeModal}
/>
```

**Usage Hook**:
```typescript
import { useYouTubeUnified } from '@/hooks/useYouTubeUnified';

const { processYouTubeVideo, isLoading, result, error } = useYouTubeUnified();

const response = await processYouTubeVideo(url, lang);
```

### Backend Integration

**Service Dependencies**:
```typescript
// YouTube Data API module
import { fetchYouTubeVideoMetadataAuto } from '../youtube-data-api/index.ts';

// Caption Service module
import { extractYouTubeCaptions, estimateDurationFromCaptions } from '../caption-service/index.ts';
```

## Testing Coverage

### Test Suites Created

1. **YouTube Data API Tests** (`youtube-data-api.test.ts`)
   - Retry logic and error handling
   - Duration parsing edge cases
   - API quota and timeout scenarios

2. **Caption Service Tests** (`youtube-caption-service.test.ts`)
   - Caption extraction success/failure
   - Language fallback scenarios
   - Duration estimation from captions

3. **Unified Service Tests** (`youtube-unified-service.test.ts`)
   - Integration between metadata and captions
   - Graceful failure handling
   - URL format validation

4. **Usage Service Tests** (`usage-service-youtube.test.ts`)
   - Duration enforcement for Free/Pro users
   - Usage tracking after processing
   - Edge cases and error handling

5. **Upload Modal Regression Tests** (`upload-modal-regression.test.tsx`)
   - Local file workflow protection
   - OpenAI integration verification
   - UI state management

6. **YouTube E2E Tests** (`youtube-e2e.test.tsx`)
   - Complete user journey testing
   - Usage limit enforcement
   - Error handling scenarios

## Migration Guide

### For Developers

**Existing Code**: No changes required for local file processing
**New Code**: Use YouTube unified service for YouTube URLs

**Before**:
```typescript
// Only local file processing
const processFile = async (file: File) => {
  // OpenAI Whisper transcription
};
```

**After**:
```typescript
// Dual-source processing
const processFile = async (file: File) => {
  // OpenAI Whisper transcription (unchanged)
};

const processYouTube = async (url: string) => {
  // YouTube unified service (new)
  const result = await processYouTubeVideo(url, 'en');
};
```

### For Users

**Local Files**: Work exactly as before
**YouTube URLs**: New processing with accurate duration tracking

## Maintenance Notes

### Code Organization

**Preserved Files**:
- `src/components/UploadModal.tsx` - Local file processing (unchanged)
- `src/lib/usageService.ts` - Core usage tracking (enhanced)

**New Files**:
- `supabase/functions/youtube-unified/index.ts` - Main YouTube service
- `supabase/functions/youtube-data-api/index.ts` - YouTube Data API v3
- `supabase/functions/caption-service/index.ts` - Caption extraction
- `src/components/YouTubeUnifiedModal.tsx` - YouTube UI
- `src/hooks/useYouTubeUnified.ts` - YouTube hook

### Dependencies

**New Dependencies**:
- `youtube-caption-extractor` - Caption extraction
- YouTube Data API v3 - Metadata fetching

**Existing Dependencies**:
- OpenAI Whisper API - Local file transcription (unchanged)
- Supabase - Database and functions (unchanged)

### Environment Variables

**Required**:
```bash
YOUTUBE_API_KEY=your_youtube_api_key_here
CLERK_SECRET_KEY=your_clerk_secret_key
```

**Optional**:
```bash
YOUTUBE_API_DEBUG=true
```

## Conclusion

The YouTube integration provides a comprehensive solution for processing YouTube videos while maintaining complete backward compatibility with existing local file processing. The dual-source approach ensures users can process both local files and YouTube videos with consistent UI patterns and accurate usage tracking.

Key benefits:
- ✅ **Preserved Functionality**: Local file processing unchanged
- ✅ **New Capabilities**: YouTube video processing with accurate duration
- ✅ **Consistent UX**: Same UI patterns across both workflows
- ✅ **Accurate Tracking**: YouTube Data API duration for usage limits
- ✅ **Graceful Fallback**: Processing continues even when APIs fail
- ✅ **Comprehensive Testing**: Full test coverage for regression protection
