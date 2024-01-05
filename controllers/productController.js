
const Product = require('../models/productModel')
const Category = require('../models/categoryModel')
const Offer = require('../models/offerModel');
const WishList = require('../models/wishListModel')

const productList = async(req,res)=>{

    try {
        const productData = await Product.find({}).populate('category').populate('offer')

        res.render('productList',{ productData , baseURL:'http://localhost:3000/',})
    } catch (error) {
        console.log(error.message)
        res.status(500).render('error',{message: error.message})
    }

}

const addProduct = async(req,res)=>{

    try {
        const allCategory = await Category.find({})
        const allOffers = await Offer.find({status : true});
        console.log('allOffers:', allOffers);
        res.render('addProduct', {allCategory, allOffers})
    } catch (error) {
        console.log(error.message)
        res.status(500).render('error',{message: error.message})
    }

}

const insertProduct = async(req,res)=>{
    const allCategory = await Category.find({is_blocked:0})
    const allOffers = await Offer.find();
    try {
        const name = req.body.name
        const similarData = await Product.findOne({ name: new RegExp(`^${name}$`, 'i') })
        if(similarData){
            res.render('addProduct',{message1:"This product already exists..", allCategory, allOffers})
        }else{
            const imagePaths = req.files.map(file => file.path);

            const category = await Category.findOne({ name: req.body.category });
            const categoryId = category ? category._id : null;

            let offerId = req.body.offer;

            if (offerId === 'Select an offer (optional)') {
                offerId = null; 
            }

            const product = new Product({
                name: req.body.name,
                category: categoryId,
                price: req.body.price,
                offer: offerId,
                offerPrice: req.body.offerPrice,
                stock: req.body.stock,
                description: req.body.description,
                image: imagePaths   
            }) 
            const productData = await product.save()
        

            if(productData){
                res.render('addProduct',{message2:"You added a product successfully..", allCategory, allOffers})
            }else{
                const validationErrors = extractValidationErrors(error);
                res.render('addProduct', { errors: validationErrors, allCategory, allOffers });
            }
        }
        
    } catch (error) {
        const validationErrors = extractValidationErrors(error);
        res.render('addProduct', { errors: validationErrors, allCategory, allOffers });
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

const unListProduct =async(req,res)=>{

    try {

        const product_id = req.query.id
        const productData = await Product.findById({_id: product_id})

        if (productData) {
            productData.unlist = !productData.unlist; 
            await productData.save();

            res.redirect('/admin/productList');
           
        } else {      
            res.status(404).send('Product not found');
        }

    } catch (error) {
        console.log(error.message)
        res.status(500).render('error',{message: error.message})
    }

}

const editProduct = async(req,res)=>{

    try {
        const id = req.query.id
        const product = await Product.findById({_id: id}).populate('category').populate('offer')
        const allCategory = await Category.find({})
        const allOffers = await Offer.find({status: true});
        console.log('reached here')
        res.render('editProduct', { product, allCategory, allOffers, baseURL:'http://localhost:3000/' })
    } catch (error) {
        console.log(error.message)
        res.status(500).render('error',{message: error.message})
    }

}

const updateProduct = async (req, res) => {
    const allCategory = await Category.find({})
    const allOffers = await Offer.find();
    const product = await Product.findById({_id: req.body.id}).populate('category').populate('offer')
    const existingProduct = await Product.findById(req.body.id).populate('category');
    try {
        let imagePaths = [];

        if (req.files && req.files.length > 0) {
            imagePaths = req.files.map(file => file.path);
        } else {
            imagePaths = existingProduct.image;
        }
        const category = await Category.findOne({ name: req.body.category });
        const categoryId = category ? category._id : null;

        let offerId = req.body.offer;

            if (!offerId || offerId === 'Select an offer (optional)') {
                offerId = null; 
            }

        const productData = await Product.findByIdAndUpdate(
            { _id: req.body.id },
            {
                $set: {
                    name: req.body.name,
                    category: categoryId,
                    price: req.body.price,
                    offer: offerId,
                    offerPrice: req.body.offerPrice,
                    stock: req.body.stock,
                    description: req.body.description,
                    image: imagePaths,
                },
            },
            { new: true }
        ).populate('category').populate('offer')

        console.log(productData);
        if (productData) {
            res.redirect('/admin/productList?successMessage=Product updated successfully');
        } else {
            res.render('editProduct', { allCategory, errors: 'Product with this name already exists.', product: existingProduct, allOffers,  baseURL: 'http://localhost:3000/' });
        }
    } catch (error) {
        console.error(error);
        // const validationErrors = extractValidationErrors(error);
        // console.log(validationErrors); // Log validation errors for debugging
        // res.render('editProduct', { allCategory, errors: validationErrors, product: existingProduct, allOffers, baseURL: 'http://localhost:3000/' });
        if (error.name === 'ValidationError') {
            // Handle validation errors
            const validationErrors = extractValidationErrors(error);
            console.log(validationErrors); // Log validation errors for debugging
            res.render('editProduct', {
                allCategory,
                errors: validationErrors,
                product: existingProduct,
                allOffers,
                baseURL: 'http://localhost:3000/',
            });
        } else {
            // Handle other types of errors
            res.status(500).render('error',{message: error.message})
        }
    }
};

const deleteProduct = async(req,res)=>{

    try {
        const id = req.query.id
        const deleteProduct = await Product.findByIdAndDelete(id)
        if(deleteProduct){
            res.redirect('/admin/productList?successMessage=Product deleted successfully');
        }else{
            res.redirect('/admin/productList?errorMessage=Product not found');
        }
        
    } catch (error) {
        console.log(error.message)
        res.redirect('/admin/productList?errorMessage=An error occurred while deleting the product');
    }

}

const deleteImage = async(req,res)=>{

    try {
        const id = req.query.id
        const image = decodeURIComponent(req.query.image)

        const existingProduct = await Product.findById(id);
        console.log('Existing Product:', existingProduct);
        console.log(image)

        const updatedProduct = await Product.findByIdAndUpdate(
            { _id: id },
            { $pull: { image: image } },
            { new: true }
        );

        if (updatedProduct) {
            console.log('Redirecting to editProduct:', `/admin/editProduct?id=${id}`);
            res.redirect('/admin/editProduct?id='+id);
        } else {
            console.log('Failed to update product. Redirecting to editProduct:', `/admin/editProduct?id=${id}`);
            res.redirect('/admin/editProduct?id='+id);
        }
        
    } catch (error) {
        console.log(error.message)
        res.redirect(`/admin/editProduct?id=${id}&errorMessage=${encodeURIComponent(error.message)}`);
    }

}

const productDetail = async (req,res)=>{

    try {
        const productId = req.params.productId;
        const product = await Product.findById(productId).populate('category');
        const allCategory = await Category.find({ is_blocked: 0 });

        const userWishlistItems = await WishList.find({ user_id: req.session.user_id })
            .populate({
                path: 'product_id',
                populate: {
                    path: 'offer',
                },
                select: ['price', 'offerPrice', 'name', 'stock', 'offer'],
            });

        const userWishlist = userWishlistItems.map(item => item.product_id._id.toString());
        res.render('productDetail', {product, allCategory, userWishlist, baseURL: 'http://localhost:3000/' })
        
    } catch (error) {
        console.log(error.message)
        res.status(500).render('error',{message: error.message})
    }

}

const productDetailView = async (req,res)=>{

    try {
        const productId = req.params.productId;
        const product = await Product.findById(productId).populate('category');
        const allCategory = await Category.find({ is_blocked: 0 });

        // Find the user's wishlist items
        const userWishlistItems = await WishList.find({ user_id: req.session.user_id })
            .populate({
                path: 'product_id',
                populate: {
                    path: 'offer',
                },
                select: ['price', 'offerPrice', 'name', 'stock', 'offer'],
            });

        // Extract product IDs from the user's wishlist items
        const userWishlist = userWishlistItems.map(item => item.product_id._id.toString());

        res.render('productDetailView', {product, allCategory, userWishlist, baseURL: 'http://localhost:3000/' })
        
    } catch (error) {
        console.log(error.message)
        res.status(500).render('error',{message: error.message})
    }

}

const categoryView = async (req,res)=>{

try {
    var search = ''
        if(req.query.search){
            search = req.query.search
        }

        var category = '';
        if (req.params.category) {
            category = req.params.category;
        }

        var sort = 'lowToHigh';
        if (req.query.sort && (req.query.sort === 'highToLow' || req.query.sort === 'lowToHigh')) {
        sort = req.query.sort;
        }

        var page = 1
        if(req.query.page){
            page = req.query.page
        }

        const limit = 8

        const categoryName = req.params.category;
        const allCategory = await Category.find({ is_blocked: 0});
        
        let query;
        if (category) {
            const categoryObject = await Category.findOne({ name: categoryName });
            query = {
                unlist: 0,
                name: { $regex: '.*' + search + '.*', $options: 'i' },
                category: categoryObject ? categoryObject._id : null,
                
            };
        }

        const sortOptions = {};
        if (sort === 'lowToHigh') {
        sortOptions.price = 1;
        } else {
        sortOptions.price = -1;
        }

        const allProduct = await Product.find(query)
        .populate('offer')
        .populate('category')
        .sort(sortOptions)
        .limit(limit * 1)
        .skip((page - 1) * limit)

        // Find the user's wishlist items
        const userWishlistItems = await WishList.find({ user_id: req.session.user_id })
            .populate({
                path: 'product_id',
                populate: {
                    path: 'offer',
                },
                select: ['price', 'offerPrice', 'name', 'stock', 'offer'],
            });

        // Extract product IDs from the user's wishlist items
        const userWishlist = userWishlistItems.map(item => item.product_id._id.toString());

        const count = await Product.find(query)
        .countDocuments()

        res.render('productCategoryWiseView', {
            allCategory, 
            allProduct,
            totalPages: Math.ceil(count/limit),
            currentPage: parseInt(page),
            search,
            category,
            sort,
            userWishlist,
            baseURL:'http://localhost:3000/'})
    

} catch (error) {
    console.log(error.message)
    res.status(500).render('error',{message: error.message})
}

}

module.exports = {

    //product management
    productList,
    addProduct,
    insertProduct,
    extractValidationErrors,
    unListProduct,
    editProduct,
    updateProduct,
    deleteProduct,
    deleteImage,
    //user side
    productDetail,
    productDetailView,
    categoryView


}