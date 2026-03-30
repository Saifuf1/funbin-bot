const { getOrdersSheet } = require('./sheets');

/**
 * Append a new order row to the Orders Google Sheet tab (scoped to client).
 * @param {object} order
 * @param {string} order.sheetsId - The specific client spreadsheet ID
 */
async function createOrder({ customerName, phone, items, totalAmount, paymentLink, address, sheetsId }) {
    const sheet = await getOrdersSheet(sheetsId);

    const orderRef = `ORD-${phone}-${Math.floor(Date.now() / 1000)}`;
    const itemsString = Array.isArray(items)
        ? items.map((i) => `${i.name} x${i.qty || 1}`).join(', ')
        : String(items);

    await sheet.addRow({
        CustomerName: customerName,
        Phone: phone,
        Items: itemsString,
        TotalAmount: totalAmount,
        Status: 'Pending',
        PaymentLink: paymentLink,
        OrderRef: orderRef,
        Address: address || 'Not provided',
        CreatedAt: new Date().toISOString(),
    });

    console.log(`📦 [SaaS] Order created: ${orderRef} for client sheet: ${sheetsId?.slice(0, 8)}`);
    return orderRef;
}

/**
 * Update the status of an existing order by OrderRef (scoped to client)
 */
async function updateOrderStatus(orderRef, newStatus, sheetsId) {
    const sheet = await getOrdersSheet(sheetsId);
    const rows = await sheet.getRows();

    const row = rows.find((r) => r.get('OrderRef') === orderRef);
    if (!row) {
        console.warn(`⚠️  Order not found in sheet ${sheetsId}: ${orderRef}`);
        return false;
    }

    row.set('Status', newStatus);
    await row.save();
    console.log(`✅ [SaaS] Order ${orderRef} updated to: ${newStatus}`);
    return true;
}

/**
 * Look up orders by phone number (scoped to client)
 */
async function getOrdersByPhone(phone, sheetsId) {
    const sheet = await getOrdersSheet(sheetsId);
    const rows = await sheet.getRows();
    return rows
        .filter((r) => String(r.get('Phone')) === String(phone))
        .map((r) => ({
            ref: r.get('OrderRef'),
            items: r.get('Items'),
            total: r.get('TotalAmount'),
            status: r.get('Status'),
            createdAt: r.get('CreatedAt'),
        }));
}

/**
 * Get all orders from the Google Sheet (scoped to client)
 */
async function getOrders(sheetsId) {
    const sheet = await getOrdersSheet(sheetsId);
    const rows = await sheet.getRows();
    return rows.map((r) => ({
        ref: r.get('OrderRef'),
        customerName: r.get('CustomerName'),
        phone: r.get('Phone'),
        items: r.get('Items'),
        amount: r.get('TotalAmount'),
        status: r.get('Status'),
        address: r.get('Address'),
        createdAt: r.get('CreatedAt'),
    }));
}

module.exports = { createOrder, updateOrderStatus, getOrdersByPhone, getOrders };
