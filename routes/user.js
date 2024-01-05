const express = require('express');
const user_route = express();
const path = require('path');
const session = require('express-session')
const config = require('../config/config')
const auth = require('../middleware/auth')
const flash = require('express-flash');

// view engine setup
user_route.set('views','./views/user');

user_route.use(express.json())
user_route.use(express.urlencoded({extended:true}))
user_route.use(flash());

//session
user_route.use(session({
    secret: config.userSession,
    resave:false,
    saveUninitialized:true
 
}))
//controller 
const userController = require('../controllers/userController');
const cartController = require('../controllers/cartController')
const orderController = require('../controllers/orderController')
const paymentController = require('../controllers/paymentController')
const couponController = require('../controllers/CouponController')
const wishListController = require('../controllers/wishListController')
const walletController = require('../controllers/walletController')
const productController = require('../controllers/productController')
const { URLSearchParams } = require('url');

//Routes
user_route.get('/user', auth.isLogout, userController.landingPage)
user_route.get('/user/register', auth.isLogout, userController.loadRegister)
user_route.post('/user/register', userController.insertUser)
user_route.get('/user/verify', auth.isLogout, userController.verifyAccount)
user_route.post('/user/verify', userController.verifyAccountload)
user_route.get('/user/login', auth.isLogout, userController.userLogin)
user_route.post('/user/login', userController.verifyLogin)
user_route.get('/user/resend-otp', auth.isLogout, userController.resendOtp)
user_route.get('/loginInsertOtp', auth.isLogout, userController.loginInsertOtp)
user_route.post('/user/loginInsertOtp', userController.verifyLoginOtp)
user_route.get('/user/loginResendOtp', auth.isLogout, userController.loginResendOTP)

user_route.get('/user/home', auth.isLogin, userController.loadHome)
user_route.get('/user/logout', auth.isLogin, userController.logout)

user_route.get('/forget', auth.isLogout, userController.forget)
user_route.post('/forget', userController.forgetLoad)
user_route.get('/user/forgetPassword', auth.isLogout, userController.forgetPasswordLoad)
user_route.post('/user/forgetPassword', userController.resetPassword)

//User management
user_route.get('/user/myAccount', auth.isLogin, userController.myAccount)
user_route.post('/user/editEmail', userController.editEmail)
user_route.post('/user/editMobile', userController.editMobile)
user_route.post('/user/addAddress', userController.addAddress)
user_route.get('/user/deleteAddress', auth.isLogin, userController.deleteAddress)
user_route.get('/user/editAddress', auth.isLogin, userController.editAddress)
user_route.post('/user/editAddress', userController.updateAddress)
user_route.post('/user/changePassword', userController.changePassword)

//cart management
user_route.post('/user/addToCart', cartController.addToCart)
user_route.get('/user/cart', auth.isLogin, cartController.cart)
user_route.post('/user/updateCartQuantity', cartController.updateCartQuantity)
user_route.delete('/user/removeCartItem/:itemId', auth.isLogin, cartController.removeCartItem)
user_route.post('/user/addToCartFromWishList', cartController.addToCartFromWishList)

//wishList
user_route.post('/user/addToWishList', wishListController.addToWishList)
user_route.get('/user/wishList', auth.isLogin, wishListController.wishList)
user_route.get('/user/wishListItems', auth.isLogin, wishListController.wishListItems)
user_route.post('/user/removeFromWishList', wishListController.removeFromWishList)

//checkout
user_route.get('/user/checkout', auth.isLogin, cartController.checkout)
user_route.get('/user/getWalletData', auth.isLogin, cartController.getWalletData)
user_route.post('/user/addNewAddress', cartController.checkoutAddNewAddress)

//payment integration
user_route.post('/user/checkout', paymentController.checkout)
user_route.post('/user/onlinePayment', paymentController.onlinePayment)
user_route.post('/user/razorpay-order', paymentController.payment)
user_route.post('/user/verifyPayment', paymentController.verifyPayment)
user_route.post('/user/delayedOnlinePayment', paymentController.delayedOnlinePayment)
user_route.post('/user/walletPayment', paymentController.walletPayment)

//Coupon
user_route.get('/user/selectCoupon', auth.isLogin, couponController.selectCoupon)
user_route.post('/user/applyCoupon', couponController.applyCoupon)

//place order 
user_route.get('/user/order', auth.isLogin, orderController.order)
user_route.get('/user/orderStatus', auth.isLogin, orderController.orderStatus)
user_route.post('/user/updateCancelOrderStatus', orderController.updateCancelOrderStatus)
user_route.post('/user/cancelOrderRequest', orderController.cancelOrderRequest);
user_route.post('/user/cancelOrder', orderController.cancelOrder);
user_route.get('/user/orderCancelledStatus', auth.isLogin, orderController.orderCancelledStatus)
user_route.get('/user/printInvoice/:id', auth.isLogin, orderController.invoice)

//wallet
user_route.get('/user/wallet', auth.isLogin, walletController.wallet)

//product
user_route.get('/user/productDetail/:productId', productController.productDetail)
user_route.get('/user/productDetailView/:productId', auth.isLogin, productController.productDetailView)
user_route.get('/user/:category', auth.isLogin, productController.categoryView)

module.exports = user_route;
