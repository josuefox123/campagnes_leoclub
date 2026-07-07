const express = require('express');
const router = express.Router();
const homeController = require('../controllers/homeController');
const editorController = require('../controllers/editorController');
const galleryController = require('../controllers/galleryController');
const { uploadPhoto } = require('../middleware/upload');
const { generationLimiter } = require('../middleware/security');

// Landing Page
router.get('/', homeController.index);

// Editor Page
router.get('/editor', editorController.showEditor);

// Handle Photo Upload (includes Multer upload processing with error catcher)
router.post('/editor/upload', (req, res, next) => {
  uploadPhoto(req, res, function (err) {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
}, editorController.uploadPhoto);

// Remove Background on Existing Uploaded Photo
router.post('/editor/remove-bg-existing', express.json(), editorController.removeBgExisting);

// Compile & Generate Poster (with rate limiter to protect against DOS)
router.post('/editor/generate', generationLimiter, editorController.generatePoster);

// Public Gallery
router.get('/gallery', galleryController.showGallery);

// Single Poster Share Preview Page
router.get('/gallery/share/:id', galleryController.showSharePage);

// Track downloads/shares
router.post('/gallery/download/:id', galleryController.trackDownload);
router.post('/gallery/share-click/:id', galleryController.trackShare);

module.exports = router;
