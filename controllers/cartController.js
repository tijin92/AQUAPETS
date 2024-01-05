const User = require('../models/userModel')
const Order = require('../models/orderModel')
const Product = require('../models/productModel')
const Category = require('../models/categoryModel')
const Cart = require('../models/cartModel')
const WishList = require('../models/wishListModel')
const Wallet = require('../models/walletModel')

const addToCart = async (req, res) => {
    const product_id = req.body.product_id;
    const user_id = req.session.user_id;

    const product = await Product.findById(product_id).populate('offer')

    try {
        const existingCartItem = await Cart.findOne({ user_id, product_id, name: product.name });
    
        if (existingCartItem) {
          // Product is already in the cart, you can update its quantity or handle it as needed
          existingCartItem.quantity += 1;
          await existingCartItem.save();
        } else {
          // Product is not in the cart, create a new cart item
          await Cart.create({
            user_id,
            product_id,
            name: product.name,
            quantity: 1,
            image: product.image[0], // Assuming image is a field in your Product model
          });
        }
    
         return res.redirect('/user/cart');
      } catch (error) {
        console.error('Error adding to cart:', error);
        res.status(500).render('error',{message: error.message})
        
      }
    
};

const addToCartFromWishList = async (req, res) => {
  const product_id = req.body.product_id;
  const user_id = req.session.user_id;

  try {
    const product = await Product.findById(product_id).populate('offer');
    console.log('Product:', product);
    const existingCartItem = await Cart.findOne({
      user_id,
      product_id,
      name: product.name,
    });
    console.log('Existing Cart Item:', existingCartItem);

    if (existingCartItem) {

      req.flash('error', 'Product already in cart. You can update its quantity in the cart.');
    } else {

      await Cart.create({
        user_id,
        product_id,
        name: product.name,
        image: product.image[0], 
        quantity: 1
      });
      await WishList.findOneAndDelete({ user_id, product_id });
      req.flash('success', 'Product added to cart successfully.');
    }

    return res.redirect('/user/cart');
  } catch (error) {
    console.error('Error adding to cart from wish list:', error);

    req.flash('error', 'Internal server error.');

    return res.redirect('/user/wishList'); 
  }
};

  
const cart = async (req,res) => {
    try {
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
        const allCategory = await Category.find({is_blocked:0})
        res.render('cart',{allCategory, cartItems,baseURL: 'http://localhost:3000/'})
    } catch (error) {
        console.log(error.message)
        res.status(500).render('error',{message: error.message})
    }
}

// Add this route to your existing routes
const updateCartQuantity =  async (req, res) => {
  const itemId = req.body.itemId;
  const newQuantity = req.body.newQuantity;

  try {
     const cartItem = await Cart.findById(itemId);
     if (cartItem) {
        cartItem.quantity = newQuantity;
        await cartItem.save();
        res.json({ success: true, message: 'Quantity updated successfully' });
     } else {
        res.status(404).json({ success: false, message: 'Cart item not found' });
     }
  } catch (error) {
     console.error('Error updating cart item quantity:', error);
     res.status(500).render('error',{message: error.message})
  }
};

//remove cart item
const removeCartItem =  async (req, res) => {
   const itemId = req.params.itemId;

   try {
      const cartItem = await Cart.findByIdAndDelete(itemId);
      if (cartItem) {
        const remainingCartItems = await Cart.find({ user_id: req.session.user_id });
        const cartIsEmpty = remainingCartItems.length === 0;
  
        res.json({
          success: true,
          message: 'Item removed successfully',
          cartIsEmpty: cartIsEmpty,
        });
      } else {
        res.status(404).json({ success: false, message: 'Cart item not found' });
      }
    } catch (error) {
      console.error('Error removing cart item:', error);
      res.status(500).render('error',{message: error.message})
    }
};

//checkout Page
const checkout = async(req,res)=>{

  try {
   const user_id = req.session.user_id
   const user = await User.findById(user_id)
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
   const allCategory = await Category.find({is_blocked:0})
   let wallet = await Wallet.findOne({userId: user_id})
   if(!wallet){
    wallet = new Wallet({userId: user_id})
    await wallet.save()
}
   res.render('checkout',{allCategory, user, wallet, cartItems, baseURL: 'http://localhost:3000/'});   
  } catch (error) {
      console.error('Error removing cart item:', error);
      res.status(500).render('error',{message: error.message})
  }

}

const getWalletData =  async (req, res) => {
  try {
      const user_id = req.session.user_id; // Assuming you use session-based authentication
      const wallet = await Wallet.findOne({ userId: user_id });

      if (!wallet) {
          return res.status(404).json({ error: 'Wallet not found' });
      }

      res.json(wallet);
  } catch (error) {
      console.error('Error fetching wallet data:', error);
      res.status(500).render('error',{message: error.message})
  }
};


const checkoutAddNewAddress = async(req,res)=>{

   try {
      const user_id = req.session.user_id;
      console.log(req.body.house_name)
      const newAddress = {
         house_name: req.body.house_name,
         street: req.body.street,
         city: req.body.city,
         state: req.body.state,
         postalCode: req.body.postalCode,
         country: req.body.country,
     };
   
     const updatedUser = await User.findByIdAndUpdate(
         user_id,
         { $push: { address: newAddress } },
         { new: true }
     );
   
     const user = await User.findById(user_id);
     const allCategory = await Category.find({is_blocked:0})
     res.render('checkout',{allCategory, user, baseURL: 'http://localhost:3000/'});
      
   } catch (error) {
      res.status(500).render('error',{message: error.message})
      console.log(error.message);
   }

}




module.exports = {
    addToCart,
    cart,
    updateCartQuantity,
    removeCartItem,
    checkout,
    checkoutAddNewAddress,
    addToCartFromWishList,
    getWalletData

}