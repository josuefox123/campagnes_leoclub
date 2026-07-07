const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

/**
 * Configure Helmet with CSP rules allowing external scripts/styles/fonts from trusted CDNs.
 */
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.jsdelivr.net", "https://unpkg.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "/uploads/", "/images/", "blob:", "https://*"],
      connectSrc: ["'self'", "https://*"]
    }
  }
});

/**
 * Limit overall rate to prevent spam.
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per windowMs
  message: 'Trop de requêtes effectuées depuis cette adresse IP. Veuillez réessayer dans 15 minutes.'
});

/**
 * Limit upload rates for generation to prevent server overloading.
 */
const generationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 15, // Limit each IP to 15 generations per hour
  message: 'Limite de génération d\'affiches atteinte (15 par heure). Veuillez réessayer plus tard.'
});

/**
 * Global 404 handler.
 */
function handle404(req, res, next) {
  res.status(404).render('errors/404.njk', {
    title: 'Page non trouvée'
  });
}

/**
 * Global 500 error handler.
 */
function handle500(err, req, res, next) {
  console.error('SERVER ERROR:', err);
  res.status(500).render('errors/500.njk', {
    title: 'Erreur interne du serveur',
    error: process.env.NODE_ENV === 'development' ? err.message : null
  });
}

module.exports = {
  securityHeaders,
  generalLimiter,
  generationLimiter,
  handle404,
  handle500
};
