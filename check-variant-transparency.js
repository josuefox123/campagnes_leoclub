const sharp = require('sharp');
const path = require('path');

async function checkTransparency() {
  const file = path.join(__dirname, 'uploads/templates/template_instagram_post.png');
  const { data, info } = await sharp(file).raw().toBuffer({ resolveWithObject: true });
  
  let transparentPixels = 0;
  for (let i = 0; i < data.length; i += info.channels) {
    if (info.channels === 4 && data[i + 3] < 255) {
      transparentPixels++;
    }
  }
  
  console.log(`Checking file: ${file}`);
  console.log(`Channels: ${info.channels}`);
  console.log(`Total pixels: ${info.width * info.height}`);
  console.log(`Transparent pixels: ${transparentPixels}`);
  console.log(`Transparency percentage: ${((transparentPixels / (info.width * info.height)) * 100).toFixed(2)}%`);
}

checkTransparency().catch(console.error);
