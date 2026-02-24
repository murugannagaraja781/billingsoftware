const Customer = require('../models/Customer');

const getCustomers = async (req, res) => {
    try {
        const customers = await Customer.find({});
        res.json(customers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createCustomer = async (req, res) => {
    const { name, phone, address, gstNumber } = req.body;
    try {
        if (phone) {
            const customerExists = await Customer.findOne({ phone });
            if (customerExists) {
                return res.status(400).json({ message: 'Customer with this phone already exists' });
            }
        }
        const customer = new Customer({ name, phone, address, gstNumber });
        const createdCustomer = await customer.save();
        res.status(201).json(createdCustomer);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const updateCustomer = async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);
        if (customer) {
            Object.assign(customer, req.body);
            const updatedCustomer = await customer.save();
            res.json(updatedCustomer);
        } else {
            res.status(404).json({ message: 'Customer not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = { getCustomers, createCustomer, updateCustomer };
