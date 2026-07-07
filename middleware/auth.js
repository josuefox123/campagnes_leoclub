/**
 * Middleware to restrict access to authenticated admin users.
 */
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  req.session.returnTo = req.originalUrl;
  res.redirect('/admin/login');
}

/**
 * Middleware to prevent authenticated admins from seeing the login page again.
 */
function isGuest(req, res, next) {
  if (!req.isAuthenticated()) {
    return next();
  }
  res.redirect('/admin/dashboard');
}

module.exports = {
  isAuthenticated,
  isGuest
};
