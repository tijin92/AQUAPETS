const User = require('../models/userModel')
const Product = require('../models/productModel')
const Category = require('../models/categoryModel')
const Cart = require('../models/cartModel')
const Order = require('../models/orderModel')
const Wallet = require('../models/walletModel')

//html to pdf generate require things
const ejs = require('ejs')
const pdf = require('html-pdf')
const fs = require('fs')
const path = require('path')

const order = async(req,res)=>{

    try {

        const  user = await User.findById(req.session.user_id)
        const allCategory = await Category.find({is_blocked:0})
        const orders = await Order.find({ user_id: req.session.user_id })
        .populate('orderItems.product')
        .sort({ orderDate: -1 });
        res.render('order',{allCategory, user, orders, baseURL: 'http://localhost:3000/'}) 

    } catch (error) {
        console.log(error.message)
        res.status(500).render('error',{message: error.message})
    } 

}

const orderStatus = async(req,res)=>{

    try {
               
        const  user = await User.findById(req.session.user_id)
        const allCategory = await Category.find({is_blocked:0})
        const orders = await Order.find({user_id: req.session.user_id })
            .populate('orderItems.product')
            .sort({ orderDate: -1 })
            .limit(1);
      
        res.render('orderStatus',{allCategory, user, orders, baseURL: 'http://localhost:3000/'})    
               
    } catch (error) {
        console.log(error.message)
        res.status(500).render('error',{message: error.message})
    }

}

const cancelOrderRequest = async(req,res)=>{

    try {
        const orderId = req.body.orderId
        const orders = await Order.find({ user_id: req.session.user_id ,_id: orderId})
            .populate('orderItems.product')
          
        const  user = await User.findById(req.session.user_id)
        const allCategory = await Category.find({is_blocked:0})
        if(order){
            res.render('orderCancellation',{user, allCategory, orders, baseURL: 'http://localhost:3000/'})
        }else{
            res.redirect('/orderStatus')
        }   
    } catch (error) {
        console.error(error.message);
        res.status(500).render('error',{message: error.message})
    }

}

const cancelOrder = async(req,res)=>{

    try {
        const { orderId } = req.body;
        const order = await Order.findOne({ _id: orderId });
        const cancellationReason = req.body.cancellationReason

        if (
            cancellationReason === 'Product Damaged or Product no more Usable' ||
            cancellationReason === 'Product Died (purchased product is fish)' 
        ){
            const wallet = await Wallet.findOne({ userId: order.user_id });
            if (wallet) {
                wallet.totalWalletAmount += order.totalAmount;
                wallet.transactions.push({
                    type: 'refund',
                    amount: order.totalAmount,
                    date: new Date(),
                    balance: wallet.totalWalletAmount,
                });
                await wallet.save();
            }else{
                
                    wallet = new Wallet({userId: user_id})
                    wallet.totalWalletAmount += order.totalAmount;
                    wallet.transactions.push({
                        type: 'refund',
                        amount: order.totalAmount,
                        date: new Date(),
                        balance: wallet.totalWalletAmount,
                    });
                    await wallet.save();
                
            }
        } else {

            for (const orderItem of order.orderItems) {
                const product = await Product.findOne({ _id: orderItem.product });

                if (product) {
                    // Increment product stock
                    product.stock += orderItem.quantity;
                    await product.save();
                }
            }

            // Refund order amount to the user's wallet
            const wallet = await Wallet.findOne({ userId: order.user_id });
            if (wallet) {
                wallet.totalWalletAmount += order.totalAmount;
                wallet.transactions.push({
                    type: 'refund',
                    amount: order.totalAmount,
                    date: new Date(),
                    balance: wallet.totalWalletAmount,
                });
                await wallet.save();
            }else{
                
                wallet = new Wallet({userId: user_id})
                wallet.totalWalletAmount += order.totalAmount;
                wallet.transactions.push({
                    type: 'refund',
                    amount: order.totalAmount,
                    date: new Date(),
                    balance: wallet.totalWalletAmount,
                });
                await wallet.save();
            
            }
        }

        const updatedOrder = await Order.findByIdAndUpdate(
            orderId,
            { $set: { status: 'Cancelled' } },
            { new: true }
        );

        if (!updatedOrder) {
            return res.status(404).send('Order not found');
        }

        // Redirect to the order history page or send a response as needed
        return res.redirect('/user/orderCancelledStatus?orderId=' + orderId);
    } catch (error) {
        console.error(error.message);
        res.status(500).render('error',{message: error.message})
    }

}

