const ClientModel = require('../models/clientModel');

const getClients = async (req, res) => {
    try {
        const clients = await ClientModel.findAll();
        res.json(clients);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createClient = async (req, res) => {
    const { name, email, tin, vrn, status } = req.body;

    try {
        const client = await ClientModel.create({ name, email, tin, vrn, status });
        res.status(201).json(client);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const updateClient = async (req, res) => {
    const { id } = req.params;
    const { name, email, tin, vrn, status } = req.body;

    try {
        const client = await ClientModel.update(id, { name, email, tin, vrn, status });
        if (client) {
            res.json(client);
        } else {
            res.status(404).json({ message: 'Client not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const deleteClient = async (req, res) => {
    const { id } = req.params;

    try {
        const client = await ClientModel.delete(id);
        if (client) {
            res.json({ message: 'Client removed' });
        } else {
            res.status(404).json({ message: 'Client not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = {
    getClients,
    createClient,
    updateClient,
    deleteClient,
};
