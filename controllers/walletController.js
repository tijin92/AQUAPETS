const User = require('../models/userModel')
const Product = require('../models/productModel')
const Category = require('../models/categoryModel')
const Wallet = require('../models/walletModel')

const wallet = async (req,res)=>{

    try {
        const user_id = req.session.user_id;
        const allCategory = await Category.find({is_blocked:0})
        const allProduct = await Product.find({unlist:0})
        const user = await User.findOne({ _id: user_id });
        let wallet = await Wallet.findOne({userId: user_id})
        if(!wallet){
            wallet = new Wallet({userId: user_id})
            await wallet.save()
        }
        res.render('wallet',{user, allCategory, allProduct, wallet})
        
    } catch (error) {
        res.status(500).render('error',{message: error.message})
        console.log(error.message)
    }

}

module.exports = {
    wallet
}