const passport = require('passport');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const User = require('../models/user');

const opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET || 'your_jwt_secret'
};

passport.use(new JwtStrategy(opts, async (jwt_payload, done) => {
  console.log('JWT Payload:', jwt_payload);
  try {
    const user = await User.findById(jwt_payload.id).select('email role employeeId companyId isActive');
    console.log('User found:', user);
    if (user && user.isActive) {
      return done(null, user);
    }
    console.log('Authentication failed: User not found or inactive');
    return done(null, false);
  } catch (error) {
    console.log('Passport error:', error);
    return done(error, false);
  }
}));

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (req.user && req.user.role === 'Super Admin') {
      return next();
    }
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }
    next();
  };
};

/**
 * JWT auth with explicit callback - always returns 401 JSON (never 400) on failure.
 * Ensures req.user is set before passing to next.
 */
const authenticateJwt = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user) => {
    if (err) {
      console.error('[auth] JWT error:', err?.message || err);
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    if (!user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    req.user = user;
    next();
  })(req, res, next);
};

module.exports = {
  initialize: () => passport.initialize(),
  authenticate: (strategy, options) => passport.authenticate(strategy, options),
  authenticateJwt,
  restrictTo
};