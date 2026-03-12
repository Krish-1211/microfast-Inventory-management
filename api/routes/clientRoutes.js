const express = require('express');
const router = express.Router();
const {
    getClients,
    createClient,
    updateClient,
    deleteClient,
} = require('../controllers/clientController');
const InvoiceModel = require('../models/invoiceModel');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/').get(protect, getClients).post(protect, admin, createClient);
router
    .route('/:id')
    .put(protect, admin, updateClient)
    .delete(protect, admin, deleteClient);

// Get all invoices for a specific client
router.get('/:id/invoices', protect, async (req, res) => {
    try {
        const invoices = await InvoiceModel.findByClientId(req.params.id);
        res.json(invoices);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
