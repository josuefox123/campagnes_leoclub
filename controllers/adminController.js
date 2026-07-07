const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { refreshSettingsCache } = require('../middleware/locals');

/**
 * GET /admin/dashboard
 * Show metrics dashboard and list recent posters.
 */
async function index(req, res, next) {
  try {
    const totalPosters = await prisma.poster.count();
    const totalCampaigns = await prisma.campaign.count();
    const totalTemplates = await prisma.template.count();
    
    // Sum metrics
    const downloadAggregate = await prisma.poster.aggregate({
      _sum: { downloadCount: true }
    });
    const shareAggregate = await prisma.poster.aggregate({
      _sum: { shareCount: true }
    });

    const totalDownloads = downloadAggregate._sum.downloadCount || 0;
    const totalShares = shareAggregate._sum.shareCount || 0;

    // Fetch recent poster generations
    const recentPosters = await prisma.poster.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { template: true }
    });

    res.render('admin/dashboard.njk', {
      title: 'Tableau de bord',
      metrics: {
        totalPosters,
        totalCampaigns,
        totalTemplates,
        totalDownloads,
        totalShares
      },
      recentPosters
    });
  } catch (error) {
    next(error);
  }
}

/**
 * CAMPAIGNS CRUD
 */
async function listCampaigns(req, res, next) {
  try {
    const campaigns = await prisma.campaign.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.render('admin/campaigns.njk', { title: 'Gestion des Campagnes', campaigns });
  } catch (error) {
    next(error);
  }
}

async function addCampaign(req, res, next) {
  try {
    const { name, description, date, color, status } = req.body;
    let logoPath = '/uploads/logos/default_campaign_logo.png';

    if (req.file) {
      logoPath = `/uploads/logos/${req.file.filename}`;
    }

    await prisma.campaign.create({
      data: {
        name,
        description,
        date,
        color: color || '#1E3A8A',
        status: status || 'ACTIVE',
        logo: logoPath
      }
    });

    res.redirect('/admin/campaigns');
  } catch (error) {
    next(error);
  }
}

