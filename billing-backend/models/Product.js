const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    category: {
        type: String,
        enum: ['new', 'waste'],
        required: true
    },
    buyPrice: { type: Number, default: 0 }, // Price at which company buys the product
    price: { type: Number, required: true }, // Selling price for new, Buying price for waste
    description: { type: String },
    unit: { type: String, default: 'kg' }, // kg, piece, etc.
    stock: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
