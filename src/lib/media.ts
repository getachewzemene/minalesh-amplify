/**
 * Media Management Service
 * 
 * Combines S3 storage and image optimization for complete media handling.
 */

import prisma from './prisma';
import { uploadToS3, deleteFromS3, generateS3Key, isS3Configured } from './s3';
import {
  generateOptimizedVersions,
  getImageMetadata,
  getOptimalFormat,
  OptimizedVersions,
} from './image-optimization';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export interface CreateMediaInput {
  productId: string;
  file: Buffer;
  filename: string;
  contentType: string;
  altText?: string;
  sortOrder?: number;
}

export interface MediaResponse {
  id: string;
  productId: string;
  url: string;
  altText: string | null;
  size: number;
  width: number | null;
  height: number | null;
  format: string;
  optimizedVersions: OptimizedVersions;
  sortOrder: number;
}

/**
 * Upload and process a media file
 */
export async function createMedia(input: CreateMediaInput): Promise<MediaResponse> {
  const { productId, file, filename, contentType, altText, sortOrder = 0 } = input;

  // Extract metadata
  const metadata = await getImageMetadata(file);
  const format = getOptimalFormat(metadata.format, metadata.hasAlpha);

  // Generate optimized versions
  const optimizedVersionsMap = await generateOptimizedVersions(file, format);

  // Prepare optimized versions object
  const optimizedVersions: OptimizedVersions = {};
  let mainUrl: string;
  let mainKey: string;

  // Upload to S3 or local storage
  if (isS3Configured()) {
    // Upload original and optimized versions to S3
    const baseKey = generateS3Key('products', filename);
    const originalKey = baseKey.replace(/\.[^.]+$/, `-original.${format}`);
    
    const originalUpload = await uploadToS3(file, originalKey, `image/${format}`);
    mainUrl = originalUpload.url;
    mainKey = originalKey;

    // Upload optimized versions
    for (const [suffix, optimized] of optimizedVersionsMap.entries()) {
      const versionKey = baseKey.replace(/\.[^.]+$/, `-${suffix}.${format}`);
      const versionUpload = await uploadToS3(
        optimized.buffer,
        versionKey,
        `image/${format}`
      );
      
      optimizedVersions[suffix] = {
        url: versionUpload.url,
        width: optimized.width,
        height: optimized.height,
        size: optimized.size,
      };
    }
  } else {
    // Fallback to local storage
    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const baseFilename = `${timestamp}-${randomString}`;
    
    const originalFilename = `${baseFilename}-original.${format}`;
    const originalPath = join(uploadsDir, originalFilename);
    await writeFile(originalPath, file);
    mainUrl = `/uploads/${originalFilename}`;
    mainKey = originalFilename;

    // Save optimized versions locally
    for (const [suffix, optimized] of optimizedVersionsMap.entries()) {
      const versionFilename = `${baseFilename}-${suffix}.${format}`;
      const versionPath = join(uploadsDir, versionFilename);
      await writeFile(versionPath, optimized.buffer);
      
      optimizedVersions[suffix] = {
        url: `/uploads/${versionFilename}`,
        width: optimized.width,
        height: optimized.height,
        size: optimized.size,
      };
    }
  }

  // Save to database
  const media = await prisma.media.create({
    data: {
      productId,
      url: mainUrl,
      altText: altText || null,
      size: metadata.size || 0,
      width: metadata.width || null,
      height: metadata.height || null,
      format,
      optimizedVersions,
      sortOrder,
    },
  });

  return {
    id: media.id,
    productId: media.productId,
    url: media.url,
    altText: media.altText,
    size: media.size,
    width: media.width,
    height: media.height,
    format: media.format,
    optimizedVersions: media.optimizedVersions as OptimizedVersions,
    sortOrder: media.sortOrder,
  };
}

/**
 * Get all media for a product
 */
export async function getProductMedia(productId: string): Promise<MediaResponse[]> {
  const mediaItems = await prisma.media.findMany({
    where: { productId },
    orderBy: { sortOrder: 'asc' },
  });

  return mediaItems.map((media) => ({
    id: media.id,
    productId: media.productId,
    url: media.url,
    altText: media.altText,
    size: media.size,
    width: media.width,
    height: media.height,
    format: media.format,
    optimizedVersions: media.optimizedVersions as OptimizedVersions,
    sortOrder: media.sortOrder,
  }));
}

/**
 * Update media alt text
 */
export async function updateMediaAltText(
  mediaId: string,
  altText: string
): Promise<MediaResponse> {
  const media = await prisma.media.update({
    where: { id: mediaId },
    data: { altText },
  });

  return {
    id: media.id,
    productId: media.productId,
    url: media.url,
    altText: media.altText,
    size: media.size,
    width: media.width,
    height: media.height,
    format: media.format,
    optimizedVersions: media.optimizedVersions as OptimizedVersions,
    sortOrder: media.sortOrder,
  };
}

/**
 * Delete media
 */
export async function deleteMedia(mediaId: string): Promise<void> {
  const media = await prisma.media.findUnique({
    where: { id: mediaId },
  });

  if (!media) {
    throw new Error('Media not found');
  }

  // Delete from S3 if configured
  if (isS3Configured() && media.url.includes('s3.amazonaws.com')) {
    const key = media.url.split('/').slice(-2).join('/');
    await deleteFromS3(key);

    // Delete optimized versions
    const optimizedVersions = media.optimizedVersions as OptimizedVersions;
    for (const version of Object.values(optimizedVersions)) {
      if (version.url.includes('s3.amazonaws.com')) {
        const versionKey = version.url.split('/').slice(-2).join('/');
        await deleteFromS3(versionKey);
      }
    }
  }

  // Delete from database
  await prisma.media.delete({
    where: { id: mediaId },
  });
}
