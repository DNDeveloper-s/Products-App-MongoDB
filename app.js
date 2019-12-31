const path = require('path');

require('dotenv').config();
let AWS = require('aws-sdk');

const express = require('express');
const session = require('express-session');
const bodyParse = require('body-parser');
const MongoDBStore = require('connect-mongodb-session')(session);
const flash = require('connect-flash');
const csrf = require('csurf');
const mongoose = require('mongoose');
const multer = require('multer');

const errorController = require('./controllers/error');

const User = require('./models/user');

const MONGODB_URI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PWD}@cluster0-zlxgj.mongodb.net/${process.env.MONGO_DEFAULT_DATABASE}`;
// const MONGODB_URI = 'mongodb://localhost:27017/shop';

const CSRFProtection = csrf();

const app = express();

const store = new MongoDBStore({
    uri: MONGODB_URI,
    collection: 'sessions'
});

const fileStorageProduct = multer.diskStorage({
    destination: './productImages',
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
        console.log(file);
    }
});

const fileFilter = (req, file, cb) => {
    if (
        file.mimetype === 'image/png' ||
        file.mimetype === 'image/jpg' ||
        file.mimetype === 'image/jpeg'
    ) {
        cb(null, true);
    } else {
        cb(null, false);
    }
};


app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');

app.use(bodyParse.json());
app.use(bodyParse.urlencoded({ extended: false }));
app.use(
    multer({ storage: fileStorageProduct, fileFilter: fileFilter }).single('image')
);
app.use(express.static(path.join(__dirname, 'public')));
app.use('/productImages', express.static(path.join(__dirname, 'productImages')));
app.use(session({
    secret: 'new secret',
    resave: false,
    saveUninitialized: false,
    store: store,
    cookie: {
        maxAge: 7200000
    }
}));

app.use((req, res, next) => {
    let param = {
        attributes: { /* required */
            'DefaultSMSType': 'Transactional', /* highest reliability */
            //'DefaultSMSType': 'Promotional' /* lowest cost */
        }
    };
    // Create promise and SNS service object
    let setSMSTypePromise = new AWS.SNS({apiVersion: '2010-03-31'}).setSMSAttributes(param).promise();
    // Handle promise's fulfilled/rejected states
    setSMSTypePromise.then(
        function(data) {
            // console.log(data);
            return next();
        }).catch(
        function(err) {
            // console.error(err, err.stack);
        });
});

app.use(CSRFProtection);
app.use(flash());

app.use((req, res, next) => {
    if(!req.session.user) {
        return next();
    }
    User.findById({_id: req.session.user._id})
        .then(user => {
            req.user = user;
            next();
        })
        .catch(err => {
            console.log(err);
        })
});

app.use((req, res, next) => {
    res.locals.isAuthenticated = req.session.isLoggedIn;
    if(req.session.user) {
        res.locals.user = req.user;
    } else {
        res.locals.user = null;
    }
    res.locals.csrfToken = req.csrfToken();
    next();
});
app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);
app.use(profileRoutes);

app.use(errorController.get404);

app.use((error, req, res, next) => {
    console.log(error);
    return res.json({errors: [error, 'This is message after first index']})
});

mongoose.connect(MONGODB_URI, {useNewUrlParser: true, useUnifiedTopology: true })
    .then(result => {
        console.log('Server is listening on 9000');
        app.listen( process.env.PORT || 9000);
    })
    .catch(err => console.log(err));

