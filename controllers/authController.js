const passport = require('passport');

/**
 * GET /admin/login
 * Show login form.
 */
function showLogin(req, res) {
  if (req.isAuthenticated()) {
    return res.redirect('/admin/dashboard');
  }
  
  // Retrieve any flash/error messages from session
  const errors = req.session.messages || [];
  req.session.messages = []; // Clear messages

  res.render('admin/login.njk', {
    title: 'Connexion Admin',
    errors
  });
}

/**
 * POST /admin/login
 * Handle authentication.
 */
const processLogin = passport.authenticate('local', {
  successReturnToOrRedirect: '/admin/dashboard',
  failureRedirect: '/admin/login',
  failureMessage: true // Exposes errors to req.session.messages
});

/**
 * GET /admin/logout
 * Destroy session and logout.
 */
function logout(req, res, next) {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    req.session.destroy(() => {
      res.redirect('/');
    });
  });
}

module.exports = {
  showLogin,
  processLogin,
  logout
};
