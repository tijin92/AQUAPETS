const mongoose = require('mongoose'); 
var adminSchema = new mongoose.Schema({
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
        default:1
    },
    registrationOTP:{
        type:String,
        default:''
    },
    token:{
        type:String,
        default:''
    },
    
});


module.exports = mongoose.model('Admin', adminSchema);