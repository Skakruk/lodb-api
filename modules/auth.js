let express = require('express'),
    jwt = require('jsonwebtoken'),
    User = require('../models/user');

const jwtConfig = {
    secret: "sdfsdfv0u78h*&GZ9G&i7vo89bsfd87y(*D^Tgahs[0"
};

const protectedRoutes = {
    '/articles': ['POST'],
    '/articles/:id': ['PUT']
};

var router = express.Router({mergeParams: true});

router.post('/token', (req, res) => {
    if (req.body.username && req.body.password) {
        new User({
            username: req.body.username
        })
            .fetch()
            .then(user => {
                if (!user) {
                    res.status(401).json({message: 'Authentication failed. User not found.'});
                } else if (user) {
                    user.comparePassword(req.body.password, function (err, isMatch) {
                        if (err) throw err;
                        if (isMatch) {
                            res.json({
                                token: jwt.sign(user.omit('password'), jwtConfig.secret, {
                                    expiresIn: "1d"
                                })
                            });
                        } else {
                            res.status(401).json({message: 'Authentication failed'});
                        }
                    });
                }
            }, (err) => {
                console.log(err);
            });
    } else {
        res.sendStatus(401);
    }
});

function checkAuth(req, res, next) {
    var token = "";
    if (req.headers && req.headers.authorization) {
        var parts = req.headers.authorization.split(' ');
        if (parts.length == 2) {
            var [scheme, credentials] = parts;

            if (/^Bearer$/i.test(scheme)) {
                token = credentials;
            } else {
                return next();
            }
        } else {
            res.status(400).json({message: 'Format is Authorization: Bearer [token]'});
            return next();
        }

        jwt.verify(token, jwtConfig.secret, function (err, decoded) {
            if (err) {
                res.status(401).json({message: err.message});
            } else {
                req.user = decoded;
                next();
            }
        });
    } else {
        res.status(401).json({message: "No token provided"});
    }
}

module.exports = {
    router,
    checkAuth
};