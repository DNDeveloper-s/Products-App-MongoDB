const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    verifyEmailToken: String,
    verifyEmailTokenExpiration: Date,
    isEmailVerified: Boolean,
    verifyOtpToken: String,
    verifyOtpTokenExpiration: Date,
    mobileNumber: Number,
    isOtpVerified: Boolean,
    resetToken: String,
    resetTokenExpiration: Date,
    address: {
        type: String,
        required: false
    },
    dp: {
        type: String,
        required: false
    },
    bio: {
        type: String,
        required: false
    },
    cart: {
        items: [{
            productId: {
                type: Schema.Types.ObjectID,
                required: true,
                ref: 'Product'
            },
            quantity: {
                type: Number,
                required: true}
        }]
    }
});

userSchema.methods.addToCart = function(product) {
    const cartProductIndex = this.cart.items.findIndex(p => p.productId.toString() === product._id.toString());

    let newQuantity = 1;

    let updatedCartItems = [...this.cart.items];

    if(cartProductIndex >= 0) {
        newQuantity = this.cart.items[cartProductIndex].quantity + 1;
        updatedCartItems[cartProductIndex].quantity = newQuantity;
    } else {
        updatedCartItems.push({productId: product._id, quantity: 1});
    }

    const updatedCart = {
        items: updatedCartItems
    };

    this.cart = updatedCart;

    return this.save()
};

userSchema.methods.getCart = function () {
    return this.cart.items;
};

userSchema.methods.deleteCartItemById = function (id) {
    this.cart.items = this.cart.items.filter(p => p.productId.toString() !== id.toString());
    return this.save();
};

module.exports = mongoose.model('User', userSchema);