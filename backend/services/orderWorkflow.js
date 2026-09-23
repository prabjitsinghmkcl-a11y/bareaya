const Order = require('../model/Order');
const User = require('../model/User');
const Customer = require('../model/Customer');
const Product = require('../model/Product');
const sendEmail = require('../utils/sendEmail');
const { escapeHtml } = require('../utils/escapeHtml');

const buildConfirmationHtml = (order) => {
  const itemsHtml = (order.items || [])
    .map(
      (item) => `
        <tr>
          <td style="padding:8px;border-bottom:1px solid #eee;">${escapeHtml(item.name) || 'Product'}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">₹${Number((item.price || 0) * (item.quantity || 1)).toFixed(2)}</td>
        </tr>
      `
    )
    .join('');

  const addr = order.address || {};
  const shipTo = escapeHtml(
    [addr.street, addr.apartment, addr.city, addr.state, addr.postalCode, addr.country]
      .filter(Boolean)
      .join(', ')
  );
  const customerName = escapeHtml(
    [addr.firstName, addr.lastName].filter(Boolean).join(' ').trim() || 'Customer'
  );

  return `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;">
      <h2 style="color:#1d1d1d;">Your order is placed successfully!</h2>
      <p>Hello ${customerName},</p>
      <p>Thank you for shopping with Bareaya. Your order has been confirmed.</p>
      <p><strong>Order ID:</strong> ${order._id}</p>
      <table style="width:100%;border-collapse:collapse;margin:12px 0;">
        <tr>
          <th style="padding:8px;text-align:left;background:#f5f5f5;">Item</th>
          <th style="padding:8px;text-align:center;background:#f5f5f5;">Qty</th>
          <th style="padding:8px;text-align:right;background:#f5f5f5;">Amount</th>
        </tr>
        ${itemsHtml}
        <tr>
          <td colspan="2" style="padding:8px;font-weight:bold;">Total (incl. 18% GST)</td>
          <td style="padding:8px;text-align:right;font-weight:bold;">₹${Number(order.totalAmount).toFixed(2)}</td>
        </tr>
      </table>
      <p><strong>Payment:</strong> ${order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Paid online (Razorpay)'}</p>
      <p><strong>Deliver to:</strong> ${shipTo}</p>
      <p>We will notify you once your order is shipped. For any questions, reply to this email or contact us at ${process.env.SMTP_FROM || process.env.EMAIL_USER}.</p>
      <p>Thank you,<br/>Bareaya Team</p>
    </div>
  `;
};

// Decrement stock for order items. Returns the items that could not be
// fulfilled (insufficient stock). No rollback happens here.
const decrementStock = async (items = []) => {
  const stockResults = await Promise.all(
    items.map((item) =>
      Product.updateOne(
        { _id: item.productId, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } }
      )
    )
  );
  return items.filter((item, index) => stockResults[index].matchedCount !== 1);
};

// Revert stock decrements, e.g. when a COD order cannot be completed.
const restoreStock = async (items = []) => {
  await Promise.all(
    items.map((item) =>
      Product.updateOne({ _id: item.productId }, { $inc: { stock: item.quantity } })
    )
  );
};

// Sync the customer's real name from the order address so the profile
// doesn't keep showing the default "Customer" placeholder.
const syncCustomerName = async (order) => {
  try {
    const addr = order.address || {};
    const fullName = [addr.firstName, addr.lastName].filter(Boolean).join(' ').trim();
    if (!fullName || order.userId == null) return;

    const user = await User.findById(order.userId);
    if (!user || (user.name && user.name !== 'Customer')) return;

    await User.updateOne({ _id: user._id }, { $set: { name: fullName } });
    if (user.phone) {
      await Customer.updateOne({ phone: user.phone }, { $set: { name: fullName } });
    }
  } catch (error) {
    console.error('Syncing customer name failed:', error.message);
  }
};

// Send the order confirmation email (guarded so failures never break the request).
const sendConfirmationEmail = async (order) => {
  try {
    const addr = order.address || {};
    const customerEmail = addr.email;
    if (!customerEmail) return;
    await sendEmail({
      email: customerEmail,
      subject: 'Bareaya - Your order has been placed successfully',
      html: buildConfirmationHtml(order)
    });
  } catch (error) {
    console.error('Order confirmation email failed:', error.message);
  }
};

/**
 * Finalize a Razorpay order that was created as a pending intent.
 *
 * Idempotent: only the caller that successfully claims the pending order
 * (status pending -> paid) decrements stock and sends the email. If the
 * order is already paid/cancelled, nothing happens a second time.
 */
const finalizeRazorpayOrder = async ({ razorpayOrderId, paymentId }) => {
  const order = await Order.findOne({ razorpayOrderId });
  if (!order) return { order: null, found: false, alreadyFinalized: false };

  const claimed = await Order.findOneAndUpdate(
    { _id: order._id, status: 'pending', paymentMethod: 'razorpay' },
    { $set: { status: 'paid', paymentId: paymentId || order.paymentId || undefined } },
    { new: true }
  );

  if (!claimed) {
    // Already paid (webhook + frontend both fired) or cancelled — safe to skip.
    return { order, found: true, alreadyFinalized: true };
  }

  const failed = await decrementStock(claimed.items);
  if (failed.length > 0) {
    // Payment is already captured so the order must stand. Log the shortfall
    // for admin attention instead of pretending the order never happened.
    console.error(
      `[OrderWorkflow] Stock shortfall on order ${claimed._id}:`,
      failed.map((item) => String(item.productId)).join(', ')
    );
  }

  await syncCustomerName(claimed);
  await sendConfirmationEmail(claimed);

  return { order: claimed, found: true, alreadyFinalized: false };
};

module.exports = {
  buildConfirmationHtml,
  decrementStock,
  restoreStock,
  syncCustomerName,
  sendConfirmationEmail,
  finalizeRazorpayOrder
};