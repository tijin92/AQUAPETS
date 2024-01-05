const User = require('../models/userModel')
const Product = require('../models/productModel')
const Category = require('../models/categoryModel')
const bcrypt = require('bcrypt')
const nodemailer = require('nodemailer')
const config = require('../config/config')
const otpGenerator = require('otp-generator')
const randomstring = require('randomstring')
const WishList = require('../models/wishListModel')
const Banner = require('../models/bannerModel')

function extractValidationErrors(error) {
    if (error.errors) {
        const errors = [];

        // Iterate over the error object and collect error messages.
        for (const key in error.errors) {
            if (error.errors[key].message) {
                errors.push(error.errors[key].message);
            }
        }

        return errors;
    } else {
        // If the error object doesn't contain specific validation errors, return a generic error message.
        return ['An error occurred during validation.'];
    }
}

const securePassword = async(password)=>{
    try {
        const passwordHash = await bcrypt.hash(password, 10)
        return passwordHash
    } catch (error) {
        console.log(error.message);
    }
}

const sendVerifymail = async(name, email, otp)=>{
    try {
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: config.userEmail,
                pass: config.userPassword
            }
        })
        const mailOptions = {

            from: config.userEmail,
            to: email,
            subject: 'For account verification',
            html: `<p> Hi ${name}, this is your generated OTP: ${otp} </p> `
        }
        transporter.sendMail(mailOptions, function(error,info){

            if(error){
                console.log(error.message)
            }else{
                console.log('Email has been send:- ',info.response)
            }

        })
        
        
    } catch (error) {
        console.lgo(error.message)
        res.status(500).render('error',{message: error.message})
    }
}

const insertUser = async (req,res)=>{
    const allCategory = await Category.find({is_blocked:0})
    try {
        const { name, email, password, mobile } = req.body;
        
        const user1 = await User.findOne({ email: email });
        const user2 = await User.findOne({ mobile: mobile });
        console.log(user1)

        if (user1 && user1.email === email) {
            res.render('register', { message1: "Email is already registered.",allCategory });
        } else if (user2 && user2.mobile === mobile) {
            res.render('register', { message1: "Mobile number is already registered.", allCategory });
        } else {
            const { otp, expDate } = generateOtp();
            const spassword = await securePassword(password);
            const user = new User({
                name,
                email,
                password: spassword,
                mobile,
                is_admin: 0,
                registrationOTP: otp,
            })
            const userData = await user.save()
            if(userData){
                sendVerifymail(name, email, otp)
                res.redirect(`/verify?id=${userData._id}&expTime=${expDate}`); // Redirect to the OTP verification page
            }else{
                res.render('register',{message1: "Your registeration has been failed..", allCategory})
            }
    }
        
    } catch (error) {
        res.status(500).render('error',{message: error.message})
        console.log(error.message)
    }
}

//to generate otp 
const otpStore = {}; 

const generateOtp = () => {
    const registrationOTP = otpGenerator.generate(6, { digits: true, alphabets: false, upperCase: false });
    const expDate = Date.now() + 10 * 60 * 1000;
    otpStore[registrationOTP] = expDate;
    return { otp: registrationOTP, expDate };
}

const verifyAccount =async(req,res)=>{
    const allCategory = await Category.find({is_blocked:0})
    try {
        const id = req.query.id
        const expTime = req.query.expTime
        res.render('verify',{id, expTime, message2:"Otp send to your email id", allCategory})
        
    } catch (error) {
        res.status(500).render('error',{message: error.message})
        console.log(error.message)
    }
}

