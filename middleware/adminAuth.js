

const isLogin = async (req, res, next) => {
    try {
        if (req.session.admin_id) {         
            
        } else {
            res.redirect('/admin');
        }
        next();
    } catch (error) {
        console.log(error.message);
        res.redirect('/admin');
    }
}

const isLogout = async (req, res, next) => {
    try {
        if (req.session.admin_id) {         
            res.redirect('/admin/home');
        } 
            next()
      
    } catch (error) {
        console.log(error.message);
        res.redirect('/admin');
    }
}

module.exports = {
    isLogin,
    isLogout
}