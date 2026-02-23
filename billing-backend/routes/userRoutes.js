const express = require('express');
const { getUsers, createUser, updateUser, deleteUser } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');
const router = express.Router();

router.route('/')
    .get(protect, authorize('super_admin', 'admin'), getUsers)
    .post(protect, authorize('super_admin', 'admin'), createUser);

router.route('/:id')
    .put(protect, authorize('super_admin', 'admin'), updateUser)
    .delete(protect, authorize('super_admin', 'admin'), deleteUser);

module.exports = router;
