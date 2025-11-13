import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { VideoDimension, calculateAspectRatioConversion, generateFFmpegScaleFilter } from './videoDimensions';
import { extractVideoMetadata } from './videoMetadata';

export interface SubtitleSegment {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  speaker?: string;
}

export interface BrandingElement {
  id: string;
  type: 'logo' | 'text' | 'watermark';
  content: string;
  position: {
    x: number;
    y: number;
  };
  size: {
    width: number;
    height: number;
  };
  opacity: number;
  rotation: number;
  visible: boolean;
  style?: {
    fontSize?: number;
    fontFamily?: string;
    color?: string;
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
  };
}

export interface VideoProcessingOptions {
  videoFile: File;
  subtitles: SubtitleSegment[];
  brandingElements: BrandingElement[];
  outputFormat?: 'mp4' | 'webm' | 'mov';
  quality?: 'high' | 'medium' | 'low';
  targetDimension?: VideoDimension;
  onProgress?: (progress: number, message: string) => void;
}

export class FFmpegService {
  private ffmpeg: FFmpeg | null = null;
  private isLoaded = false;
  private isProcessing = false;

  async initialize(): Promise<void> {
    if (this.isLoaded) return;

    try {
      this.ffmpeg = new FFmpeg();
      
      // Set up logging
      this.ffmpeg.on('log', ({ message }) => {
        console.log('[FFmpeg]', message);
      });

      // Set up progress tracking
      this.ffmpeg.on('progress', ({ progress, time }) => {
        console.log('[FFmpeg Progress]', progress, time);
      });

      // Load FFmpeg core from CDN
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
      await this.ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });

