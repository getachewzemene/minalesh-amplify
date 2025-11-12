# Media Management Documentation

## Overview

The media management system provides comprehensive image handling with S3 storage integration, automatic optimization, multiple size generation, and accessibility support through alt text.

## Features

### Storage Options
- **AWS S3**: Production-ready cloud storage
- **Local Filesystem**: Development fallback (automatic)
- **Automatic Detection**: Uses S3 if configured, falls back to local

### Image Optimization
- **Multiple Sizes**: Thumbnail (150x150), Medium (500x500), Large (1200x1200)
- **WebP Conversion**: Modern format for better compression
- **Quality Control**: 85% quality for optimal size/quality balance
- **Smart Resizing**: Maintains aspect ratio, no enlargement
- **Metadata Extraction**: Width, height, format, size, alpha channel

### Accessibility
- **Alt Text Support**: Store descriptive text for images
- **Update Capability**: Change alt text without re-uploading
- **API Integration**: Alt text included in all responses

## API Endpoints

### Upload Media
```bash
POST /api/media
Content-Type: multipart/form-data
Authorization: Bearer {token}
```

**Form Data:**
- `file` - Image file (JPEG, PNG, WebP)
- `productId` - Product UUID
- `altText` - Descriptive text for accessibility (optional)
- `sortOrder` - Display order (optional, default: 0)

**File Requirements:**
- Max size: 10MB
- Allowed types: image/jpeg, image/jpg, image/png, image/webp

**Example:**
```javascript
const formData = new FormData();
formData.append('file', imageFile);
formData.append('productId', 'product-uuid');
formData.append('altText', 'Product front view showing features');
formData.append('sortOrder', '0');

const response = await fetch('/api/media', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});
```

**Response:**
```json
{
  "success": true,
  "media": {
    "id": "media-uuid",
    "productId": "product-uuid",
    "url": "https://bucket.s3.amazonaws.com/products/123-abc.webp",
    "altText": "Product front view showing features",
    "size": 245678,
    "width": 1920,
    "height": 1080,
    "format": "webp",
    "optimizedVersions": {
      "thumbnail": {
        "url": "https://bucket.s3.amazonaws.com/products/123-abc-thumbnail.webp",
        "width": 150,
        "height": 150,
        "size": 5432
      },
      "medium": {
        "url": "https://bucket.s3.amazonaws.com/products/123-abc-medium.webp",
        "width": 500,
        "height": 500,
        "size": 28765
      },
      "large": {
        "url": "https://bucket.s3.amazonaws.com/products/123-abc-large.webp",
        "width": 1200,
        "height": 1200,
        "size": 132456
      }
    },
    "sortOrder": 0
  }
}
```

### Get Product Media
```bash
GET /api/media?productId={uuid}
```

Returns all media items for a product, ordered by sortOrder.

**Response:**
```json
{
  "success": true,
  "media": [
    {
      "id": "media-uuid",
      "productId": "product-uuid",
      "url": "https://...",
      "altText": "Product image",
      "size": 245678,
      "width": 1920,
      "height": 1080,
      "format": "webp",
      "optimizedVersions": { ... },
      "sortOrder": 0
    }
  ]
}
```

### Update Media Alt Text
```bash
PATCH /api/media/{mediaId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "altText": "Updated descriptive text"
}
```

**Response:**
```json
{
  "success": true,
  "media": {
    "id": "media-uuid",
    "altText": "Updated descriptive text",
    ...
  }
}
```

### Delete Media
```bash
DELETE /api/media/{mediaId}
Authorization: Bearer {token}
```

Deletes media from storage (S3 or local) and database, including all optimized versions.

**Response:**
```json
{
  "success": true,
  "message": "Media deleted successfully"
}
```

## Database Schema

### Media Table
```sql
CREATE TABLE media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt_text TEXT,
  size INTEGER NOT NULL,
  width INTEGER,
  height INTEGER,
  format TEXT NOT NULL,
  optimized_versions JSONB NOT NULL DEFAULT '{}',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL
);

CREATE INDEX media_product_id_idx ON media(product_id);
```

### Product Relation
```prisma
model Product {
  // ...
  media Media[]
}

model Media {
  id                String   @id @default(dbgenerated("gen_random_uuid()"))
  productId         String   @map("product_id")
  url               String
  altText           String?  @map("alt_text")
  size              Int
  width             Int?
  height            Int?
  format            String
  optimizedVersions Json     @default("{}") @map("optimized_versions")
  sortOrder         Int      @default(0) @map("sort_order")
  
  product           Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
}
```

