const Article = require('../models/article');
const Setting = require('../models/setting');
const Articles = require('../models/articles');
const ArticleContent = require('../models/article_content');
const {repeat} = require('lodash');

module.exports = {
    get(query) {
        var where = [];

        if (query.url) {
            where.push(['url', '=', query.url]);
        }

        if (query.children) {
            where.push(['children', '=', query.children]);
        }

        if (query.type) {
            where.push(['type', 'in', query.type.split(",")]);
        }

        if (query.parent) {
            where.push(['parent_id', '=', query.parent]);
        }

        return where.reduce((chain, q) => {
            return chain.where(q[0], q[1], q[2]);
        }, Article)
            .fetchAll();
    },

    getById(id) {
        return Article.where('id', id)
            .query(function (qb) {
                qb.debug(true);
            })
            .fetch({
                withRelated: [
                    'content.children',
                    {
                        'mainImageObj': function (query) {
                            query.debug(true);
                        }
                    }
                ]
            })
    },

    update(id, fields) {
        let articleContent = fields.content;
        delete fields.content;

        if (fields.main_image.id) {
            fields.main_image = fields.main_image.id;
        }

        return new Article({id})
            .save(fields, {
                method: fields.created_at ? "update" : "insert",
                require: false
            })
            .then(() => {
                let queue = articleContent.map(content => {
                    delete content.children;
                    return new ArticleContent({id: content.id})
                        .save(content, {
                            method: content.created_at ? "update" : "insert",
                            require: false
                        })
                });
                return Promise.all(queue)
            });
    },

    delete(id) {
        return new Article({id}).destroy()
    },

    getRootArticleId() {
        return Setting.where({key: 'homePage'}).fetch()
    },

    listHierarchy(rootId) {
        return Articles
            .query((qb) => qb.whereNull('parent_id'))
            .fetch({withRelated: repeat('children.', 10).replace(/\.$/, '')})
    }
};