const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
require('dotenv').config();
const User = mongoose.model('User');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.json({ message: 'Please enter all fields', status: 400 })

    }
    const user = await User.findOne({ username }).lean();
    if (!user) {
        return res.json({ message: 'User does not exist', status: 400 })
    }
    if (await bcrypt.compare(password, user.password)) {
        try {
            const token = jwt.sign({ _id: user._id, username: user.username }, process.env.JWT_SECRET);
            return res.json({ message: 'Login Successful', status: 200, token })
        } catch (error) {
            console.log(error);
            return res.json({ message: 'Error Logging In', status: 400 })
        }
    } else {
        return res.json({ message: 'Invalid Credentials', status: 400 })
    }
}

exportes.register = async (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
        return res.json({ message: 'Please enter all fields', status: 400 })
    }
    if (password.length < 6) {
        return res.json({ message: 'Password must be at least 6 characters', status: 400 })
    }
    try {
        const hasedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({ username, email, password: hasedPassword });
        const token = jwt.sign({ _id: user._id, username: user.username }, process.env.JWT_SECRET);
        return res.json({ message: 'Registration Successful', status: 200, token })
    } catch (error) {
        console.log(error);
        return res.json({ message: 'Error Registering', status: 400 })
    }

}

exports.changePassword = async (req, res) => {
    const { token, oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
        return res.json({ message: 'Please enter all fields', status: 400 })
    }
    if (newPassword.length < 6) {
        return res.json({ message: 'Password must be at least 6 characters', status: 400 })
    }
    try {
        const user = jwt.verify(token, process.env.JWT_SECRET);
        const _id = user._id;
        const hasedPassword = await bcrypt.hash(newPassword, 10);
        console.log('JWTDecoded', user);
        await User.findOneAndUpdate({ _id }, { password: hasedPassword });
        return res.json({ message: 'Password changed successfully', status: 200 })
    } catch (error) {
        console.log(error);
        return res.json({ message: 'Error Changing Password', status: 400 })
    }
}