const User = require('../models/userModel');

const isLogin = async (req, res, next) => {
    try {
        if (req.session.user_id) {
            const user = await User.findById({ _id: req.session.user_id });
            if (user && user.is_blocked === 1) {
                delete req.session.user_id;
                res.redirect('/user');
            } 
            next();
        } else {
            res.redirect('/user');
        }
    } catch (error) {
        console.log(error.message);
    }
}

const isLogout = async (req, res, next) => {
    try {
        if (req.session.user_id) {
            res.redirect('/user/home');
        } 
            next()
    } catch (error) {
        console.log(error.message);
        res.redirect('/user');
    }
}


module.exports = {
    isLogin,
    isLogout,
};
