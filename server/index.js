var express = require('express');
var fs = require('fs');
var open = require('open');

var RestaurantRecord = require('./model').Restaurant;
var ParseStorage = require('./storage.parse').ParseStorage;

console.log(ParseStorage);

var API_URL = '/api/restaurant';
var API_URL_ID = API_URL + '/:id';
var API_URL_ORDER = '/api/order';

var removeMenuItems = function(restaurant) {
  var clone = {};

  Object.getOwnPropertyNames(restaurant).forEach(function(key) {
    if (key !== 'menuItems') {
      clone[key] = restaurant[key];
    }
  });

  return clone;
};


exports.start = function(PORT, STATIC_DIR, DATA_FILE, TEST_DIR) {
  var app = express();
  var parse = new ParseStorage();
  parse.initialize();
  // log requests
  app.use(express.logger('dev'));

  // serve static files for demo client
  app.use(express.static(STATIC_DIR));

  // parse body into req.body
  app.use(express.bodyParser());


  // API
  app.get(API_URL, function(req, res, next) {
    parse.getAllRestaurants(function(restaurants) {
      res.send(200, restaurants);
    });
  });


  app.post(API_URL, function(req, res, next) {
    var restaurant = new RestaurantRecord(req.body);
    var errors = [];

    if (restaurant.validate(errors)) {
      parse.addRestaurant(restaurant);
      return res.send(201, restaurant);
    }

    return res.send(400, {error: errors});
  });

  app.post(API_URL_ORDER, function(req, res, next) {
    console.log(req.body)
    return res.send(201, { orderId: Date.now()});
  });


  app.get(API_URL_ID, function(req, res, next) {
    var restaurant = ParseStorage.getById(req.params.id);

    if (restaurant) {
      return res.send(200, restaurant);
    }

    return res.send(400, {error: 'No restaurant with id "' + req.params.id + '"!'});
  });


  app.put(API_URL_ID, function(req, res, next) {
    var restaurant = parse.getById(req.params.id);
    var errors = [];

    if (restaurant) {
      restaurant.update(req.body);
      return res.send(200, restaurant);
    }

    restaurant = new RestaurantRecord(req.body);
    if (restaurant.validate(errors)) {
      parse.add(restaurant);
      return res.send(201, restaurant);
    }

    return res.send(400, {error: errors});
  });


  app.del(API_URL_ID, function(req, res, next) {
    if (parse.deleteById(req.params.id)) {
      return res.send(204, null);
    }

    return res.send(400, {error: 'No restaurant with id "' + req.params.id + '"!'});
  });


  // only for running e2e tests
  app.use('/test/', express.static(TEST_DIR));


  // start the server
  // read the data from json and start the server
  //fs.readFile(DATA_FILE, function(err, data) {
  //  JSON.parse(data).forEach(function(restaurant) {
  //    parse.addRestaurant(restaurant);
  //  });

    app.listen(PORT, function() {
      open('http://localhost:' + PORT + '/');
      console.log('Go to http://localhost:' + PORT + '/');
    });


  // Windows and Node.js before 0.8.9 would crash
  // https://github.com/joyent/node/issues/1553
  try {
    process.on('SIGINT', function() {
      // save the storage back to the json file
      //fs.writeFile(DATA_FILE, JSON.stringify(parse.getAll()), function() {
        process.exit(0);
      //});
    });
  } catch (e) {
    console.log(JSON.stringify(e));
  }

};
