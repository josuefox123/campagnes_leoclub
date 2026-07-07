const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function makeTransparent() {
  const srcPath = path.join(__dirname, '../public/images/official-template-blue-box.jpg');
  const destPath = path.join(__dirname, '../uploads/templates/default_template.png');

  if (!fs.existsSync(srcPath)) {
    console.error('Source official template not found.');
    return;
  }

  console.log('Processing official template to punch transparent cutout...');

  const image = sharp(srcPath);
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });

  // Create an RGBA buffer
  const rgbaBuffer = Buffer.alloc(info.width * info.height * 4);

  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const srcIdx = (y * info.width + x) * 3;
      const destIdx = (y * info.width + x) * 4;

      const r = data[srcIdx];
      const g = data[srcIdx + 1];
      const b = data[srcIdx + 2];

      rgbaBuffer[destIdx] = r;
      rgbaBuffer[destIdx + 1] = g;
      rgbaBuffer[destIdx + 2] = b;

      // Check if pixel is within the blue box bounding area and matches the dark blue color range
      if (x > 500 && x < 1010 && y > 330 && y < 820 && 
          r < 25 && g < 42 && b > 40) {
        rgbaBuffer[destIdx + 3] = 0; // Transparent
      } else {
        rgbaBuffer[destIdx + 3] = 255; // Opaque
      }
    }
  }

  // Save the RGBA buffer as a transparent PNG
  await sharp(rgbaBuffer, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4
    }
  })
  .png()
  .toFile(destPath);

  console.log('Transparent template written to:', destPath);
}

module.exports = {
  makeTransparent
};
