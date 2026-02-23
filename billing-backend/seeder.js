const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('./models/User');
const Product = require('./models/Product');
const Store = require('./models/Store');

dotenv.config();

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/billing_db');

        // Clear existing data
        await User.deleteMany();
        await Product.deleteMany();
        await Store.deleteMany();

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('123456', salt);

        // Create Super Admin
        const superAdmin = await User.create({
            name: 'Super Admin',
            email: 'superadmin@test.com',
            password: hashedPassword,
            role: 'super_admin'
        });

        // Create a Store
        const store = await Store.create({
            name: 'Main Plastic Factory',
            location: 'Chennai, Tamil Nadu',
            adminId: superAdmin._id
        });

        // Create Admin and Manager
        await User.create({
            name: 'Store Admin',
            email: 'admin@test.com',
            password: hashedPassword,
            role: 'admin',
            storeId: store._id
        });

        // Create Products
        const products = [
            { name: 'Plastic Chair - New', category: 'new', price: 450, stock: 100 },
            { name: 'Plastic Bucket - New', category: 'new', price: 120, stock: 50 },
            { name: 'Waste Plastic Bottles', category: 'waste', price: 15, unit: 'kg' },
            { name: 'Mixed Scrap Plastic', category: 'waste', price: 12, unit: 'kg' },
            { name: 'HDPE Scrap', category: 'waste', price: 25, unit: 'kg' },
        ];

        await Product.insertMany(products);

        console.log('Data Seeded Successfully!');
        process.exit();
    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
};

seedData();
