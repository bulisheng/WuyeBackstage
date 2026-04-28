const https = require('https');
const crypto = require('crypto');
const cloudBase = require('../../../framework/cloud/cloud_base.js');
const util = require('../../../framework/utils/util.js');
const cloudUtil = require('../../../framework/cloud/cloud_util.js');

const NoticeConfigModel = require('../model/notice_config_model.js');
const NoticeLogModel = require('../model/notice_log_model.js');
const NOTICE_TEMPLATES = require('../public/notice_templates.js');

class NotificationService {
	async listConfigs(input = {}) {
		let where = {};
		if (util.isDefined(input.search) && input.search) {
			where.or = [
				{ NOTICE_TITLE: ['like', input.search] },
				{ NOTICE_CODE: ['like', input.search] },
			];
		}
		return await NoticeConfigModel.getList(where, '*', { NOTICE_ADD_TIME: 'desc' }, input.page || 1, input.size || 20, input.isTotal !== false, input.oldTotal || 0);
	}

	async listLogs(input = {}) {
		let where = {};
		if (util.isDefined(input.search) && input.search) {
			where.or = [
				{ NOTICELOG_TITLE: ['like', input.search] },
				{ NOTICELOG_SCENE: ['like', input.search] },
				{ NOTICELOG_CONTENT: ['like', input.search] },
			];
		}
		return await NoticeLogModel.getList(where, '*', { NOTICELOG_ADD_TIME: 'desc' }, input.page || 1, input.size || 20, input.isTotal !== false, input.oldTotal || 0);
	}

	async getConfig(code) {
		return await NoticeConfigModel.getOne({ NOTICE_CODE: code }, '*');
	}

	async saveConfig(input) {
		let data = {
			NOTICE_CODE: input.code,
			NOTICE_TITLE: input.title || input.code,
			NOTICE_DESC: input.desc || '',
			NOTICE_STATUS: Number(input.status || 0),
			NOTICE_OBJ: input.obj || {},
			NOTICE_FORMS: input.forms || [],
		};
		return await NoticeConfigModel.insertOrUpdate({ NOTICE_CODE: input.code }, data);
	}

	renderTemplate(scene, vars = {}) {
		let tpl = NOTICE_TEMPLATES[scene];
		if (!tpl) return '';
		let content = tpl.content || '';
		return content.replace(/\{([^{}]+)\}/g, (m, rawKey) => {
			let key = String(rawKey).trim();
			let fallback = '';
			if (key.includes('||')) {
				let parts = key.split('||').map(s => s.trim());
				for (let i = 0; i < parts.length; i++) {
					let val = this._resolveValue(vars, parts[i]);
					if (util.isDefined(val) && String(val) !== '') return String(val);
				}
				return fallback;
			}
			let val = this._resolveValue(vars, key);
			return util.isDefined(val) ? String(val) : fallback;
		});
	}

	_resolveValue(obj, key) {
		if (!key) return '';
		let val = obj;
		let parts = key.split('.');
		for (let i = 0; i < parts.length; i++) {
			if (!util.isDefined(val) || val === null) return '';
			val = val[parts[i]];
		}
		return util.isDefined(val) ? val : '';
	}

