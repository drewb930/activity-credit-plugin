'use strict';

var Endpoint = require('./endpoint');
var Router = require('zengo').router;
var Factory = require('./endpoint-factory');

Router.post('/', request => {
	var factory = new Factory();
	return Endpoint(factory).post(request);
});

module.exports = Router.dispatch;
