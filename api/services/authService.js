const UserModel = require('../models/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

class AuthService {
    static generateToken(id) {
        return jwt.sign({ id }, process.env.JWT_SECRET, {
            expiresIn: '30d',
        });
    }

    static async register({ email, password, role }) {
        const userExists = await UserModel.findByEmail(email);

        if (userExists) {
            throw new Error('User already exists');
        }

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        const user = await UserModel.create({
            email,
            password_hash,
            role,
        });

        if (user) {
            return {
                _id: user.id,
                email: user.email,
                role: user.role,
                token: this.generateToken(user.id),
            };
        } else {
            throw new Error('Invalid user data');
        }
    }

    static async login({ email, password }) {
        console.log(`Login attempt for: ${email}`);
        const user = await UserModel.findByEmail(email);

        if (!user) {
            console.log(`User not found: ${email}`);
            throw new Error('Invalid email or password');
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        console.log(`Password match for ${email}: ${isMatch}`);

        if (isMatch) {
            return {
                _id: user.id,
                email: user.email,
                role: user.role,
                token: this.generateToken(user.id),
            };
        } else {
            throw new Error('Invalid email or password');
        }
    }
}

module.exports = AuthService;
