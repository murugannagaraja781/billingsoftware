const express = require('express');
const { getProducts, createProduct, updateProduct } = require('../controllers/productController');
const { protect, authorize } = require('../middleware/authMiddleware');
const router = express.Router();

router.route('/')
    .get(getProducts)
    .post(protect, authorize('super_admin', 'admin'), createProduct);

router.route('/:id')
    .put(protect, authorize('super_admin', 'admin'), updateProduct);

module.exports = router;
