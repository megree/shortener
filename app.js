var PORT = process.env.PORT || 3000;

var express = require('express');
var redirect = require("express-redirect");
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var urlExists = require('url-exists');

var app = express();
app.set('view engine', 'ejs');
redirect(app);
var urlencodedParser = bodyParser.urlencoded({ extended: false });

mongoose.connect('mongodb://short:short@ds111568.mlab.com:11568/shortener');
var shortenedSchema = new mongoose.Schema({
  key: Number,
  url: String
});
var Shortened = mongoose.model('Shortened', shortenedSchema);

var encode = function(key) {return key.toString(36);}
var decode = function(codedKey) {return parseInt(codedKey, 36);}

app.get('/', function(req, res) {
  res.render('shortener', {data: {}});
});

app.post('/', urlencodedParser, function(req, res) {
  var url = '';

  urlExists('http://' + req.body.url, function(err, exists) {
    if (exists) url = 'http://' + req.body.url;
    urlExists('https://' + req.body.url, function(err, exists) {
      if (exists) url = 'https://' + req.body.url;
      urlExists(req.body.url, function(err, exists) {
        if (exists) url = req.body.url;

        var data = {};
        if (!url) {
          data = {message: 'invalid url.', shortenedUrl: '/s'}
          res.render('shortener', {data: data});
        } else {
          Shortened.find({}, function(err, data) {
            Shortened({key: data.length, url: url}).save(function(err, data) {
             if (err) throw err;
             var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
             var shortenedUrl = fullUrl + encode(data.key);
             data = {message: shortenedUrl, shortenedUrl: shortenedUrl}
             res.render('shortener', {data: data});
            });
          });
        }

      });
    });
  });

});

app.get('/:codedKey', function(req, res) {
  key = decode(req.params.codedKey);
  Shortened.find({key: key}, function(err, data) {
    if (!data || !data[0]) res.render('shortener', {data: {}});
    else res.redirect(data[0].url);
  });
});

app.use(function(req, res, next) {
  res.status(404);
  res.render('shortener', {data: {}});
});

app.listen(PORT, () => console.log(`Listening on ${ PORT }`));
