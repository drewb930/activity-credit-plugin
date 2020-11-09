'use strict';

const Firebase = require('@zenginehq/backend-firebase');
const Webhook = require('@zenginehq/backend-webhooks');
const BackendHttp = require('@zenginehq/backend-http');
const zengo = require('zengo');

var Endpoint = factory => {
	var endpoint = {};
	const Api = BackendHttp(factory.Http);
	const znRecord = zengo.core.record;

	function validateWebhook (settings, request) {
		const validates = Webhook.validateSecret(settings, request);

		if (!validates) {
			const error = new Error('Invalid Webhook Key');
			return Promise.reject(error);
		}

		return true;
	}

	async function validateActivity (activity, settings) {
		const action = activity.action;
		const resource = activity.resource;

		if (resource !== 'records' ||
			action === 'delete') {
			return false;
		}

		const fullActivity = await Api.getActivity(activity.id);

		return Webhook.activityToFolder(fullActivity, settings.folderId);
	}

	function createRecord (settings) {
		const data = znRecord.setFieldValue({}, settings.fieldId, 'value');

		return Api.createRecord(settings.applicationFormId, data);
	}

	endpoint.post = request => {
		const workspaceId = parseInt(request.params.workspaceId, 10);

		return Firebase(factory.Firebase).load([workspaceId, 'settings', request.query.config])
			.then(async settings => {
				await validateWebhook(settings, request);

				const activity = request.body.data[0];
				const valid = await validateActivity(activity, settings);

				if (valid) {
					return createRecord(settings);
				}

				return {
					message: 'Irrelevant Activity. Nothing to do'
				};
			}
			);
	};

	return endpoint;
};

module.exports = Endpoint;
