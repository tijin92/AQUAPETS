const mongoose = require('mongoose');
const offerSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    startingDate: {
        type: Date,
        required: true
    },
    expiryDate: {
        type: Date,
        required: true
    },
    percentage: {
        type: Number,
        default: 0
    },
    status: {
        type: Number,
        default: 1
    }
});

offerSchema.index({ expiryDate: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Offer', offerSchema);
