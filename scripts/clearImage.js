const path = require('path');
const fs = require('fs');

const express = require('express');

const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);

const app = express();

const fileHandler = require('../utils/file');

const User = require('../models/user');
const Product = require('../models/product');

const MONGODB_URI = 'mongodb+srv://dndeveloper:Saurabh6162@cluster0-zlxgj.mongodb.net/shop';

const clearImages = () => {
    const clearImages = (cb) => {
        const p = path.join('productImages');
        fs.readdir(p, (err, data) => {
            console.log(data);
            cb(data);
        })
    };
    clearImages((fileNames) => {
        const dbImageNames = [],
            invalidImages = [];
        // console.log('Line 28 from /scripts/clear', fileNames);
        User.find()
            .then(users => {
                users.forEach(user => {
                    if(user.dp) {
                        const dpSplit = user.dp.split('\\')[1];
                        dbImageNames.push(dpSplit);
                    }
                });
                return Product.find()
            })
            .then(products => {
                products.forEach(product => {
                    const imageUrlSplit = product.imageUrl.split('\\')[1];
                    dbImageNames.push(imageUrlSplit);
                });
                // console.log('Line 45 from /scripts/clear', dbImageNames);

                // Comparing elements of two arrays
                fileNames.forEach(el => {
                    let breakIt;
                    dbImageNames.forEach(cur => {
                        if(el === cur) {
                            breakIt = true;
                            return false;
                        }
                    });
                    if (breakIt)
                        return false;
                    invalidImages.push(el);
                });
                console.log(invalidImages);

                // Deleting Images through File Handler
                invalidImages.forEach(imageName => {
                    const p = path.join('../productImages', imageName);
                    fileHandler.deleteFile(p);
                });

                // Exiting the process
                process.exit();
            })
            .catch(err => {
                console.log(err);
            })
    });
};

clearImages();

mongoose.connect(MONGODB_URI)
    .then(result => {
        // console.log('Server is listening on 8080');
        // app.listen(8080);
    })
    .catch(err => console.log(err));