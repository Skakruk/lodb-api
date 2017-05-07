let bookshelf = require('../bookshelf');

let ArticleContent = bookshelf.Model.extend({
    tableName: 'articles_content',
	children: function() {
		return this.hasMany(ArticleContent, 'parent_id')
	},
    constructor: function() {
        bookshelf.Model.apply(this, arguments);
        this.on('updating', model => {
            model.set('updated_at', new Date())
        });
    }
});
module.exports = ArticleContent;