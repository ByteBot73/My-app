

// const express = require('express');
// const mongoose = require('mongoose');
// const bodyParser = require('body-parser');
// const cors = require('cors');
// const bcrypt = require('bcrypt');
// const User = require('./models/User');

// const app = express();
// const PORT = 3000;

// app.use(cors());
// app.use(bodyParser.json());
// app.use(express.static('public'));

// // MongoDB Connection
// mongoose.connect('mongodb+srv://georgeortman19:MsgpbIeGYduvbysk@myweb1.iovqynj.mongodb.net/myweb1?retryWrites=true&w=majority')
//   .then(() => console.log("✅ Connected to MongoDB"))
//   .catch((err) => console.error("❌ MongoDB error:", err));

// // Routes
// app.get('/', (req, res) => res.sendFile(__dirname + '/public/index.html'));
// app.get('/admin_dashboard', (req, res) => res.sendFile(__dirname + '/public/admin_dashboard.html'));

// app.post('/register', async (req, res) => {
//   const { username, password } = req.body;
//   if (!username || !password) return res.status(400).json({ error: 'Missing fields' });

//   try {
//     const existing = await User.findOne({ username });
//     if (existing) return res.status(400).json({ error: 'Username taken' });

//     const hashed = await bcrypt.hash(password, 10);
//     const user = new User({ username, password: hashed });
//     await user.save();

//     res.status(201).json({ message: 'Registered successfully' });
//   } catch (err) {
//     res.status(500).json({ error: 'Registration failed' });
//   }
// });

// app.post('/login', async (req, res) => {
//   const { username, password } = req.body;
//   const user = await User.findOne({ username });
//   if (!user) return res.status(401).json({ error: 'Invalid credentials' });

//   const match = await bcrypt.compare(password, user.password);
//   if (!match) return res.status(401).json({ error: 'Invalid credentials' });

//   if (user.isAdmin) {
//     return res.status(200).json({ isAdmin: true, message: 'Admin login - verification required' });
//   } else {
//     return res.status(200).json({ isAdmin: false, message: 'Login successful' });
//   }
// });

// app.post('/verify-admin', async (req, res) => {
//   const { username, verificationCode } = req.body;
//   const user = await User.findOne({ username });

//   if (!user || !user.isAdmin) return res.status(404).json({ error: 'Admin not found' });
//   if (user.verificationCode === verificationCode) {
//     res.status(200).json({ message: 'Verified' });
//   } else {
//     res.status(401).json({ error: 'Invalid code' });
//   }
// });

// app.get('/admin/users', async (req, res) => {
//   const users = await User.find({}, { password: 0 });
//   res.json(users);
// });

// app.get('/admin/users/:username', async (req, res) => {
//   const user = await User.findOne({ username: req.params.username }, { password: 0 });
//   if (!user) return res.status(404).json({ error: 'User not found' });
//   res.json(user);
// });

// app.post('/admin/users', async (req, res) => {
//   const { username, password, isAdmin, verificationCode } = req.body;

//   if (!username || !password) return res.status(400).json({ error: 'Missing fields' });
//   if (isAdmin && !verificationCode) return res.status(400).json({ error: 'Admin code required' });

//   const existing = await User.findOne({ username });
//   if (existing) return res.status(400).json({ error: 'Username taken' });

//   const hashed = await bcrypt.hash(password, 10);
//   const newUser = new User({
//     username,
//     password: hashed,
//     isAdmin: !!isAdmin,
//     verificationCode: isAdmin ? verificationCode : null
//   });

//   await newUser.save();
//   res.status(201).json({ success: true, message: 'User created' });
// });

// app.delete('/admin/users/:id', async (req, res) => {
//   const result = await User.findByIdAndDelete(req.params.id);
//   if (!result) return res.status(404).json({ error: 'User not found' });
//   res.json({ success: true, message: 'User deleted' });
// });

// app.listen(PORT, () => console.log(`🚀 Server running: http://localhost:${PORT}`));


const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const session = require('express-session');
const User = require('./models/User');
const socketIo = require('socket.io');

const app = express();
const PORT = 3000;

// --- Session Setup ---
const sessionMiddleware = session({ // Store session middleware in a variable
    secret: '3c97b63d24b46cc1e91ee17f0d6e167354270e2629e1f3b33967562705f3ac07947a5e390036de0dcf08103fc80e4d4f0f69850e0798bc1880b9a8b6945b09c2',
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24, // 1 day
        secure: process.env.NODE_ENV === 'production'
    }
});
app.use(sessionMiddleware); // Use the session middleware for HTTP requests
// --- End Session Setup ---

// CORS Middleware
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));

app.use(bodyParser.json());
app.use(express.static('public'));

// MongoDB connection
mongoose.connect('mongodb+srv://georgeortman19:MsgpbIeGYduvbysk@myweb1.iovqynj.mongodb.net/myweb1?retryWrites=true&w=majority')
    .then(() => console.log("✅ Connected to MongoDB"))
    .catch((err) => console.error("❌ MongoDB connection error:", err));

// --- Authentication Middleware ---
const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.username) {
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized: Please log in.' });
    }
};

