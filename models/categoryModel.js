const mongoose = require('mongoose')
const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        require:true,
        unique:true,
    },
    offer : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'Offer'
    },
    is_blocked:{
        type: Number,
        default:0
    },

})

module.exports = mongoose.model('Category', categorySchema);