async function editCampaign(req, res, next) {
  try {
    const { id } = req.params;
    const { name, description, date, color, status } = req.body;
    const data = { name, description, date, color, status };

    if (req.file) {
      data.logo = `/uploads/logos/${req.file.filename}`;
      // Clean up old logo file if it's not default
      const oldCampaign = await prisma.campaign.findUnique({ where: { id } });
      if (oldCampaign && oldCampaign.logo && !oldCampaign.logo.includes('default_campaign_logo')) {
        const oldPath = path.join(__dirname, '..', oldCampaign.logo);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
    }

    await prisma.campaign.update({ where: { id }, data });
    res.redirect('/admin/campaigns');
  } catch (error) {
    next(error);
  }
}

async function deleteCampaign(req, res, next) {
  try {
    const { id } = req.params;
    const campaign = await prisma.campaign.findUnique({ where: { id } });
    
    if (campaign) {
      // Clean logo file
      if (campaign.logo && !campaign.logo.includes('default_campaign_logo')) {
        const oldPath = path.join(__dirname, '..', campaign.logo);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      await prisma.campaign.delete({ where: { id } });
    }
    res.redirect('/admin/campaigns');
  } catch (error) {
    next(error);
  }
}

async function toggleCampaign(req, res, next) {
  try {
    const { id } = req.params;
    const campaign = await prisma.campaign.findUnique({ where: { id } });
    if (campaign) {
      const nextStatus = campaign.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await prisma.campaign.update({
        where: { id },
        data: { status: nextStatus }
      });
    }
    res.redirect('/admin/campaigns');
  } catch (error) {
    next(error);
  }
}

/**
 * CLUBS CRUD
 */
async function listClubs(req, res, next) {
  try {
    const clubs = await prisma.club.findMany({ orderBy: { name: 'asc' } });
    res.render('admin/clubs.njk', { title: 'Gestion des Clubs', clubs });
  } catch (error) {
    next(error);
  }
}

async function addClub(req, res, next) {
  try {
    const { name, city, president, phone, facebook } = req.body;
    let logoPath = '/images/logo-placeholder.png';

    if (req.file) {
      logoPath = `/uploads/logos/${req.file.filename}`;
    }

    await prisma.club.create({
      data: { name, city, president, phone, facebook, logo: logoPath }
    });
    res.redirect('/admin/clubs');
  } catch (error) {
    next(error);
  }
}

async function editClub(req, res, next) {
  try {
    const { id } = req.params;
    const { name, city, president, phone, facebook } = req.body;
    const data = { name, city, president, phone, facebook };

    if (req.file) {
      data.logo = `/uploads/logos/${req.file.filename}`;
      const oldClub = await prisma.club.findUnique({ where: { id } });
      if (oldClub && oldClub.logo && !oldClub.logo.includes('logo-placeholder')) {
        const oldPath = path.join(__dirname, '..', oldClub.logo);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
    }

    await prisma.club.update({ where: { id }, data });
    res.redirect('/admin/clubs');
  } catch (error) {
    next(error);
  }
}

async function deleteClub(req, res, next) {
  try {
    const { id } = req.params;
    const club = await prisma.club.findUnique({ where: { id } });
    if (club) {
      if (club.logo && !club.logo.includes('logo-placeholder')) {
        const oldPath = path.join(__dirname, '..', club.logo);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      await prisma.club.delete({ where: { id } });
    }
    res.redirect('/admin/clubs');
  } catch (error) {
    next(error);
  }
}

/**
 * SETTINGS CRUD
 */
async function showSettings(req, res, next) {
  try {
    const settings = await prisma.setting.findMany();
    res.render('admin/settings.njk', { title: 'Paramètres du Site', settings });
  } catch (error) {
    next(error);
  }
}

async function updateSettings(req, res, next) {
  try {
    const settingsObj = req.body;
    
    // Update each setting row
    for (const key of Object.keys(settingsObj)) {
      await prisma.setting.upsert({
        where: { key },
        update: { value: settingsObj[key] },
        create: { key, value: settingsObj[key] }
      });
    }

    // Handle site logo file upload if provided
    if (req.file) {
      const logoUrl = `/uploads/logos/${req.file.filename}`;
      await prisma.setting.upsert({
        where: { key: 'site_logo' },
        update: { value: logoUrl },
        create: { key: 'site_logo', value: logoUrl }
      });
    }

    // Refresh memory cache in locals
    await refreshSettingsCache();

    res.redirect('/admin/settings');
  } catch (error) {
    next(error);
  }
}

/**
 * POSTERS LIST & MODERATION
 */
async function listPosters(req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    const [posters, total] = await prisma.$transaction([
      prisma.poster.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { template: true }
      }),
      prisma.poster.count()
    ]);

    res.render('admin/posters.njk', {
      title: 'Modération des Affiches',
      posters,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    next(error);
  }
}

async function deletePoster(req, res, next) {
  try {
    const { id } = req.params;
    const poster = await prisma.poster.findUnique({ where: { id } });
    if (poster) {
      // Delete output file
      const filePath = path.join(__dirname, '..', poster.filename);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (e) {
          console.warn('Failed to delete physical poster file:', e.message);
        }
      }
      await prisma.poster.delete({ where: { id } });
    }
    res.redirect('/admin/posters');
  } catch (error) {
    next(error);
  }
}

/**
 * TEMPLATES CRUD & INTERACTIVE ZONE CONFIG
 */
async function listTemplates(req, res, next) {
  try {
    let templates = await prisma.template.findMany({
      include: { campaign: true, layers: true }
    });
    
    // Map the background layer path to backgroundImage for the view
    templates = templates.map(t => {
      const bgLayer = t.layers.find(l => l.type === 'BACKGROUND');
      return {
        ...t,
        backgroundImage: bgLayer ? bgLayer.imagePath : '/images/placeholder.png'
      };
    });

    const campaigns = await prisma.campaign.findMany({ where: { status: 'ACTIVE' } });
    res.render('admin/templates.njk', { title: 'Modèles d\'Affiches', templates, campaigns });
  } catch (error) {
    next(error);
  }
}

async function addTemplate(req, res, next) {
  try {
    const { name, campaignId, width, height } = req.body;
    
    if (!req.file) {
      throw new Error('Vous devez uploader une image de fond.');
    }

    const bgPath = `/uploads/templates/${req.file.filename}`;
    const tWidth = parseInt(width) || 1080;
    const tHeight = parseInt(height) || 1350;

    const template = await prisma.template.create({
      data: {
        name,
        campaignId,
        width: tWidth,
        height: tHeight,
        status: 'ACTIVE'
      }
    });

    // Create the default layers
    await prisma.layer.createMany({
      data: [
        { templateId: template.id, type: 'BACKGROUND', imagePath: bgPath, x: 0, y: 0, width: tWidth, height: tHeight, zIndex: 5 },
        { templateId: template.id, type: 'PHOTO', x: 140, y: 260, width: 800, height: 700, zIndex: 0, fit: 'cover' },
        { templateId: template.id, type: 'TEXT', key: 'SLOGAN', fontFamily: 'Impact', fontSize: 60, color: '#E02424', x: 140, y: 1020, width: 800, align: 'center', isUppercase: true, zIndex: 10 },
        { templateId: template.id, type: 'TEXT', key: 'NAME', fontFamily: 'Inter', fontSize: 44, color: '#FFFFFF', x: 140, y: 1110, width: 800, align: 'center', isUppercase: true, zIndex: 10 },
        { templateId: template.id, type: 'TEXT', key: 'CITY', fontFamily: 'Inter', fontSize: 32, color: '#A3B7FF', x: 140, y: 1180, width: 800, align: 'center', isUppercase: false, zIndex: 10 },
        { templateId: template.id, type: 'QRCODE', x: tWidth - 160, y: tHeight - 160, width: 140, height: 140, zIndex: 15 }
      ]
    });

    res.redirect(`/admin/templates/edit/${template.id}`);
  } catch (error) {
    next(error);
  }
}

async function editTemplate(req, res, next) {
  try {
    const { id } = req.params;
    let template = await prisma.template.findUnique({
      where: { id },
      include: { layers: true, campaign: true }
    });

    if (!template) {
      return res.status(404).render('errors/404.njk', { title: 'Modèle introuvable' });
    }

    const bgLayer = template.layers.find(l => l.type === 'BACKGROUND');
    const photoLayer = template.layers.find(l => l.type === 'PHOTO');
    const textLayers = template.layers.filter(l => l.type === 'TEXT').map(l => ({
      ...l,
      type: l.key
    }));

    template = {
      ...template,
      backgroundImage: bgLayer ? bgLayer.imagePath : '',
      photoX: photoLayer ? photoLayer.x : 0,
      photoY: photoLayer ? photoLayer.y : 0,
      photoWidth: photoLayer ? photoLayer.width : 0,
      photoHeight: photoLayer ? photoLayer.height : 0,
      photoRotation: photoLayer ? photoLayer.rotation : 0,
      texts: textLayers
    };

    res.render('admin/template_editor.njk', {
      title: `Éditeur visuel de Modèle - ${template.name}`,
      template
    });
  } catch (error) {
    next(error);
  }
}

async function updateTemplateConfig(req, res, next) {
  try {
    const { id } = req.params;
    const {
      name,
      photoX,
      photoY,
      photoWidth,
      photoHeight,
      photoRotation,
      textsJson // JSON format representing all texts configurations
    } = req.body;

    // 1. Update Template base metadata
    await prisma.template.update({
      where: { id },
      data: { name }
    });

    if (req.file) {
      const bgPath = `/uploads/templates/${req.file.filename}`;
      // Update background layer
      const bgLayer = await prisma.layer.findFirst({ where: { templateId: id, type: 'BACKGROUND' } });
      if (bgLayer) {
        if (bgLayer.imagePath && !bgLayer.imagePath.includes('default_template')) {
          const oldPath = path.join(__dirname, '..', bgLayer.imagePath);
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }
        await prisma.layer.update({ where: { id: bgLayer.id }, data: { imagePath: bgPath } });
      }
    }

    // Update PHOTO layer
    const photoLayer = await prisma.layer.findFirst({ where: { templateId: id, type: 'PHOTO' } });
    if (photoLayer) {
      await prisma.layer.update({
        where: { id: photoLayer.id },
        data: {
          x: parseInt(photoX),
          y: parseInt(photoY),
          width: parseInt(photoWidth),
          height: parseInt(photoHeight),
          rotation: parseFloat(photoRotation) || 0.0
        }
      });
    }

    // 2. Update Text placements
    if (textsJson) {
      const texts = JSON.parse(textsJson);
      for (const textItem of texts) {
        await prisma.layer.update({
          where: { id: textItem.id },
          data: {
            fontFamily: textItem.fontFamily,
            fontSize: parseInt(textItem.fontSize),
            color: textItem.color,
            x: parseInt(textItem.x),
            y: parseInt(textItem.y),
            width: parseInt(textItem.width),
            align: textItem.align,
            isUppercase: textItem.isUppercase === true || textItem.isUppercase === 'true'
          }
        });
      }
    }

    res.redirect('/admin/templates');
  } catch (error) {
    next(error);
  }
}

async function deleteTemplate(req, res, next) {
  try {
    const { id } = req.params;
    const template = await prisma.template.findUnique({ 
      where: { id },
      include: { layers: true }
    });
    if (template) {
      const bgLayer = template.layers.find(l => l.type === 'BACKGROUND');
      if (bgLayer && bgLayer.imagePath && !bgLayer.imagePath.includes('default_template')) {
        const oldPath = path.join(__dirname, '..', bgLayer.imagePath);
        if (fs.existsSync(oldPath)) {
          try {
            fs.unlinkSync(oldPath);
          } catch(e) {}
        }
      }
      await prisma.template.delete({ where: { id } });
    }
    res.redirect('/admin/templates');
  } catch (error) {
    next(error);
  }
}

module.exports = {
  index,
  listCampaigns,
  addCampaign,
  editCampaign,
  deleteCampaign,
  toggleCampaign,
  listClubs,
  addClub,
  editClub,
  deleteClub,
  showSettings,
  updateSettings,
  listPosters,
  deletePoster,
  listTemplates,
  addTemplate,
  editTemplate,
  updateTemplateConfig,
  deleteTemplate
};
