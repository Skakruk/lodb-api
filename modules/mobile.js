const express = require('express');
const router = express.Router({mergeParams: true});
const request = require('request');
const cheerio = require('cheerio');
const url = require('url');

const BookProlongationService = require('../services/BookProlongationService');

const remoteHost = 'http://lodb.org.ua/';
const remoteServer = 'http://lodb.org.ua/api';
const COVER_MARKER = 'float: left; margin: 0 10px 10px 0;';

const prepareHtml = (field) => {
    const $ = cheerio.load(field, {decodeEntities: false});

    $('img').each(function (i, elem) {
        let $img = $(elem);
        if ($img.attr('style') === COVER_MARKER) {
            $img.remove();
        }

        $img.attr('src', remoteHost + $img.attr('src'));
        $img.attr('height', null);

        if ($img.attr('width')) {
            $img.attr('width', Number($img.attr('width')) / 600 * 100 + '%');
        }
    });

    $('iframe').each(function (i, elem) {
        let $iframe = $(elem);
        $iframe.attr('width', '100%');
        $iframe.attr('height', '400px');
    });

    return $.html();
};

const mapArticle = (article) => {
    ['introtext', 'content'].forEach(field => article[field] = prepareHtml(article[field]));
    if (article.cover) {
        article.cover = (remoteHost + article.cover).replace(/([^:]\/)\/+/g, "$1");
    }

    if (article.type === 'reference') {
        let parsed = url.parse(article['content']);
        if (!parsed.protocol) {
            article['content'] = (remoteHost + article['content']).replace(/([^:]\/)\/+/g, "$1");
        }
    }

    article['content'] = article['content'].replace(article['introtext'], '');

    if (!article.type) {
        if (!article['content'].length) {
            article.type = 'announce';
        }
    }
    return article;
};

router.get('/news', (req, res) => {
    request({
        url: `${remoteServer}/news`,
        json: true
    }, (err, remoteResponse, body) => {
        res.json(Object.assign({}, body, {
            items: body.items.map(mapArticle)
        }));
    })
});

router.get('/news/:id', (req, res) => {
    request({
        url: `${remoteServer}/articles/${req.params.id}`,
        json: true
    }, (err, remoteResponse, body) => res.json(mapArticle(body)))
});

router.get('/latest-arrivals', (req, res) => {
    request({
        url: `${remoteServer}/latest-arrivals`,
        json: true
    }, (err, remoteResponse, body) => {
        res.json(Object.assign({}, body, {
            items: body.items.map(item => Object.assign(item, {
                image: (remoteHost + item.image).replace(/([^:]\/)\/+/g, "$1")
            }))
        }))
    })
});

router.get('/lost-items', (req, res) => {
    request({
        url: `${remoteServer}/lost-items`,
        json: true
    }, (err, remoteResponse, body) => res.json(body))
});

const chlibEndpoint = 'http://www.chl.kiev.ua/MarcWeb_L/';
const autocompletePath = 'Dict.asp';
const dictsByType = {
    'author': 'IDX100a',
    'title': 'IDX245a'
};
const dicsDB = {
    'books': 3555,
    'articles': 1703,
    'discs': 1562
};

router.get('/catalog/init', (req, res) => {
    request({
        url: `${chlibEndpoint}Work.asp`,
        qs: {
            'ValueDB': dicsDB[req.query.db]
        }
    }, (err, response) => {
        res.json({
            cookie: response.headers['set-cookie']
        });
    });
});

router.get('/catalog/autocomplete', (req, res) => {
    //http://www.chl.kiev.ua/MarcWeb_L/WorkDict.asp?ValueDict=IDX245a
    if (dictsByType[req.query.type]) {
        let j = request.jar();
        j.setCookie(req.header('x-chlib-cookies'), chlibEndpoint);

        request({
            url: `${chlibEndpoint}${autocompletePath}`,
            jar: j,
            qs: {
                ValueDict: dictsByType[req.query.type],
                Term: req.query.term,
                PageSize: 10
            }
        }, (err, remoteRes) => {
            console.log(remoteRes);
            const $ = cheerio.load(remoteRes.body, {decodeEntities: false});
            let results = $('table tr')
                .map((i, elem) => $(elem).find('td a'))
                .get()
                .filter($a => $a.length)
                .map($a => ({
                    value: $a.html(),
                    link: $a.attr('href')
                }));

            // console.log($('table tr'));
            return res.json(results);
        })
    } else {
        req.send(400);
    }
});

router.post('/catalog/search', (req, res) => {
    let j = request.jar();
    req.header('x-chlib-cookies').split("||").forEach(cookie => {
        j.setCookie(cookie, chlibEndpoint);
    });
    request({
        method: 'POST',
        url: `${chlibEndpoint}/Exe/OPACServlet.exe`,
        jar: j,
        form: {
            T0: dicsDB[req.body.db],
            Mode: 'F',
            D1: dictsByType['author'],
            T1: req.body.author || "",
            D5: 'AND',
            D2: dictsByType['title'],
            T2: req.body.title || "",
            S0: 'DOC',
            D8: 0,
            D9: 0,
            T5: 100
        }
    }, (err, remoteRes) => {
        const $ = cheerio.load(remoteRes.body, {decodeEntities: false});
        let results = $('.TableDocs tr')
            .map((i, elem) => $(elem).find('td').eq(1))
            .get()
            .map($td => {
                let chunks = $td.html().split('<br>');
                return chunks.reduce((acc, chunk) => {

                    if (chunk.includes('Бібліографія докладна:')) {
                        acc.author = $(chunk).text().replace('Бібліографія докладна:', '').replace(/&nbsp;/g, '');
                    } else if (chunk.includes('Ключові слова:')) {
                        acc.tags = chunk.replace('Ключові слова:', '').replace(/&nbsp;/g, '').split(';').map(s => s.trim())
                    } else if (chunk.includes('Рубрика:')) {
                        acc.categories = chunk.replace('Рубрика:', '').replace(/&nbsp;/g, '').split(';').map(s => s.trim())
                    } else if (chunk.includes('Персоналії:')) {
                        acc.persons = chunk.replace('Персоналії:', '').replace(/&nbsp;/g, '').split(';').map(s => s.trim())
                    } else if (chunk.includes('// ')) {
                        acc.source = chunk.replace('// ', '');
                    } else if (chunk.includes('Географічна рубрика:')) {
                        acc.geoCategory = chunk.replace('Географічна рубрика:', '').replace(/&nbsp;/g, '').trim()
                    } else if (chunk.includes('MarcFormatView') || chunk.includes('</a></a>')) {
                        // skip, link to marc
                    } else if (chunk.length > 0 && !acc.description) {
                        acc.description = chunk.replace(/^\s\s\s/, '');
                    }
                    return acc;
                }, {});
            });
        res.json({
            total: $('p[align=center] i').text(),
            items: results
        });
    })
});

router.post('/book-prolongation', (req, res) => {
    BookProlongationService.requestProlongation(req.body)
        .then(() => {
            res.status(200).json({message: 'Request sent'});
        })
        .catch((err) => {
            console.error(err);
            return res.status(503).json({message: 'Server error'});
        });
});

module.exports = router;
