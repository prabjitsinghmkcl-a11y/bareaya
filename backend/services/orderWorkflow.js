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

// Decrement stock for order items, atomically, one conditional update per line.
// Each update only matches when enough stock is present, so concurrent orders
// cannot oversell. Returns BOTH sets:
//   decremented - lines that were actually deducted, and therefore the only
//                 lines that may ever be restored
//   failed      - lines that were NOT deducted (missing product or short stock)
// No rollback happens here; the caller decides.
const decrementStock = async (items = []) => {
  const stockResults = await Promise.all(
    items.map((item) =>
      Product.updateOne(
        { _id: item.productId, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } }
      )
    )
  );
  const decremented = [];
  const failed = [];
  items.forEach((item, index) => {
    if (stockResults[index].matchedCount === 1) decremented.push(item);
    else failed.push(item);
  });
  return { decremented, failed };
};

// Revert stock decrements. MUST only ever be called with the `decremented`
// list returned by decrementStock — passing the full item list would add back
// quantities that were never deducted and inflate inventory.
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

// Send the order confirmation email. Throws on failure so the background retry
// below can tell a delivered mail from a dropped one — a silently swallowed
// error would look identical to a successful send.
const deliverConfirmationEmail = async (order) => {
  const addr = order.address || {};
  const customerEmail = addr.email;
  if (!customerEmail) return;
  await sendEmail({
    email: customerEmail,
    subject: 'Bareaya - Your order has been placed successfully',
    html: buildConfirmationHtml(order)
  });
};

// Guarded wrapper for callers that must never throw.
const sendConfirmationEmail = async (order) => {
  try {
    await deliverConfirmationEmail(order);
  } catch (error) {
    console.error('Order confirmation email failed:', error.message);
  }
};

const SIDE_EFFECT_ATTEMPTS = 3;
const SIDE_EFFECT_RETRY_MS = 2000;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Post-order side effects (customer-name sync + confirmation email), detached
 * from the request.
 *
 * By the time this is called the order is saved and its stock is already
 * reserved, so the response does not depend on any of it. The SMTP round trip
 * to the production host routinely costs seconds (TLS handshake, auth, DATA)
 * while on localhost it fails or completes instantly — awaiting it inline is
 * what made checkout feel slow on the live site. Detached, the checkout
 * responds as soon as the order exists and the mail still goes out, retried a
 * few times in the background because SMTP can drop transiently.
 */
const runPostOrderSideEffects = (order) => {
  setImmediate(async () => {
    try {
      await syncCustomerName(order);
    } catch (error) {
      console.error('Syncing customer name failed:', error.message);
    }

    for (let attempt = 1; attempt <= SIDE_EFFECT_ATTEMPTS; attempt += 1) {
      try {
        await deliverConfirmationEmail(order);
        return;
      } catch (error) {
        console.error(
          `Order confirmation email failed (attempt ${attempt}/${SIDE_EFFECT_ATTEMPTS}) for order ${order._id}:`,
          error.message
        );
        if (attempt < SIDE_EFFECT_ATTEMPTS) await wait(SIDE_EFFECT_RETRY_MS * attempt);
      }
    }
  });
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

  const { failed } = await decrementStock(claimed.items);
  if (failed.length > 0) {
    // Payment is already captured so the order must stand. Log the shortfall
    // for admin attention instead of pretending the order never happened.
    console.error(
      `[OrderWorkflow] Stock shortfall on order ${claimed._id}:`,
      failed.map((item) => String(item.productId)).join(', ')
    );
  } else {
    // Record that inventory is reserved, so a cancellation gives it back once.
    // Left false on a shortfall: nothing was deducted for those lines, so
    // restoring them later would manufacture stock.
    claimed.stockDeducted = true;
    await claimed.save();
  }

  runPostOrderSideEffects(claimed);

  return { order: claimed, found: true, alreadyFinalized: false };
};

module.exports = {
  buildConfirmationHtml,
  decrementStock,
  restoreStock,
  syncCustomerName,
  sendConfirmationEmail,
  runPostOrderSideEffects,
  finalizeRazorpayOrder
};