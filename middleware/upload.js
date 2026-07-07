const multer = require('multer');
const path = require('path');
const fs = require('fs');

// File filter to ensure only images are uploaded
const imageFileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Erreur : Seules les images au format JPEG, PNG et WEBP sont autorisées !'));
  }
};

// 1. Photo Upload Storage (User profile photo)
const photoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/photos'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'photo-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// 2. Logo Upload Storage (Clubs/Campaign logos)
const logoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/logos'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'logo-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// 3. Template Image Upload Storage (Base templates)
const templateStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/templates'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'template-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Export configured multer uploads
module.exports = {
  uploadPhoto: multer({
    storage: photoStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
    fileFilter: imageFileFilter
  }).single('photo'),

  uploadLogo: multer({
    storage: logoStorage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB limit
    fileFilter: imageFileFilter
  }).single('logo'),

  uploadTemplate: multer({
    storage: templateStorage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit for HD templates
    fileFilter: imageFileFilter
  }).single('backgroundImage')
};