const verifyAccountload = async (req, res) => {
    const allCategory = await Category.find({is_blocked:0})
    const allProduct = await Product.find({unlist:0})
    try {
        const otp = req.body.otp;
        const id = req.body.id;
        const expTime = req.body.expTime;
        const user = await User.findOne({ _id: id });

        if (user && user.registrationOTP === otp) {
            if(expTime - Date.now() >= 0){
                await User.updateOne({ _id: id }, { $set: { is_verified: 1 } });
                
                res.render('login', { message2: "Your email is verified successful!, You can login to your account", allCategory, allProduct});
            }else{
                res.render('verify', { message1: "Invalid OTP. Please try again.", id });
            }
            
        } else {
            res.render('verify', { message1: "Invalid OTP. Please try again.", id });
        }
    } catch (error) {
        console.log(error.message);
        res.render('verify', { message1: "An error occurred during verification", id });
    }
}

const userLogin = async(req,res)=>{

    try {
        const allCategory = await Category.find({is_blocked:0})
        const allProduct = await Product.find({unlist:0})
        res.render('login', {allCategory, allProduct})
    } catch (error) {
        console.log(error.message);
        res.status(500).render('error',{message: error.message})
    }

}

const verifyLogin = async (req,res)=>{
    
    try {
        const email = req.body.email
        const password = req.body.password

        const userData = await User.findOne({email: email})

        const allCategory = await Category.find({is_blocked:0})
        const allProduct = await Product.find({unlist:0})

        if(userData) {
            
            const passwordMatch = await bcrypt.compare(password,userData.password)
            if (passwordMatch) {

                if(userData.is_blocked === 0){
                    if (userData.is_verified === 0) {
                        const { otp, expDate } = generateOtp();
                        await User.findOneAndUpdate({email: userData.email},{$set:{registrationOTP: otp}})
                        sendVerifymail(userData.name, userData.email, otp)
                        res.render('verify', {id: userData._id, expTime: expDate, message2:"Verify your email", allCategory});      
                        
                    } else {
                        req.session.user_id = userData._id;
                        res.redirect('/user/home');
                    }
                }else{
                    
                    res.render('login',{message1 : "You are blocked by admin", allCategory, allProduct})
                }   
                
            } else {
                res.render('login',{message1 : "Email and password is incorrect", allCategory, allProduct})
            }

        }else{

            res.render('login',{message1 : "User not found", allCategory, allProduct})
        }

    } catch (error) {
        console.log(error.message)
        res.status(500).render('error',{message: error.message})
    }

}

const loginInsertOtp = async(req,res)=>{

    try {
        const allCategory = await Category.find({is_blocked:0})
        const allProduct = await Product.find({unlist:0})
        res.render('loginInsertOtp',{id, expTime: expDate, allCategory, allProduct})    
    } catch (error) {
        console.log(error.message)
        res.status(500).render('error',{message: error.message})
    }

}

//login otp authentication
const verifyLoginOtp = async(req,res)=>{
    const otp = req.body.otp;
    const id = req.body.id;
    const expTime = req.body.expTime;
    try {
        const user = await User.findOne({ _id: id });

        const allCategory = await Category.find({is_blocked:0})
        const allProduct = await Product.find({unlist:0})

        if (user && user.registrationOTP === otp) {  

            if(expTime - Date.now() >= 0){
                req.session.user_id = user._id;
                res.redirect('/user/home');
            }else{
                res.render('loginInsertOtp', { message1: "Invalid OTP. Please try again.", id, expTime, allCategory, allProduct});
            }
            
        } else {
            
            res.render('loginInsertOtp', { message1: "Invalid OTP. Please try again.", id, expTime, allCategory, allProduct});
        }
    } catch (error) {
        console.log(error.message);
        res.render('loginInsertOtp', { message1: "An error occurred during otp authentication", id, expTime, allCategory, allProduct});
    }    

}

//login reset otp
const loginResendOTP = async (req, res) => {

    const allCategory = await Category.find({is_blocked:0})
    const allProduct = await Product.find({unlist:0})
   
    try {
        const id = req.query.id
        const { otp, expDate } = generateOtp();
        const userData = await User.findOne({_id: id });
        await User.updateOne({_id: id},{$set:{registrationOTP: otp}})
        sendVerifymail(userData.name, userData.email, otp);

        res.render('loginInsertOtp', { message2: "New OTP has been sent to your email.", id, expTime: expDate, allCategory, allProduct});
    } catch (error) {
        
        const user_id = req.session.user_id;
        res.render('loginInsertOtp', { message1: "Error while resending OTP." , id, expTime: expDate, allCategory, allProduct});
    }
};

