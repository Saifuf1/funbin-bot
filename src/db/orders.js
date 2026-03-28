const { getOrdersSheet } = require('./sheets');

/**
 * Append a new order row to the Orders Google Sheet tab.
 * Columns: CustomerName, Phone, Items, TotalAmount, Status, PaymentLink, Address
 *
 * @param {object} order
 * @param {string} order.customerName
 * @param {string} order.phone
 * @param {string|Array} order.items - item list (array or comma-separated string)
 * @param {number} order.totalAmount
 * @param {string} order.paymentLink - UPI deep link
 * @param {string} order.address - Customer Delivery Address
 * @returns {Promise<string>} - Generated order reference (e.g. ORD-9876543210-1711401600)
 */
async function createOrder({ customerName, phone, items, totalAmount, paymentLink, address }) {
    const sheet = await getOrdersSheet();

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

    console.log(`📦 Order created: ${orderRef}`);
    return orderRef;
}

/**
 * Update the status of an existing order by OrderRef
 * @param {string} orderRef
 * @param {string} newStatus - e.g. 'Paid', 'Shipped', 'Cancelled'
 */
async function updateOrderStatus(orderRef, newStatus) {
    const sheet = await getOrdersSheet();
    const rows = await sheet.getRows();

    const row = rows.find((r) => r.get('OrderRef') === orderRef);
    if (!row) {
        console.warn(`⚠️  Order not found: ${orderRef}`);
        return false;
    }

    row.set('Status', newStatus);
    await row.save();
    console.log(`✅ Order ${orderRef} status updated to: ${newStatus}`);
    return true;
}

/**
 * Look up orders by phone number
 * @param {string} phone
 * @returns {Promise<Array>}
 */
async function getOrdersByPhone(phone) {
    const sheet = await getOrdersSheet();
    const rows = await sheet.getRows();
    return rows
        .filter((r) => r.get('Phone') === phone)
        .map((r) => ({
            ref: r.get('OrderRef'),
            items: r.get('Items'),
            total: r.get('TotalAmount'),
            status: r.get('Status'),
            createdAt: r.get('CreatedAt'),
        }));
}

/**
 * Get all orders from the Google Sheet
 * @returns {Promise<Array>}
 */
async function getOrders() {
    const sheet = await getOrdersSheet();
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
