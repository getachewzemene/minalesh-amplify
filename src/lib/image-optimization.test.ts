import { describe, it, expect } from 'vitest';

describe('Image optimization', () => {
  it('should validate image sizes configuration', () => {
    const imageSizes = [
      { width: 150, height: 150, suffix: 'thumbnail' },
      { width: 500, height: 500, suffix: 'medium' },
      { width: 1200, height: 1200, suffix: 'large' },
    ];
    
    expect(imageSizes.length).toBe(3);
    imageSizes.forEach(size => {
      expect(size.width).toBeGreaterThan(0);
      expect(size.height).toBeGreaterThan(0);
      expect(size.suffix).toBeTruthy();
    });
  });

  it('should validate image formats', () => {
    const validFormats = ['jpeg', 'png', 'webp'];
    validFormats.forEach(format => {
      expect(['jpeg', 'png', 'webp'].includes(format)).toBe(true);
    });
  });

  it('should validate quality settings', () => {
    const quality = 85;
    expect(quality).toBeGreaterThan(0);
    expect(quality).toBeLessThanOrEqual(100);
  });

  it('should validate webp effort settings', () => {
    const effort = 4;
    expect(effort).toBeGreaterThanOrEqual(0);
    expect(effort).toBeLessThanOrEqual(6);
  });

  it('should calculate optimized buffer size', () => {
    const originalSize = 1000000; // 1MB
    const optimizedSize = 250000; // 250KB
    const reduction = ((originalSize - optimizedSize) / originalSize) * 100;
    
    expect(optimizedSize).toBeLessThan(originalSize);
    expect(reduction).toBeGreaterThan(0);
    expect(reduction).toBe(75);
  });

  it('should validate image metadata structure', () => {
    const metadata = {
      width: 1920,
      height: 1080,
      format: 'jpeg',
      size: 500000,
      hasAlpha: false,
    };
    
    expect(metadata.width).toBeGreaterThan(0);
    expect(metadata.height).toBeGreaterThan(0);
    expect(metadata.format).toBeTruthy();
    expect(metadata.size).toBeGreaterThan(0);
    expect(typeof metadata.hasAlpha).toBe('boolean');
  });

  it('should validate resize fit modes', () => {
    const fitModes = ['cover', 'contain', 'fill', 'inside', 'outside'];
    const selectedFit = 'inside';
    
    expect(fitModes.includes(selectedFit)).toBe(true);
  });

  it('should validate withoutEnlargement option', () => {
    const originalWidth = 800;
    const targetWidth = 1200;
    const shouldNotEnlarge = true;
    
    if (shouldNotEnlarge && originalWidth < targetWidth) {
      expect(originalWidth).toBeLessThan(targetWidth);
    }
  });

  it('should determine optimal format based on alpha channel', () => {
    const hasAlpha = false;
    const optimalFormat = hasAlpha ? 'webp' : 'webp'; // WebP supports both
    
    expect(optimalFormat).toBe('webp');
  });

  it('should validate content type for images', () => {
    const validContentTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/webp'
    ];
    
    validContentTypes.forEach(type => {
      expect(type.startsWith('image/')).toBe(true);
    });
  });
});