//register reset otp
const resendOtp = async(req,res)=>{

    try {
        const id = req.query.id
        const user = await User.findOne({ _id: id });
        const { otp, expDate } = generateOtp();
        await User.findByIdAndUpdate({_id:id},{$set:{registrationOTP: otp }})
        sendVerifymail(user.name, user.email, otp)
        res.redirect(`/user/verify?id=${user._id}&expTime=${expDate}`); // Redirect to the OTP verification page
        
    } catch (error) {
        console.log(error.message);
        res.status(500).render('error',{message: error.message})
    }

}

const landingPage = async (req, res) => {
    try {
        var search = '';
        if (req.query.search) {
            search = req.query.search;
        }

        var category = '';
        if (req.query.category) {
            category = req.query.category;
        }

        var sort = 'lowToHigh';
        if (req.query.sort && (req.query.sort === 'highToLow' || req.query.sort === 'lowToHigh')) {
            sort = req.query.sort;
        }

        var page = 1;
        if (req.query.page) {
            page = req.query.page;
        }

        const limit = 8;

        const allCategory = await Category.find({ is_blocked: 0 });

             
        let query;
        if (category) {
            const categoryObject = await Category.findOne({ name: category });
            query = {
                unlist: 0,
                name: { $regex: '.*' + search + '.*', $options: 'i' },
                category: categoryObject ? categoryObject._id : null
            };
        } else {
            query = {
                unlist: 0,
                name: { $regex: '.*' + search + '.*', $options: 'i' },
            };
        }

        const sortOptions = {};
        if (sort === 'lowToHigh') {
        sortOptions.price = 1;
        } else {
        sortOptions.price = -1;
        }

        const allProduct = await Product.find(query)
            .populate('offer')
            .populate({
                path: 'category',
                populate: { path: 'offer' }
            })
            .sort(sortOptions)
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const count = await Product.find(query).countDocuments();

        res.render('index', {
            allCategory,
            allProduct,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page),
            search,
            category,
            sort,
            baseURL: 'http://localhost:3000/',
        });
    } catch (error) {
        res.status(500).render('error', { message: 'landing page not found' });
        console.log(error.message);
    }
};


const loadRegister = async (req,res)=>{
    try {
        const allCategory = await Category.find({is_blocked:0})
        res.render('register',{allCategory })
    } catch (error) {
        res.status(500).render('error',{message:'register page not found'})
        console.log(error.message)
    }
}

//home
const loadHome =async(req,res)=>{

    try {
        var search = ''
        if(req.query.search){
            search = req.query.search
        }

        var category = '';
        if (req.query.category) {
            category = req.query.category;
        }

        var sort = 'lowToHigh';
        if (req.query.sort && (req.query.sort === 'highToLow' || req.query.sort === 'lowToHigh')) {
        sort = req.query.sort;
        }

        var page = 1
        if(req.query.page){
            page = req.query.page
        }

        const limit = 8

        const allCategory = await Category.find({is_blocked:0})
        const banners = await Banner.find({status: 1})

        let query;
        if (category) {
            const categoryObject = await Category.findOne({ name: category });
            query = {
                unlist: 0,
                name: { $regex: '.*' + search + '.*', $options: 'i' },
                category: categoryObject ? categoryObject._id : null,
                
            };
        } else {
            query = {
                unlist: 0,
                name: { $regex: '.*' + search + '.*', $options: 'i' },
                
            };
        }

       

        const sortOptions = {};
        if (sort === 'lowToHigh') {
        sortOptions.price = 1;
        } else {
        sortOptions.price = -1;
        }
      
        const allProduct = await Product.find(query)
            .populate('offer')
            .populate({
                path: 'category',
                populate: { path: 'offer' }
            })
            .sort(sortOptions)
            .limit(limit * 1)
            .skip((page - 1) * limit);

        // Find the user's wishlist items
        const userWishlistItems = await WishList.find({ user_id: req.session.user_id })
            .populate({
                path: 'product_id',
                populate: {
                    path: 'offer',
                },
                select: ['price', 'offerPrice', 'name', 'stock', 'offer'],
            });

        // Extract product IDs from the user's wishlist items
        const userWishlist = userWishlistItems.map(item => item.product_id._id.toString());

        const count = await Product.find(query)
        .countDocuments()  

        res.render('home', {
            allCategory, 
            banners,
            allProduct,
            totalPages: Math.ceil(count/limit),
            currentPage: parseInt(page),
            search,
            category,
            sort,
            userWishlist,
            baseURL:'http://localhost:3000/'})

    } catch (error) {
        console.log(error.message);
        res.status(500).render('error',{message: error.message})
    }

}

