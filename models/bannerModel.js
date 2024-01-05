const mongoose = require( 'mongoose' )
const bannerSchema = new mongoose.Schema( {

    title : {
        type : String,
        require : true
    },

    description : {
        type : String,
        require : true
    },

    image : {
        type : String,
        require : true
    },
    bannerURL :{
        type: String,
        require : true
    },
    URL_buttonText :{
        type: String,
        require : true
    },
    status:{
        type: Number,
        default:1
    },
    textAlignment:{
        type: String,
        require : true
    }

})

module.exports = mongoose.model( 'banner', bannerSchema)