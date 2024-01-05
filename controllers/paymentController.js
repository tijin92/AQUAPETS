const User = require('../models/userModel')
const Order = require('../models/orderModel')
const Product = require('../models/productModel')
const Category = require('../models/categoryModel')
const Cart = require('../models/cartModel')
const razorpay = require('razorpay')
const { order } = require('./orderController')
const crypto = require('crypto');
const Wallet = require('../models/walletModel')

const {RAZORPAY_ID_KEY, RAZORPAY_SECRET_KEY} = process.env

const instance = new razorpay({ 
    key_id: RAZORPAY_ID_KEY, 
    key_secret: RAZORPAY_SECRET_KEY 
})

instance.orders.create({
    amount: 50000,
    currency: "INR",
    receipt: "receipt#1",
    notes: {
      key1: "value3",
      key2: "value2"
    }
  })

const checkout =  async (req, res) => {
    try {
 
        const selectedAddressId = req.body.userAddress;
        console.log("selected address Id: ", selectedAddressId);

        const user = await User.findById(req.session.user_id);

        const address = await User.findOne(
        { _id: req.session.user_id },
        { address: { $elemMatch: { _id: selectedAddressId } } }
        );

        console.log("selected address: ", address);

        const { name, email, mobile, paymentMethod } = req.body;
        const { house_name, street, city, state, postalCode, country } = address.address[0];

        const cartItems = await Cart.find({user_id: req.session.user_id})
        .populate({
          path: 'product_id',
          populate: [
              {
                  path: 'offer',
              },
              {
                  path: 'category',
                  populate: {
                      path: 'offer',
                  },
              },
          ],
          select: ['price', 'offerPrice', 'name', 'stock', 'offer', 'category'],
      });

 
         for (const item of cartItems) {
          const product = item.product_id;
        
             if (product.stock >= item.quantity) {
     
                product.stock -= item.quantity;
                
                await product.save();
             } else {
 
                const allCategory = await Category.find({is_blocked:0})
                return res.render('checkout',{allCategory, user, cartItems, baseURL: 'http://localhost:3000/',message1:'Insufficient stock for ' + product.name})
             }
          }
 
        let total = 0;
        let shipping = 50; 
        cartItems.forEach(item => {
            
            const pricePerItem = (
                item.product_id.offer &&
                item.product_id.offer.status  &&
                item.product_id.offerPrice &&
                new Date(item.product_id.offer.expiryDate) >= new Date()
            )
                ? item.product_id.offerPrice
                : (
                    item.product_id.category &&
                    item.product_id.category.offer &&
                    item.product_id.category.offer.status === 1 &&
                    new Date(item.product_id.category.offer.expiryDate) >= new Date()
                )
                    ? (item.product_id.price * (100 - item.product_id.category.offer.percentage)) / 100
                    : item.product_id.price;

            total += pricePerItem * item.quantity;

            console.log(`Item: ${item.product_id.name}, Price Per Item: ${pricePerItem}, Quantity: ${item.quantity}`);
        });
        
 
        if (total >= 500) {
            shipping = shipping - 50;
        }
 
        const totalAmount = total + shipping;
 

        const order = new Order({
            orderID: generateOrderID(), 
            totalAmount,
            user_id: user._id,
            paymentMethod,
            orderItems: cartItems.map(item => {
                let pricePerItem = 0;
        
                if (item.product_id.offer && item.product_id.offer.status === 1 && item.product_id.offerPrice && new Date(item.product_id.offer.expiryDate) >= new Date()) {
                    pricePerItem = item.product_id.offerPrice;
                } else if (item.product_id.category.offer && item.product_id.category.offer.status === 1 && new Date(item.product_id.category.offer.expiryDate) >= new Date()) {
                    pricePerItem = (item.product_id.price * (100 - item.product_id.category.offer.percentage)) / 100
                } else {
                    pricePerItem = item.product_id.price;
                }
        
                return {
                    product: item.product_id,
                    name: item.product_id.name,
                    quantity: item.quantity,
                    pricePerItem,
                };
            }),
            status: 'Pending', 
            shippingAddress: {
                name,
                email,
                mobile,
                house_name,
                street,
                city,
                state,
                postalCode,
                country,
              },
        });
 
        // Save the order to the database
        await order.save();
        console.log(order)
        if(order){
            await Cart.deleteMany({ user_id: req.session.user_id });
           if(req.body['paymentMethod']==='Cash On Delivery'){
                res.redirect(`/user/orderStatus`)
           }else if(req.body['paymentMethod']==='razorpay'){
                res.redirect(`/user/selectCoupon?id=${order._id}`)         
           }else if(req.body['paymentMethod']==='wallet'){
                res.redirect(`/user/selectCoupon?id=${order._id}`)
           }
           
        }else{
           const allCategory = await Category.find({is_blocked:0})
           res.render('checkout',{allCategory, user, cartItems, baseURL: 'http://localhost:3000/',message1:"Cannot able to place the order"})
        }
        // Update user information (clear the cart, etc.) 
        
 
 
    } catch (error) {
        console.error(error);
        res.status(500).render('error',{message: error.message})
    }
 };
 
 const generateOrderID = () => {
    return 'ORD' + Math.floor(1000 + Math.random() * 9000);
 };


 const onlinePayment = async(req,res)=>{
    let cartItems = await Cart.find({user_id: req.session.user_id}).populate('product_id', ['price', 'offerPrice', 'name', 'stock']);
    try {
        order_id = req.body.id
        const order = await Order.findById(order_id)
        
        const allCategory = await Category.find({is_blocked:0})
        const user = await User.findById(req.session.user_id)
        const paymentMethod = req.body.paymentMethod
        if(order){
            if(paymentMethod === 'razorpay'){
                res.render('onlinePayment', {allCategory, user, order, baseURL: 'http://localhost:3000/'})
            }else{
                res.render('walletPayment', {allCategory, user, order, baseURL: 'http://localhost:3000/'})
            }
            
            
        } 
        
    } catch (error) {
        console.error(error);
        const allCategory = await Category.find({is_blocked:0})
        const user = await User.findById(req.session.user_id)
        res.render('onlinePayment', {allCategory, user, order, baseURL: 'http://localhost:3000/',message1:"Cannot able to place the order"})
    }

 }

 const delayedOnlinePayment = async(req,res)=>{

    try {
        const order_id = req.body.id;
        const order = await Order.findById(order_id);

        const allCategory = await Category.find({ is_blocked: 0 });
        const user = await User.findById(req.session.user_id);

        if (order) {
            // Assuming the payment is successful, you can redirect to a confirmation page or a payment gateway
            return res.render('onlinePayment', {allCategory, user, order, baseURL: 'http://localhost:3000/'})
        }
    } catch (error) {
        console.error(error);
        const allCategory = await Category.find({ is_blocked: 0 });
        const user = await User.findById(req.session.user_id);
        const cartItems = await Cart.find({ user_id: req.session.user_id }).populate('product_id', ['price', 'offerPrice', 'name', 'stock']);
        return res.render('onlinePayment', {allCategory, user, order, baseURL: 'http://localhost:3000/', message1:"cannot able to place the order"})
    }

 }

