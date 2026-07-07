require('dotenv').config();
const express = require('express');
const nunjucks = require('nunjucks');
const path = require('path');
const session = require('express-session');
const passport = require('passport');

const initializePassport = require('./config/passport');
const { loadLocals } = require('./middleware/locals');
const { generateDefaultAssets } = require('./utils/assetGenerator');
const { securityHeaders, generalLimiter, handle404, handle500 } = require('./middleware/security');

const webRoutes = require('./routes/web');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Passport Auth Strategy
initializePassport();

// 1. Template Engine Config (Nunjucks)
const env = nunjucks.configure('views', {
  autoescape: true,
  express: app,
  watch: process.env.NODE_ENV === 'development',
  noCache: process.env.NODE_ENV === 'development'
});

// Custom Date filter since Nunjucks doesn't bundle one by default
env.addFilter('date', function(dateVal, formatStr) {
  if (!dateVal) return '';
  const date = new Date(dateVal);
  if (isNaN(date.getTime())) return dateVal;
  
  const pad = (num) => String(num).padStart(2, '0');
  
  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1);
  const year = date.getFullYear();
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  
  return formatStr
    .replace('DD', day)
    .replace('MM', month)
    .replace('YYYY', year)
    .replace('HH', hours)
    .replace('mm', minutes);
});

app.set('view engine', 'njk');

// 2. Global Security & Rate Limiting Middleware
app.use(securityHeaders);
app.use(generalLimiter);

// 3. Parser Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 4. Session & Cookie Config
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'stop-drogue-tour-session-secret-2026',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true if deploying on HTTPS
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    }
  })
);

// 5. Auth Middleware
app.use(passport.initialize());
app.use(passport.session());

// 6. Global Local Variables Injection Middleware
app.use(loadLocals);

// 7. Static Directories Setup
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 8. Application Routes
app.use('/', webRoutes);
app.use('/admin', adminRoutes);

// 9. Global Error Routing Middleware
app.use(handle404);
app.use(handle500);

// 10. Startup Initialization
async function boot() {
  try {
    console.log('Validating media directories and core templates...');
    await generateDefaultAssets();
    
    app.listen(PORT, () => {
      console.log(`=================================================`);
      console.log(`  STOP DROGUE TOUR 2026 server running on:`);
      console.log(`  👉 http://localhost:${PORT}`);
      console.log(`=================================================`);
    });
  } catch (err) {
    console.error('Critical boot failure:', err);
    process.exit(1);
  }
}

boot();
