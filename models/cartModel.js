const mongoose = require('mongoose')
const cartSchema = new mongoose.Schema({
    
    product_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
      },
    name: {
        type: String,
        required: true
      },
    quantity: {
        type: Number,
        required: true,
        min: 1,
        
      },
    image: {
        type: Array,
        required: true
      },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    active: {
        type: Boolean,
        default: true
    },
    modifiedOn: {
        type: Date,
        default: Date.now
    }
},
{ timestamps: true })

module.exports = mongoose.model('Cart', cartSchema);