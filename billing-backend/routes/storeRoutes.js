const express = require('express');
const { getStores, createStore, updateStore, deleteStore } = require('../controllers/storeController');
const { protect, authorize } = require('../middleware/authMiddleware');
const router = express.Router();

router.route('/')
    .get(protect, getStores)
    .post(protect, authorize('super_admin'), createStore);

router.route('/:id')
    .put(protect, authorize('super_admin'), updateStore)
    .delete(protect, authorize('super_admin'), deleteStore);

module.exports = router;
