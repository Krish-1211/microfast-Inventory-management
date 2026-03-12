const AuthService = require('../services/authService');

const registerUser = async (req, res) => {
    const { email, password, role } = req.body;

    try {
        const user = await AuthService.register({ email, password, role });
        res.status(201).json({
            _id: user.id,
            email: user.email,
            role: user.role,
            token: AuthService.generateToken(user.id),
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const authUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const result = await AuthService.login({ email, password });
        res.json(result);
    } catch (error) {
        res.status(401).json({ message: error.message });
    }
};

const ClientModel = require('../models/clientModel');

const getMe = async (req, res) => {
    let user = {
        _id: req.user.id,
        email: req.user.email,
        role: req.user.role,
    };

    if (user.role === 'client') {
        const client = await ClientModel.findByEmail(user.email);
        if (client) {
            user.client = client;
        }
    }

    res.status(200).json(user);
};

module.exports = {
    registerUser,
    authUser,
    getMe,
};
