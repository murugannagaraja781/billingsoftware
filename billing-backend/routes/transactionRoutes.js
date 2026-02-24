const express = require('express');
const { createTransaction, getTransactions, deleteTransaction } = require('../controllers/transactionController');
const { protect, authorize } = require('../middleware/authMiddleware');
const router = express.Router();

router.route('/')
    .post(protect, createTransaction)
    .get(protect, getTransactions);

router.route('/:id')
    .delete(protect, authorize('admin', 'super_admin'), deleteTransaction);

module.exports = router;