      this.isLoaded = true;
    } catch (error) {
      console.error('Failed to initialize FFmpeg:', error);
      throw new Error('Failed to initialize video processing engine');
    }
  }

  async processVideo(options: VideoProcessingOptions): Promise<Blob> {
    if (this.isProcessing) {
      throw new Error('Video processing is already in progress');
    }

    if (!this.isLoaded) {
      await this.initialize();
    }

    this.isProcessing = true;

    try {
      const { videoFile, subtitles, brandingElements, outputFormat = 'mp4', quality = 'medium', targetDimension, onProgress } = options;

      // Update progress
      onProgress?.(10, 'Preparing video file...');

      // Write input video to FFmpeg filesystem
      const videoData = await fetchFile(videoFile);
      await this.ffmpeg!.writeFile('input.mp4', videoData);

      onProgress?.(20, 'Processing subtitles...');

      // Generate SRT content from subtitles
      const srtContent = this.generateSRTContent(subtitles);
      await this.ffmpeg!.writeFile('subtitles.srt', new TextEncoder().encode(srtContent));

      onProgress?.(30, 'Processing branding elements...');

      // Process branding elements
      const brandingFiles: string[] = [];
      for (let i = 0; i < brandingElements.length; i++) {
        const element = brandingElements[i];
        if (!element.visible) continue;

        if (element.type === 'logo' && element.content.startsWith('data:')) {
          // Handle base64 image data
          const base64Data = element.content.split(',')[1];
          const binaryData = atob(base64Data);
          const bytes = new Uint8Array(binaryData.length);
          for (let j = 0; j < binaryData.length; j++) {
            bytes[j] = binaryData.charCodeAt(j);
          }
          const fileName = `logo_${i}.png`;
          await this.ffmpeg!.writeFile(fileName, bytes);
          brandingFiles.push(fileName);
        }
      }

      onProgress?.(40, 'Extracting video metadata...');

      // Extract video metadata for aspect ratio conversion
      let videoWidth = 1920;
      let videoHeight = 1080;
      if (targetDimension) {
        try {
          const metadata = await extractVideoMetadata(videoFile);
          videoWidth = metadata.width;
          videoHeight = metadata.height;
        } catch (error) {
          console.warn('Failed to extract video metadata, using defaults:', error);
          // Keep default values
        }
      }

      onProgress?.(45, 'Building FFmpeg command...');

      // Build FFmpeg command
      const command = this.buildFFmpegCommand(outputFormat, quality, brandingFiles, targetDimension, videoWidth, videoHeight);

      onProgress?.(50, 'Processing video with FFmpeg...');

      // Execute FFmpeg command
      await this.ffmpeg!.exec(command);

      onProgress?.(90, 'Finalizing output...');

      // Read output file
      const outputData = await this.ffmpeg!.readFile('output.mp4');

      if (!(outputData instanceof Uint8Array)) {
        throw new Error('Unexpected FFmpeg output format');
      }

      const outputCopy = outputData.slice();
      const outputBlob = new Blob([outputCopy], { type: 'video/mp4' });

      onProgress?.(100, 'Video processing completed!');

      return outputBlob;

    } catch (error) {
      console.error('Video processing failed:', error);
      throw new Error(`Video processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      this.isProcessing = false;
      this.cleanup();
    }
  }

  private generateSRTContent(subtitles: SubtitleSegment[]): string {
    return subtitles
      .sort((a, b) => a.startTime - b.startTime)
      .map((subtitle, index) => {
        const startTime = this.formatSRTTime(subtitle.startTime);
        const endTime = this.formatSRTTime(subtitle.endTime);
        return `${index + 1}\n${startTime} --> ${endTime}\n${subtitle.text}\n`;
      })
      .join('\n');
  }

  private formatSRTTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const milliseconds = Math.floor((seconds % 1) * 1000);

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${milliseconds.toString().padStart(3, '0')}`;
  }

  private buildFFmpegCommand(
    outputFormat: string, 
    quality: string, 
    brandingFiles: string[], 
    targetDimension?: VideoDimension,
    videoWidth?: number,
    videoHeight?: number
  ): string[] {
    const command: string[] = ['-i', 'input.mp4'];

    // Build video filters
    const videoFilters: string[] = [];

    // Add aspect ratio conversion if target dimension is specified
    if (targetDimension && videoWidth && videoHeight) {
      const conversion = calculateAspectRatioConversion(videoWidth, videoHeight, targetDimension);
      const scaleFilter = generateFFmpegScaleFilter(conversion);
      videoFilters.push(scaleFilter);
    }

    // Add subtitle filter
    videoFilters.push('subtitles=subtitles.srt:force_style=\'FontSize=18,PrimaryColour=&Hffffff,OutlineColour=&H000000,Outline=2\'');

    // Add branding elements
    if (brandingFiles.length > 0) {
      brandingFiles.forEach((file, index) => {
        command.push('-i', file);
        videoFilters.push(`[${index + 1}:v]scale=100:100[logo${index}]`);
        videoFilters.push(`[0:v][logo${index}]overlay=10:10[overlay${index}]`);
      });
    }

    // Combine all video filters
    if (videoFilters.length > 0) {
      command.push('-vf', videoFilters.join(','));
    }

    // Output settings based on quality
    const qualitySettings = {
      high: ['-c:v', 'libx264', '-preset', 'slow', '-crf', '18'],
      medium: ['-c:v', 'libx264', '-preset', 'medium', '-crf', '23'],
      low: ['-c:v', 'libx264', '-preset', 'fast', '-crf', '28']
    };

    command.push(...qualitySettings[quality as keyof typeof qualitySettings]);
    command.push('-c:a', 'aac');
    command.push('-movflags', '+faststart');
    command.push('output.mp4');

    return command;
  }

  private cleanup(): void {
    if (!this.ffmpeg) return;

    try {
      // Clean up files
      const files = ['input.mp4', 'output.mp4', 'subtitles.srt'];
      files.forEach(file => {
        this.ffmpeg?.deleteFile(file).catch(() => {});
      });

      // Clean up branding files
      for (let i = 0; i < 10; i++) {
        this.ffmpeg?.deleteFile(`logo_${i}.png`).catch(() => {});
      }
    } catch (error) {
      console.warn('Cleanup failed:', error);
    }
  }

  isReady(): boolean {
    return this.isLoaded && !this.isProcessing;
  }

  getProcessingStatus(): { isLoaded: boolean; isProcessing: boolean } {
    return {
      isLoaded: this.isLoaded,
      isProcessing: this.isProcessing
    };
  }
}

// Singleton instance
export const ffmpegService = new FFmpegService();