const payment = async (req, res) => {
    try {
        const order_id = req.body.id
        const amount = req.body.amount * 100;
        const options = {
            amount: amount,
            currency: 'INR',
            receipt: ''+order_id,
        };

        instance.orders.create(options,
            (err,order)=>{
                if(!err){
                    console.log(order)
                    res.status(200).send({
                        success: true,
                        msg:'Order Created',
                        order_id: order.id,
                        amount: amount,
                        key_id: RAZORPAY_ID_KEY,
                        name: req.body.name,
                        email: req.body.email,
                        mobile: req.body.mobile
                    })
                }else{
                    console.error('Razorpay order creation failed');
                    res.status(400).send({ success: false, msg: 'Unable to create order' }); 
                }
            })
        await Order.findByIdAndUpdate({_id: req.body.order_id},{status: 'order confirmed'})

    } catch (error) {
        console.error('Internal Server Error:', error);
        res.status(500).render('error',{message: error.message})
    }
};

const verifyPayment = async (req, res) => {
    try {
        const { payment, order } = req.body;
        const secret = RAZORPAY_SECRET_KEY;

        // Create an HMAC object with the SHA256 algorithm and your secret
        const hmac = crypto.createHmac('sha256', secret);

        // Update the HMAC object with the Razorpay order ID and payment ID
        hmac.update(`${order}|${payment}`);

        // Calculate the HMAC digest and convert it to hexadecimal
        const calculatedSignature = hmac.digest('hex');

        if (calculatedSignature === req.headers['x-razorpay-signature']) {
            console.log("im a web site:",calculatedSignature)
            await Order.findByIdAndUpdate({_id: req.body.order_id},{status: 'order confirmed'})
            
            res.redirect('/user/orderStatus');
        } else {
            console.log('hello failure')
            await Order.findByIdAndUpdate({_id: req.body.order_id},{status: 'pending'})
            
            res.redirect('/user/orderStatus');
        }
    } catch (error) {
        console.error('Error in verifyPayment:', error);
        res.status(500).render('error',{message: error.message})
    }
};


const walletPayment = async(req,res)=>{

    try {
        const orderId = req.body.order_id;
        const orderTotal = parseFloat(req.body.amount);
        const userId = req.session.user_id; 

        const user = await User.findById(userId);
        const wallet = await Wallet.findOne({userId: userId})
        if(!wallet){
            wallet = new Wallet({userId: req.session.user_id})
            await wallet.save()
        }
        const walletTotal = wallet.totalWalletAmount


        if (walletTotal >= orderTotal) {

            const updatedWalletTotal = walletTotal - orderTotal;
            await Wallet.findOneAndUpdate({ userId: userId }, { totalWalletAmount: updatedWalletTotal });
            await Wallet.findOneAndUpdate(
                { userId: userId },
                {
                  $push: {
                    transactions: {
                      type: 'debit', 
                      amount: orderTotal,
                      date: new Date(),
                      balance: updatedWalletTotal,
                    },
                  },
                })
            await Order.findByIdAndUpdate({_id:req.body.order_id}, {status: 'order confirmed'})
            return res.redirect(`/user/orderStatus`);

        } else {

            return res.status(400).json({ success: false, error: 'Insufficient funds in the wallet' });
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).render('error',{message: error.message})
    }

}



module.exports = {
    checkout,
    onlinePayment,
    payment,
    verifyPayment,
    delayedOnlinePayment,
    walletPayment
};