const logout = async(req,res)=>{

    try {
        delete req.session.user_id;
        res.redirect('/user')
    } catch (error) {
        console.log(error.message);
        res.status(500).render('error',{message: error.message})
    }

}
//forget password
const forget = async(req,res)=>{

    try {
        const allCategory = await Category.find({is_blocked:0})
        const allProduct = await Product.find({unlist:0}) 
        res.render('forget',{allCategory, allProduct})
    } catch (error) {
        console.log(error.message);
        res.status(500).render('error',{message: error.message})
    }

}

//forget password
const forgetLoad = async (req,res)=>{
    
    try {
        const email = req.body.email
        const userData = await User.findOne({email: email})  
        
        const allCategory = await Category.find({is_blocked:0})
        const allProduct = await Product.find({unlist:0})

        if(userData){

            if(userData.is_verified === 0){

                const { otp, expDate } = generateOtp();
                await User.findOneAndUpdate({email: userData.email},{$set:{registrationOTP: otp}})
                sendVerifymail(userData.name, userData.email, otp)
                res.render('verify', {id: userData._id, expTime: expDate, message2:"Verify your email", allCategory, allProduct});

            }else{
                const randomString = randomstring.generate()
                const updatedData = await User.updateOne({email: email}, {$set: {token: randomString }})
                sendResetPasswordMail(userData.name, userData.email, randomString ) 
                res.render('forget',{message2:"Please check your mail to reset your password", allCategory, allProduct})
            }

        }else{
            
            res.render('forget',{message1:"Invalid Email", allCategory, allProduct})
        }
        
    } catch (error) {
        console.log(error.message)
        res.status(500).render('error',{message: error.message})
    }

}

//for reset password send mail
const sendResetPasswordMail = async (name, email, token)=>{

    try {

        const transporter = nodemailer.createTransport({

            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: config.userEmail,
                pass: config.userPassword
            }
        })
        const mailOptions = {

            from: config.userEmail,
            to: email,
            subject: 'For Reset Password',
            html: `<p> Hi ${name}, please click here to  <a href="http://localhost:3000/user/forgetPassword?token=${token}">Reset</a> your password"</p> `
            
        }
        transporter.sendMail(mailOptions, function(error,info){

            if(error){
                console.log(error.message)
            }else{
                console.log('Email has been send:- ',info.response)
            }

        })
        
    } catch (error) {
        console.log(error.message)
        res.status(500).render('error',{message: error.message})
    }

}

//get route function to create new password
const forgetPasswordLoad = async(req,res)=>{
   
    try {
        const token = req.query.token
        const tokenData = await User.findOne({token: token})

        const allCategory = await Category.find({is_blocked:0})
        const allProduct = await Product.find({unlist:0})

        if (tokenData) {
            res.render('forget-password',{ id: tokenData._id, allCategory, allProduct})   
        }else{
            res.render('error',{message:"Token is invalid", allCategory, allProduct})
        }
        
    } catch (error) {
        console.log(error.message)
        res.status(500).render('error',{message: error.message})
    }

}

