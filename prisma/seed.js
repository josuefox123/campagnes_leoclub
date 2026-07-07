const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { generateDefaultAssets } = require('../utils/assetGenerator');
const { generateVariants } = require('../utils/variantGenerator');

const prisma = new PrismaClient();

async function main() {
  console.log('Generating default asset files...');
  await generateDefaultAssets();

  console.log('Generating official design social media variants...');
  const generatedTemplates = await generateVariants();
  
  console.log('Seeding database...');

  // 1. Create Default Admin
  const adminEmail = 'admin@admin.bj';
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail }
  });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('admin', 10);
    await prisma.user.create({
      data: {
        email: adminEmail,
        password: passwordHash,
        role: 'ADMIN'
      }
    });
    console.log('Admin user seeded: admin@admin.bj / admin');
  } else {
    console.log('Admin user already exists.');
  }

  // 2. Create Default Settings
  const defaultSettings = [
    { key: 'site_name', value: 'STOP DROGUE TOUR 2026' },
    { key: 'facebook_url', value: 'https://facebook.com' },
    { key: 'instagram_url', value: 'https://instagram.com' },
    { key: 'whatsapp_url', value: 'https://wa.me/22900000000' },
    { key: 'contact_email', value: 'contact@stopdrogue.bj' },
    { key: 'primary_color', value: '#3b46ff' },
    { key: 'site_logo', value: '/images/logo-placeholder.png' }
  ];

  for (const setting of defaultSettings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: {},
      create: {
        key: setting.key,
        value: setting.value
      }
    });
  }
  console.log('Default settings seeded.');

  // 3. Create Default Campaign
  const campaignName = 'STOP DROGUE TOUR 2026';
  const existingCampaign = await prisma.campaign.findFirst({
    where: { name: campaignName }
  });

  let campaign;
  if (!existingCampaign) {
    campaign = await prisma.campaign.create({
      data: {
        name: campaignName,
        description: 'STOP DROGUE TOUR 2026 - Grande campagne nationale de sensibilisation contre la toxicomanie. Organisé par la Région 14 (District Leo 403 A4 Bénin). Devise de l\'action : Unis par le Cœur, Engagés pour l\'Impact.',
        date: '24 & 25 Juillet 2026',
        color: '#3b46ff',
        status: 'ACTIVE',
        logo: '/uploads/logos/default_campaign_logo.png'
      }
    });
    console.log('Default campaign seeded.');
  } else {
    campaign = existingCampaign;
    console.log('Default campaign already exists.');
  }

  // 4. Create Default Clubs (Region 14 Léo Clubs)
  const defaultClubs = [
    { name: 'Léo Club Porto-Novo Espoir', city: 'Porto-Novo', president: 'Président Porto Espoir', phone: '+229 97 00 00 01', logo: '/images/fanion-porto-espoir.png' },
    { name: 'Léo Club Ekpè La Marina', city: 'Ekpè', president: 'Président Ekpè La Marina', phone: '+229 97 00 00 02', logo: '/images/fanion-ekpe-la-marina.png' },
    { name: 'Léo Club Cotonou Ortie', city: 'Cotonou', president: 'Président Ortie', phone: '+229 97 00 00 03', logo: '/images/fanion-ortie.png' },
    { name: 'Léo Club Cotonou Havre de Paix', city: 'Cotonou', president: 'Président Havre de Paix', phone: '+229 97 00 00 04', logo: '/images/fanion-havre-de-paix.png' },
    { name: 'Léo Club Cotonou Fontaine de Jouvence', city: 'Cotonou', president: 'Président Fontaine de Jouvence', phone: '+229 97 00 00 05', logo: '/images/fanion-fontaine-de-jouvence.png' },
    { name: 'Léo Club Cotonou Elite', city: 'Cotonou', president: 'Président Elite', phone: '+229 97 00 00 06', logo: '/images/fanion-elite.png' }
  ];

  await prisma.club.deleteMany({});

  for (const club of defaultClubs) {
    await prisma.club.create({
      data: club
    });
  }
  console.log('Default clubs seeded.');

  // 5. Save generated templates in the DB
  await prisma.template.deleteMany({});

  for (const t of generatedTemplates) {
    const template = await prisma.template.create({
      data: {
        name: t.name,
        width: t.width,
        height: t.height,
        status: 'ACTIVE',
        campaignId: campaign.id
      }
    });

    // 1. BACKGROUND Layer
    await prisma.layer.create({
      data: {
        templateId: template.id,
        type: 'BACKGROUND',
        imagePath: t.backgroundImage,
        x: 0,
        y: 0,
        width: t.width,
        height: t.height,
        zIndex: 0
      }
    });

    // 2. PHOTO Layer
    await prisma.layer.create({
      data: {
        templateId: template.id,
        type: 'PHOTO',
        x: t.photoX,
        y: t.photoY,
        width: t.photoWidth,
        height: t.photoHeight,
        zIndex: 1,
        fit: 'cover'
      }
    });

    // 3. TEXT Layers
    await prisma.layer.createMany({
      data: [
        {
          templateId: template.id,
          type: 'TEXT',
          key: 'NAME',
          fontFamily: 'Inter',
          fontSize: Math.round(t.photoWidth * 0.075),
          fontWeight: 'bold',
          color: '#1E3A8A',
          x: t.photoX,
          y: t.photoY + t.photoHeight + Math.round(t.photoHeight * 0.08),
          width: t.photoWidth,
          align: 'center',
          isUppercase: true,
          zIndex: 10
        },
        {
          templateId: template.id,
          type: 'TEXT',
          key: 'CITY',
          fontFamily: 'Inter',
          fontSize: Math.round(t.photoWidth * 0.055),
          fontWeight: 'normal',
          color: '#EAB308',
          x: t.photoX,
          y: t.photoY + t.photoHeight + Math.round(t.photoHeight * 0.16),
          width: t.photoWidth,
          align: 'center',
          isUppercase: false,
          zIndex: 10
        }
      ]
    });

    // 4. QRCODE Layer
    await prisma.layer.create({
      data: {
        templateId: template.id,
        type: 'QRCODE',
        x: t.width - 160,
        y: t.height - 160,
        width: 140,
        height: 140,
        zIndex: 15
      }
    });

    // 5. LOGO Layer (if campaign has logo)
    if (campaign.logo) {
      await prisma.layer.create({
        data: {
          templateId: template.id,
          type: 'LOGO',
          x: 50,
          y: 50,
          width: 200,
          height: 100,
          zIndex: 20,
          imagePath: campaign.logo,
          fit: 'contain'
        }
      });
    }
  }

  console.log('Seeded 5 visual templates and text configs successfully.');

  console.log('Database seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
