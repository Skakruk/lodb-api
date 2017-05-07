let bookshelf = require('../bookshelf');

let Setting = bookshelf.Model.extend({
	tableName: 'settings'
});

module.exports = Setting;