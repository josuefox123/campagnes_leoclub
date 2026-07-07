const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

let settingsCache = null;

/**
 * Fetch settings from database and cache them in memory.
 */
async function loadSettings() {
  try {
    const settingsList = await prisma.setting.findMany();
    const settingsObj = {};
    settingsList.forEach(s => {
      settingsObj[s.key] = s.value;
    });
    settingsCache = settingsObj;
    return settingsCache;
  } catch (error) {
    console.error('Failed to load settings from DB:', error);
    return {};
  }
}

/**
 * Force refresh of settings cache (e.g. after admin update).
 */
async function refreshSettingsCache() {
  return await loadSettings();
}

/**
 * Middleware to load settings and user info into res.locals.
 */
async function loadLocals(req, res, next) {
  if (!settingsCache) {
    await loadSettings();
  }

  // Inject settings
  res.locals.settings = settingsCache || {};
  
  // Inject authenticated user info
  res.locals.currentUser = req.user || null;
  res.locals.isAuthenticated = req.isAuthenticated();
  
  // Inject request path
  res.locals.currentPath = req.path;

  // Inject current active campaigns
  try {
    res.locals.activeCampaigns = await prisma.campaign.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' }
    });
  } catch (err) {
    res.locals.activeCampaigns = [];
  }

  next();
}

module.exports = {
  loadLocals,
  refreshSettingsCache
};
