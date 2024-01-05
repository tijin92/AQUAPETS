const User = require('../models/userModel')
const Product = require('../models/productModel')
const Category = require('../models/categoryModel')
const Cart = require('../models/cartModel')
const Order = require('../models/orderModel')
const Offer = require('../models/offerModel')
const Coupon = require('../models/couponModel')

const addCoupon = async (req,res)=> {

    try {
        const allCategory = await Category.find({})
        res.render('addCoupon', { allCategory })
    } catch (error) {
        console.log(error.message)
    }

}

const submitAddCoupon = async (req,res)=> {

    try {
        const startDate = req.body.startDate
        const expireDate = req.body.expireDate
        const discountPercentage = req.body.discountPercentage
        const minimumSpend = req.body.minimumSpend
        const numberOfUsesType = req.body.numberOfUsesType
        const code = req.body.code
        const CouponExist = await Coupon.findOne({ code : code })
        let users;
        if (numberOfUsesType === 'unlimited') {
            users = 100000
        }else if (numberOfUsesType === 'limited') {
            users = req.body.userLimit
        }
        if( CouponExist ) {
            res.render('addCoupon',{message1:'Coupon already existing'})
        } else {
        const coupon = new Coupon({
            code : code,
            discountPercentage : discountPercentage,
            NumberOfUses : users,
            countUses : 0,
            startDate : startDate, 
            expireDate : expireDate,
            minimumSpend : minimumSpend,
            status: true
        }) 
         await coupon.save()
         res.render('addCoupon',{message2:'New Coupon Saved'})
        }
    } catch (error) {
        console.log(error.message)
        res.status(500).render('error',{message: error.message})
    }

}

const viewCoupon = async (req,res)=>{

    try {
        const allCategory = await Category.find({})
        const allCoupons = await Coupon.find({})
        res.render('Coupon', { allCategory, allCoupons})
    } catch (error) {
        console.log(error.message)
        res.status(500).render('error',{message: error.message})
    }

}

const updateCouponStatus = async (req, res) => {
    const allCoupons = await Coupon.find({})
    const allCategory = await Category.find({});
    try {
        const id = req.query.id;
        const updatedCoupon = await Coupon.findById(id);
        console.log(updatedCoupon)
        if (updatedCoupon) {
            // Toggle the status
            updatedCoupon.status = !updatedCoupon.status;
            await updatedCoupon.save();
            
            res.redirect('/admin/viewCoupon');

        } else {
            res.render('Coupon', { allCategory, allCoupons, now: new Date(), message1: "Status updation failed" });
        }

    } catch (error) {
        console.error(error.message);
        res.render('Coupon', { allCategory, allCoupons, now: new Date(), message1: "Status updation failed" });
    }
};

const editCoupon = async (req,res)=>{

    const allCoupon = await Coupon.find();
    const allCategory = await Category.find({});
    try {
        const id = req.query.id;
        const coupon = await Coupon.findById(id);
        if(coupon){
            res.render('editCoupon',{allCategory, allCoupon, coupon})
        }else{
            
            res.render('Coupon', { allCategory, allCoupon, now: new Date(), message1: "error loading edit Coupon page" });
        }
        
    } catch (error) {
        console.error(error.message);
        res.status(500).render('error',{message: error.message})
    }

}

const submitEditCoupon = async (req,res)=>{
    const allCoupon = await Coupon.find();
    const allCategory = await Category.find({});
    const id = req.body.id;
    try {
        const {  numberOfUsesType } = req.body
        let users;
        if (numberOfUsesType === 'unlimited') {
            users = 100000
        }else if (numberOfUsesType === 'limited') {
            users = req.body.userLimit
        }
        const updatedCoupon = await Coupon.findByIdAndUpdate({ _id: id }, { $set: { code: req.body.code, startDate: req.body.startDate, expireDate: req.body.expireDate, minimumSpend: req.body.minimumSpend, discountPercentage: req.body.discountPercentage, NumberOfUses: users, status: req.body.status} },{ new: true });
        console.log(updatedCoupon)
        if (updatedCoupon) {
            res.redirect('/admin/viewCoupon?successMessage=offer updated successfully');
        } else {
            res.render('editCoupon', { allCategory, allCoupon, coupon: updatedCoupon,  message1: 'Coupon updation failed.'});
        }
        
    } catch (error) {
        console.error(error.message);
        const coupon = await Coupon.findById(id);
        res.render('editCoupon', { allCategory, allCoupon, coupon, message1: 'An error occurred during Coupon updation.' });
    }

}

