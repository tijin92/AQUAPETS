const User = require('../models/userModel')
const Product = require('../models/productModel')
const Category = require('../models/categoryModel')
const Cart = require('../models/cartModel')
const Order = require('../models/orderModel')
const Offer = require('../models/offerModel')

const addOffer = async (req,res)=>{

    try {
        const allCategory = await Category.find({})
        res.render('addOffer', {allCategory})
    } catch (error) {
        console.log(error.message)
        res.status(500).render('error',{message: error.message})
    }

}

const submitAddOffer = async (req,res)=>{

    try {
        
        const { startingDate, expiryDate, percentage } = req.body
        const name = req.body.name
        const offerExist = await Offer.findOne({ name : name })
        if( offerExist ) {
            res.render('addOffer',{message1:'Offer already existing'})
        } else {
         const offer = new Offer({
            name : name,
            startingDate : startingDate, 
            expiryDate : expiryDate,
            percentage : percentage,
         }) 
         await offer.save()
         res.render('addOffer',{message2:'New Offer Saved'})
        }
    } catch (error) {
        console.log(error.message)
        res.status(500).render('error',{message: error.message})
    }

}

const offer = async (req,res)=>{

    try {
        const offers = await Offer.find()
        const allCategory = await Category.find({})
        console.log(offers)
        res.render('offer', {allCategory, offers})
    } catch (error) {
        console.log(error.message)
        res.status(500).render('error',{message: error.message})
    }

}

const updateOfferStatus = async (req, res) => {
    const offers = await Offer.find();
    const allCategory = await Category.find({});
    try {
        const id = req.query.id;
        const updatedOffer = await Offer.findById(id);
        console.log(updatedOffer);

        if (updatedOffer) {
            // Toggle the status
            updatedOffer.status = !updatedOffer.status;

            // Save the updated offer
            await updatedOffer.save();

            res.redirect('/admin/viewOffer');
        } else {
            res.render('offer', { allCategory, offers, now: new Date(), message1: "Status updation failed" });
        }

    } catch (error) {
        console.error(error.message);
        res.render('offer', { allCategory, offers, now: new Date(), message1: "Status updation failed" });
    }
};




const editOffer = async (req,res)=>{
    const allOffers = await Offer.find();
    const allCategory = await Category.find({});
    try {
        const id = req.query.id;
        const editOffer = await Offer.findById({ _id: id });
        if(editOffer){
            res.render('editOffer',{allCategory, allOffers, offer:editOffer})
        }else{
            res.render('offer', { allCategory, allOffers, now: new Date(), message1: "error loading edit offer page" });
        }
        
    } catch (error) {
        console.error(error.message);
        res.status(500).render('error',{message: error.message})
    }
}

const submitEditOffer = async (req,res)=>{
    const offers = await Offer.find();
    const allCategory = await Category.find({});
    try {
        const id = req.body.id;
        const updatedOffer = await Offer.findByIdAndUpdate({ _id: id }, { $set: { name: req.body.name, startingDate: req.body.startingDate, expiryDate: req.body.expiryDate, percentage: req.body.percentage, status: req.body.status} },{ new: true });

        if (updatedOffer) {
            res.redirect('/admin/viewOffer?successMessage=offer updated successfully');
        } else {
            res.render('editOffer', { allCategory, offers, message1: 'offer updation failed.'});
        }
        
    } catch (error) {
        console.error(error.message);
        res.render('editOffer', { allCategory, offers, message1: 'An error occurred during offer updation.' });
    }

}



module.exports = {
    //user side
    
    //admin side
    addOffer,
    offer,
    submitAddOffer,
    updateOfferStatus,
    editOffer,
    submitEditOffer
    
}