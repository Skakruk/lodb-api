let express = require('express'),
    repeat = require('lodash/repeat'),
    checkAuth = require('./auth').checkAuth,
    bookshelf = require('../bookshelf'),
    ArticleService = require('../services/ArticleService');

let router = express.Router({mergeParams: true});

router.get('/', function (req, res) {
    ArticleService.get(req.query)
        .then(articles => {
            res.json({
                total: articles.length,
                data: articles
            });
        })
        .catch((err) => {
            console.error(err);
            return res.status(503).json({message: 'Server error'});
        });
});

router.post('/', checkAuth, function (req, res) {
    if (req.user.role !== 'admin') return res.sendStatus(403);

    ArticleService
        .update(req.body.id, req.body)
        .then(() => ArticleService.getById(req.body.id))
        .then(article => {
            res.status(201).send(article);
        })
        .catch(e => {
            console.error(e);
            res.status(500).json(e);
        })
});

router.get('/tree', function (req, res) {
    ArticleService.listHierarchy()
        .then(dirs => {
            res.json({
                articles: dirs
            });
        });
});

router.get('/:id', function (req, res) {
    ArticleService
        .getById(req.params.id)
        .then((article) => {
            res.json({
                article
            });
        }, err => {
            console.error(err);
            res.status(500).json({message: err.toString()})
        })
});

router.put('/:id', checkAuth, (req, res) => {
    if (!req.user.role === 'admin')  return res.sendStatus(403);

    ArticleService
        .update(req.body.id, req.body)
        .then(() => {
            return ArticleService.getById(req.params.id)
        })
        .then((article) => {
            res.json(article)
        })
        .catch(err => {
            console.error(err);
            res.status(500).json(err);
        })
});

router.delete('/:id', checkAuth, (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    ArticleService.delete(req.params.id)
        .then((article) => {
            res.status(200).json(article);
        }, (err) => {
            console.error(err);
            res.status(500).json({message: 'Server error'})
        });
});

module.exports = router;