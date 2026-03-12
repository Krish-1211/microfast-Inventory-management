const InvoiceService = require('../services/invoiceService');
const InvoiceModel = require('../models/invoiceModel');
const ClientModel = require('../models/clientModel');

// @desc    Get all invoices (Admin only)
// @route   GET /invoices
// @access  Private/Admin
const getInvoices = async (req, res) => {
    try {
        const invoices = await InvoiceService.getAllInvoices();
        res.json(invoices);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get my invoices (Client only)
// @route   GET /my-invoices
// @access  Private/Client
const getMyInvoices = async (req, res) => {
    try {
        const client = await ClientModel.findByEmail(req.user.email);

        if (!client) {
            return res.status(404).json({ message: 'Client profile not found for this user' });
        }

        const invoices = await InvoiceService.getClientInvoices(client.id);
        res.json(invoices);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create new invoice (Admin only)
// @route   POST /invoices
// @access  Private/Admin
const createInvoice = async (req, res) => {
    const { invoiceNumber, clientId, items, status, dueDate, taxes, lpo_no, exempt } = req.body;

    try {
        const invoice = await InvoiceService.createInvoice({ invoiceNumber, clientId, items, status, dueDate, taxes, lpo_no, exempt });
        res.status(201).json(invoice);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get invoice by ID
// @route   GET /invoices/:id
// @access  Private
const getInvoiceById = async (req, res) => {
    try {
        const invoice = await InvoiceService.getInvoiceById(req.params.id);

        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        if (req.user.role !== 'admin') {
            const client = await ClientModel.findByEmail(req.user.email);
            if (!client || invoice.client_id !== client.id) {
                return res.status(403).json({ message: 'Not authorized to view this invoice' });
            }
        }

        res.json(invoice);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete invoice (Admin only)
// @route   DELETE /invoices/:id
// @access  Private/Admin
const deleteInvoice = async (req, res) => {
    try {
        const invoice = await InvoiceService.getInvoiceById(req.params.id);
        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        await InvoiceModel.delete(req.params.id);
        res.json({ message: 'Invoice removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create public order
// @route   POST /invoices/public
// @access  Public
const createPublicOrder = async (req, res) => {
    const { customer, items } = req.body;

    try {
        const order = await InvoiceService.createOrder({ customer, items });
        res.status(201).json(order);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update invoice (Admin only)
// @route   PUT /invoices/:id
// @access  Private/Admin
const updateInvoice = async (req, res) => {
    const { invoiceNumber, clientId, items, status, dueDate, taxes, lpo_no, exempt } = req.body;

    try {
        const invoice = await InvoiceService.updateInvoice(req.params.id, {
            invoiceNumber, clientId, items, status, dueDate, taxes, lpo_no, exempt
        });
        res.json(invoice);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = {
    getInvoices,
    getMyInvoices,
    createInvoice,
    createPublicOrder,
    getInvoiceById,
    deleteInvoice,
    updateInvoice,
};
