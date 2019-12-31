const express = require('express');

const router = express.Router();

const profileController = require('../controllers/profile');

router.get('/profile', profileController.getProfile);

router.post('/edit-user', profileController.postProfileEdits);

router.post('/verify-email', profileController.postVerifyEmail);

router.get('/verifyEmail/:token', profileController.verifyEmail);

module.exports = router;