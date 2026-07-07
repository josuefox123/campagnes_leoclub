const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * GET /gallery
 * Show paginated, searchable public gallery of posters.
 */
async function showGallery(req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 12;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    // Search filter criteria (name, city, or school)
    const where = search ? {
      OR: [
        { name: { contains: search } },
        { city: { contains: search } },
        { school: { contains: search } }
      ]
    } : {};

    const [posters, total] = await prisma.$transaction([
      prisma.poster.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          template: {
            include: { campaign: true }
          }
        }
      }),
      prisma.poster.count({ where })
    ]);

    const totalPages = Math.ceil(total / limit);

    res.render('gallery.njk', {
      title: 'Galerie des Affiches',
      posters,
      search,
      currentPage: page,
      totalPages,
      total
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /gallery/share/:id
 * Render specific poster sharing preview page with OpenGraph metadata.
 */
async function showSharePage(req, res, next) {
  try {
    const poster = await prisma.poster.findUnique({
      where: { id: req.params.id },
      include: {
        template: {
          include: { campaign: true }
        }
      }
    });

    if (!poster) {
      return res.status(404).render('errors/404.njk', { title: 'Affiche introuvable' });
    }

    const host = req.get('host');
    const protocol = req.protocol;
    const fullPosterUrl = `${protocol}://${host}${poster.filename}`;

    res.render('share.njk', {
      title: `Affiche de ${poster.name || 'Sensibilisation'}`,
      poster,
      fullPosterUrl,
      shareUrl: `${protocol}://${host}/gallery/share/${poster.id}`
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /gallery/download/:id
 * Track poster download count.
 */
async function trackDownload(req, res) {
  try {
    await prisma.poster.update({
      where: { id: req.params.id },
      data: {
        downloadCount: { increment: 1 }
      }
    });
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

/**
 * POST /gallery/share-click/:id
 * Track poster share click count.
 */
async function trackShare(req, res) {
  try {
    await prisma.poster.update({
      where: { id: req.params.id },
      data: {
        shareCount: { increment: 1 }
      }
    });
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

module.exports = {
  showGallery,
  showSharePage,
  trackDownload,
  trackShare
};
