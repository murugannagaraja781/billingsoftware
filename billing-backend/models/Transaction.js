const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    customerName: { type: String, required: true },
    customerPhone: { type: String },
    items: [
        {
            productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
            productName: String,
            quantity: { type: Number, required: true },
            type: { type: String, enum: ['bought', 'sold'], required: true }, // bought(waste), sold(new)
            unitPrice: { type: Number, required: true },
            subTotal: { type: Number, required: true },
        }
    ],
    totalNewAmount: { type: Number, default: 0 },
    totalWasteAmount: { type: Number, default: 0 },
    netAmount: { type: Number, required: true }, // totalNewAmount - totalWasteAmount
    paymentStatus: {
        type: String,
        enum: ['paid', 'pending', 'partial'],
        default: 'paid'
    },
    paymentMethod: { type: String, default: 'cash' },
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store' },
    managedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    date: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);
