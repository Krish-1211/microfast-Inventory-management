const express = require('express');
const router = express.Router();
const {
    getInvoices,
    createInvoice,
    createPublicOrder,
    getInvoiceById,
    deleteInvoice,
    updateInvoice,
} = require('../controllers/invoiceController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, admin, getInvoices)
    .post(protect, admin, createInvoice);

router.post('/public', createPublicOrder);

router.route('/:id')
    .get(protect, getInvoiceById)
    .put(protect, admin, updateInvoice)
    .delete(protect, admin, deleteInvoice);

module.exports = router;