const findValidCouponsForOrder = async (order) => {
    try {
      const currentDate = new Date();
      const validCoupons = await Coupon.find({
        status: 1,  
        startDate: { $lte: currentDate },  
        expireDate: { $gte: currentDate }, 
        minimumSpend: { $lte: order.totalAmount }, 
      });
  
      return validCoupons;
    } catch (error) {
        console.error('Error finding valid coupons:', error);
        res.status(500).render('error',{message: error.message})
    }
  };

const selectCoupon = async (req,res)=>{

    let cartItems = await Cart.find({user_id: req.session.user_id}).populate('product_id', ['price', 'offerPrice', 'name', 'stock']);
    try {
        order_id = req.query.id
        const order = await Order.findById(order_id)
        
        const allCategory = await Category.find({is_blocked:0})
        const user = await User.findById(req.session.user_id)
        if(order){
            const validCoupons = await findValidCouponsForOrder(order);
            res.render('selectCoupon', {allCategory, user, order, validCoupons, baseURL: 'http://localhost:3000/'})
        } 
        
    } catch (error) {
        console.error(error);
        const allCategory = await Category.find({is_blocked:0})
        const user = await User.findById(req.session.user_id)
        res.render('checkout',{allCategory, user, cartItems, baseURL: 'http://localhost:3000/',message1:"Cannot able to place the order"})
    }

}

const applyCoupon = async (req, res) => {
    const code = req.body.code;
    const order_id = req.body.id;
    const userId = req.session.user_id;

    const order = await Order.findById(order_id)       
    const allCategory = await Category.find({is_blocked:0})
    const user = await User.findById(req.session.user_id)

    const couponValidationResult = await validateCoupon(code, order.totalAmount, userId);

    if (!couponValidationResult.isValid) {

        return res.render('selectCoupon', {
            allCategory,
            user,
            order,
            baseURL: 'http://localhost:3000/',
            message1: couponValidationResult.errors[0]
        });
    }

    try {
        const coupon = couponValidationResult.coupon;

        if (order.totalAmount < coupon.minimumSpend) {
            return res.render('selectCoupon', {
                allCategory,
                user,
                order,
                baseURL: 'http://localhost:3000/',
                message1: "Order total does not meet the minimum spend required for the coupon"
            });
        }

         // Apply coupon to order
         const discountAmount = calculateDiscount(coupon, order.totalAmount);
         order.discountAmount = discountAmount;
         order.discountPercentage = coupon.discountPercentage || 0;
         order.totalAmount -= discountAmount;
   
        coupon.user.push(userId); 
        coupon.countUses++; 


        await Promise.all([order.save(), coupon.save()]);

        return res.render('selectCoupon', {
            allCategory,
            user,
            order,
            baseURL: 'http://localhost:3000/',
            message2: "COUPON APPLIED SUCCESSFULLY"
        });
    } catch (error) {
        console.error(error);

        return res.render('selectCoupon', {
            allCategory,
            user,
            order,
            baseURL: 'http://localhost:3000/',
            message1: "Coupon cannot be processed"
        });
    }
};

const validateCoupon = async (couponCode, userCartTotal, userId) => {
    try {
    
        const coupon = await Coupon.findOne({ code: couponCode });

        if (!coupon) {
            return { isValid: false, errors: ['Invalid coupon code'] };
        }

        const currentDate = new Date();
        if (currentDate > coupon.expireDate) {
            return { isValid: false, errors: ['Coupon has expired'] };
        }

        const userHasAppliedCoupon = coupon.user.includes(userId);
        if (userHasAppliedCoupon) {
            return { isValid: false, errors: ['Coupon has already been applied by this user'] };
        }

        if (coupon.NumberOfUses && coupon.countUses >= coupon.NumberOfUses) {
            return { isValid: false, errors: ['Coupon has reached its maximum usage limit'] };
        }

        if (userCartTotal < coupon.minimumAmount) {
            return { isValid: false, errors: ['Minimum cart amount not met'] };
        }

        return { isValid: true, coupon, errors: [] };
    } catch (error) {
        console.error(error);
        res.status(500).render('error',{message: error.message})
    }
};



// Function to calculate the discount amount
const calculateDiscount = (coupon, userCartTotal) => {
    const discountPercentage = coupon.discountPercentage || 0;
    const discountAmount = (discountPercentage / 100) * userCartTotal;

    // If there's a maximum discount amount set in the coupon, apply it
    if (coupon.maximumDiscountAmount && discountAmount > coupon.maximumDiscountAmount) {
        return coupon.maximumDiscountAmount;
    }

    return discountAmount;
};



module.exports = {
    //admin side
    addCoupon,
    submitAddCoupon,
    viewCoupon,
    updateCouponStatus,
    editCoupon,
    submitEditCoupon,
    //use side
    selectCoupon,
    applyCoupon,
}
