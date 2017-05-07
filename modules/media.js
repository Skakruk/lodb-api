let express = require('express'),
	path = require('path'),
	Media = require('../models/media'),
	sharp = require('sharp'),
	fs = require('fs'),
	bookshelf = require('../bookshelf'),
	repeat = require('lodash/repeat'),
	mkdirp = require('mkdirp');

const basePath = '/Users/vkenyz/IdeaProjects/lodb/cdn/images';
const cdn = 'http://cdn.lodb.dev/media';

const imagesLocation = path.resolve(__dirname, '..', 'assets', 'images');

function streamFile(fileOptions, req, res) {
	var gfs = app.get("gridfs");
	gfs.findOne(fileOptions, (err, file) => {
		if (err) {
			console.error(err);
			res.send(err);
		}

		if (file) {

			if (req.get("If-None-Match") && req.get("If-None-Match") == file.md5) {
				return res.sendStatus(304);
			}

			res.writeHead(200, {
				'Content-Type': file.contentType,
				'ETag': file.md5,
				'Content-Transfer-Encoding': 'chunked',
				'Cache-Control': 'public, max-age=31536000'
			});

			var readStream = gfs.createReadStream(fileOptions);

			var sharpStream = sharp();

			if (req.query.wh) {
				let sizes = req.query.wh.split("x");
				sharpStream = sharpStream
					.resize(Number(sizes[0]), sizes[1] ? Number(sizes[1]) : null);
			}

			if (req.query.w) {
				sharpStream = sharpStream
					.resize(Number(req.query.w), null);
			}

			if (req.query.h) {
				sharpStream = sharpStream
					.resize(null, Number(req.query.h));
			}

			readStream.pipe(sharpStream).pipe(res);

			readStream.on('error', function (err) {
				console.log('An error occurred!', err);
				throw err;
			});
		}
	});
}

var router = express.Router({mergeParams: true});

router.get('/images/tree', function (req, res) {
	bookshelf.Collection
		.extend({
			model: Media
		})
		.query(function (qb) {
			qb.where('parent_id', '=', -1);
		})
		.fetch({withRelated: repeat('children.', 10).replace(/\.$/, '')})
		.then(dirs => {
			res.json({
			    media: dirs
            });
		});
});


router.post('/images', function (req, res) {

	var queue = req.files['files[]'].map(file => {
		return new Promise((resolve, reject) => {
			new Media({
				type: "image",
				name: file.name,
				parent_id: req.body.parent
			})
				.save()
				.then(
					media => {
						let dirPath = `${basePath}/${media.get('parent_id')}`;
						mkdirp.sync(dirPath);
						let writeStream = fs.createWriteStream(`${dirPath}/${media.get('id')}_${media.get('name')}`);
						writeStream.on('close', () => {
							media.fetch().then((media) => {
								resolve(media);
							})
						});
						writeStream.write(file.data);
						writeStream.end();
					},
					err => reject(err)
				)
		});
	});
	Promise.all(queue).then((media) => {
		res.status(201).json(media);
	});
});

router.post('/directory', (req, res) => {
	new Media({
		name: req.body.name,
		type: 'dir',
		parent_id: req.body.parent
	})
		.save()
		.then(media => {
			res.status(201).json(media);
		})
		.catch(err => {
			console.error(err);
			res.send(err);
		});
});

router.get('/:fileId', (req, res) => {
	streamFile({
		"_id": req.params.fileId
	}, req, res);
});

// router.get('/images/:id', async function (req, res) {
// 	try {
// 		var mediaFile = await Media.findById(req.params.id).exec();
// 		streamFile({
// 			_id: mediaFile.fileId
// 		}, req, res);
// 	} catch (err) {
// 		console.log(err);
// 		res.status(500).send(err);
// 	}
//
// });
//
router.delete('/images/:id', function (req, res) {
	try {
		let media = new Media({id: Number(req.params.id)})
			.fetch()
			.then(media => {
				let dirPath = `${basePath}/${media.get('parent_id')}`;
				fs.unlinkSync(`${dirPath}/${media.get('id')}_${media.get('name')}`);

				media
					.destroy()
					.then(() => {
						res.status(200).json(media);
					});
			})
			.catch(err => {
				console.error(err);
				res.status(500).send(err);
			})

	} catch (err) {
		console.log(err);
		res.status(500).send(err);
	}

});

module.exports = router;