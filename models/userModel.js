const mongoose = require('mongoose'); 
var userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
        index:true,
    },
    email:{
        type:String,
        required:true,
        unique:true,
    },
    mobile:{
        type:String,
        required:true,
        unique:true,
    },
    password:{
        type:String,
        required:true,
    },
    is_verified:{
        type:Number,
        default:0
    },
    registrationOTP:{
        type:String,
        default:''
    },
    token:{
        type:String,
        default:''
    },
    address: [{
        house_name: String,
        street: String,
        city: String,
        state: String,
        postalCode: String,
        country: String,
    }],
    is_blocked:{
        type:Number,
        default:0
    },
    slug:{
        type: String
    }
    
});


module.exports = mongoose.model('User', userSchema);