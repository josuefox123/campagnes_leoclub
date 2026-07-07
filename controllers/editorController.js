const path = require('path');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const PosterEngine = require('../utils/PosterEngine');
const bgRemoval = require('../services/bgRemoval');

/**
 * GET /editor
 * Render the poster creation screen.
 */
async function showEditor(req, res, next) {
  try {
    let templates = await prisma.template.findMany({
      where: { status: 'ACTIVE' },
      include: { layers: true, campaign: true }
    });

    // Map layers to legacy format for the frontend preview
    const mapTemplateForFrontend = (t) => {
      const bgLayer = t.layers.find(l => l.type === 'BACKGROUND');
      const photoLayer = t.layers.find(l => l.type === 'PHOTO');
      const textLayers = t.layers.filter(l => l.type === 'TEXT').map(l => ({
        ...l,
        type: l.key // map key to type for frontend
      }));

      return {
        ...t,
        backgroundImage: bgLayer ? bgLayer.imagePath : '',
        photoX: photoLayer ? photoLayer.x : 0,
        photoY: photoLayer ? photoLayer.y : 0,
        photoWidth: photoLayer ? photoLayer.width : 0,
        photoHeight: photoLayer ? photoLayer.height : 0,
        photoRotation: photoLayer ? photoLayer.rotation : 0,
        texts: textLayers
      };
    };

    templates = templates.map(mapTemplateForFrontend);

    const selectedTemplateId = req.query.templateId;
    let activeTemplate = null;

    if (selectedTemplateId) {
      activeTemplate = templates.find(t => t.id === selectedTemplateId);
    }

    // Fallback to first active template
    if (!activeTemplate && templates.length > 0) {
      activeTemplate = templates[0];
    }

    res.render('editor.njk', {
      title: 'Créer mon affiche',
      templates,
      activeTemplate
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /editor/upload
 * Handle user photo upload and optional server background removal.
 */
async function uploadPhoto(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier téléchargé.' });
    }

    const tempPath = req.file.path;
    const filename = req.file.filename;
    
    // Public web path of the raw photo
    let publicPath = `/uploads/photos/${filename}`;
    let bgRemoved = false;

    // Check if client requested server-side background removal
    if (req.body.removeBg === 'true') {
      const outputFilename = `transparent-${Date.now()}-${path.basename(tempPath, path.extname(tempPath))}.png`;
      const outputPath = path.join(__dirname, '../uploads/photos', outputFilename);
      
      const success = await bgRemoval.removeBackground(tempPath, outputPath);
      if (success) {
        publicPath = `/uploads/photos/${outputFilename}`;
        bgRemoved = true;
        
        // Delete original raw temp file to save space
        try {
          fs.unlinkSync(tempPath);
        } catch (e) {
          console.warn('Failed to delete temp file:', e.message);
        }
      }
    }

    return res.json({
      success: true,
      photoUrl: publicPath,
      bgRemoved
    });
  } catch (err) {
    console.error('Upload handler error:', err);
    return res.status(500).json({ error: err.message || 'Erreur lors du traitement de la photo.' });
  }
}

/**
 * POST /editor/remove-bg-existing
 * Remove background on an already uploaded photo via API call.
 */
async function removeBgExisting(req, res) {
  try {
    const { photoPath } = req.body;
    if (!photoPath) return res.status(400).json({ error: 'Aucun chemin de photo fourni.' });

    // Ensure photo path is safe
    const basename = path.basename(photoPath);
    const absolutePath = path.join(__dirname, '../uploads/photos', basename);

    if (!fs.existsSync(absolutePath)) {
      return res.status(400).json({ error: 'Fichier source introuvable.' });
    }

    const outputFilename = `transparent-${Date.now()}-${basename}`;
    const outputPath = path.join(__dirname, '../uploads/photos', outputFilename);

    const success = await bgRemoval.removeBackground(absolutePath, outputPath);
    
    if (success) {
      return res.json({
        success: true,
        photoUrl: `/uploads/photos/${outputFilename}`
      });
    } else {
      // bgRemoval gracefully fell back to copying the file (e.g. no API keys config)
      return res.json({
        success: true,
        photoUrl: `/uploads/photos/${outputFilename}`,
        message: 'No background removal API configured, file was duplicated without modifications.'
      });
    }

  } catch (err) {
    console.error('removeBgExisting error:', err);
    return res.status(500).json({ error: err.message || 'Erreur lors du détourage.' });
  }
}

/**
 * POST /editor/generate
 * Compile the final poster with user inputs and Sharp compositing.
 */
async function generatePoster(req, res) {
  try {
    const {
      photoPath, // Relative web path (/uploads/photos/...)
      templateId,
      name,
      city,
      school,
      slogan, // Override slogan text if applicable
      zoom,
      rotate,
      offsetX,
      offsetY
    } = req.body;

    if (!photoPath || !templateId) {
      return res.status(400).json({ error: 'Champs obligatoires manquants.' });
    }

    // 1. Fetch template from DB
    const template = await prisma.template.findUnique({
      where: { id: templateId },
      include: { layers: true, campaign: true }
    });

    if (!template) {
      return res.status(404).json({ error: 'Modèle introuvable.' });
    }

    // 2. Resolve absolute paths
    const absolutePhotoPath = path.join(__dirname, '..', photoPath);
    if (!fs.existsSync(absolutePhotoPath)) {
      return res.status(400).json({ error: 'Fichier photo introuvable sur le serveur.' });
    }

    const uniqueId = require('crypto').randomUUID();
    const posterFilename = `poster-${uniqueId}.png`;
    const absoluteOutputPath = path.join(__dirname, '../uploads/posters', posterFilename);

    // 3. Prepare QR Code URL (points to sharing page)
    const protocol = req.protocol;
    const host = req.get('host');
    const shareUrl = `${protocol}://${host}/gallery/share/${uniqueId}`;

    // 4. Composite final poster using the new PosterEngine
    const inputs = {
      NAME: name,
      CITY: city,
      SCHOOL: school,
      SLOGAN: slogan,
      zoom,
      rotate,
      offsetX,
      offsetY
    };

    const engine = new PosterEngine(uniqueId, template, inputs, absolutePhotoPath, shareUrl);
    await engine.run(absoluteOutputPath);

    // 5. Store poster record in database
    const poster = await prisma.poster.create({
      data: {
        id: uniqueId,
        filename: `/uploads/posters/${posterFilename}`,
        name: name || null,
        city: city || null,
        school: school || null,
        templateId: template.id
      }
    });

    return res.json({
      success: true,
      posterId: poster.id,
      posterUrl: poster.filename,
      shareUrl
    });
  } catch (err) {
    console.error('Poster generation failed:', err);
    return res.status(500).json({ error: 'La génération de l\'affiche a échoué. Veuillez réessayer.' });
  }
}

module.exports = {
  showEditor,
  uploadPhoto,
  removeBgExisting,
  generatePoster
};
