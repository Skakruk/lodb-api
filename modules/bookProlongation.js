let express = require('express'),
    BookProlongationService = require('../services/BookProlongationService');

let router = express.Router({mergeParams: true});

router.post('/', function (req, res) {
    BookProlongationService.requestProlongation(req.body)
        .then(() => {
            res.send(200);
        })
        .catch((err) => {
            console.error(err);
            return res.status(503).json({message: 'Server error'});
        });
});

module.exports = router;