let express = require('express'),
    cors = require('cors'),
    bodyParser = require('body-parser'),
    busboyBodyParser = require('busboy-body-parser'),
    // articleRoutes = require('./modules/articles'),
    // authRoutes = require('./modules/auth').router,
    // userRoutes = require('./modules/user'),
	// mediaRoutes = require('./modules/media'),
	mobileRoutes = require('./modules/mobile');

var app = express();

app.use(cors());

app.use(function (req, res, next) {
    if (req.is('multipart/form-data')) {
        busboyBodyParser({multi: true})(req, res, next);
    } else {
        bodyParser.json()(req, res, next);
    }
});

app.use('/assets', express.static(__dirname + '/assets'));

// app.use('/auth', authRoutes);
// app.use('/user', userRoutes);
// app.use('/articles', articleRoutes);
// app.use('/media', mediaRoutes);

app.use('/mobile', mobileRoutes);

var server = app.listen(3001, function () {
    console.log('API listening on port 3001!');
});

process.on('SIGTERM', () => {
    server.close();
});

process.on('SIGINT', () => {
    server.close(function(){
        process.exit();
    });
});