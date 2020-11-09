'use strict';

const Http = require('../lib/zn-http');
const Firebase = require('../lib/zn-firebase')();
let Config;

try {
	Config = require('../config');
} catch (error) {}

const EndpointFactory = () => {
	const factory = {};

	factory.Http = Http();
	factory.Firebase = new Firebase();
	factory.config = Config;

	return factory;
};

module.exports = EndpointFactory;
