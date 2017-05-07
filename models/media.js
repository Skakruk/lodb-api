let bookshelf = require('../bookshelf');

let Media = bookshelf.Model.extend({
	tableName: 'media',
	children: function() {
		return this.hasMany(Media, 'parent_id')
	}
});
module.exports = Media;