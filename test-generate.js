const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const path = require('path');
const fs = require('fs');
const sharpService = require('./services/sharpService');

async function test() {
  const template = await prisma.template.findFirst({
    where: { status: 'ACTIVE' },
    include: { texts: true }
  });
  
  if (!template) {
    console.error('No active template found.');
    return;
  }

  const userPhotoPath = path.join(__dirname, 'public/images/logo-placeholder.png');
  const outputPath = path.join(__dirname, 'uploads/posters/test-output.png');

  console.log('Testing poster generation using:');
  console.log('Template:', template.name);
  console.log('Photo path:', userPhotoPath);
  console.log('Output path:', outputPath);

  await sharpService.generatePoster({
    userPhotoPath,
    template,
    transformations: { zoom: 1, rotate: 0, offsetX: 0, offsetY: 0 },
    textInputs: {
      NAME: 'JEAN DUPONT',
      CITY: 'PORTO-NOVO'
    },
    qrUrl: 'http://localhost:3000/gallery/share/test-uuid',
    outputPath
  });

  if (fs.existsSync(outputPath)) {
    console.log('Success! Final poster generated successfully at:', outputPath);
  } else {
    console.error('Failure! Output file not created.');
  }
}

test()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
