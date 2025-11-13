// Simple test to verify FFmpeg service initialization
import { ffmpegService } from './ffmpegService';

export async function testFFmpegInitialization(): Promise<boolean> {
  try {
    console.log('Testing FFmpeg initialization...');
    await ffmpegService.initialize();
    console.log('✅ FFmpeg initialized successfully!');
    return true;
  } catch (error) {
    console.error('❌ FFmpeg initialization failed:', error);
    return false;
  }
}

// Note: This is a test utility. Remove or comment out after testing.
