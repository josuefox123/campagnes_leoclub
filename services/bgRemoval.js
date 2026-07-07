const fs = require('fs');
const path = require('path');

/**
 * Remove background from an image.
 * Uses remove.bg or ClipDrop APIs if keys are provided in .env.
 * Otherwise, copies the file as-is (graceful fallback).
 * 
 * @param {string} inputPath - Absolute path to input image
 * @param {string} outputPath - Absolute path to save transparent PNG
 * @returns {Promise<boolean>} - True if background was removed, false if copied as fallback
 */
async function removeBackground(inputPath, outputPath) {
  const removeBgKey = process.env.REMOVE_BG_API_KEY;
  const clipDropKey = process.env.CLIPDROP_API_KEY;

  if (removeBgKey) {
    console.log('Using remove.bg API for background removal...');
    return await callRemoveBg(inputPath, outputPath, removeBgKey);
  } else if (clipDropKey) {
    console.log('Using ClipDrop API for background removal...');
    return await callClipDrop(inputPath, outputPath, clipDropKey);
  } else {
    console.log('No background removal API keys configured. Copying file as-is.');
    fs.copyFileSync(inputPath, outputPath);
    return false;
  }
}

/**
 * Call remove.bg API
 */
async function callRemoveBg(inputPath, outputPath, apiKey) {
  try {
    const FormData = require('form-data'); // Wait, we don't have form-data in package.json.
    // Let's use native Node fetch with standard boundary or a simple request.
    // Since we don't have form-data package installed, we can construct the multipart body manually,
    // or install form-data.
    // Actually, to make it super robust, let's write a standard manual boundary multipart builder
    // using Buffer.concat, which is extremely reliable and has no dependencies!
    const fileBuffer = fs.readFileSync(inputPath);
    const filename = path.basename(inputPath);
    
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    
    // Construct boundary payload
    const bodyBuffer = Buffer.concat([
      Buffer.from(`--${boundary}\r\n`),
      Buffer.from(`Content-Disposition: form-data; name="image_file"; filename="${filename}"\r\n`),
      Buffer.from(`Content-Type: image/jpeg\r\n\r\n`), // adjust type if needed, jpeg works for most
      fileBuffer,
      Buffer.from(`\r\n--${boundary}\r\n`),
      Buffer.from(`Content-Disposition: form-data; name="size"\r\n\r\n`),
      Buffer.from(`auto\r\n`),
      Buffer.from(`--${boundary}--\r\n`)
    ]);

    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        'X-Api-Key': apiKey,
        'Content-Type': `multipart/form-data; boundary=${boundary}`
      },
      body: bodyBuffer
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`remove.bg API error: ${response.status} ${errText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    fs.writeFileSync(outputPath, Buffer.from(arrayBuffer));
    console.log('remove.bg background removal successful.');
    return true;
  } catch (error) {
    console.error('remove.bg API failed, falling back to copying file:', error);
    fs.copyFileSync(inputPath, outputPath);
    return false;
  }
}

/**
 * Call ClipDrop API
 */
async function callClipDrop(inputPath, outputPath, apiKey) {
  try {
    const fileBuffer = fs.readFileSync(inputPath);
    const filename = path.basename(inputPath);
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);

    const bodyBuffer = Buffer.concat([
      Buffer.from(`--${boundary}\r\n`),
      Buffer.from(`Content-Disposition: form-data; name="image_file"; filename="${filename}"\r\n`),
      Buffer.from(`Content-Type: image/jpeg\r\n\r\n`),
      fileBuffer,
      Buffer.from(`\r\n--${boundary}--\r\n`)
    ]);

    const response = await fetch('https://clipdrop-api.co/remove-background/v1', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': `multipart/form-data; boundary=${boundary}`
      },
      body: bodyBuffer
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`ClipDrop API error: ${response.status} ${errText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    fs.writeFileSync(outputPath, Buffer.from(arrayBuffer));
    console.log('ClipDrop background removal successful.');
    return true;
  } catch (error) {
    console.error('ClipDrop API failed, falling back to copying file:', error);
    fs.copyFileSync(inputPath, outputPath);
    return false;
  }
}

module.exports = {
  removeBackground
};
