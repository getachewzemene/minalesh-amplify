# PWA Icons Directory

This directory should contain Progressive Web App (PWA) icons for the Minalesh marketplace.

## Required Icon Sizes

To complete the PWA setup, add the following icon sizes:

- `icon-72x72.png` - 72x72 pixels
- `icon-96x96.png` - 96x96 pixels
- `icon-128x128.png` - 128x128 pixels
- `icon-144x144.png` - 144x144 pixels
- `icon-152x152.png` - 152x152 pixels
- `icon-192x192.png` - 192x192 pixels
- `icon-384x384.png` - 384x384 pixels
- `icon-512x512.png` - 512x512 pixels

## Design Guidelines

### Icon Design
- Use the Minalesh logo with Ethiopian gold (#FFD700) color
- Include the "ምናለሽ" (Minalesh in Amharic) text or symbol
- Ensure the icon works well at small sizes
- Use a simple, recognizable design

### Technical Requirements
- Format: PNG with transparency
- Color: Ethiopian gold (#FFD700) primary color
- Background: White or transparent
- Safe area: Keep important content within 80% of the canvas (for rounded corners)

### Maskable Icons
All icons are marked as "maskable" in the manifest, meaning they should:
- Have important content in the center 80% of the canvas
- Use a solid background color (not transparent) for maskable variants
- Work well when cropped to various shapes (circle, rounded square, etc.)

## Creating Icons

### Option 1: Use an Online Tool
1. Create a 512x512 base icon
2. Use tools like:
   - https://realfavicongenerator.net/
   - https://www.pwabuilder.com/imageGenerator
   - https://maskable.app/editor

### Option 2: Manual Creation
1. Design in a tool like Figma, Photoshop, or GIMP
2. Export at each required size
3. Optimize with tools like ImageOptim or TinyPNG

### Option 3: Automated Generation
Use a script to generate from a base SVG:

```bash
# Install sharp if not already available
npm install sharp

# Create a simple Node.js script to resize
node scripts/generate-icons.js
```

## Current Status

⚠️ **TODO**: Icons need to be added to this directory

The PWA manifest is configured but requires actual icon files to be created and placed in this directory.

## After Adding Icons

1. Test the PWA installation on mobile:
   - Chrome Android: Menu > Add to Home Screen
   - Safari iOS: Share > Add to Home Screen
2. Verify icons appear correctly
3. Test in different contexts (app switcher, splash screen, etc.)

## Resources

- [PWA Icon Generator](https://www.pwabuilder.com/imageGenerator)
- [Maskable Icon Editor](https://maskable.app/editor)
- [Google PWA Icons Guide](https://web.dev/add-manifest/#icons)
