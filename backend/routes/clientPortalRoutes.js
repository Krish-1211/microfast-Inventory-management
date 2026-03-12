const express = require('express');
const router = express.Router();
const {
    getMyInvoices,
} = require('../controllers/invoiceController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getMyInvoices);

module.exports = router;
