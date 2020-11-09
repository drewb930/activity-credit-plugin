/* eslint-env jasmine */
'use strict';
const Endpoint = require('../src/endpoint');
const Factory = require('./fake/endpoint-factory');

describe('Sample Test', () => {
	const factory = new Factory();

	var request;

	beforeEach(() => {
		request = {
			params: {
				workspaceId: 123
			},
			headers: {},
			query: {},
			body: {
				webhook: {}
			}
		};
	});

	describe('Request Validation', () => {
		it('should fail with missing webhook key', () => {
			try {
				return Endpoint(factory).post(request).then(data => {
					return expect.fail('Request should fail');
				}, error => {
					expect(error.message).to.equal('Invalid Webhook Key');
				});
			} catch (e) {
				console.log(e);
				expect.fail('Request should fail');
			}
		});

		it('should ignore delete activity', () => {
			request.body.webhook.id = 1;
			request.body.data = [{
				action: 'delete'
			}];

			request.query.config = 1;
			request.headers['x-zengine-webhook-key'] = 'ABC';

			return Endpoint(factory).post(request).then((data) => {
				expect(data.message).to.equal('Irrelevant Activity. Nothing to do');
			});
		});

		it('should ignore when folder not moved to submitted', () => {
			request.body.webhook.id = 1;
			request.body.data = [{
				id: 456,
				action: 'update',
				resource: 'records'
			}];

			request.query.config = 1;
			request.headers['x-zengine-webhook-key'] = 'ABC';

			return Endpoint(factory).post(request).then((data) => {
				expect(data.message).to.equal('Irrelevant Activity. Nothing to do');
			});
		});
	});

	describe('Business Logic Tests', () => {
		it('should create a record', () => {
			request.body.webhook.id = 1;
			request.body.data = [{
				id: 123,
				action: 'update',
				resource: 'records'
			}];

			request.query.config = 1;
			request.headers['x-zengine-webhook-key'] = 'ABC';

			return Endpoint(factory).post(request).then((data) => {
				expect(data).to.deep.equal({
					id: 12,
					field123: 'value'
				});
			});
		});
	});
});
