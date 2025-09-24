const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Connect to MongoDB
const mongoUri = 'mongodb://localhost:27017/test';
mongoose.connect(mongoUri)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Error connecting to MongoDB:', err));

// Define a Mongoose schema and model for the login data
const loginSchema = new mongoose.Schema({
    loginid: Number,
    username: String,
    password: String,
});

const Login = mongoose.model('loginmaster', loginSchema, 'loginmaster');

const app = express();
app.use(cors());
app.use(express.json());

// API endpoint for login
app.post('/api/login', async (req, res) => {
    console.log('Received login request.');
    console.log('Raw request body:', req.body);

    try {
        const username = req.body.username ? req.body.username.trim() : '';
        const password = req.body.password ? req.body.password.trim() : '';

        console.log(`Attempting to log in with username: "${username}"`);

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username and password are required.'
            });
        }

        // Find user
        const user = await Login.findOne({ username });

        console.log('User found:', user);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password.'
            });
        }

        // Check password
        if (user.password === password) {
            console.log('Login successful for user:', username);

            // Return only required fields
            return res.json({
                success: true,
                message: 'Login successful!',
                data: {
                    loginid: user.loginid,
                    username: user.username
                }
            });
        } else {
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password.'
            });
        }

    } catch (error) {
        console.error('An error occurred during login:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error.'
        });
    }
});

// API endpoint for signup
app.post('/api/signup', async (req, res) => {
    console.log('Received signup request.');
    console.log('Request body:', req.body);

    try {
        const username = req.body.username ? req.body.username.trim() : '';
        const password = req.body.password ? req.body.password.trim() : '';
        const confirmPassword = req.body.confirmpassword ? req.body.confirmpassword.trim() : '';

        // Step 1: Validate input
        if (!username || !password || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Username, password, and confirm password are required.'
            });
        }

        // Step 2: Check if passwords match
        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Passwords do not match.'
            });
        }

        // Step 3: Check if username already exists
        const existingUser = await Login.findOne({ username: new RegExp(`^${username}$`, 'i') });
        if (existingUser) {
            console.log(`Signup failed: Username "${username}" already exists.`);
            return res.status(409).json({
                success: false,
                message: 'Username already exists. Please choose another username.'
            });
        }

        // Step 4: Generate a new loginid (auto-increment)
        const lastUser = await Login.findOne().sort({ loginid: -1 });
        const newLoginId = lastUser ? lastUser.loginid + 1 : 1;

        // Step 5: Create new user
        const newUser = new Login({
            loginid: newLoginId,
            username: username,
            password: password
        });

        await newUser.save();

        console.log('Signup successful for:', username);

        return res.status(201).json({
            success: true,
            message: 'Signup successful!',
            data: {
                loginid: newLoginId,
                username: username
            }
        });

    } catch (error) {
        console.error('An error occurred during signup:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error.'
        });
    }
});


const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
    console.log('Server running on port 3001');
});