const isAdmin = (req, res, next) => {
    if (req.session && req.session.isAdmin) {
        next();
    } else {
        res.status(403).json({ error: 'Forbidden: Admin access required.' });
    }
};
// --- End Authentication Middleware ---

// Login Route
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    req.session.username = user.username;
    req.session.isAdmin = user.isAdmin;

    res.status(200).json({ message: 'Login successful', username: user.username, isAdmin: user.isAdmin });
});

// Logout Route
app.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ error: 'Could not log out' });
        }
        res.clearCookie('connect.sid');
        res.status(200).json({ message: 'Logged out successfully' });
    });
});

// Admin Verification Route
app.post('/verify-admin', async (req, res) => {
    const { username, verificationCode } = req.body;
    const user = await User.findOne({ username });

    if (!user || !user.isAdmin || user.verificationCode !== verificationCode) {
        return res.status(401).json({ error: 'Invalid verification code' });
    }

    req.session.username = user.username;
    req.session.isAdmin = user.isAdmin;

    res.status(200).json({ message: 'Admin verified', redirectTo: '/admin_dashboard.html' });
});

// Register Route
app.post('/register', async (req, res) => {
    const { username, password, isAdmin, verificationCode } = req.body;

    if (!username || !password) return res.status(400).json({ error: 'Missing fields' });

    try {
        const existing = await User.findOne({ username });
        if (existing) return res.status(400).json({ error: 'Username taken' });

        const hashed = await bcrypt.hash(password, 10);
        const user = new User({
            username,
            password: hashed,
            isAdmin: isAdmin || false,
            verificationCode: isAdmin ? verificationCode : null
        });

        if (isAdmin && !verificationCode) {
            return res.status(400).json({ error: 'Verification code is required to register as an admin.' });
        }

        await user.save();
        res.status(201).json({ message: 'User created successfully', user: { username: user.username, isAdmin: user.isAdmin, verificationCode: user.verificationCode } });
    } catch (err) {
        console.error("Error during registration:", err);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

// MODIFIED ROUTE: Get Logged-in Username (now returns isAdmin)
app.get('/get-username', isAuthenticated, (req, res) => {
    res.json({ username: req.session.username, isAdmin: req.session.isAdmin });
});


// ADMIN DASHBOARD ROUTES
app.get('/admin/users', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const users = await User.find({}, '-password -verificationCode');
        res.json(users);
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

app.post('/admin/users', isAuthenticated, isAdmin, async (req, res) => {
    const { username, password, isAdmin, verificationCode } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required.' });
    }

    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(409).json({ error: 'Username already exists.' });
        }

        if (isAdmin) {
            if (!verificationCode) {
                return res.status(400).json({ error: 'Verification code is required for admin users.' });
            }
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        let newUser = new User({
            username,
            password: hashedPassword,
            isAdmin: isAdmin || false,
            verificationCode: isAdmin ? verificationCode : null
        });

        await newUser.save();
        res.status(201).json({ message: 'User created successfully!', user: { username: newUser.username, isAdmin: newUser.isAdmin, verificationCode: newUser.verificationCode } });
    } catch (err) {
        console.error('Error creating user:', err);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

app.delete('/admin/users/:userId', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const { userId } = req.params;
        const result = await User.findByIdAndDelete(userId);

        if (!result) {
            return res.status(404).json({ error: 'User not found.' });
        }
        res.status(200).json({ message: 'User deleted successfully!' });
    } catch (err) {
        console.error('Error deleting user:', err);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

// Start the server
const server = app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));

// --- Socket.IO Setup (MODIFIED) ---
const io = socketIo(server);

// Use shared session middleware for Socket.IO
// This allows you to access session data (like req.session.username, req.session.isAdmin)
// directly within your socket.io connection.
io.use((socket, next) => {
    sessionMiddleware(socket.request, {}, next);
});

io.on('connection', (socket) => {
    // Check if the user is authenticated via session when the socket connects
    const username = socket.request.session.username;
    const isAdmin = socket.request.session.isAdmin;

    if (!username) {
        console.log('Unauthenticated socket connection attempted. Disconnecting.');
        socket.disconnect(true); // Disconnect unauthenticated sockets
        return;
    }

    console.log(`User ${username} (${isAdmin ? 'Admin' : 'Regular'}) connected via WebSocket`);

    socket.on('disconnect', () => {
        console.log(`User ${username} disconnected`);
    });

    socket.on('chatMessage', (msg) => {
        // The server validates isAdmin from the session, not trusting the client-sent flag
        const messageToSend = {
            username: username,
            message: msg.message, // msg.message comes from client
            isAdmin: isAdmin // Use isAdmin from the server-side session
        };
        console.log('Message:', messageToSend);
        io.emit('chatMessage', messageToSend); // Broadcast message to all connected clients
    });

    socket.on('typing', () => { // No need for client to send username/isAdmin for typing
        // Server sends typing notification based on its own session info
        const typingUsername = username;
        const isTypingAdmin = isAdmin;
        
        socket.broadcast.emit('typing', { username: typingUsername, isAdmin: isTypingAdmin });
    });
});