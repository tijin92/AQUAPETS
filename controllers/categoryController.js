const Admin = require('../models/adminModel')
const User = require('../models/userModel')
const Product = require('../models/productModel')
const Category = require('../models/categoryModel')
const Offer = require('../models/offerModel');

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

const categoryList = async(req,res)=>{

    try {
        const categoryData = await Category.find({})
        const allOffers = await Offer.find({status : true});
        res.render('categoryList',{ categoryData, allOffers})
    } catch (error) {
        console.log(error.message)
        res.status(500).render('error',{message: error.message})
    }

}

const addCategory = async(req,res)=>{

    try {
        const name = req.body.name
        const offerId = req.body.offer;
        const similarData = await Category.findOne({ name: new RegExp(`^${name}$`, 'i') })
        const categoryData = await Category.find({})
        if(similarData){
            
            res.render('categoryList',{message1:"This category already exists..", categoryData, allOffers})
        }else{

            const categoryFields = {
                name: req.body.name,
                is_blocked: 0
            };
            if (offerId && offerId !== "Select an offer (optional)") {
                categoryFields.offer = offerId;
            }
            const category = new Category(categoryFields);
            const categoryDataItem = await category.save()
            
            if(categoryDataItem){
                const categoryData = await Category.find({})
                const allOffers = await Offer.find({status : true});
                res.render('categoryList',{message2:"You added a category successfully..", categoryData, allOffers})
            }else{
                const validationErrors = extractValidationErrors(error);
                const categoryData = await Category.find({})
                const allOffers = await Offer.find({status : true});
                res.render('categoryList', { message1:"This category already exists..", categoryData, allOffers});
            }
        }
        
    } catch (error) {
        const validationErrors = extractValidationErrors(error);
        const categoryData = await Category.find({})
        const allOffers = await Offer.find({status : true});
        res.render('categoryList', { message1:"Valdation error in the entered category.", categoryData, allOffers });
    }

}

const blockCategory = async(req,res)=>{

    try {
        const id = req.query.id;
        const category = await Category.findOne({ _id: id });

        if (category) {
            category.is_blocked = !category.is_blocked ; // XOR operation to toggle between 0 and 1
            await category.save();
            if(category.is_blocked == 1){
                await Product.updateMany({category: id},{ unlist: 1})
            }else{
                await Product.updateMany({category: id},{ unlist: 0})
            }
        } else {      
            console.log('Category not found');
        }
        
        const categories = await Category.find({});       
        
        res.redirect('/admin/categoryList');
        
    } catch (error) {
        console.error(error.message);
        res.status(500).render('error',{message: error.message})
    }

}

const editCategory = async(req,res)=>{

    try {
        const id = req.query.id
        const category = await Category.findById({_id: id})
        const allOffers = await Offer.find({status : true});
        res.render('editCategory', { category, allOffers })
    } catch (error) {
        console.log(error.message)
        res.status(500).render('error',{message: error.message})
    }

}

const insertEditedCategory = async (req, res) => {
    const allOffers = await Offer.find({status : true});
    try {
        const offerId = req.body.offer;
        const existingCategory = await Category.findOne({
            name: new RegExp(`^${req.body.name}$`, 'i'),
            _id: { $ne: req.body.id } // Exclude the current category from the check
        });
    
        if (existingCategory) {
            res.render('editCategory', {message1: 'Category with the same name already exists',category: existingCategory, allOffers });
        } else {
            let categoryData
            if (offerId && offerId !== "Select an offer (optional)") {
                categoryData = await Category.findByIdAndUpdate({ _id: req.body.id }, { $set: { name: req.body.name, offer: offerId } },{ new: true });          
            }else{
                categoryData = await Category.findByIdAndUpdate({ _id: req.body.id }, { $set: { name: req.body.name } },{ new: true });          
            }
            
            if (categoryData) {
                res.render('editCategory', {category: categoryData, message2: 'Updated a category successfully..', allOffers});
            } else {
                res.render('editCategory', {message1: 'Updating category failed', category: existingCategory, allOffers});
            }
        }
    } catch (error) {
        const validationErrors = extractValidationErrors(error);
        const existingCategory = await Category.findOne({ name: new RegExp(`^${req.body.name}$`, 'i') });
        res.render('editCategory', {message1: error, category: existingCategory, allOffers});
    }
  };

  const deleteCategory = async(req,res)=>{

    try {
        const id = req.query.id
        await Product.deleteMany({category: id})
        const deleteCategory = await Category.findByIdAndDelete(id)
        if(deleteCategory){
            res.redirect('/admin/categoryList?successMessage=Category and Product deleted successfully');
        }else{
            res.redirect('/admin/categoryList?errorMessage=Category not found');
        }
        
    } catch (error) {
        console.log(error.message)
        res.redirect('/admin/categoryList?errorMessage=Category not found');
    }

  }

  module.exports = {
    
    //category management
    categoryList,
    addCategory,
    blockCategory,
    editCategory,
    insertEditedCategory,
    deleteCategory

}