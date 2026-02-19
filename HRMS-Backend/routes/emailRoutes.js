const express = require('express');
const router = express.Router();
const { authenticate, restrictTo } = require('../middleware/auth');
const emailController = require('../controllers/emailController');

router.post(
  '/send',
  authenticate('jwt', { session: false }),
  restrictTo('Super Admin'),
  emailController.sendEmailToEmployees
);

module.exports = router;
