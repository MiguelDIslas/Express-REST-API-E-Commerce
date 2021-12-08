const express = require('express');
const router = express.Router();
const {
    Order
} = require('../models/order');
const {
    OrderItem
} = require('../models/orderItem');
const mongoose = require('mongoose');

//Get request
router.get('/', async (req, res) => {
    const orderList = await Order.find()
        .populate('user', 'name')
        .populate('orderItems').sort({
            'dateOrdered': -1
        });
    if (!orderList) {
        res.status(500).json({
            success: false
        });
    }
    res.send(orderList);
});


//Get specific request
router.get('/:id', async (req, res) => {
    const order = await Order.findById(req.params.id)
        .populate('user', 'name')
        .populate({
            path: 'orderItems',
            populate: {
                path: 'product',
                populate: 'category'
            }
        });
    if (!order) {
        res.status(500).json({
            success: false
        });
    }
    res.send(order);
});


//Get request for a specific client
router.get('/get/userOrders/:userid', async (req, res) => {
    const userOrderList = await Order.find({
            user: req.params.userid
        })
        .populate({
            path: 'orderItems',
            populate: {
                path: 'product',
                populate: 'category'
            }
        }).sort({
            'dateOrdered': -1
        });
    if (!userOrderList) {
        res.status(500).json({
            success: false
        });
    }
    res.send(userOrderList);
})

//Method to post in database server
router.post('/', async (req, res) => {
    const orderItemIds = Promise.all(req.body.orderItems.map(async orderItem => {
        let newOrderItem = new OrderItem({
            "quantity": orderItem.quantity,
            "product": orderItem.product
        });
        newOrderItem = await newOrderItem.save();

        return newOrderItem._id;
    }));
    const orderItemIdsResolved = await orderItemIds;

    const totalPrices = await Promise.all((orderItemIdsResolved).map(async orderItemId => {
        const orderItem = await OrderItem.findById(orderItemId).populate('product', 'price');
        const totalPrice = orderItem.product.price * orderItem.quantity;
        return totalPrice;
    }));
    const totalPrice = totalPrices.reduce((a, b) => a + b, 0);
    let order = new Order({
        orderItems: orderItemIdsResolved,
        shippingAddress1: req.body.shippingAddress1,
        shippingAddress2: req.body.shippingAddress2,
        city: req.body.city,
        state: req.body.state,
        zip: req.body.zip,
        country: req.body.country,
        phone: req.body.phone,
        status: req.body.status,
        totalPrice: totalPrice,
        user: req.body.user,
    })
    order = await order.save();

    if (!order)
        return res.status(400).send('the order cannot be created!')

    res.send(order);

});


//Put request
router.put('/:id', async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).send('Invalid Order ID');
    }
    const order = await Order.findByIdAndUpdate(
        req.params.id, {
            status: req.body.status
        }, {
            new: true
        }
    );

    if (!order)
        return res.status(500).send('The order cannot be updated');

    res.send(order);
});


//Delete request
router.delete('/:id', (req, res) => {
    Order.findByIdAndRemove(req.params.id).then(async order => {
        if (order) {
            await order.orderItems.map(async orderItem => {
                await OrderItem.findByIdAndRemove(orderItem);
            });
            return res.status(200).json({
                success: true,
                message: 'The order is deleted'
            });
        } else {
            return res.status(404).json({
                success: false,
                message: 'The order not found'
            });
        }
    }).catch(err => {
        return res.status(400).json({
            success: false,
            message: err
        });
    });
});


//Get request of totalsales
router.get('/get/totalsales', async (req, res) => {
    const totalSales = await Order.aggregate([{
        $group: {
            _id: null,
            totalsales: {
                $sum: '$totalPrice'
            }
        }
    }]);
    if (!totalSales) {
        return res.status(400).send('The order sales cannot be generated');
    }
    res.send({
        totalSales: totalSales.pop().totalsales
    });
});


//Get request of count
router.get('/get/count', async (req, res) => {
    const orderCount = await Order.countDocuments((count) => count);
    if (!orderCount) {
        res.status(500).json({
            success: false
        });
    }
    res.send({
        orderCount: orderCount
    });
});

module.exports = router;