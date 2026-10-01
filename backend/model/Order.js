const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true
        },
        name: String,
        quantity: {
          type: Number,
          default: 1
        },
        price: Number
      }
    ],
    totalAmount: {
      type: Number,
      required: true
    },
    address: {
      firstName: String,
      lastName: String,
      phone: String,
      email: String,
      street: String,
      apartment: String,
      city: String,
      state: String,
      postalCode: String,
      country: String
    },
    orderNotes: String,
    paymentId: String,
    razorpayOrderId: {
      type: String,
      index: true
    },
    paymentMethod: {
      type: String,
      enum: ['razorpay', 'cod'],
      default: 'razorpay'
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'shipped', 'delivered', 'cancelled'],
      default: 'pending'
    },
    // True only when inventory was actually deducted for this order. Cancelling
    // restores stock exclusively when this flag is set, and clears it in the
    // same atomic update, so a double-cancel can never return stock twice.
    stockDeducted: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// "My orders" and the admin order list both filter/sort on these.
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);