const Transaction = require('../models/Transaction');
const Product = require('../models/Product');

const createTransaction = async (req, res) => {
    const { customerName, customerPhone, items, paymentMethod, storeId } = req.body;

    try {
        let totalNewAmount = 0;
        let totalWasteAmount = 0;

        const processedItems = items.map(item => {
            const subTotal = item.quantity * item.unitPrice;
            if (item.type === 'sold') {
                totalNewAmount += subTotal;
            } else {
                totalWasteAmount += subTotal;
            }
            return { ...item, subTotal };
        });

        const netAmount = totalNewAmount - totalWasteAmount;

        const transaction = new Transaction({
            customerName,
            customerPhone,
            items: processedItems,
            totalNewAmount,
            totalWasteAmount,
            netAmount,
            paymentMethod,
            storeId,
            managedBy: req.user._id,
        });

        // Update stock logic (simplified)
        for (const item of items) {
            const product = await Product.findById(item.productId);
            if (product) {
                if (item.type === 'sold') {
                    product.stock -= item.quantity;
                } else {
                    product.stock += item.quantity;
                }
                await product.save();
            }
        }

        const createdTransaction = await transaction.save();
        res.status(201).json(createdTransaction);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const getTransactions = async (req, res) => {
    try {
        const transactions = await Transaction.find({}).populate('managedBy', 'name').sort({ createdAt: -1 });
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { createTransaction, getTransactions };
