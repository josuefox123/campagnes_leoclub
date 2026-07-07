const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const adminController = require('../controllers/adminController');
const { isAuthenticated, isGuest } = require('../middleware/auth');
const { uploadLogo, uploadTemplate } = require('../middleware/upload');

// Auth routes
router.get('/login', isGuest, authController.showLogin);
router.post('/login', isGuest, authController.processLogin);
router.get('/logout', authController.logout);

// Protected Admin Panel Dashboard
router.get('/dashboard', isAuthenticated, adminController.index);

// Campaigns CRUD
router.get('/campaigns', isAuthenticated, adminController.listCampaigns);
router.post('/campaigns/add', isAuthenticated, uploadLogo, adminController.addCampaign);
router.post('/campaigns/edit/:id', isAuthenticated, uploadLogo, adminController.editCampaign);
router.post('/campaigns/delete/:id', isAuthenticated, adminController.deleteCampaign);
router.post('/campaigns/toggle/:id', isAuthenticated, adminController.toggleCampaign);

// Clubs CRUD
router.get('/clubs', isAuthenticated, adminController.listClubs);
router.post('/clubs/add', isAuthenticated, uploadLogo, adminController.addClub);
router.post('/clubs/edit/:id', isAuthenticated, uploadLogo, adminController.editClub);
router.post('/clubs/delete/:id', isAuthenticated, adminController.deleteClub);

// Settings CRUD
router.get('/settings', isAuthenticated, adminController.showSettings);
router.post('/settings/update', isAuthenticated, uploadLogo, adminController.updateSettings);

// Poster Moderation
router.get('/posters', isAuthenticated, adminController.listPosters);
router.post('/posters/delete/:id', isAuthenticated, adminController.deletePoster);

// Templates CRUD
router.get('/templates', isAuthenticated, adminController.listTemplates);
router.post('/templates/add', isAuthenticated, uploadTemplate, adminController.addTemplate);
router.get('/templates/edit/:id', isAuthenticated, adminController.editTemplate);
router.post('/templates/edit/:id', isAuthenticated, uploadTemplate, adminController.updateTemplateConfig);
router.post('/templates/delete/:id', isAuthenticated, adminController.deleteTemplate);

module.exports = router;
