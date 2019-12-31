const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const orderSchema = new Schema({
    products: [
        {
            product: {
                type: Object,
            },
            quantity: Number
        }
    ],
    user: {
        email: {
            type: String,
            required: true
        },
        userId: {
            type: Schema.Types.ObjectID,
            required: true,
            ref: 'User'
        }
    }
});

module.exports = mongoose.model('Order', orderSchema);