let knex = require('knex'),
    bookshelf = require('bookshelf');

let configuredKnex = knex({
    client: 'postgres',
    connection: {
        host     : '127.0.0.1',
        user     : '',
        password : '',
        database : 'lodb',
        charset  : 'utf8'
    }
});

module.exports = bookshelf(configuredKnex);