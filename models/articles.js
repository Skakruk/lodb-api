let bookshelf = require('../bookshelf');
let Article = require('./article');

const Articles = bookshelf.Collection
    .extend({
        model: Article
    });

module.exports = Articles;
