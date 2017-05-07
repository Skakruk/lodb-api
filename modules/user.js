let express = require('express'),
    {checkAuth} = require('./auth'),
    User = require('../models/user');


var router = express.Router({mergeParams: true});

router.get('/', checkAuth, (req, res) => {
    if (req.user) {
        res.json({
            username: req.user.username,
            role: req.user.role,
            _id: req.user._id,
        });
    } else {
        res.status(404);
    }
});

router.post('/', (req, res) => {
    new User({
        username: req.body.username,
        password: User.encryptPassword(req.body.password),
        role: 'user'
    })
        .save()
        .then(result => {
            res.status(201).end();
        }, (err) => {
            return res.status(500).json({
                message: err.detail
            });
        });
});

module.exports = router;