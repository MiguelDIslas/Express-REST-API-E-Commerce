const express = require('express');
const router = express.Router();
const {
    User
} = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

//Get list of users
router.get('/', async (req, res) => {
    const userList = await User.find().select('-password');
    if (!userList) {
        res.status(500).json({
            success: false
        });
    }
    res.send(userList);
});


// //Get a specific user and avoid get password
// router.get('/:id',async (req, res) => {
//     const userList = await User.findById(req.params.id).select('-passwordHash');
//     if(!userList){
//         res.status(500).json({success:false});
//     }
//     res.send(userList);
// });


//Get a specific data
router.get('/:id', async (req, res) => {
    const userList = await User.findById(req.params.id).select('name phone email');
    if (!userList) {
        res.status(500).json({
            success: false
        });
    }
    res.send(userList);
});


//Method to login
router.post('/login', async (req, res) => {
    const user = await User.findOne({
        email: req.body.email
    });
    const secret = process.env.secret;
    if (!user) {
        return res.status(400).send('Usuario no encontrado');
    }
    if (user && bcrypt.compareSync(req.body.password, user.passwordHash)) {
        const token = jwt.sign({
                userId: user.id,
                isAdmin: user.isAdmin
            },
            secret, {
                expiresIn: '1d'
            }
        );
        return res.status(200).send({
            user: user.email,
            token: token
        });
    } else {
        return res.status(400).send('Contraseña incorrecta');
    }
});


//Method to post admin in database server
router.post('/', async (req, res) => {
    let user = new User({
        name: req.body.name,
        email: req.body.email,
        passwordHash: bcrypt.hashSync(req.body.passwordHash, 10),
        phone: req.body.phone,
        isAdmin: req.body.isAdmin,
        steet: req.body.steet,
        apartment: req.body.apartment,
        zip: req.body.zip,
        city: req.body.city,
        country: req.body.country
    });

    user = await user.save();
    if (!user)
        return res.status(400).send('The User cannot be created');

    res.send(user);
});


//Method to post users in database server
router.post('/register', async (req, res) => {
    let user = new User({
        name: req.body.name,
        email: req.body.email,
        passwordHash: bcrypt.hashSync(req.body.passwordHash, 10),
        phone: req.body.phone,
        isAdmin: req.body.isAdmin,
        steet: req.body.steet,
        apartment: req.body.apartment,
        zip: req.body.zip,
        city: req.body.city,
        country: req.body.country
    });

    user = await user.save();
    if (!user)
        return res.status(400).send('The User cannot be created');

    res.send(user);
});


//User count
router.get(`/get/count`, async (req, res) => {
    const userCount = await User.countDocuments((count) => count)

    if (!userCount) {
        res.status(500).json({
            success: false
        })
    }
    res.send({
        userCount: userCount
    });
});


/********** Delete method **********/
router.delete('/:id', (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).send('Invalid Product ID');
    }
    User.findByIdAndRemove(req.params.id).then(user => {
        if (user) {
            return res.status(200).json({
                success: true,
                message: 'The user is deleted'
            });
        } else {
            return res.status(404).json({
                success: false,
                message: 'The user not found'
            });
        }
    }).catch(err => {
        return res.status(400).json({
            success: false,
            message: err
        });
    });
});

module.exports = router;