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
    razorpayOrderId: String,
    paymentMethod: {
      type: String,
      enum: ['razorpay', 'cod'],
      default: 'razorpay'
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'shipped', 'delivered', 'cancelled'],
      default: 'pending'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Order', orderSchema);