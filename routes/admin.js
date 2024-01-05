const express = require('express')
const admin_route = express()
const session = require('express-session')
const config = require('../config/config')
const auth = require('../middleware/adminAuth')

//session
admin_route.use(session({
    secret: config.adminSession,
    resave: false, 
    saveUninitialized:true,

}))

admin_route.use(express.json())
admin_route.use(express.urlencoded({extended:true}))

// view engine setup
admin_route.set('views','./views/admin');

//middleware for storing images
const multer = require('multer');
const path = require('path')
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname,'../public/productImages')); 
    },
    filename: function (req, file, cb) {
        const name = Date.now()+'_'+file.originalname
        cb(null, name); 
    },
});

const upload = multer({ storage: storage });
//...............

const adminController = require('../controllers/adminController')
const productController = require('../controllers/productController')
const categoryController = require('../controllers/categoryController')
const orderController = require('../controllers/orderController')
const offerController = require('../controllers/offerController')
const couponController = require('../controllers/CouponController')
const bannerController = require('../controllers/bannerController')

//Routes
admin_route.get('/admin/register', auth.isLogout, adminController.loadRegister)
admin_route.post('/admin/register', adminController.insertAdmin)

admin_route.get('/admin', auth.isLogout, adminController.loadLogin)
admin_route.post('/admin', adminController.verifyLogin)

//home or dashboard
admin_route.get('/admin/home', auth.isLogin, adminController.loadDashboard)
admin_route.get('/admin/logout', auth.isLogin, adminController.logout)
admin_route.get('/admin/salesReport', auth.isLogin, adminController.salesReport)
admin_route.get('/admin/salesReportExcel', auth.isLogin, adminController.salesReportExcel)
admin_route.get('/admin/salesReportPDF', auth.isLogin, adminController.salesReportPDF)


//user list
admin_route.get('/admin/userList', auth.isLogin, adminController.userList)
admin_route.get('/admin/blockUser', auth.isLogin, adminController.blockUser)
admin_route.post('/admin/searchUserList', adminController.searchUser)

// product
admin_route.get('/admin/productList', auth.isLogin, productController.productList)
admin_route.get('/admin/addProducts', auth.isLogin, productController.addProduct)
admin_route.post('/admin/addProducts', upload.array('image', 5), productController.insertProduct)
admin_route.get('/admin/unListProduct', auth.isLogin, productController.unListProduct)
admin_route.get('/admin/editProduct', auth.isLogin, productController.editProduct)
admin_route.post('/admin/editProduct', upload.array('image', 5), productController.updateProduct)
admin_route.get('/admin/deleteProduct', auth.isLogin, productController.deleteProduct)
admin_route.delete('/admin/deleteImage', auth.isLogin, productController.deleteImage)

//category
admin_route.get('/admin/categoryList', auth.isLogin, categoryController.categoryList)
admin_route.post('/admin/categoryList', categoryController.addCategory)
admin_route.get('/admin/blockCategory', auth.isLogin, categoryController.blockCategory)
admin_route.get('/admin/editCategory', auth.isLogin, categoryController.editCategory)
admin_route.post('/admin/editCategory', categoryController.insertEditedCategory)
admin_route.get('/admin/deleteCategory', auth.isLogin, categoryController.deleteCategory)

//Order
admin_route.get('/admin/orderList', auth.isLogin, orderController.orderList)
admin_route.post('/admin/updateOrderStatus/:orderId', orderController.updateOrderList)
admin_route.post('/admin/viewOrderDetails/:orderId', orderController.viewOrderDetails)
admin_route.post('/admin/salesOrderDetails/:orderId', orderController.salesOrderDetails)

//Offer
admin_route.get('/admin/addOffer', auth.isLogin, offerController.addOffer)
admin_route.post('/admin/addOffer', offerController.submitAddOffer)
admin_route.get('/admin/viewOffer', auth.isLogin, offerController.offer)
admin_route.get('/admin/updateOfferStatus', auth.isLogin, offerController.updateOfferStatus)
admin_route.get('/admin/editOffer', auth.isLogin, offerController.editOffer)
admin_route.post('/admin/editOffer', offerController.submitEditOffer)

//Coupon
admin_route.get('/admin/addCoupon', auth.isLogin, couponController.addCoupon)
admin_route.post('/admin/addCoupon', couponController.submitAddCoupon)
admin_route.get('/admin/viewCoupon', auth.isLogin, couponController.viewCoupon)
admin_route.get('/admin/updateCouponStatus', auth.isLogin, couponController.updateCouponStatus)
admin_route.get('/admin/editCoupon', auth.isLogin, couponController.editCoupon)
admin_route.post('/admin/editCoupon', couponController.submitEditCoupon)


//banner
admin_route.get('/admin/addBanner', auth.isLogin, bannerController.addBanner)
admin_route.post('/admin/addBanner', upload.single('image'), bannerController.insertBanner)
admin_route.get('/admin/viewBanner', auth.isLogin, bannerController.viewBanner )
admin_route.get('/admin/unListBanner', auth.isLogin, bannerController.unListBanner)
admin_route.get('/admin/editBanner', auth.isLogin, bannerController.editBanner)
admin_route.post('/admin/editBanner', upload.single('image'), bannerController.updateBanner)
admin_route.get('/admin/deleteBanner', auth.isLogin, bannerController.deleteBanner)

// admin_route.get('*', function(req,res){
//     res.redirect('/admin')
// })

module.exports = admin_route
