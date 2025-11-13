# Video Export Feature Documentation

## Overview

The Video Export feature in audiotext allows content creators to transform their podcast episodes into professional, social media-ready videos with hardcoded subtitles and branding overlays. This feature is designed to help creators maximize their content reach across multiple platforms.

## Table of Contents

- [Features](#features)
- [Getting Started](#getting-started)
- [Step-by-Step Guide](#step-by-step-guide)
- [Platform Support](#platform-support)
- [Technical Specifications](#technical-specifications)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)
- [API Reference](#api-reference)

## Features

### Core Functionality

- **Multi-Platform Export**: Support for TikTok (9:16), Instagram (1:1), YouTube (16:9), and more
- **Automatic Subtitle Generation**: Convert podcast transcripts into timed subtitles
- **Branding Overlays**: Add logos, watermarks, and text overlays
- **Aspect Ratio Conversion**: Automatic cropping and padding for different platforms
- **Real-time Preview**: See exactly how your video will look before exporting
- **High-Quality Processing**: Powered by FFmpeg.wasm for professional results

### Advanced Features

- **Custom Dimensions**: Set custom width and height for specific requirements
- **Subtitle Styling**: Full control over fonts, colors, backgrounds, and positioning
- **Branding Management**: Multiple logo and watermark support
- **Batch Processing**: Process multiple videos with similar settings
- **Quality Settings**: Choose between different quality presets

## Getting Started

### Prerequisites

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Video file in supported format (MP4, MOV, AVI, MKV, WEBM)
- Podcast episode with transcript (optional)
- Logo or branding assets (optional)

### Supported Formats

#### Input Formats
- **Video**: MP4, MOV, AVI, MKV, WEBM
- **Audio**: MP3, M4A, WAV, FLAC, AAC, OGG
- **Images**: PNG, JPG, SVG (for logos)

#### Output Formats
- **Video**: MP4 (H.264)
- **Audio**: AAC
- **Subtitles**: SRT, VTT

### System Requirements

- **Browser**: Chrome 80+, Firefox 75+, Safari 13+, Edge 80+
- **Memory**: 4GB RAM minimum, 8GB recommended
- **Storage**: 1GB free space for processing
- **Internet**: Stable connection for FFmpeg.wasm loading

## Step-by-Step Guide

### 1. Access Video Export

There are three ways to access the Video Export feature:

#### From Dashboard
1. Click "Upload" button
2. Select "Video Export" tab
3. Follow the guided interface

#### From Episode Editor
1. Open any episode
2. Click "Video" tab
3. Upload your video file

#### From Onboarding
1. Complete the feature tour
2. Click on "Video Export" feature
3. Follow the interactive tutorial

### 2. Upload Your Video

1. **Drag and Drop**: Drag your video file onto the upload area
2. **Browse**: Click "Browse" to select from your computer
3. **Validation**: System checks format and size automatically
4. **Preview**: See your video in the preview player

**Tips for Best Results:**
- Use high-quality source videos (1080p or higher)
- Keep file size under 500MB for faster processing
- MP4 format works best for compatibility
- Ensure good audio quality for subtitle generation

### 3. Configure Subtitles

#### Auto-Generate from Transcript
1. Click "Use Episode Transcript"
2. System automatically generates timed subtitles
3. Review and edit timing as needed
4. Adjust text content if necessary

#### Manual Subtitle Creation
1. Click "Add Subtitle"
2. Set start and end times
3. Enter subtitle text
4. Style the subtitle (font, size, color, background)

#### Subtitle Styling Options
- **Font**: Choose from available fonts
- **Size**: Adjust subtitle size (recommended: 24-32px)
- **Color**: Set text color (white or yellow work best)
- **Background**: Add background for better readability
- **Position**: Choose top, center, or bottom positioning

### 4. Add Branding Elements

#### Upload Logo
1. Click "Upload Logo"
2. Select your logo file (PNG, JPG, SVG)
3. Position the logo on the video
4. Adjust opacity (recommended: 70-90%)

#### Add Text Watermarks
1. Click "Add Text Watermark"
2. Enter your watermark text (e.g., "@yourhandle")
3. Choose font, size, and color
4. Position the watermark

#### Branding Best Practices
- Keep logos small and unobtrusive (10-15% of screen)
- Use consistent branding across all videos
- Position logos in corners to avoid content interference
- Test visibility on different devices and screen sizes

### 5. Select Output Format

#### Choose Platform
- **TikTok**: 1080×1920 (9:16) - Vertical format for short-form content
- **Instagram Square**: 1080×1080 (1:1) - Square posts and carousel content
- **Instagram Stories**: 1080×1920 (9:16) - Vertical stories and highlights
- **YouTube**: 1920×1080 (16:9) - Standard widescreen for long-form content
- **YouTube Shorts**: 1080×1920 (9:16) - Vertical shorts
- **Facebook**: 1920×1080 (16:9) - Widescreen posts
- **Twitter**: 1280×720 (16:9) - Optimized for Twitter
- **LinkedIn**: 1920×1080 (16:9) - Professional format

#### Aspect Ratio Preview
- See how your video will look after conversion
- Check for any cropping or padding that will be applied
- Adjust your content if needed

#### Custom Dimensions
- Set custom width and height
- Calculate aspect ratio automatically
- Perfect for specific platform requirements

### 6. Process and Export

#### Review Settings
1. Check that all subtitles are properly timed
2. Verify branding elements are positioned correctly
3. Confirm the output format is correct

#### Start Processing
1. Click "Start Processing"
2. System shows progress through each step:
   - Initializing FFmpeg
   - Uploading video file
   - Processing subtitles
   - Adding branding elements
   - Converting aspect ratio
   - Exporting final video

#### Download Your Video
1. Once processing is complete, click "Download Video"
2. File will be saved to your downloads folder
3. Ready to upload to your chosen social platform

## Platform Support

### TikTok (9:16)
- **Dimensions**: 1080×1920
- **Aspect Ratio**: 9:16
- **Best For**: Short, engaging content
- **Subtitle Placement**: Bottom third of screen
- **Logo Placement**: Top corners or bottom right
- **Content Tips**: Keep text large and readable

### Instagram Square (1:1)
- **Dimensions**: 1080×1080
- **Aspect Ratio**: 1:1
- **Best For**: Square posts and carousel content
- **Subtitle Placement**: Center or bottom
- **Logo Placement**: Bottom right corner
- **Content Tips**: Ensure important content is in the center

### Instagram Stories (9:16)
- **Dimensions**: 1080×1920
- **Aspect Ratio**: 9:16
- **Best For**: Vertical stories and highlights
- **Subtitle Placement**: Center or top third
- **Logo Placement**: Top corners
- **Content Tips**: Keep text away from edges

### YouTube (16:9)
- **Dimensions**: 1920×1080
- **Aspect Ratio**: 16:9
- **Best For**: Long-form content and tutorials
- **Subtitle Placement**: Bottom third
- **Logo Placement**: Bottom right corner
- **Content Tips**: Use the full width effectively

### YouTube Shorts (9:16)
- **Dimensions**: 1080×1920
- **Aspect Ratio**: 9:16
- **Best For**: Vertical shorts and quick content
- **Subtitle Placement**: Bottom third
- **Logo Placement**: Top corners
- **Content Tips**: Optimize for mobile viewing

### Facebook (16:9)
- **Dimensions**: 1920×1080
- **Aspect Ratio**: 16:9
- **Best For**: Business content and announcements
- **Subtitle Placement**: Bottom third
- **Logo Placement**: Bottom right corner
- **Content Tips**: Professional appearance

### Twitter (16:9)
- **Dimensions**: 1280×720
- **Aspect Ratio**: 16:9
- **Best For**: Quick updates and news
- **Subtitle Placement**: Bottom third
- **Logo Placement**: Bottom right corner
- **Content Tips**: Keep content concise

### LinkedIn (16:9)
- **Dimensions**: 1920×1080
- **Aspect Ratio**: 16:9
- **Best For**: Professional content and thought leadership
- **Subtitle Placement**: Bottom third
- **Logo Placement**: Bottom right corner
- **Content Tips**: Professional and polished

## Technical Specifications

### Video Processing
- **Engine**: FFmpeg.wasm (WebAssembly)
- **Codec**: H.264 (x264)
- **Container**: MP4
- **Audio Codec**: AAC
- **Bitrate**: Variable (based on quality setting)
- **Frame Rate**: Preserved from source

### Subtitle Processing
- **Format**: SRT (SubRip)
- **Encoding**: UTF-8
- **Timing**: Millisecond precision
- **Styling**: CSS-based rendering

### Branding Overlays
- **Image Formats**: PNG, JPG, SVG
- **Positioning**: Pixel-perfect placement
- **Opacity**: 0-100% adjustable
- **Scaling**: Maintain aspect ratio

### Performance
- **Processing Time**: 1-5 minutes (depending on video length)
- **Memory Usage**: 2-4GB during processing
- **Browser Support**: Modern browsers with WebAssembly support
- **File Size**: 10-50MB output (depending on settings)

## Troubleshooting

### Common Issues

#### Video Won't Upload
**Symptoms**: File upload fails or shows error message
**Solutions**:
- Check file format (MP4, MOV, AVI, MKV, WEBM)
- Ensure file size is under 500MB
- Try compressing the video first
- Check internet connection stability

#### Subtitles Not Appearing
**Symptoms**: Subtitles don't show in final video
**Solutions**:
- Check subtitle timing (start/end times)
- Verify text color contrasts with background
- Ensure subtitles are within video duration
- Check subtitle positioning settings

#### Branding Not Visible
**Symptoms**: Logo or watermark not showing
**Solutions**:
- Check logo opacity (should be 70-90%)
- Verify logo is positioned within video bounds
- Ensure logo file is not corrupted
- Try different logo positioning

#### Processing Fails
**Symptoms**: Video processing stops or shows error
**Solutions**:
- Check browser compatibility (Chrome, Firefox, Safari)
- Ensure stable internet connection
- Try refreshing the page and starting over
- Check if video file is corrupted

### Performance Issues

#### Slow Processing
**Causes**: Large video files, complex effects, browser limitations
**Solutions**:
- Compress video before uploading
- Close other browser tabs
- Use Chrome for best performance
- Ensure sufficient RAM (8GB+ recommended)

#### Browser Crashes
**Causes**: Insufficient memory, browser bugs, WebAssembly issues
**Solutions**:
- Restart browser
- Clear browser cache
- Update browser to latest version
- Try different browser

### Error Messages

#### "FFmpeg initialization failed"
**Cause**: WebAssembly not supported or corrupted
**Solution**: Update browser or try different browser

#### "Video file too large"
**Cause**: File exceeds 500MB limit
**Solution**: Compress video or use smaller file

#### "Unsupported video format"
**Cause**: Video format not supported
**Solution**: Convert to MP4 format

#### "Processing timeout"
**Cause**: Video too long or complex
**Solution**: Try shorter video or simpler effects

## Best Practices

### Content Creation
1. **Plan Your Content**: Think about how your podcast will look as video
2. **Visual Elements**: Add relevant images or graphics when possible
3. **Engagement**: Use engaging thumbnails and titles
4. **Consistency**: Maintain consistent branding across all videos

### Technical Optimization
1. **File Preparation**: Use high-quality source videos
2. **Subtitle Timing**: Ensure subtitles match speech timing
3. **Branding Placement**: Keep logos visible but not distracting
4. **Platform Optimization**: Tailor content for each platform's audience

### Workflow Efficiency
1. **Templates**: Create reusable templates for common formats
2. **Batch Processing**: Process multiple videos at once
3. **Preview First**: Always preview before final export
4. **Save Settings**: Save successful configurations for reuse

### Quality Assurance
1. **Test on Devices**: Check video on different devices and screen sizes
2. **Audio Quality**: Ensure good audio for subtitle generation
3. **Visual Clarity**: Test subtitle readability
4. **Branding Visibility**: Verify logos are visible but not intrusive

## API Reference

### Components

#### VideoEditor
```typescript
interface VideoEditorProps {
  videoFile: File;
  transcript: string;
  onExport: (videoBlob: Blob) => void;
  className?: string;
}
```

#### VideoUpload
```typescript
interface VideoUploadProps {
  onVideoSelect: (file: File) => void;
  onVideoRemove: () => void;
  selectedVideo: File | null;
  className?: string;
}
```

#### DimensionSelector
```typescript
interface DimensionSelectorProps {
  selectedDimension: VideoDimension | null;
  onDimensionSelect: (dimension: VideoDimension) => void;
  className?: string;
}
```

#### VideoProcessor
```typescript
interface VideoProcessorProps {
  videoFile: File;
  subtitles: SubtitleSegment[];
  brandingElements: BrandingElement[];
  targetDimension?: VideoDimension | null;
  onExportComplete?: (videoBlob: Blob) => void;
  className?: string;
}
```

### Types

#### VideoDimension
```typescript
interface VideoDimension {
  id: string;
  name: string;
  width: number;
  height: number;
  aspectRatio: number;
  platform: string;
}
```

#### SubtitleSegment
```typescript
interface SubtitleSegment {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  speaker?: string;
  style?: SubtitleStyle;
}
```

#### BrandingElement
```typescript
interface BrandingElement {
  id: string;
  type: 'logo' | 'text';
  visible: boolean;
  position: { x: number; y: number };
  size: { width: number; height: number };
  opacity: number;
  content?: string;
  imageUrl?: string;
}
```

### Services

#### FFmpegService
```typescript
class FFmpegService {
  async initialize(): Promise<void>;
  async processVideo(options: VideoProcessingOptions): Promise<Blob>;
  private buildFFmpegCommand(...): string[];
}
```

#### VideoMetadata
```typescript
interface VideoMetadata {
  width: number;
  height: number;
  duration: number;
  frameRate: number;
  bitrate: number;
  codec: string;
}
```

## Support and Resources

### Getting Help
- **Documentation**: Comprehensive guides and tutorials
- **Community**: Join our Discord for tips and support
- **Support**: Contact support through the dashboard
- **Tutorials**: Step-by-step video tutorials

### Additional Resources
- **Video Editing Best Practices**: Professional video creation tips
- **Social Media Optimization**: Platform-specific optimization guides
- **Community Examples**: See what others are creating
- **Feature Updates**: Stay updated with new features

### Contributing
- **Bug Reports**: Report issues through GitHub
- **Feature Requests**: Suggest new features
- **Code Contributions**: Contribute to the open source components
- **Documentation**: Help improve our documentation

---

*This documentation is regularly updated. For the latest version, visit our help center or contact support.*
