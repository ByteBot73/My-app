

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
const User = require('./models/User');
const socketIo = require('socket.io');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// MongoDB Connection
mongoose.connect('mongodb+srv://georgeortman19:MsgpbIeGYduvbysk@myweb1.iovqynj.mongodb.net/myweb1?retryWrites=true&w=majority')
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB error:", err));

// Routes
app.get('/', (req, res) => res.sendFile(__dirname + '/public/index.html'));
app.get('/admin_dashboard', (req, res) => res.sendFile(__dirname + '/public/admin_dashboard.html'));

// Chat route (for logged-in users)
app.get('/chat', (req, res) => res.sendFile(__dirname + '/public/LoggedIn.html'));

// Register route
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Missing fields' });

  try {
    const existing = await User.findOne({ username });
    if (existing) return res.status(400).json({ error: 'Username taken' });

    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashed });
    await user.save();

    res.status(201).json({ message: 'Registered successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login route
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ error: 'Invalid credentials' });

  // Login successful, send response
  res.status(200).json({ username: user.username, isAdmin: user.isAdmin, message: 'Login successful' });
});

// Admin verification route
app.post('/verify-admin', async (req, res) => {
  const { username, verificationCode } = req.body;
  const user = await User.findOne({ username });

  if (!user || !user.isAdmin) return res.status(404).json({ error: 'Admin not found' });
  if (user.verificationCode === verificationCode) {
    res.status(200).json({ message: 'Verified' });
  } else {
    res.status(401).json({ error: 'Invalid code' });
  }
});

// Admin user management routes
app.get('/admin/users', async (req, res) => {
  const users = await User.find({}, { password: 0 });
  res.json(users);
});

app.post('/admin/users', async (req, res) => {
  const { username, password, isAdmin, verificationCode } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Missing fields' });
  if (isAdmin && !verificationCode) return res.status(400).json({ error: 'Admin code required' });

  const existing = await User.findOne({ username });
  if (existing) return res.status(400).json({ error: 'Username taken' });

  const hashed = await bcrypt.hash(password, 10);
  const newUser = new User({
    username,
    password: hashed,
    isAdmin: !!isAdmin,
    verificationCode: isAdmin ? verificationCode : null
  });

  await newUser.save();
  res.status(201).json({ success: true, message: 'User created' });
});

app.delete('/admin/users/:id', async (req, res) => {
  const result = await User.findByIdAndDelete(req.params.id);
  if (!result) return res.status(404).json({ error: 'User not found' });
  res.json({ success: true, message: 'User deleted' });
});

// Starting the server
const server = app.listen(PORT, () => console.log(`🚀 Server running: http://localhost:${PORT}`));

// Set up socket.io for real-time chat
const io = socketIo(server);

io.on('connection', (socket) => {
  console.log('A user connected');

  // Notify when a user is typing
  socket.on('typing', (username) => {
    socket.broadcast.emit('typing', username); // Notify other users
  });

  // Listen for chat messages
  socket.on('chatMessage', (msg) => {
    io.emit('chatMessage', msg); // Broadcast the message to all users
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});
