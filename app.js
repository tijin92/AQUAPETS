const createError = require('http-errors');
const dbConnect = require('./config/dbConnect');
const express = require('express');
const path = require('path');
const app = express();
const dotenv = require('dotenv').config()
const nocache = require('nocache');
const sharp = require('sharp');

app.use(nocache())
dbConnect()

const  cookieParser = require('cookie-parser');
const  logger = require('morgan');
app.set('view engine', 'ejs');

//for user routes
const  userRouter = require('./routes/user');
app.use('/', userRouter);

//for admin routes
const  adminRouter = require('./routes/admin');
app.use('/', adminRouter);

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static('public'));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
