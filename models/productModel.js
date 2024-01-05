const mongoose = require('mongoose')
const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique:true,
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true,
    },
    price: {
        type: Number,
        required: true,
        validate: {
            validator: function (value) {
                return value > 0;
            },
            message: 'Price must be greater than zero',
        },
    },
    offer : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'Offer'
    },
    offerPrice: {
        type: Number,
        validate: {
            validator: function (value) {
                if ((this.offer || this.category.offer)  && this.offerPrice > 0) {
                    return value > 0;
                }
                return true;
            },
            message: 'OfferPrice must be greater than zero when Price is greater than zero',
        }
        
    },
    stock: {
        type: Number,
        required: true,
        min: 0 
    },
    description: {
        type: String,
        required: true
    },
    image: [{
        type: String,
        
    }],
    isFeatured: {
        type: Boolean,
        default: false
    },
    rating: {
        type: Number,
        default: 0
    },
    numReview: {
        type: Number,
        default: 0
    },
    dateCreated:{
        type: Date,
        default: Date.now
    },
    unlist:{
        type:Number,
        default: 0
    },
    
})

module.exports = mongoose.model('Product', productSchema);