//post route function for crete new password
const resetPassword = async (req,res)=>{

    const allCategory = await Category.find({is_blocked:0})
    const allProduct = await Product.find({unlist:0})
    try {

        const password = req.body.password
        const user_id = req.body.id
        const spassword = await securePassword(password)
        const updatedData = await User.findByIdAndUpdate({_id: user_id},{$set:{password: spassword, token:''}})

        res.render('login',{message2:"Your password changed successfully. Login to your accocunt", allCategory, allProduct})
        
    } catch (error) {
        console.log(error.message)
        res.status(500).render('error',{message: error.message})
    }

}

const myAccount = async(req,res)=>{
   
    try {

        const user_id = req.session.user_id;
        const allCategory = await Category.find({is_blocked:0})
        const allProduct = await Product.find({unlist:0})
        const user = await User.findOne({ _id: user_id });
        res.render('myaccount',{user, allCategory, allProduct})
        
    } catch (error) {
        console.log(error.message)
        res.status(500).render('error',{message: error.message})
    }

}

const editEmail = async(req,res)=>{
    
    const allCategory = await Category.find({is_blocked:0})
    const allProduct = await Product.find({unlist:0})
    try {
        const email = req.body.email
        const id = req.body.id

        console.log("Email:", email);
        console.log("User ID:", id);
  
        const user1 = await User.findOne({ email: email });

        if (user1 && user1.email === email) {
            const user = await User.findOne({ _id: id });
            res.render('myaccount', { message1: "No changes is made", user, allCategory, allProduct });
        } else {
            await User.findByIdAndUpdate({_id: id},{$set:{email: email}})
            const user = await User.findOne({ _id: id });
            res.render('myaccount',{user, allCategory, allProduct})   
        }
    
    } catch (error) {
        console.log(error.message) 
        res.status(500).render('error',{message: error.message})
    }

}

const editMobile = async(req,res)=>{
    const allCategory = await Category.find({is_blocked:0})
    const allProduct = await Product.find({unlist:0})
    try {
        const mobile = req.body.mobile
        const id = req.body.id
        const user1 = await User.findOne({ mobile: mobile });

        if (user1 && user1.mobile === mobile) {
            const user = await User.findOne({ _id: id });
            res.render('myaccount', { message1: "This update cannot be done", user, allCategory, allProduct });
        } else {
            await User.findByIdAndUpdate({_id: id},{$set:{mobile: mobile}})
            const user = await User.findOne({ _id: id });
            res.render('myaccount',{user, allCategory, allProduct})
        }
        
    } catch (error) {
        console.log(error.message) 
        res.status(500).render('error',{message: error.message})
    }

}

const addAddress = async (req, res) => {
    try {
        const allCategory = await Category.find({ is_blocked: 0 });
        const allProduct = await Product.find({ unlist: 0 });

        const user_id = req.session.user_id;
        const newAddress = {
            house_name: req.body.house_name,
            street: req.body.street,
            city: req.body.city,
            state: req.body.state,
            postalCode: req.body.postalCode,
            country: req.body.country,
        };

        console.log(user_id);

        const updatedUser = await User.findByIdAndUpdate(
            user_id,
            { $push: { address: newAddress } },
            { new: true }
        );

        const user = await User.findById(user_id);
        res.redirect('/user/myAccount')
    } catch (error) {
        res.status(500).render('error', { message: error.message });
        console.log(error.message);
    }
};

const deleteAddress = async(req,res)=>{

    try {
        const allCategory = await Category.find({ is_blocked: 0 });
        const allProduct = await Product.find({ unlist: 0 });

        const user_id = req.query.user_id
        const address = req.query.address

        const updateUser = await User.updateOne({ _id: user_id } , 
            {$pull: { address: { _id: address } } },
            { new: true });

        const user = await User.findById(user_id);

        if(updateUser){
            res.render('myaccount',{user, allCategory, allProduct, message2: "User address deleted succesfully"})
        }else{      
            res.render('myaccount',{user, allCategory, allProduct, message1: "This update cannot be done"})
        }
        
    } catch (error) {
        res.status(500).render('error', { message: error.message });
        console.log(error.message);
    }

}

