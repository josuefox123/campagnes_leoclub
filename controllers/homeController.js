const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Render Landing Page.
 */
async function index(req, res, next) {
  try {
    // 1. Fetch clubs to display in sponsors section
    const clubs = await prisma.club.findMany({
      orderBy: { createdAt: 'asc' }
    });

    // 2. Fetch recent posters to show in the landing page gallery
    const recentPosters = await prisma.poster.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: {
        template: {
          include: { campaign: true }
        }
      }
    });

    // 3. Fetch active campaigns
    const activeCampaigns = await prisma.campaign.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' }
    });

    res.render('home.njk', {
      title: 'Accueil',
      clubs,
      recentPosters,
      activeCampaigns
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  index
};
