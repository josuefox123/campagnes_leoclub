const sharp = require('sharp');
const path = require('path');

async function checkTransparency() {
  const file = path.join(__dirname, 'uploads/templates/default_template.png');
  const { data, info } = await sharp(file).raw().toBuffer({ resolveWithObject: true });
  
  let transparentPixels = 0;
  for (let i = 0; i < data.length; i += info.channels) {
    // Check alpha channel (4th byte in RGBA)
    if (info.channels === 4 && data[i + 3] < 255) {
      transparentPixels++;
    }
  }
  
  console.log(`Total pixels: ${info.width * info.height}`);
  console.log(`Transparent pixels: ${transparentPixels}`);
  console.log(`Transparency percentage: ${((transparentPixels / (info.width * info.height)) * 100).toFixed(2)}%`);
}

checkTransparency().catch(console.error);
