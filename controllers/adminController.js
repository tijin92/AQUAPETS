const Admin = require('../models/adminModel')
const User = require('../models/userModel')
const Product = require('../models/productModel')
const Category = require('../models/categoryModel')
const bcrypt = require('bcrypt')
const Order = require('../models/orderModel')
const otpGenerator = require('otp-generator')
const excelJS = require('exceljs')

//html to pdf generate require things
const ejs = require('ejs')
const pdf = require('html-pdf')
const fs = require('fs')
const path = require('path')

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

const securePassword = async(password)=>{
    try {
        const passwordHash = await bcrypt.hash(password, 10)
        return passwordHash
    } catch (error) {
        console.log(error.message);
    }
}

const loadRegister = async(req,res)=>{
    try {

        res.render('registration')
        
    } catch (error) {
        console.log(error.message)
        res.status(500).render('error',{message: error.message})
    }
}

const insertAdmin = async(req,res)=>{

    try {
        const { name, email, password, mobile } = req.body;
        
        const user1 = await Admin.findOne({ email: email });
        const user2 = await Admin.findOne({ mobile: mobile });
        console.log(user1)

        if (user1 && user1.email === email) {
            res.render('registration', { message1: "Email is already registered." });
        } else if (user2 && user2.mobile === mobile) {
            res.render('registration', { message1: "Mobile number is already registered." });
        } else {
            
            const spassword = await securePassword(password);
            const admin = new Admin({
                name,
                email,
                password: spassword,
                mobile,
                is_admin: 0,
                
            })
            const adminData = await admin.save()
            if(adminData){
                
                res.render('registration',{message2: "Your registeration is successful.."})
            }else{
                res.render('registration',{message1: "Your registeration has been failed.."})
            }
        }
        
    } catch (error) {
        console.log(error.message)
        res.status(500).render('error',{message: error.message})
    }

}

//to generate otp 
const otpStore = {}; 

const generateOtp = () => {
    const registrationOTP = otpGenerator.generate(6, { digits: true, alphabets: false, upperCase: false });
    const expDate = Date.now() + 10 * 60 * 1000;
    otpStore[registrationOTP] = expDate;
    return { otp: registrationOTP, expDate };
}

const loadLogin = async(req,res)=>{

    try {
        res.render('login')        
    } catch (error) {
        console.log(error.message)
        res.status(500).render('error',{message: error.message})
    }

}

const verifyLogin = async(req,res)=>{

    try {
        const email = req.body.email
        const password = req.body.password
        const adminData = await Admin.findOne({email: email})
        
        if (adminData) {
            const passwordMatch = await bcrypt.compare(password, adminData.password)

            if (passwordMatch) {
                req.session.admin_id = adminData._id
                res.redirect('/admin/home')
            } else {
                res.render('login', {message1: "Email and password is incorrect"})
            }
            
        } else {
            res.render('login', {message1: "Email and password is incorrect"})
        }
        
    } catch (error) {
        console.log(error.message)
        res.status(500).render('error',{message: error.message})
    }

}

const loadDashboard = async(req,res)=>{


    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Fetch today's revenue
        const todayRevenue = await Order.aggregate([
            {
                $match: {
                    orderDate: { $gte: today },
                    status: { $ne: 'Pending' }
                },
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$totalAmount' },
                },
            },
        ]);

        // Fetch total revenue
        const totalRevenue = await Order.aggregate([
            {
                $match: {
                    status: { $ne: 'Pending' }
                },
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$totalAmount' },
                },
            },
        ]);

        // Fetch today's sales count
        const todaySales = await Order.countDocuments({
            orderDate: { $gte: today },
            status: { $ne: 'Pending' }
        });

        // Fetch total sales count
        const totalSales = await Order.countDocuments({status: { $ne: 'Pending' }});

        console.log('Today Revenue:', todayRevenue);
        console.log('Total Revenue:', totalRevenue);
        console.log('Today Sales:', todaySales);
        console.log('Total Sales:', totalSales);

        const allMonths = Array.from({ length: 12 }, (_, i) => i + 1);
        // Fetch monthly revenue
        const monthlyRevenue = await Order.aggregate([
            {
                $match: {
                    orderDate: { $gte: new Date(today.getFullYear(), 0, 1) },
                    status: { $ne: 'Pending' }
                },
            },
            {
                $group: {
                    _id: { $month: '$orderDate' },
                    total: { $sum: '$totalAmount' },
                },
            },
        ]);

        // Fetch monthly sales count
        const monthlySales = await Order.aggregate([
            {
                $match: {
                    orderDate: { $gte: new Date(today.getFullYear(), 0, 1) },
                    status: { $ne: 'Pending' }
                },
            },
            {
                $group: {
                    _id: { $month: '$orderDate' },
                    count: { $sum: 1 },
                },
            },
        ]);

        const filledMonthlyRevenue = allMonths.map(month => ({
            _id: month,
            total: (monthlyRevenue.find(entry => entry._id === month) || { total: 0 }).total,
        }));

        const filledMonthlySales = allMonths.map(month => ({
            _id: month,
            count: (monthlySales.find(entry => entry._id === month) || { count: 0 }).count,
        }));

        // Render the home template with the fetched data
        res.render('home', {
            todayRevenue: todayRevenue.length > 0 ? todayRevenue[0].total : 0,
            totalRevenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0,
            todaySales,
            totalSales,
            monthlyRevenue,
            monthlySales,
            filledMonthlyRevenue,
            filledMonthlySales,
        });

    } catch (error) {
        console.log(error.message)
        res.status(500).render('error',{message: error.message})
    }

}

