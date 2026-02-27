const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

// Middleware
app.use(express.json());
app.use(cors());

// Make io accessible in routes
app.set('io', io);

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/billing_db')
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Could not connect to MongoDB', err));

// Socket.io Connection
const connectedUsers = {};

io.on('connection', (socket) => {
    console.log('🔌 User connected:', socket.id);

    // Register user with their role
    socket.on('register', (userData) => {
        connectedUsers[socket.id] = userData;
        console.log(`👤 ${userData.name} (${userData.role}) registered`);
    });

    socket.on('disconnect', () => {
        const user = connectedUsers[socket.id];
        if (user) {
            console.log(`👤 ${user.name} disconnected`);
            delete connectedUsers[socket.id];
        }
    });
});

// Routes middleware
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/transactions', require('./routes/transactionRoutes'));
app.use('/api/stores', require('./routes/storeRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/customers', require('./routes/customerRoutes'));

app.get('/', (req, res) => {
    res.send('Billing Software API is running...');
});

// Port
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);

    // Self-ping to keep Render awake (Optional)
    const url = `https://billingsoftware-vmoo.onrender.com`;
    if (url.includes('onrender')) {
        setInterval(() => {
            http.get(url, (res) => {
                console.log('Self-ping to stay awake...');
            }).on('error', (err) => {
                console.error('Self-ping error:', err.message);
            });
        }, 840000); // Every 14 minutes
    }
});
