# YouTube Unified Service - Deployment Guide

## Overview

This guide covers deploying the YouTube Unified Service, which combines video metadata fetching and caption extraction into a single efficient endpoint.

## Prerequisites

### Required Environment Variables

```bash
# YouTube Data API v3
YOUTUBE_API_KEY=your_youtube_api_key_here

# Clerk Authentication
CLERK_SECRET_KEY=your_clerk_secret_key

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Dependencies

The unified service depends on two other modules:
- `youtube-data-api` - YouTube Data API v3 integration
- `caption-service` - Caption extraction service

## Deployment Steps

### 1. Deploy Dependencies

First, deploy the required modules:

```bash
# Deploy YouTube Data API module
supabase functions deploy youtube-data-api

# Deploy Caption Service module  
supabase functions deploy caption-service
```

### 2. Deploy Unified Service

```bash
# Deploy the unified service
supabase functions deploy youtube-unified
```

### 3. Verify Deployment

```bash
# Check function status
supabase functions list

# Test the endpoint
curl -X POST \
  https://your-project.supabase.co/functions/v1/youtube-unified \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"youtubeUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'
```

## Configuration

### Environment Variables Setup

#### YouTube API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable YouTube Data API v3
4. Create credentials (API Key)
5. Set quota limits (recommended: 10,000 units/day)

#### Clerk Secret Key

1. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Select your project
3. Go to API Keys section
4. Copy the Secret Key

### Supabase Configuration

```bash
# Set environment variables
supabase secrets set YOUTUBE_API_KEY=your_key_here
supabase secrets set CLERK_SECRET_KEY=your_key_here
```

## Testing

### Manual Testing

#### Test with curl

```bash
# Basic test
curl -X POST \
  https://your-project.supabase.co/functions/v1/youtube-unified \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "youtubeUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "lang": "en"
  }'
```

#### Expected Response

```json
{
  "success": true,
  "videoId": "dQw4w9WgXcQ",
  "metadata": {
    "title": "Rick Astley - Never Gonna Give You Up",
    "description": "The official video for 'Never Gonna Give You Up'...",
    "duration": 253,
    "channelTitle": "Rick Astley",
    "publishedAt": "2009-10-25T06:57:33Z"
  },
  "captions": [
    {
      "text": "We're no strangers to love",
      "offset": 0,
      "duration": 3.5
    }
  ],
  "transcript": "We're no strangers to love...",
  "processingTime": 1250
}
```

### Frontend Testing

#### Test the Hook

```typescript
import { useYouTubeUnified } from '@/hooks/useYouTubeUnified';

function TestComponent() {
  const { processYouTubeVideo, isLoading, result, error } = useYouTubeUnified();

  const testVideo = async () => {
    const response = await processYouTubeVideo('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    console.log('Result:', response);
  };

  return (
    <div>
      <button onClick={testVideo} disabled={isLoading}>
        Test Video Processing
      </button>
      {result?.success && <div>Success! Duration: {result.metadata?.duration}s</div>}
      {error && <div>Error: {error}</div>}
    </div>
  );
}
```

#### Test the Modal

```typescript
import YouTubeUnifiedModal from '@/components/YouTubeUnifiedModal';

function App() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div>
      <button onClick={() => setShowModal(true)}>
        Open YouTube Processor
      </button>
      
      <YouTubeUnifiedModal 
        open={showModal}
        onOpenChange={setShowModal}
      />
    </div>
  );
}
```

## Monitoring

### Log Monitoring

Monitor these log patterns:

```
[Unified Service] Processing video: dQw4w9WgXcQ with language: en
[Unified Service] Starting parallel processing...
[Unified Service] ✅ Metadata fetched successfully
[Unified Service] ✅ Captions extracted successfully: 45 segments
[Unified Service] ✅ Processing completed successfully
[Unified Service] - Processing time: 1250ms
```

### Error Monitoring

Watch for these error patterns:

- `YouTube API quota exceeded` - Need to increase quota
- `Video not found or private` - Invalid video URL
- `No captions available` - Video has no captions
- `Authentication required` - Token issues

### Performance Metrics

Track these metrics:

- **Processing Time**: Average response time
- **Success Rate**: Percentage of successful requests
- **Error Rate**: Percentage of failed requests
- **API Usage**: YouTube API quota consumption

## Troubleshooting

### Common Issues

#### 1. Authentication Errors

**Problem**: `Authorization token required`

**Solution**: 
- Ensure Clerk token is properly configured
- Check CLERK_SECRET_KEY environment variable
- Verify token format in requests

#### 2. YouTube API Errors

**Problem**: `YouTube API quota exceeded`

**Solution**:
- Check API quota in Google Cloud Console
- Increase quota limits if needed
- Implement rate limiting

#### 3. Caption Extraction Failures

**Problem**: `No captions available for this video`

**Solution**:
- Verify video has captions enabled
- Try different language settings
- Check if video is public

#### 4. Network Timeouts

**Problem**: `Request processing failed: Timeout`

**Solution**:
- Check network connectivity
- Increase timeout limits
- Implement retry logic

### Debug Mode

Enable debug logging:

```bash
# Set debug environment variable
supabase secrets set YOUTUBE_API_DEBUG=true
```

This will provide more detailed logging for troubleshooting.

## Performance Optimization

### Caching Strategy

Implement caching for frequently accessed videos:

```typescript
// Simple in-memory cache
const videoCache = new Map();

