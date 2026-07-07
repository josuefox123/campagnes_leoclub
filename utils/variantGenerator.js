const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

/**
 * Generates transparent size variations from the transparent base template.
 */
async function generateVariants() {
  const baseTemplatePath = path.join(__dirname, '../uploads/templates/default_template.png');
  const outputDir = path.join(__dirname, '../uploads/templates');

  if (!fs.existsSync(baseTemplatePath)) {
    console.error('Base transparent template not found.');
    return [];
  }

  const baseWidth = 1024;
  const baseHeight = 1024;
  
  // Coordinates of the transparent cutout in the original 1024x1024 base template
  const baseBox = {
    x: 540,
    y: 360,
    width: 460,
    height: 420
  };

  const formats = [
    {
      key: 'instagram_post',
      name: 'Format Instagram Post (1080x1080)',
      filename: 'template_instagram_post.png',
      width: 1080,
      height: 1080
    },
    {
      key: 'instagram_story',
      name: 'Format Instagram Story (1080x1920)',
      filename: 'template_instagram_story.png',
      width: 1080,
      height: 1920
    },
    {
      key: 'facebook_share',
      name: 'Format Facebook Partage (1200x630)',
      filename: 'template_facebook.png',
      width: 1200,
      height: 630
    },
    {
      key: 'whatsapp_status',
      name: 'Format Status WhatsApp (1080x1920)',
      filename: 'template_whatsapp.png',
      width: 1080,
      height: 1920
    },
    {
      key: 'linkedin_post',
      name: 'Format LinkedIn Partage (1200x628)',
      filename: 'template_linkedin.png',
      width: 1200,
      height: 628
    }
  ];

  const results = [];

  for (const fmt of formats) {
    const outputPath = path.join(outputDir, fmt.filename);

    // Calculate scaling factors to fit "contain" in destination dimensions
    const scale = Math.min(fmt.width / baseWidth, fmt.height / baseHeight);
    const w = Math.round(baseWidth * scale);
    const h = Math.round(baseHeight * scale);

    const resizedBuffer = await sharp(baseTemplatePath)
      .resize(w, h)
      .png()
      .toBuffer();

    // Calculate centering offsets
    const leftOffset = Math.round((fmt.width - w) / 2);
    const topOffset = Math.round((fmt.height - h) / 2);

    // Create target layout with 100% transparency
    await sharp({
      create: {
        width: fmt.width,
        height: fmt.height,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 } // Completely transparent bg
      }
    })
    .composite([{
      input: resizedBuffer,
      left: leftOffset,
      top: topOffset
    }])
    .png()
    .toFile(outputPath);

    // Compute scaled photo slot coordinates
    const scaledX = Math.round(baseBox.x * scale) + leftOffset;
    const scaledY = Math.round(baseBox.y * scale) + topOffset;
    const scaledW = Math.round(baseBox.width * scale);
    const scaledH = Math.round(baseBox.height * scale);

    results.push({
      key: fmt.key,
      name: fmt.name,
      backgroundImage: `/uploads/templates/${fmt.filename}`,
      width: fmt.width,
      height: fmt.height,
      photoX: scaledX,
      photoY: scaledY,
      photoWidth: scaledW,
      photoHeight: scaledH
    });

    console.log(`Generated template variant: ${fmt.filename} (${fmt.width}x${fmt.height})`);
  }

  return results;
}

module.exports = {
  generateVariants
};
