let bookshelf = require('../bookshelf');
let ArticleContent = require('./article_content');
let Media = require('./media');

let Article = bookshelf.Model.extend({
    tableName: 'articles',

    children: function() {
        return this.hasMany(Article, 'parent_id')
    },

    mainImageObj: function() {
        return this.hasOne(Media, 'id', 'main_image')
    },

    content: function(){
	    return this.hasMany(ArticleContent, 'article_id')
    },

    constructor: function() {
        bookshelf.Model.apply(this, arguments);
        this.on('updating', model => {
            model.set('updated_at', new Date())
        });
    }
});

module.exports = Article;