const editAddress = async(req,res)=>{

    try {
        const allCategory = await Category.find({ is_blocked: 0 });
        const allProduct = await Product.find({ unlist: 0 });

        const user_id = req.query.user_id
        const address_id = req.query.address

        const address = await User.findOne({_id: user_id, 'address': { $elemMatch: { _id: address_id } }},{ 'address.$': 1, _id:0 })
        console.log(address)
        if (address) {
            res.render('editAddress', { user_id, address, allCategory, allProduct });
        } else {
            res.render('editAddress', { user_id, address: null, allCategory, allProduct, message1: 'Address not found' });
        }
        
    } catch (error) {
        res.status(500).render('error', { message: error.message });
        console.log(error.message);
    }

}

const updateAddress = async(req,res)=>{

    try {
        const allCategory = await Category.find({ is_blocked: 0 });
        const allProduct = await Product.find({ unlist: 0 });

        const user_id = req.body.user_id;
        const address_id = req.body.address_id;

        const updatedData = await User.findOneAndUpdate(
            { _id: user_id, 'address._id': address_id },
            {
                $set: {
                    'address.$.house_name': req.body.house_name,
                    'address.$.street': req.body.street,
                    'address.$.city': req.body.city,
                    'address.$.state': req.body.state,
                    'address.$.postalCode': req.body.postalCode,
                    'address.$.country': req.body.country,
                },
            },
            { new: true }
        );

        if (updatedData) {
            const user = await User.findById(user_id);
            res.render('myAccount',{user, allCategory, allProduct, message2: "User address updated succesfully"});
        } else {
            const address = await User.findOne(
                { _id: user_id, 'address': { $elemMatch: { _id: address_id } } },
                { 'address.$': 1, _id: 0 }
            );
            res.render('editAddress', { user_id, address, allCategory, allProduct, message1: 'Address not found or no changes made' });
        }
    } catch (error) {
        res.status(500).render('error', { message: error.message });
        console.error(error.message);
    }

}

const changePassword =async(req,res)=>{

    try {
        const email = req.body.email
        const currentPassword = req.body.currentPassword
        const newPassword = req.body.newPassword
        const retypeNewPassword = req.body.retypeNewPassword

        const allCategory = await Category.find({is_blocked:0})
        const allProduct = await Product.find({unlist:0})

        const userData = await User.findOne({email: email})

        if(userData) {
            
            const passwordMatch = await bcrypt.compare(currentPassword,userData.password)
            if (passwordMatch) {
                if(newPassword === retypeNewPassword){

                    const spassword = await securePassword(newPassword) 
                    const updatedData = await User.findOneAndUpdate({email: email},{$set:{password: spassword}})
                    res.render('myaccount',{message2 : "Password changed Succesfully..", allCategory, allProduct, user: userData })
                    
                }
            }else{
                res.render('myaccount',{message1 : "Current password is wrong", allCategory, allProduct, user: userData })
            }
        }else{
            res.render('myaccount',{message1 : "User not found", allCategory, allProduct, user: userData})
        }

        
    } catch (error) {
        res.status(500).render('error', { message: error.message });
        console.error(error.message);
    }

}

module.exports = {  
    landingPage,
    loadRegister,
    insertUser,
    verifyAccount,
    verifyAccountload,
    userLogin,
    verifyLogin,
    resendOtp,
    loginInsertOtp,
    verifyLoginOtp,
    loginResendOTP,
    loadHome,
    logout,
    forget,
    forgetLoad,
    sendResetPasswordMail,
    forgetPasswordLoad,
    resetPassword,
    myAccount,
    editEmail,
    editMobile,
    addAddress,
    deleteAddress,
    editAddress,
    updateAddress,
    changePassword
}