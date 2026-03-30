const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../../clients.json');

// Initialize with the current user's credentials as the first client
const INITIAL_CLIENTS = [
    {
        id: 'owner',
        name: 'Default Store',
        whatsappPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
        whatsappToken: process.env.WHATSAPP_TOKEN,
        googleSheetsId: process.env.GOOGLE_SHEETS_ID,
        instagramPageId: process.env.INSTAGRAM_PAGE_ID,
        facebookPageId: process.env.FACEBOOK_PAGE_ID, // Add Facebook ID if available
        aiConfig: {
            enabled: true,
            mode: 'Professional',
            systemPrompt: 'You are a helpful sales assistant.'
        }
    }
];

function loadClients() {
    if (!fs.existsSync(DB_PATH)) {
        fs.writeFileSync(DB_PATH, JSON.stringify(INITIAL_CLIENTS, null, 2));
    }
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

function saveClients(clients) {
    fs.writeFileSync(DB_PATH, JSON.stringify(clients, null, 2));
}

/**
 * Find a client by their Meta ID (WhatsApp Phone ID, Instagram Page ID, or FB Page ID)
 */
function findClientByMetaId(metaId) {
    const clients = loadClients();
    return clients.find(c =>
        c.whatsappPhoneNumberId === metaId ||
        c.instagramPageId === metaId ||
        c.facebookPageId === metaId
    );
}

/**
 * Register a new client
 */
function registerClient(clientData) {
    const clients = loadClients();
    const newClient = {
        id: `client_${Date.now()}`,
        ...clientData,
        aiConfig: clientData.aiConfig || { enabled: true, mode: 'Professional' }
    };
    clients.push(newClient);
    saveClients(clients);
    return newClient;
}

module.exports = { findClientByMetaId, registerClient, loadClients };
