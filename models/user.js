const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    name: {
        type: String,
        requiered: true,
    },
    email: {
        type: String,
        requiered: true,
    },
    passwordHash: {
        type: String,
        requiered: true
    },
    phone: {
        type: String,
        requiered: true,
    },
    isAdmin: {
        type: Boolean,
        requiered: false
    },
    steet: {
        type: String,
        default: '',
    },
    apartment: {
        type: String,
        default: '',
    },
    zip: {
        type: String,
        default: '',
    },
    city: {
        type: String,
        default: '',
    },
    country: {
        type: String,
        default: ''
    }

});

userSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

userSchema.set('toJSON', {
    virtuals: true,
});

exports.User = mongoose.model('User', userSchema);
exports.userSchema = userSchema;