## Configuration

### Environment Variables

Add to `.env`:

```bash
# AWS S3 Configuration (Optional)
# If not set, media will be stored in public/uploads
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=your-bucket-name
AWS_REGION=us-east-1
```

### S3 Bucket Setup

1. Create an S3 bucket in AWS Console
2. Set bucket policy for public read access (if needed):
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-bucket/*"
    }
  ]
}
```
3. Create IAM user with S3 permissions
4. Add credentials to environment variables

## Implementation Details

### Image Processing Pipeline

1. **Upload**: Receive file from client
2. **Validation**: Check file type and size
3. **Authorization**: Verify user owns product
4. **Metadata**: Extract image information
5. **Optimization**: Generate 3 optimized versions
6. **Storage**: Upload to S3 or save locally
7. **Database**: Create media record
8. **Response**: Return media with all URLs

### Storage Selection
```typescript
if (isS3Configured()) {
  // Upload to S3
  const result = await uploadToS3(buffer, key, contentType);
} else {
  // Save to local filesystem
  await writeFile(path, buffer);
}
```

### Authorization

Media endpoints verify:
1. User is authenticated
2. User owns the product (vendor) OR is admin
3. Product exists

```typescript
const isAdmin = process.env.ADMIN_EMAILS?.split(',').includes(email);
const isOwner = product.vendor.userId === userId;

if (!isAdmin && !isOwner) {
  return { error: 'Not authorized' };
}
```

## Usage Examples

### Upload Product Image
```typescript
async function uploadProductImage(productId: string, file: File) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('productId', productId);
  formData.append('altText', 'Product showcase image');
  
  const response = await fetch('/api/media', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getToken()}`
    },
    body: formData
  });
  
  return response.json();
}
```

### Display Optimized Images
```tsx
function ProductImage({ media }: { media: Media }) {
  return (
    <picture>
      <source
        srcSet={media.optimizedVersions.large.url}
        media="(min-width: 1024px)"
      />
      <source
        srcSet={media.optimizedVersions.medium.url}
        media="(min-width: 640px)"
      />
      <img
        src={media.optimizedVersions.thumbnail.url}
        alt={media.altText || 'Product image'}
        loading="lazy"
      />
    </picture>
  );
}
```

### Update Alt Text
```typescript
async function updateAltText(mediaId: string, altText: string) {
  const response = await fetch(`/api/media/${mediaId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${getToken()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ altText })
  });
  
  return response.json();
}
```

## Performance Considerations

- **Lazy Loading**: Use `loading="lazy"` for images
- **Responsive Images**: Use `<picture>` with srcset for different sizes
- **WebP Format**: 25-35% smaller than JPEG at same quality
- **CDN**: Consider CloudFront for S3 content delivery
- **Caching**: Set appropriate cache headers

## Best Practices

### Alt Text Guidelines
- Be descriptive but concise
- Describe what's in the image
- Include relevant product details
- Don't start with "Image of" or "Picture of"
- Keep under 125 characters when possible

**Good Examples:**
- "Red leather sofa with chrome legs"
- "Fresh Ethiopian coffee beans in burlap sack"
- "Traditional white Habesha Kemis with colored borders"

### Image Guidelines
- Use high-quality source images (minimum 1200px wide)
- Keep original file size under 10MB
- Use JPEG for photos, PNG for graphics/logos
- Square images work best (1:1 aspect ratio)
- Ensure good lighting and focus

## Troubleshooting

### Images Not Uploading
1. Check file size (max 10MB)
2. Verify file type (JPEG, PNG, WebP only)
3. Ensure user is authenticated
4. Verify product ownership

### S3 Upload Fails
1. Check AWS credentials in `.env`
2. Verify bucket exists and is accessible
3. Check IAM permissions
4. Ensure bucket region matches configuration

### Images Not Displaying
1. Verify S3 bucket is public (if needed)
2. Check CORS configuration for S3
3. Verify URLs are correct in database
4. Check network/firewall settings

## Future Enhancements

- Image compression levels
- Custom size generation
- Video support
- SVG optimization
- Watermarking
- Image cropping/editing
- Batch uploads
- Background removal
- AI-powered alt text generation
