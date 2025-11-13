export interface VideoDimension {
  id: string;
  name: string;
  aspectRatio: string;
  width: number;
  height: number;
  description: string;
  platform: string;
  icon: string;
}

export const VIDEO_DIMENSIONS: VideoDimension[] = [
  {
    id: 'tiktok',
    name: 'TikTok',
    aspectRatio: '9:16',
    width: 1080,
    height: 1920,
    description: 'Vertical video format for TikTok and Instagram Reels',
    platform: 'TikTok',
    icon: '📱'
  },
  {
    id: 'instagram-square',
    name: 'Instagram Square',
    aspectRatio: '1:1',
    width: 1080,
    height: 1080,
    description: 'Square format for Instagram posts',
    platform: 'Instagram',
    icon: '📷'
  },
  {
    id: 'instagram-story',
    name: 'Instagram Story',
    aspectRatio: '9:16',
    width: 1080,
    height: 1920,
    description: 'Vertical format for Instagram Stories',
    platform: 'Instagram',
    icon: '📸'
  },
  {
    id: 'youtube',
    name: 'YouTube',
    aspectRatio: '16:9',
    width: 1920,
    height: 1080,
    description: 'Widescreen format for YouTube videos',
    platform: 'YouTube',
    icon: '📺'
  },
  {
    id: 'youtube-shorts',
    name: 'YouTube Shorts',
    aspectRatio: '9:16',
    width: 1080,
    height: 1920,
    description: 'Vertical format for YouTube Shorts',
    platform: 'YouTube',
    icon: '🎬'
  },
  {
    id: 'facebook',
    name: 'Facebook',
    aspectRatio: '16:9',
    width: 1920,
    height: 1080,
    description: 'Widescreen format for Facebook videos',
    platform: 'Facebook',
    icon: '👥'
  },
  {
    id: 'twitter',
    name: 'Twitter',
    aspectRatio: '16:9',
    width: 1280,
    height: 720,
    description: 'Widescreen format for Twitter videos',
    platform: 'Twitter',
    icon: '🐦'
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    aspectRatio: '16:9',
    width: 1920,
    height: 1080,
    description: 'Professional format for LinkedIn videos',
    platform: 'LinkedIn',
    icon: '💼'
  }
];

export interface AspectRatioConversion {
  inputWidth: number;
  inputHeight: number;
  outputWidth: number;
  outputHeight: number;
  scale: number;
  padX: number;
  padY: number;
  cropX: number;
  cropY: number;
  cropWidth: number;
  cropHeight: number;
  method: 'crop' | 'pad' | 'fit';
}

export function calculateAspectRatioConversion(
  inputWidth: number,
  inputHeight: number,
  targetDimension: VideoDimension
): AspectRatioConversion {
  const inputAspectRatio = inputWidth / inputHeight;
  const targetAspectRatio = targetDimension.width / targetDimension.height;
  
  let method: 'crop' | 'pad' | 'fit';
  let scale: number;
  let padX = 0;
  let padY = 0;
  let cropX = 0;
  let cropY = 0;
  let cropWidth = inputWidth;
  let cropHeight = inputHeight;

  if (Math.abs(inputAspectRatio - targetAspectRatio) < 0.01) {
    // Aspect ratios are nearly identical, just scale
    method = 'fit';
    scale = Math.min(targetDimension.width / inputWidth, targetDimension.height / inputHeight);
  } else if (inputAspectRatio > targetAspectRatio) {
    // Input is wider than target, crop horizontally
    method = 'crop';
    scale = targetDimension.height / inputHeight;
    const scaledWidth = inputWidth * scale;
    const scaledHeight = inputHeight * scale;
    
    if (scaledWidth > targetDimension.width) {
      cropWidth = targetDimension.width / scale;
      cropHeight = inputHeight;
      cropX = (inputWidth - cropWidth) / 2;
      cropY = 0;
    }
  } else {
    // Input is taller than target, crop vertically
    method = 'crop';
    scale = targetDimension.width / inputWidth;
    const scaledWidth = inputWidth * scale;
    const scaledHeight = inputHeight * scale;
    
    if (scaledHeight > targetDimension.height) {
      cropWidth = inputWidth;
      cropHeight = targetDimension.height / scale;
      cropX = 0;
      cropY = (inputHeight - cropHeight) / 2;
    }
  }

  // If cropping doesn't work well, use padding instead
  if (method === 'crop' && (cropWidth < inputWidth * 0.5 || cropHeight < inputHeight * 0.5)) {
    method = 'pad';
    scale = Math.min(targetDimension.width / inputWidth, targetDimension.height / inputHeight);
    const scaledWidth = inputWidth * scale;
    const scaledHeight = inputHeight * scale;
    padX = (targetDimension.width - scaledWidth) / 2;
    padY = (targetDimension.height - scaledHeight) / 2;
  }

  return {
    inputWidth,
    inputHeight,
    outputWidth: targetDimension.width,
    outputHeight: targetDimension.height,
    scale,
    padX,
    padY,
    cropX,
    cropY,
    cropWidth,
    cropHeight,
    method
  };
}

export function generateFFmpegScaleFilter(conversion: AspectRatioConversion): string {
  const { inputWidth, inputHeight, outputWidth, outputHeight, scale, padX, padY, cropX, cropY, cropWidth, cropHeight, method } = conversion;

  if (method === 'fit') {
    return `scale=${outputWidth}:${outputHeight}`;
  } else if (method === 'crop') {
    return `crop=${Math.round(cropWidth)}:${Math.round(cropHeight)}:${Math.round(cropX)}:${Math.round(cropY)},scale=${outputWidth}:${outputHeight}`;
  } else if (method === 'pad') {
    const scaledWidth = Math.round(inputWidth * scale);
    const scaledHeight = Math.round(inputHeight * scale);
    const padXInt = Math.round(padX);
    const padYInt = Math.round(padY);
    return `scale=${scaledWidth}:${scaledHeight},pad=${outputWidth}:${outputHeight}:${padXInt}:${padYInt}:black`;
  }

  return `scale=${outputWidth}:${outputHeight}`;
}

export function getDimensionById(id: string): VideoDimension | undefined {
  return VIDEO_DIMENSIONS.find(dim => dim.id === id);
}

export function getDimensionsByPlatform(platform: string): VideoDimension[] {
  return VIDEO_DIMENSIONS.filter(dim => dim.platform === platform);
}
