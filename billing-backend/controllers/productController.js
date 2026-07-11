const Product = require('../models/Product');

const getProducts = async (req, res) => {
    try {
        const products = await Product.find({});
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createProduct = async (req, res) => {
    const { name, category, buyPrice, price, description, unit, stock } = req.body;
    try {
        const product = new Product({ name, category, buyPrice, price, description, unit, stock });
        const createdProduct = await product.save();
        res.status(201).json(createdProduct);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const updateProduct = async (req, res) => {
    const { name, category, buyPrice, price, description, unit, stock } = req.body;
    try {
        const product = await Product.findById(req.params.id);
        if (product) {
            product.name = name || product.name;
            product.category = category || product.category;
            product.buyPrice = buyPrice !== undefined ? buyPrice : product.buyPrice;
            product.price = price || product.price;
            product.description = description || product.description;
            product.unit = unit || product.unit;
            product.stock = stock !== undefined ? stock : product.stock;
            const updatedProduct = await product.save();
            res.json(updatedProduct);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (product) {
            await Product.findByIdAndDelete(req.params.id);
            res.json({ message: 'Product removed' });
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getProducts, createProduct, updateProduct, deleteProduct };