const logout = async(req,res)=>{

    try {

        delete req.session.admin_id;
        res.redirect('/admin')
        
    } catch (error) {
        console.log(error.message)
        res.status(500).render('error',{message: error.message})
    }

}

const userList = async(req,res)=>{

    try {
        const users = await User.find({})
        res.render('userList',{ users })
    } catch (error) {
        console.log(error.message)
        res.status(500).render('error',{message: error.message})
    }

}

const blockUser = async (req,res)=>{

    try {
        const id = req.query.id;
        const userData = await User.findById({_id: id });

        if (userData) {
            userData.is_blocked = !userData.is_blocked; 
            await userData.save();

            res.redirect('/admin/userList');
           
        } else {      
            res.status(404).render('error',{message: 'User not found'})
        }
          
        
    } catch (error) {
        console.error(error.message);
    } 

}
  
  const searchUser = async (req, res) => {
    try {
        const searchItem = req.body.searchItem;
        const users = await User.find({
            $and: [
                { name: { $regex: `^${searchItem}`, $options: 'i' } },
                { is_admin: { $not: { $eq: 1 } } }
            ]
        });
        
        // Render a partial view with the search results (search-results.ejs).
        res.render('search-results.ejs', { users });
    } catch (error) {
        console.log(error.message);
        res.status(500).render('error',{message: error.message})
    }
};

const salesReport = async(req,res)=>{

    try {
        const orders = await Order.find({ status: { $ne: 'Pending' } }) 
            .populate('user_id')
            .populate('orderItems.product')
            .sort({ orderDate: -1 })

        res.render('salesReport',{ orders })    
    } catch (error) {
        console.log(error.message)
        res.status(500).render('error',{message: error.message})
    }

}

const salesReportExcel = async (req,res)=>{

    try {
        const workbook = new excelJS.Workbook()
        const worksheet = workbook.addWorksheet("Sales Report Excel Sheet")
        
        worksheet.columns = [
            { header:"S no.", key:"S_no"},
            { header:"OrderID", key:"orderID"},
            { header:"Payment", key:"paymentMethod"},
            { header:"Total Amount", key:"totalAmount"},
            { header:"Date", key:"orderDate"},
            { header:"Status", key:"status"},
        ]
        let counter = 1
        let totalAmount = 0;

        const orders = await Order.find({ status: { $ne: 'Pending' } }) 
            .populate('user_id')
            .populate('orderItems.product')
            .sort({ orderDate: -1 })
        
        orders.forEach((order) => {
            order.S_no = counter
            totalAmount += order.totalAmount;
            worksheet.addRow(order)
            counter++
        })

        worksheet.addRow({ totalAmount: 'Total Amount', totalAmount: totalAmount });

        worksheet.getRow(1).eachCell((cell) => {
            cell.font = { bold:true }
        })

        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )

        res.setHeader("Content-Disposition",`attachment; filename=Sales_Report.xlxs`)

        return workbook.xlsx.write(res).then(()=>{
            res.status(200)
        })

    } catch (error) {
        console.log(error.message)
        res.status(500).render('error',{message: error.message})
    }

}

const salesReportPDF = async (req,res)=>{

    try {
        const orders = await Order.find({ status: { $ne: 'Pending' } }) 
            .populate('user_id')
            .populate('orderItems.product')
            .sort({ orderDate: -1 })
        
        const data ={
            orders: orders
        }
        const filepathName = path.resolve(__dirname,'../views/admin/htmltopdf.ejs')
        const htmlString = fs.readFileSync(filepathName).toString()
        let options = {
            format: 'Letter'
        }
        const ejsData = ejs.render(htmlString, data);

        pdf.create(ejsData, options).toBuffer((err, buffer) => {
            if (err) {
                console.log('Error creating PDF:', err);
                res.status(500).render('error',{message: err.message})
            } 
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=salesReport.pdf`);
            res.end(buffer);
        });

    } catch (error) {
        console.log(error.message)
        res.status(500).render('error',{message: error.message})
    }

}

module.exports = {
    loadRegister,
    insertAdmin,
    loadLogin,
    verifyLogin,
    loadDashboard,
    salesReport,
    salesReportExcel,
    salesReportPDF,
    logout,
    // user management
    userList,
    blockUser,
    searchUser,
    

}