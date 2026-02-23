const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Product = require('./models/Product');
const dotenv = require('dotenv');

dotenv.config();

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB for seeding...');

        // Clear existing data
        await User.deleteMany({});
        await Product.deleteMany({});

        // Seed Users
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('123456', salt);

        const users = [
            {
                name: 'Super Admin User',
                email: 'superadmin@test.com',
                password: hashedPassword,
                role: 'super_admin'
            },
            {
                name: 'Admin User',
                email: 'admin@test.com',
                password: hashedPassword,
                role: 'admin'
            },
            {
                name: 'Manager User',
                email: 'manager@test.com',
                password: hashedPassword,
                role: 'manager'
            }
        ];

        await User.insertMany(users);
        console.log('Users seeded successfully!');

        // Seed Products
        const products = [
            { name: 'HDPE Virgin Pellets', category: 'new', price: 120, unit: 'KG', stock: 1000 },
            { name: 'PET Flakes (Clear)', category: 'new', price: 85, unit: 'KG', stock: 500 },
            { name: 'Old Plastic Chairs (Waste)', category: 'waste', price: 18, unit: 'KG', stock: 0 },
            { name: 'Mixed Scrap Plastic', category: 'waste', price: 12, unit: 'KG', stock: 0 },
            { name: 'Industrial Scrap (PP)', category: 'waste', price: 25, unit: 'KG', stock: 0 }
        ];

        await Product.insertMany(products);
        console.log('Products seeded successfully!');

        process.exit();
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
};

seedData();
