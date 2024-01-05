const User = require('../models/userModel')
const Order = require('../models/orderModel')
const Product = require('../models/productModel')
const Category = require('../models/categoryModel')
const Cart = require('../models/cartModel')
const WishList = require('../models/wishListModel')

const addToWishList = async (req,res)=>{

    const product_id = req.body.product_id;
    const user_id = req.session.user_id;

    const product = await Product.findById(product_id).populate('offer')

    try {
        const existingWishListItem = await WishList.findOne({ user_id, product_id, name: product.name });
    
        if (existingWishListItem) {
          // Product is already in the wish List, you can update its quantity or handle it as needed
          await existingWishListItem.save();
        } else {
          // Product is not in the wishList, create a new wishList item
          await WishList.create({
            user_id,
            product_id,
            name: product.name,
            image: product.image[0], // Assuming image is a field in your Product model
          });
        }   
         return res.redirect('/user/wishList');
      } catch (error) {
        console.error('Error adding to cart:', error);
        res.status(500).render('error',{message: error.message})
        
      }

}

const wishList = async (req,res)=>{

    try {
        const wishListItems = await WishList.find({user_id: req.session.user_id}).populate({
         path: 'product_id',
         populate: {
           path: 'offer',
         },
         select: ['price', 'offerPrice', 'name', 'stock', 'offer'],
       });
        const allCategory = await Category.find({is_blocked:0})
        res.render('wishList',{allCategory, wishListItems, baseURL: 'http://localhost:3000/'})
    } catch (error) {
        console.log(error.message)
        res.status(500).render('error',{message: error.message})
    }

}

const wishListItems = async (req, res) => {
    try {
        const wishListItems = await WishList.find({ user_id: req.session.user_id })
            .populate({
                path: 'product_id',
                populate: {
                    path: 'offer',
                },
                select: ['price', 'offerPrice', 'name', 'stock', 'offer'],
            });
        res.json(wishListItems);
    } catch (error) {
        console.log(error.message);
        res.status(500).render('error',{message: error.message})
    }
};

const removeFromWishList = async (req,res)=>{

    try {
        const itemId = req.body.itemId;

        const result = await WishList.findByIdAndDelete(itemId);

        if (result) {
            res.json({ success: true, message: 'Item removed from wishlist.' });
        } else {
            res.json({ success: false, message: 'Item not found in wishlist.' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).render('error',{message: error.message})
    }

}


module.exports = {
    addToWishList,
    wishList,
    wishListItems,
    removeFromWishList
}