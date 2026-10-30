const express = require('express');
const { updateProfile, changePassword } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();
router.use(protect); // every route below needs a valid login

router.put('/profile', updateProfile);
router.put('/password', changePassword);

module.exports = router;
