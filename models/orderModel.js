const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    orderID: {
        type: String,
        required: true
      },
    orderDate: {
        type: Date,
        default: Date.now,
    },
   
    totalAmount: {
        type: Number,
        required: true,
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    paymentMethod: {
        type: String,
        enum: ['razorpay', 'Cash On Delivery', 'wallet'],
        required: true,
    },
    status: {
        type: String,
        enum: ['Pending', 'order confirmed', 'Shipped', 'Delivered', 'Cancelled'],
        default: 'Pending',
    },
    orderItems: [
        {
            product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
            name: { type: String },
            quantity: { type: Number },
            pricePerItem: { type: Number },
            // Add more details as needed, e.g., subtotal, discounts, etc.
        },
    ],
    shippingAddress: {
        name: { type: String },
        email: { type: String},
        mobile: { type: String },
        house_name: { type: String },
        street: { type: String },
        city: { type: String },
        state: { type: String },
        postalCode: { type: String },
        country: { type: String },
    },
    // Razorpay-specific fields
    razorpayOrderID: { type: String },
    razorpayPaymentID: { type: String },
    razorpaySignature: { type: String },
    paymentStatus: { type: String },
    
    discountAmount: {
        type: Number,
        default: 0,
    },
    discountPercentage: {
        type: Number,
        default: 0,
    },
});


orderSchema.index({ user_id: 1, status: 1 });

module.exports = mongoose.model('Order', orderSchema);
