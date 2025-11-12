/**
 * Image Optimization Utilities
 * 
 * Provides image transformation and optimization using Sharp.
 */

import sharp from 'sharp';

export interface ImageSize {
  width: number;
  height: number;
  suffix: string;
}

export const IMAGE_SIZES: ImageSize[] = [
  { width: 150, height: 150, suffix: 'thumbnail' },
  { width: 500, height: 500, suffix: 'medium' },
  { width: 1200, height: 1200, suffix: 'large' },
];

export interface OptimizedImage {
  buffer: Buffer;
  width: number;
  height: number;
  format: string;
  size: number;
}

export interface OptimizedVersions {
  [key: string]: {
    url: string;
    width: number;
    height: number;
    size: number;
  };
}

/**
 * Optimize and resize an image
 */
export async function optimizeImage(
  inputBuffer: Buffer,
  width: number,
  height: number,
  format: 'jpeg' | 'png' | 'webp' = 'webp'
): Promise<OptimizedImage> {
  const sharpInstance = sharp(inputBuffer);
  
  // Get original metadata
  const metadata = await sharpInstance.metadata();
  
  // Resize and optimize
  const result = await sharpInstance
    .resize(width, height, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .toFormat(format, {
      quality: 85,
      ...(format === 'webp' && { effort: 4 }),
    })
    .toBuffer({ resolveWithObject: true });

  return {
    buffer: result.data,
    width: result.info.width,
    height: result.info.height,
    format: result.info.format,
    size: result.info.size,
  };
}

/**
 * Generate multiple optimized versions of an image
 */
export async function generateOptimizedVersions(
  inputBuffer: Buffer,
  format: 'jpeg' | 'png' | 'webp' = 'webp'
): Promise<Map<string, OptimizedImage>> {
  const versions = new Map<string, OptimizedImage>();

  for (const size of IMAGE_SIZES) {
    const optimized = await optimizeImage(
      inputBuffer,
      size.width,
      size.height,
      format
    );
    versions.set(size.suffix, optimized);
  }

  return versions;
}

/**
 * Extract image metadata
 */
export async function getImageMetadata(inputBuffer: Buffer) {
  const metadata = await sharp(inputBuffer).metadata();
  
  return {
    width: metadata.width,
    height: metadata.height,
    format: metadata.format,
    size: metadata.size,
    hasAlpha: metadata.hasAlpha,
  };
}

/**
 * Validate image file type
 */
export function isValidImageType(contentType: string): boolean {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  return validTypes.includes(contentType);
}

/**
 * Get optimal format based on source format and alpha channel
 */
export function getOptimalFormat(
  sourceFormat: string | undefined,
  hasAlpha: boolean | undefined
): 'jpeg' | 'png' | 'webp' {
  // Always prefer WebP for web optimization
  return 'webp';
}
