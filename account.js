const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User'); // Adjust the path if necessary

// MongoDB connection string (adjust if needed)
mongoose.connect('mongodb+srv://georgeortman19:MsgpbIeGYduvbysk@myweb1.iovqynj.mongodb.net/myweb1?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('✅ Connected to MongoDB');
    
    // Create an admin user
    const createAdmin = async () => {
      const username = 'Vector'; // Change this to whatever username you want
      const password = '1234'; // Change to desired admin password
      const isAdmin = true; // Flag for admin

      // Check if the user already exists
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        console.log('❌ Admin already exists');
        mongoose.disconnect();
        return;
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create the admin user
      const admin = new User({
        username,
        password: hashedPassword,
        isAdmin: true,
        verificationCode: "1123"
      });

      // Save the user to the database
      await admin.save();

      console.log('✅ Admin user created');
      mongoose.disconnect();
    };

    createAdmin();
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    mongoose.disconnect();
  });
