# Trail Background Images

This directory contains weather-reactive trail background images for the RainCheck app.

## Image Requirements

### Technical Specifications

- **Format**: WebP (for optimal compression)
- **Desktop Resolution**: 2000x1200px (5:3 aspect ratio)
- **Mobile Resolution**: 1200x800px (5:3 aspect ratio)
- **Desktop File Size**: <800KB
- **Mobile File Size**: <300KB
- **Color Grading**: Slightly desaturated (-10% saturation) for atmospheric effect
- **Quality**: High-quality nature/forest trail photography

### Required Images

1. **sunny-trail.webp** - Clear/sunny weather
   - Bright, warm lighting
   - Visible sun rays through trees
   - Vibrant greens and warm tones
   - Search terms: "sunny forest trail", "bright forest path"

2. **rainy-trail.webp** - Rainy/drizzle weather
   - Wet surfaces, puddles, rain-soaked foliage
   - Cool, moody lighting
   - Overcast sky visible through trees
   - Search terms: "rainy forest trail", "wet forest path"

3. **snowy-trail.webp** - Snowy weather
   - Snow-covered trail and trees
   - White/blue color palette
   - Winter forest atmosphere
   - Search terms: "snowy forest trail", "winter forest path"

4. **cloudy-trail.webp** - Cloudy/overcast weather
   - Diffused lighting, no direct sun
   - Neutral tones, soft shadows
   - Overcast but not rainy
   - Search terms: "cloudy forest trail", "overcast forest path"

5. **foggy-trail.webp** - Foggy/misty weather
   - Limited visibility, atmospheric fog
   - Muted colors, soft focus background
   - Mysterious, ethereal atmosphere
   - Search terms: "foggy forest trail", "misty forest path"

6. **default-trail.webp** - Default fallback
   - Neutral lighting conditions
   - Versatile for any weather
   - Safe, pleasant atmosphere
   - Search terms: "forest trail", "nature path"

## Recommended Image Sources

### Free Stock Photo Sites

1. **Unsplash** (https://unsplash.com)
   - License: Free to use, no attribution required (but appreciated)
   - High-quality nature photography
   - Search: https://unsplash.com/s/photos/forest-trail

2. **Pexels** (https://www.pexels.com)
   - License: Free to use, no attribution required
   - Good variety of trail images
   - Search: https://www.pexels.com/search/forest%20path/

3. **Pixabay** (https://pixabay.com)
   - License: Free to use, no attribution required
   - Large collection of nature photos
   - Search: https://pixabay.com/images/search/forest-trail/

### Subject Matter Guidelines

- **Include**: Forest paths, woodland trails, natural running environments
- **Exclude**: People (for universal connection), urban elements, buildings
- **Composition**:
  - Foreground: Clear trail/path
  - Midground: Trees, foliage, natural elements
  - Background: Depth of field with distant trees/sky
- **Perspective**: Eye-level, inviting viewer to "step into" the scene

## Image Processing Workflow

### 1. Download High-Resolution Images

Download images at highest available resolution (preferably 4000px+ width)

### 2. Crop to 5:3 Aspect Ratio

Use any image editor:

- Desktop: Crop to 2000x1200px
- Mobile: Crop to 1200x800px

### 3. Apply Color Grading

- Reduce saturation by 10% for atmospheric effect
- Adjust exposure/contrast as needed
- Maintain natural colors, avoid heavy filters

### 4. Convert to WebP

**Using Squoosh (Online):**

1. Visit https://squoosh.app
2. Upload image
3. Select "WebP" format
4. Adjust quality to achieve target file size
5. Download optimized image

**Using cwebp (CLI):**

```bash
# Install cwebp (macOS)
brew install webp

# Convert desktop image
cwebp -q 90 input.jpg -o sunny-trail.webp

# Convert mobile image with smaller size
cwebp -q 85 -resize 1200 800 input.jpg -o sunny-trail-mobile.webp
```

### 5. Verify File Sizes

- Desktop images should be <800KB
- Mobile images should be <300KB
- If too large, reduce quality setting and re-convert

### 6. Test in Component

Add images to this directory and test in the TrailBackground component:

```tsx
<TrailBackground weatherCondition="Clear" />
```

## Attribution

While not legally required for the recommended sources, it's good practice to maintain a list of image credits:

- **sunny-trail.webp**: [Photographer Name] via [Source]
- **rainy-trail.webp**: [Photographer Name] via [Source]
- **snowy-trail.webp**: [Photographer Name] via [Source]
- **cloudy-trail.webp**: [Photographer Name] via [Source]
- **foggy-trail.webp**: [Photographer Name] via [Source]
- **default-trail.webp**: [Photographer Name] via [Source]

## Current Status

✅ **Production trail images in place** - All 6 weather-reactive trail images have been added with proper specifications:

- All images: 2000x1200px (5:3 aspect ratio) ✓
- All images: WebP format ✓
- All file sizes: <800KB (ranging from 202KB to 698KB) ✓
- Image verification: All tests passing ✓

### Image Inventory

| Image File         | Size  | Dimensions | Status  |
| ------------------ | ----- | ---------- | ------- |
| sunny-trail.webp   | 649KB | 2000x1200  | ✓ Ready |
| rainy-trail.webp   | 216KB | 2000x1200  | ✓ Ready |
| snowy-trail.webp   | 479KB | 2000x1200  | ✓ Ready |
| cloudy-trail.webp  | 202KB | 2000x1200  | ✓ Ready |
| foggy-trail.webp   | 346KB | 2000x1200  | ✓ Ready |
| default-trail.webp | 698KB | 2000x1200  | ✓ Ready |
