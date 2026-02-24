const Transaction = require('../models/Transaction');
const Product = require('../models/Product');

const createTransaction = async (req, res) => {
    const { customerName, customerPhone, items, paymentMethod, storeId, invoiceId } = req.body;

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
            invoiceId,
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

        // Emit real-time notification to admin/super_admin
        const io = req.app.get('io');
        if (io) {
            io.emit('new-bill', {
                message: `${req.user.name || 'Manager'} created a new bill`,
                customerName,
                totalAmount: netAmount,
                managerName: req.user.name,
                transactionId: createdTransaction._id,
                timestamp: new Date()
            });
        }

        res.status(201).json(createdTransaction);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const deleteTransaction = async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id);
        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        // Revert stock changes
        for (const item of transaction.items) {
            const product = await Product.findById(item.productId);
            if (product) {
                if (item.type === 'sold') {
                    product.stock += item.quantity; // Sold item, so add it back
                } else {
                    product.stock -= item.quantity; // Bought item, so remove it
                }
                await product.save();
            }
        }

        await transaction.deleteOne();
        res.json({ message: 'Transaction deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { createTransaction, getTransactions, deleteTransaction };
