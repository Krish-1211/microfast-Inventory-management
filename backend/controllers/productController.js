const ProductModel = require('../models/productModel');

const getProducts = async (req, res) => {
    try {
        const products = await ProductModel.findAll();
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createProduct = async (req, res) => {
    const { name, price, stock, status } = req.body;

    try {
        const product = await ProductModel.create({ name, price, stock, status });
        res.status(201).json(product);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const updateProduct = async (req, res) => {
    const { id } = req.params;
    const { name, price, stock, status } = req.body;

    try {
        const product = await ProductModel.update(id, { name, price, stock, status });
        if (product) {
            res.json(product);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const deleteProduct = async (req, res) => {
    const { id } = req.params;

    try {
        const product = await ProductModel.delete(id);
        if (product) {
            res.json({ message: 'Product removed' });
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const getRecommendations = async (req, res) => {
    const { id } = req.params;
    const { limit } = req.query;

    try {
        const recommendations = await ProductModel.getRecommendations(id, parseInt(limit) || 4);
        res.json(recommendations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    getRecommendations,
};
