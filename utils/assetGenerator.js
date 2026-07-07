const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

/**
 * Ensures all required uploads and public directories exist.
 */
function ensureDirectories() {
  const dirs = [
    path.join(__dirname, '../uploads/photos'),
    path.join(__dirname, '../uploads/posters'),
    path.join(__dirname, '../uploads/templates'),
    path.join(__dirname, '../uploads/logos'),
    path.join(__dirname, '../public/css'),
    path.join(__dirname, '../public/js'),
    path.join(__dirname, '../public/images')
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }
  });
}

/**
 * Generates default placeholder assets if they don't exist.
 */
async function generateDefaultAssets() {
  ensureDirectories();

  const defaultTemplatePath = path.join(__dirname, '../uploads/templates/default_template.png');
  const placeholderLogoPath = path.join(__dirname, '../public/images/logo-placeholder.png');
  const defaultCampaignLogoPath = path.join(__dirname, '../uploads/logos/default_campaign_logo.png');

  // 1. Generate Placeholder Logo
  if (!fs.existsSync(placeholderLogoPath)) {
    const logoSvg = `
      <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#1E3A8A" rx="20"/>
        <circle cx="100" cy="100" r="70" fill="none" stroke="#FFFFFF" stroke-width="8"/>
        <text x="100" y="115" font-family="Inter, sans-serif" font-size="48" font-weight="bold" fill="#FFFFFF" text-anchor="middle">LIONS</text>
      </svg>
    `;
    await sharp(Buffer.from(logoSvg))
      .png()
      .toFile(placeholderLogoPath);
    console.log('Generated placeholder logo.');
  }

  // 2. Generate Default Campaign Logo
  if (!fs.existsSync(defaultCampaignLogoPath)) {
    const campaignLogoSvg = `
      <svg width="300" height="100" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#E02424" rx="10"/>
        <text x="150" y="60" font-family="Impact, sans-serif" font-size="32" font-weight="bold" fill="#FFFFFF" text-anchor="middle">STOP DROGUE</text>
      </svg>
    `;
    await sharp(Buffer.from(campaignLogoSvg))
      .png()
      .toFile(defaultCampaignLogoPath);
    console.log('Generated campaign logo placeholder.');
  }

  // 2.5 Generate 6 Léo Club Fanion Placeholders
  const fanionClubs = [
    { filename: 'fanion-porto-espoir.png', name: 'Porto Espoir', color: '#1D4ED8', text: 'PORTO' },
    { filename: 'fanion-ekpe-la-marina.png', name: 'La Marina', color: '#0284C7', text: 'EKPÈ' },
    { filename: 'fanion-ortie.png', name: 'Ortie', color: '#059669', text: 'ORTIE' },
    { filename: 'fanion-havre-de-paix.png', name: 'Havre de Paix', color: '#4F46E5', text: 'H. DE PAIX' },
    { filename: 'fanion-fontaine-de-jouvence.png', name: 'Fontaine de J.', color: '#0891B2', text: 'FONTAINE' },
    { filename: 'fanion-elite.png', name: 'Elite', color: '#7C3AED', text: 'ELITE' }
  ];

  for (const fanion of fanionClubs) {
    const fanionPath = path.join(__dirname, '../public/images', fanion.filename);
    if (!fs.existsSync(fanionPath)) {
      const fanionSvg = `
        <svg width="150" height="200" viewBox="0 0 150 200" xmlns="http://www.w3.org/2000/svg">
          <!-- Fanion border and fill -->
          <path d="M 15 15 L 135 15 L 135 135 L 75 185 L 15 135 Z" fill="${fanion.color}" stroke="#FFFFFF" stroke-width="6" stroke-linejoin="round"/>
          
          <!-- Outer border decoration -->
          <path d="M 23 23 L 127 23 L 127 128 L 75 172 L 23 128 Z" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="2" stroke-linejoin="round"/>

          <!-- LEO vertical letters badge -->
          <rect x="55" y="35" width="40" height="40" rx="8" fill="#FFFFFF" />
          <text x="75" y="63" font-family="'Space Grotesk', Arial, sans-serif" font-size="24" font-weight="bold" fill="${fanion.color}" text-anchor="middle">L</text>
          
          <!-- Club label text -->
          <text x="75" y="105" font-family="'Inter', sans-serif" font-size="11" font-weight="extrabold" fill="#FFFFFF" text-anchor="middle" letter-spacing="1">LÉO CLUB</text>
          <text x="75" y="125" font-family="'Space Grotesk', sans-serif" font-size="12" font-weight="bold" fill="#FBBF24" text-anchor="middle" letter-spacing="0.5">${fanion.text.toUpperCase()}</text>
          
          <!-- Stars decoration -->
          <circle cx="50" cy="150" r="3" fill="#FFFFFF" opacity="0.6"/>
          <circle cx="75" cy="155" r="4" fill="#FBBF24" opacity="0.8"/>
          <circle cx="100" cy="150" r="3" fill="#FFFFFF" opacity="0.6"/>
        </svg>
      `;
      await sharp(Buffer.from(fanionSvg))
        .png()
        .toFile(fanionPath);
      console.log(`Generated fanion: ${fanion.filename}`);
    }
  }

  // 3. Generate Default Template Frame with a Transparent Cutout
  if (!fs.existsSync(defaultTemplatePath)) {
    // Create base red/blue poster frame (1080x1350)
    // We will draw the frame background, top title, bottom footer, and punch a hole in the middle.
    
    // Width and height of the template
    const width = 1080;
    const height = 1350;

    // SVG overlay for the headers, labels, and borders
    const templateSvg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <!-- Main blue container -->
        <rect width="${width}" height="${height}" fill="#0F172A" />
        
        <!-- Red accent top border -->
        <rect width="${width}" height="20" fill="#E02424" />
        
        <!-- Header Text -->
        <text x="540" y="100" font-family="Impact, sans-serif" font-size="56" fill="#E02424" text-anchor="middle" letter-spacing="4">STOP DROGUE TOUR 2026</text>
        <text x="540" y="160" font-family="'Inter', sans-serif" font-size="28" font-weight="bold" fill="#FFFFFF" text-anchor="middle" letter-spacing="2">LIONS &amp; LEO CLUBS DU BÉNIN</text>
        
        <!-- Outer Photo frame border -->
        <rect x="135" y="255" width="810" height="710" fill="none" stroke="#3B82F6" stroke-width="10" rx="15"/>
        
        <!-- Info labels in footer -->
        <text x="540" y="1255" font-family="'Inter', sans-serif" font-size="24" font-weight="semibold" fill="#94A3B8" text-anchor="middle">24 &amp; 25 JUILLET 2026 • PORTO-NOVO &amp; COTONOU</text>
        <text x="540" y="1305" font-family="'Inter', sans-serif" font-size="28" font-weight="bold" fill="#3B82F6" text-anchor="middle">#JeChoisisLaVie</text>
      </svg>
    `;

    // SVG mask to cut out a transparent hole in the middle where the user's photo will sit
    // Coordinates: x=140, y=260, width=800, height=700
    const cutoutSvg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <!-- Solid background representing where we keep opaque pixels -->
        <rect width="${width}" height="${height}" fill="#FFFFFF" />
        <!-- Black box representing the hole to punch out -->
        <rect x="140" y="260" width="800" height="700" fill="#000000" rx="10" />
      </svg>
    `;

    // Step A: Load the base SVG
    const baseBuffer = await sharp(Buffer.from(templateSvg)).png().toBuffer();
    
    // Step B: Use the cutout SVG as a mask (using 'dest-out' or simple mask compositing)
    // In Sharp, we can use the cutout image as a joint-composition with blend mode 'dest-in' or 'dest-out'
    const maskBuffer = await sharp(Buffer.from(cutoutSvg)).png().toBuffer();

    // Composite them together
    await sharp(baseBuffer)
      .composite([{
        input: maskBuffer,
        blend: 'dest-in' // Dest-in keeps the parts where mask is white (opaque). Black parts become transparent!
      }])
      .png()
      .toFile(defaultTemplatePath);

    console.log('Generated default template frame with transparent viewport.');
  }
}

module.exports = {
  ensureDirectories,
  generateDefaultAssets
};
