require('dotenv/config');

const express = require('express');
const app = express();
const morgan = require('morgan');
const mongoose = require('mongoose');
const productsRouter = require('./routes/products');
const categoryRouter = require('./routes/category');
const orderRouter = require('./routes/order');
const userRouter = require('./routes/user');
const cors = require('cors');
const api = process.env.API_URL;
const authJWT = require('./helpers/jwt');
const errorHandler = require('./helpers/errorHandler');
const {
    urlencoded
} = require('express');
//Anyone can accesse to the API
app.use(cors());
app.options('*', cors());

//Middleware
app.use(express.json()); //Get json documents
app.use(urlencoded({
    extended: false
}));
app.use(morgan('tiny'));
app.use(authJWT());
app.use('/public/uploads', express.static(__dirname + '/public/uploads'));
app.use(errorHandler);
//Routers
app.use(`${api}/products`, productsRouter);
app.use(`${api}/category`, categoryRouter);
app.use(`${api}/order`, orderRouter);
app.use(`${api}/users`, userRouter);

//Connection to database server
mongoose.connect(process.env.CONNECTION_STRING, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('Conection is ready');
}).catch((err) => {
    console.log(err);
});

app.listen(3000, () => {
    console.log("The server is running with localhost:3000");
});