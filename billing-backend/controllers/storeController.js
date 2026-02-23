const Store = require('../models/Store');

const getStores = async (req, res) => {
    try {
        const stores = await Store.find({}).populate('adminId', 'name email');
        res.json(stores);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createStore = async (req, res) => {
    const { name, location, adminId } = req.body;
    try {
        const store = new Store({ name, location, adminId });
        const createdStore = await store.save();
        res.status(201).json(createdStore);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const updateStore = async (req, res) => {
    const { name, location, adminId } = req.body;
    try {
        const store = await Store.findById(req.params.id);
        if (store) {
            store.name = name || store.name;
            store.location = location || store.location;
            store.adminId = adminId || store.adminId;
            const updatedStore = await store.save();
            res.json(updatedStore);
        } else {
            res.status(404).json({ message: 'Store not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const deleteStore = async (req, res) => {
    try {
        const store = await Store.findById(req.params.id);
        if (store) {
            await store.remove();
            res.json({ message: 'Store removed' });
        } else {
            res.status(404).json({ message: 'Store not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getStores, createStore, updateStore, deleteStore };
