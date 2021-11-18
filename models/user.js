const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    cart: {
        items: [
            { productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
            quantity: { type: Number, required: true } }]
    }
});

userSchema.methods.addToCart = function(product) {
    const { cart: { items }} = this;
    const cartProductIndex = items.findIndex(cp => cp.productId.toString() === product._id.toString());
    let newQuantity = 1;
    const updatedCartItems = [...items];

    if (cartProductIndex >= 0) {
        newQuantity = items[cartProductIndex].quantity + 1;
        updatedCartItems[cartProductIndex].quantity = newQuantity;
    } else {
        updatedCartItems.push({ productId: product._id, quantity: newQuantity });
    }
    
    const updatedCart = {items: updatedCartItems};
    this.cart = updatedCart;
    return this.save();
}

userSchema.methods.removeFromCart = function(productId) {
    const updatedCartItems = this.cart.items
    .filter(item => item.productId.toString() !== productId.toString());
    this.cart.items = updatedCartItems;
    return this.save();
}

userSchema.methods.clearCart = function() {
    this.cart = { items: [] };
    return this.save();
}

module.exports = mongoose.model('User', userSchema);

// const mongodb = require('mongodb');
// const { getDb } = require("../util/database");
// const { ObjectId } = mongodb;

// class User {
//     constructor(name, email, cart, id) {
//         this.name = name;
//         this.email = email;
//         this.cart = cart;
//         this._id = id;
//     }

//     save() {
//         return getDb().collection('users')
//             .insertOne(this)
//             .then(err => console.log(res))
//             .catch(err => console.log(err));
//     }

//     addToCart(product) {
//         const { cart: { items }} = this;
//         const cartProductIndex = items.findIndex(cp => cp.productId.toString() === product._id.toString());
//         let newQuantity = 1;
//         const updatedCartItems = [...items];

//         if (cartProductIndex >= 0) {
//             newQuantity = items[cartProductIndex].quantity + 1;
//             updatedCartItems[cartProductIndex].quantity = newQuantity;
//         } else {
//             updatedCartItems.push({ productId: new ObjectId(product._id), quantity: newQuantity });
//         }
        
//         const updatedCart = {items: updatedCartItems};
//         return getDb().collection('users')
//             .updateOne({_id: new ObjectId(this._id)}, { $set: { cart: updatedCart }})
//             .then(res => console.log(res))
//             .catch(err => console.log(err));
//     }

//     getCart() {
//         const {cart: { items }} = this;
//         const productIds = items.map(i => i.productId)
//         return getDb().collection('products')
//             .find({_id: {$in: productIds}})
//             .toArray()
//             .then(products => {
//                 return products.map(p => {
//                     return {...p, quantity: items.find(i => {
//                         return i.productId.toString() === p._id.toString()
//                     }).quantity}
//                 })
//             })
//             .catch(err => console.log(err));
//     }

//     deleteItemFromCart(productId) {
//         const { cart: { items }} = this;
//         const updatedCartItems = items
//             .filter(item => item.productId.toString() !== productId.toString());
//         return getDb().collection('users')
//             .updateOne({ _id: new ObjectId(this._id)}, { $set: { cart: { items: updatedCartItems}}})
//             .then()
//             .catch(err => console.log(err));
//     }

//     addOrder() {
//         const db = getDb();
//         return this.getCart()
//             .then(products => {
//                 const order = {
//                     items: products,
//                     user: {
//                         _id: new ObjectId(this._id),
//                         name: this.name
//                     }
//                 };
//                 return db.collection('orders').insertOne(order)
//             })        
//             .then(result => {
//                 this.cart = { items: []};
//                 return db.collection('users')
//                     .updateOne({ _id: new ObjectId(this._id)}, { $set: { cart: { items: []}}})
//             })
//             .catch();
//     }

//     getOrders() {
//         return getDb().collection('orders')
//             .find({'user._id': new ObjectId(this._id)})
//             .toArray();
//     }

//     static findById(userId) {
//         return getDb().collection('users')
//             .findOne({_id: new ObjectId(userId)})
//             .then(user => user)
//             .catch(err => console.log(err));
//     }
// }

// module.exports = User;