async function getCachedVideo(videoId: string) {
  if (videoCache.has(videoId)) {
    return videoCache.get(videoId);
  }
  
  const result = await processYouTubeVideoUnified(videoId);
  if (result.success) {
    videoCache.set(videoId, result);
  }
  
  return result;
}
```

### Rate Limiting

Implement rate limiting to prevent quota exhaustion:

```typescript
// Simple rate limiter
const rateLimiter = new Map();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userRequests = rateLimiter.get(userId) || [];
  
  // Remove old requests (older than 1 minute)
  const recentRequests = userRequests.filter(time => now - time < 60000);
  
  if (recentRequests.length >= 10) { // 10 requests per minute
    return false;
  }
  
  recentRequests.push(now);
  rateLimiter.set(userId, recentRequests);
  return true;
}
```

## Security Considerations

### API Key Security

- Never expose API keys in client-side code
- Use environment variables for all secrets
- Rotate keys regularly
- Monitor API usage for anomalies

### Input Validation

- Validate YouTube URLs before processing
- Sanitize user inputs
- Implement proper error handling
- Rate limit requests per user

### Data Privacy

- Don't store sensitive user data
- Implement proper data retention policies
- Log only necessary information
- Comply with privacy regulations

## Scaling Considerations

### Horizontal Scaling

- Deploy multiple function instances
- Use load balancers for distribution
- Implement proper session management
- Monitor resource usage

### Vertical Scaling

- Increase function memory limits
- Optimize processing algorithms
- Implement efficient data structures
- Cache frequently accessed data

## Maintenance

### Regular Tasks

1. **Monitor API Quotas**: Check YouTube API usage daily
2. **Update Dependencies**: Keep packages up to date
3. **Review Logs**: Check for errors and performance issues
4. **Test Functionality**: Regular end-to-end testing

### Updates

1. **Deploy Updates**: Use rolling deployments
2. **Test Changes**: Verify functionality after updates
3. **Monitor Performance**: Watch for regressions
4. **Rollback if Needed**: Have rollback plan ready

## Support

### Documentation

- [YouTube Data API v3](https://developers.google.com/youtube/v3)
- [Clerk Authentication](https://clerk.com/docs)
- [Supabase Functions](https://supabase.com/docs/guides/functions)

### Community

- [Supabase Discord](https://discord.supabase.com/)
- [GitHub Issues](https://github.com/supabase/supabase/issues)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/supabase)

## Conclusion

The YouTube Unified Service provides a robust, scalable solution for processing YouTube videos. By following this deployment guide, you can ensure proper setup, monitoring, and maintenance of the service.

Remember to monitor performance metrics, implement proper security measures, and keep the service updated for optimal performance.
