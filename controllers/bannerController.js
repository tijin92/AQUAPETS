const Product = require('../models/productModel')
const Category = require('../models/categoryModel')
const Banner = require('../models/bannerModel')
const Offer = require('../models/offerModel')

const addBanner = async (req,res)=>{

    try {
        const allCategory = await Category.find({})
        const allOffers = await Offer.find({status : true});
        const banner = await Banner.find({status : 1})
        console.log('allOffers:', allOffers);
        res.render('addBanner', {allCategory, allOffers, banner})
    } catch (error) {
        console.log(error.message)
        res.status(500).render('error',{message: error.message})
    }

}

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

const insertBanner = async(req,res)=>{
    const allCategory = await Category.find({is_blocked:0})
    const allOffers = await Offer.find();
    try {
        const title = req.body.title
        const similarTitle = await Banner.findOne({ title: new RegExp(`^${title}$`, 'i') })
        if(similarTitle){
            res.render('addBanner',{message1:"This banner already exists..", allCategory, allOffers})
        }else{
            const imagePaths = req.file.filename
            const bannerCategory = '/user/'+req.body.bannerURL+'?search=&sort=lowToHigh'
            

            const banner = new Banner({
                title: req.body.title,
                description: req.body.description,
                image: imagePaths,
                bannerURL: bannerCategory,
                URL_buttonText: req.body.URL_buttonText,
                textAlignment: req.body.textAlignment,
                status: 1   
            }) 
            const bannerData = await banner.save()
        

            if(bannerData){
                res.render('addBanner',{message2:"You added a banner successfully..", allCategory, allOffers})
            }else{
                const validationErrors = extractValidationErrors(error);
                res.render('addBanner', { errors: validationErrors, allCategory, allOffers });
            }
        }
        
    } catch (error) {
        const validationErrors = extractValidationErrors(error);
        res.render('addBanner', { errors: validationErrors, allCategory, allOffers });
    }

}

const viewBanner = async (req,res)=>{

    try {
        const bannerData = await Banner.find({})
        .sort({ _id: -1 })
        .exec();

        res.render('bannerList',{ bannerData , baseURL:'http://localhost:3000/',})
    } catch (error) {
        console.log(error.message)
        res.status(500).render('error',{message: error.message})
    }

}

const unListBanner = async (req,res)=>{

    try {
        const banner_id = req.query.id
        const bannerData = await Banner.findById({_id: banner_id})

        if (bannerData) {
            bannerData.status = !bannerData.status; 
            await bannerData.save();

            res.redirect('/admin/viewBanner');
           
        } else {      
            res.status(404).send('Product not found');
        }
        
    } catch (error) {
        console.log(error.message) 
        res.status(500).render('error',{message: error.message})
    }

}

const editBanner = async (req,res)=>{

    try {
        const id = req.query.id
        const banner = await Banner.findById({_id: id})
        const allCategory = await Category.find({})
        const allOffers = await Offer.find({status: true});
        console.log('reached here')

        res.render('editBanner', { banner, allCategory, allOffers, baseURL:'http://localhost:3000/' })
    } catch (error) {
        console.log(error.message)
        res.status(500).render('error',{message: error.message})
    }

} 

const updateBanner = async (req, res) => {
    try {
        const bannerId = req.body.bannerId;
        console.log('bannerId: ',bannerId)
        const banner = await Banner.findById({_id: bannerId});

        if (!banner) {
            return res.status(404).send('Banner not found');
        }

        const bannerCategory = '/user/'+req.body.bannerURL+'?search=&sort=lowToHigh'

        banner.title = req.body.title;
        banner.description = req.body.description;

        if (req.file) {
            banner.image = req.file.filename;
        }

        if (req.body.bannerURL) {
            banner.bannerURL = bannerCategory;
        }

        banner.URL_buttonText = req.body.URL_buttonText;
        banner.status = req.body.status;
        banner.textAlignment = req.body.textAlignment;

        const updatedBanner = await banner.save();

        const allCategory = await Category.find({})
        const allOffers = await Offer.find({status: true});
        if(updatedBanner){
            res.render('editBanner', { banner, allCategory, allOffers, baseURL:'http://localhost:3000/', message2:"banner updated succesfully"}); 
        } else{
            res.render('editBanner', { banner, allCategory, allOffers, baseURL:'http://localhost:3000/', message1:"banner updation failed"}); 
        }
        
    } catch (error) {
        console.error(error);
        res.status(500).render('error',{message: error.message})
    }
};

const deleteBanner = async (req,res)=>{

    try {
        const id = req.query.id
        const deleteBanner = await Banner.findByIdAndDelete(id)
        if(deleteBanner){
            res.redirect('/admin/viewBanner?successMessage=Product deleted successfully');
        }else{
            res.redirect('/admin/viewBanner?errorMessage=Product not found');
        }
        
    } catch (error) {
        console.log(error.message)
        res.redirect('/admin/productList?errorMessage=An error occurred while deleting the product');
    }

}

module.exports = {
    addBanner,
    insertBanner,
    viewBanner,
    unListBanner,
    editBanner,
    updateBanner,
    deleteBanner
}