const orderList = async(req,res)=>{

    try {
        const orders = await Order.find()
        .populate('user_id')
        .populate('orderItems.product')
        .sort({ orderDate: -1 })

        res.render('orderList',{ orders })    
    } catch (error) {
        console.log(error.message)
        res.status(500).render('error',{message: error.message})
    }

}

const updateOrderList = async (req, res) => {
    const { orderId } = req.params;
    const { status } = req.body;
    try {
        const order = await Order.findOneAndUpdate(
            { orderID: orderId },
            { $set: { status: status } },
            { new: true }
        );

        if (!order) {
 
            return res.status(404).json({ success: false, error: 'Order not found' });
        }
        
        return res.status(200).json({ success: true, message: 'Order status updated successfully' });

    } catch (error) {
        console.log(error.message);
        res.status(500).render('error',{message: error.message})
    }
};


const viewOrderDetails = async (req,res)=>{
    const { orderId } = req.params;
    console.log('Order ID:', orderId);
    try {
        const order = await Order.findOne({orderID: orderId})
        .populate('user_id')
        .populate('orderItems.product')
        
        if (!order) {
            res.redirect('/admin/orderList');
        }

        res.render('viewOrderDetails',{ order }) 
        
    } catch (error) {
        console.log(error.message)
        res.redirect('/admin/orderList');
    }
}

const salesOrderDetails = async (req,res)=>{
    const { orderId } = req.params;
    console.log('Order ID:', orderId);
    try {
        const order = await Order.findOne({orderID: orderId})
        .populate('user_id')
        .populate('orderItems.product')
        
        if (!order) {
            res.redirect('/admin/orderList');
        }

        res.render('salesOrderDetails',{ order }) 
        
    } catch (error) {
        console.log(error.message)
        res.redirect('/admin/orderList');
    }
}

const orderCancelledStatus = async (req,res)=>{

    try {
        const orderId = req.query.orderId       
        const  user = await User.findById(req.session.user_id)
        const allCategory = await Category.find({is_blocked:0})
        const wallet = await Wallet.findOne({userId: req.session.user_id})
        const orders = await Order.find({_id : orderId })
            .populate('orderItems.product')
                 
        if (orders.length > 0) {
            // Order found, render the view with order details
            res.render('orderCancelledStatus', {
                allCategory,
                wallet,
                user,
                orders,
                message: 'Order cancellation successful!', // Add a success message
                baseURL: 'http://localhost:3000/',
            });
        } else {
            // No orders found, render the view with an error message
            res.render('orderCancelledStatus', {
                allCategory,
                wallet,
                user,
                message: 'Order not found or cancellation unsuccessful!', // Add an error message
                baseURL: 'http://localhost:3000/',
            });
        }
               
    } catch (error) {
        console.log(error.message)
        res.render('orderCancelledStatus', {
            allCategory: [],
            wallet: null,
            user: null,
            message: 'An error occurred while processing the order cancellation.', // Add an error message
            baseURL: 'http://localhost:3000/',
        });
    }

}

const updateCancelOrderStatus = async (req, res) => {
    try {
        const { order_id, status } = req.body;
        console.log('Received order_id:', order_id);
        console.log('Received status:', status);
        const updatedOrder = await Order.findByIdAndUpdate(order_id, { status: 'pending' }, { new: true });

        res.json({ success: true, message: 'Order status updated successfully', order: updatedOrder });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).render('error',{message: error.message})
    }
};

const invoice = async (req,res)=>{

    try {
        const order_id = req.params.id
        const order = await Order.findById(order_id)
        const data = {
            order : order
        }
        const filePathName = path.resolve(__dirname,'../views/user/htmltopdfInvoice.ejs')
        const htmlString = fs.readFileSync(filePathName).toString()
        let options = {
            fomrat: 'Letter'
        }
        const ejsData = ejs.render(htmlString, data);
        pdf.create(ejsData, options).toBuffer((err, buffer) => {
            if (err) {
                console.log('Error creating PDF:', err);
                res.status(500).render('error',{message: err.message})
            } 
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=Order_Invoice.pdf`);
            res.end(buffer);
        });

    } catch (error) {
        console.log(error.message)
        res.status(500).render('error',{message: error.message})
    }

}

module.exports = {
    //user side
    order,
    orderStatus, 
    cancelOrderRequest,
    cancelOrder,
    orderCancelledStatus,
    updateCancelOrderStatus,
    invoice,
    //admin side
    orderList,
    updateOrderList,
    viewOrderDetails,
    salesOrderDetails
}