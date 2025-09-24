const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Connect to MongoDB Atlas
const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
    console.error('Error: MONGO_URI environment variable is not set.');
    process.exit(1);
}

mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('Connected to MongoDB Atlas'))
    .catch(err => console.error('Error connecting to MongoDB Atlas:', err));

// Define Mongoose schema and model for loginmaster
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

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username and password are required.'
            });
        }

        const user = await Login.findOne({ username });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password.'
            });
        }

        if (user.password === password) {
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

        if (!username || !password || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Username, password, and confirm password are required.'
            });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Passwords do not match.'
            });
        }

        const existingUser = await Login.findOne({ username: new RegExp(`^${username}$`, 'i') });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'Username already exists. Please choose another username.'
            });
        }

        const lastUser = await Login.findOne().sort({ loginid: -1 });
        const newLoginId = lastUser ? lastUser.loginid + 1 : 1;

        const newUser = new Login({
            loginid: newLoginId,
            username: username,
            password: password
        });

        await newUser.save();

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

// Listen on Render-assigned port
const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
