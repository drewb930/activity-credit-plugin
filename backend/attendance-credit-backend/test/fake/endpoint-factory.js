'use strict';

const Http = require('zengo').fakes.znHttp;
const Firebase = require('zengo').fakes.firebase;
const fakeFbData = require('../data/firebase.json');
const fakeData = require('../data/endpoint.json');

let Config;

try {
	Config = require('../../config');
} catch (error) {}

function createFakeEndpointFactory () {
	var factory = {};

	factory.Http = Http(fakeData);
	factory.Firebase = new Firebase(null, fakeFbData);
	factory.config = Config;

	return factory;
}

module.exports = createFakeEndpointFactory;
