let bookshelf = require('../bookshelf'),
    bcrypt = require('bcrypt');

const SALT_WORK_FACTOR = 10;

let User = bookshelf.Model.extend({
    tableName: 'users',
    comparePassword(candidatePassword, cb) {
        bcrypt.compare(candidatePassword, this.attributes.password, function (err, isMatch) {
            if (err) return cb(err);
            cb(null, isMatch);
        });
    },
}, {

    encryptPassword(password) {
        let salt = bcrypt.genSaltSync(SALT_WORK_FACTOR);
        return bcrypt.hashSync(password, salt);
    }
});

module.exports = User;