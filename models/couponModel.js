const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
  },
  discountPercentage: {
    type: Number,
    required: true,
    min:0,
    max:100
  },
  NumberOfUses:{
    type: Number,
  },
  countUses: {
    type: Number,
  },
  user:[{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  startDate: {
    type: Date,
    required: true,
  },
  expireDate: {
    type: Date,
    required: true,
  },
  minimumSpend: {
    type: Number, 
    required: true,
  },
  status : {
    type : Number, 
    default : true
}
});
couponSchema.index({ expireDate: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Coupon', couponSchema);