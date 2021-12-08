const express = require('express');
const router = express.Router();
const {
    Product
} = require('../models/product');
const {
    Category
} = require('../models/category');
const mongoose = require('mongoose');
const multer = require('multer');
const FILE_TYPE_MAP = {
    'image/png': 'png',
    'image/jpeg': 'jpeg',
    'image/jpg': 'jpg'
}

//Storage for images
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const isValid = FILE_TYPE_MAP[file.mimetype];
        let uploadError = new Error('Invalid image type');
        if (isValid) {
            uploadError = null;
        }
        cb(uploadError, 'public/uploads')
    },
    filename: function (req, file, cb) {
        const fileName = file.originalname.split(' ').join('-');
        const extension = FILE_TYPE_MAP[file.mimetype];
        cb(null, `${fileName}-${Date.now()}.${extension}`);
    }
});

const uploadOptions = multer({
    storage: storage
});

// Get request, query mode and filter
// http://localhost:3000/api/v1/products?categories=61032796b316aa46e0a2388a  the way to get the data with query
router.get('/', async (req, res) => {
    let filter = {};
    if (req.params.categories) {
        filter = {
            category: req.query.categories.split(',')
        }
    }
    const productList = await Product.find(filter).populate('category');
    if (!productList) {
        res.status(500).json({
            success: false
        });
    }
    res.send(productList);
});


// Get specific product
router.get('/:id', async (req, res) => {
    const product = await Product.findById(req.params.id).populate('category');
    if (!product) {
        res.status(500).json({
            message: 'Not found'
        });
    }
    res.status(200).send(product);

});


// Get product count
router.get('/get/count', async (req, res) => {
    const productCount = await Product.countDocuments((count) => count);
    if (!productCount) {
        res.status(500).json({
            success: false
        });
    }
    res.send({
        productCount: productCount
    });
});


// Get specific characteristic
router.get('/get/featured/:count', async (req, res) => {
    const count = req.params.count ? req.params.count : 0;
    const products = await Product.find({
        isFeatured: true
    }).limit(+count);
    if (!products) {
        res.status(500).json({
            success: false
        });
    }
    res.send(products);
});


//Method to get a specific products and specific data
// router.get('/:id:name', async (req,res)=>{
//     const product = await Product.findById(req.params.id).select('name image -_id');
//     if(!product){
//         res.status(500).json({message: 'Not found'});
//     }
//     res.status(200).send(product);

// });


//Post request
router.post('/', uploadOptions.single('image'), async (req, res) => {

    //Validate if category exists
    const category = await Category.findById(req.body.category);
    if (!category) return res.status(400).send('Invalid category');

    const file = req.file;
    if (!file) return res.status(400).send('No image in the request');

    const fileName = req.file.filename;
    const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;

    let product = new Product({
        name: req.body.name,
        description: req.body.description,
        richDescription: req.body.richDescription,
        image: `${basePath}${fileName}`,
        brand: req.body.brand,
        price: req.body.price,
        category: req.body.category,
        countInStock: req.body.countInStock,
        rating: req.body.rating,
        numReviews: req.body.numReviews,
        isFeatured: req.body.isFeatured
    });

    product = await product.save();
    if (!product)
        return res.status(500).send('The product cannot be created');

    res.send(product);
});


//Put request
router.put('/:id', uploadOptions.single('image'), async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).send('Invalid Product ID');
    }
    //Validate if category exists    
    const category = await Category.findById(req.body.category);
    if (!category) return res.status(400).send('Invalid category');

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(400).send('Invalid product');

    const file = req.file;
    const imagePath = '';

    if (file) {
        const fileName = req.file.filename;
        const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;
        imagePath = `${basePath}${fileName}`;
    } else {
        imagePath = product.image;
    }

    const updatedProduct = await Product.findByIdAndUpdate(
        req.params.id, {
            name: req.body.name,
            description: req.body.description,
            richDescription: req.body.richDescription,
            image: imagePath,
            brand: req.body.brand,
            price: req.body.price,
            description: req.body.description,
            category: req.body.category,
            countInStock: req.body.countInStock,
            rating: req.body.rating,
            numReviews: req.body.numReviews,
            isFeatured: req.body.isFeatured
        }, {
            new: true
        }
    );
    if (!updatedProduct)
        return res.status(500).send('The product cannot be updated');

    res.send(updatedProduct);
});


//Delete request
router.delete('/:id', (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).send('Invalid Product ID');
    }
    Product.findByIdAndRemove(req.params.id).then(product => {
        if (product) {
            return res.status(200).json({
                success: true,
                message: 'The product is deleted'
            });
        } else {
            return res.status(404).json({
                success: false,
                message: 'The product not found'
            });
        }
    }).catch(err => {
        return res.status(400).json({
            success: false,
            message: err
        });
    });
});


//Update request to multiple images
router.put(
    '/gallery-images/:id',
    uploadOptions.array('images', 10),
    async (req, res) => {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).send('Invalid Product Id');
        }
        const files = req.files;
        let imagesPaths = [];
        const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;

        if (files) {
            files.map((file) => {
                imagesPaths.push(`${basePath}${file.filename}`);
            });
        }

        const product = await Product.findByIdAndUpdate(
            req.params.id, {
                images: imagesPaths
            }, {
                new: true
            }
        );

        if (!product)
            return res.status(500).send('the gallery cannot be updated!');

        res.send(product);
    }
);

module.exports = router;