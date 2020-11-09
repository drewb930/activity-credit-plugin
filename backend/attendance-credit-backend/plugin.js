'use strict';

const dispatch = require('./src/endpoint-router.js');

/* eslint-disable */
exports.run = function(eventData) {
/* eslint-enable */
	dispatch(eventData);
};