	async send(scene, vars = {}, options = {}) {
		let tpl = NOTICE_TEMPLATES[scene];
		if (!tpl) {
			return null;
		}

		let config = await this.getConfig(scene);
		let content = this.renderTemplate(scene, vars);
		let payload = Object.assign({
			scene,
			title: tpl.title,
			content,
			vars
		}, options.payload || {});

		let result = {
			scene,
			title: tpl.title,
			content,
			sent: false,
			channel: 'log'
		};

		try {
			let sentCount = 0;
			let cfgObj = config ? (config.NOTICE_OBJ || {}) : {};
			if (config && config.NOTICE_STATUS === 1) {
				if (cfgObj.webhook) {
					await this._sendWebhook(cfgObj, tpl.title, content, vars);
					sentCount++;
					result.channel = 'webhook';
				}

				if (Array.isArray(options.receiverOpenIds) && options.receiverOpenIds.length > 0 && cfgObj.miniTemplateId) {
					for (let i = 0; i < options.receiverOpenIds.length; i++) {
						await this._sendMiniTemplate(cfgObj.miniTemplateId, options.receiverOpenIds[i], vars, cfgObj.page || '');
						sentCount++;
					}
					result.channel = cfgObj.webhook ? 'mixed' : 'mini';
				}
			}
			result.sent = sentCount > 0;

			await NoticeLogModel.insert({
				NOTICELOG_CODE: scene,
				NOTICELOG_TITLE: tpl.title,
				NOTICELOG_SCENE: scene,
				NOTICELOG_STATUS: sentCount > 0 ? 1 : 0,
				NOTICELOG_RECEIVER: options.receiverText || '',
				NOTICELOG_CONTENT: content,
				NOTICELOG_OBJ: payload
			});

			return result;
		} catch (err) {
			cloudUtil.log('notice.send', err);
			await NoticeLogModel.insert({
				NOTICELOG_CODE: scene,
				NOTICELOG_TITLE: tpl.title,
				NOTICELOG_SCENE: scene,
				NOTICELOG_STATUS: 0,
				NOTICELOG_RECEIVER: options.receiverText || '',
				NOTICELOG_CONTENT: content,
				NOTICELOG_OBJ: Object.assign({}, payload, { errMsg: err.message })
			});
			throw err;
		}
	}

	async sendTest(scene, vars = {}) {
		let sample = Object.assign({
			communityName: '幸福里小区',
			houseName: '1栋2单元1201',
			userName: '张三',
			phone: '13800000000',
			content: '这是一条测试消息',
			type: '测试',
			billType: '物业费',
			amount: '280.00',
			dueDate: '2024-05-20',
			payTime: '2024-05-18 09:30',
			serviceType: '快递代寄',
			productNames: '五常大米 5kg',
			number: '1',
			createTime: '2024-05-18 09:30'
		}, vars);
		return await this.send(scene, sample, {
			receiverText: '测试接收人'
		});
	}

	async _sendWebhook(cfgObj, title, content, vars) {
		let webhook = cfgObj.webhook;
		if (!webhook) return;

		let body = {
			msgtype: 'text',
			text: {
				content: `[${title}]\n${content}`
			}
		};

		if (Array.isArray(cfgObj.atMobiles) && cfgObj.atMobiles.length > 0) {
			body.at = {
				atMobiles: cfgObj.atMobiles,
				isAtAll: !!cfgObj.atAll
			};
		}

		let finalWebhook = webhook;
		if (cfgObj.secret) {
			let timestamp = Date.now();
			let sign = encodeURIComponent(crypto.createHmac('sha256', cfgObj.secret).update(`${timestamp}\n${cfgObj.secret}`).digest('base64'));
			finalWebhook += `${webhook.includes('?') ? '&' : '?'}timestamp=${timestamp}&sign=${sign}`;
		}

		await this._postJSON(finalWebhook, body);
	}

	async _sendMiniTemplate(templateId, openid, vars, page = '') {
		const miniLib = require('../../../framework/lib/mini_lib.js');
		let data = {};
		let idx = 1;
		Object.keys(vars || {}).forEach(key => {
			if (data[`thing${idx}`]) idx++;
			data[`thing${idx}`] = { value: String(vars[key]).substring(0, 20) };
		});
		await miniLib.sendMiniOnceTempMsg({
			touser: openid,
			templateId,
			page,
			data
		}, templateId + '_' + openid);
	}

	_postJSON(url, data) {
		return new Promise((resolve, reject) => {
			let body = JSON.stringify(data);
			let req = https.request(url, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Content-Length': Buffer.byteLength(body)
				}
			}, res => {
				let chunks = [];
				res.on('data', chunk => chunks.push(chunk));
				res.on('end', () => {
					resolve(Buffer.concat(chunks).toString('utf8'));
				});
			});
			req.on('error', reject);
			req.write(body);
			req.end();
		});
	}
}

module.exports = NotificationService;
