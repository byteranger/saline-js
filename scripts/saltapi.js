'use strict';

function SaltAPI(url) {
	this.url = url;
	this.token = null;
	this.waitTries = 10;
	this.waitSeconds = 10;
}

// Privacy
(function () {

	function tResUnauthorized(res) {
		if (res.status == 401)
			throw new Error('Unauthorized');
		return res;
	}

	function tResUnexpected(res) {
		if (!res.ok) {
			console.log(res);
			throw new Error('Unexpected error, report to admin: ' + res.status + ' - ' + res.statusText);
		}
		return res;
	}

	function eJsonBad(err) {
		throw new Error('Malformed JSON: ' + err.message);
	}

	function tResOk(res) {
		if (res.ok && res.headers.has('Content-Type') && res.headers.get('Content-Type') == 'application/json')
			return res.json().catch(eJsonBad);
		return res;
	}

	// login
	SaltAPI.prototype.login = function (username, password) {
		var _this = this;
		return fetch(_this.url + '/login', {
			redirect: 'manual',
			method: 'POST',
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				eauth: 'pam',
				username: username,
				password: password,
			}),
		})
		.then(function (res) {
			if (res.status == 401)
				throw new Error('Bad username or password');
			return res;
		})
		// Also possible, but treating generically...
		// 400: // Bad Request
		// 406: // Not Acceptable
		// 500: // Internal Server Error
		.then(tResUnexpected)
		.then(tResOk)
		.then(function (result) {
			//TODO: try/catch/throw Error
			//TODO: utilize more of return object?
			//TODO: store expire time
			return _this.token = result.return[0].token;
		});
	};

	// start a job
	SaltAPI.prototype.start = function (target = '*', command = 'test.ping', args = undefined, kwargs = undefined) {
		var _this = this;
		//TODO: support array of targets?
		//TODO: configurable target type?
		return fetch(_this.url + '/minions', {
			method: 'POST',
			redirect: 'manual',
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json',
				'X-Auth-Token': _this.token,
			},
			body: JSON.stringify({
				tgt: target,
				fun: command,
				arg: args,
				kwarg: kwargs,
			}),
		})
		.then(tResUnauthorized)
		.then(tResUnexpected)
		.then(tResOk)
		.then(function (result) {
			if (result === null || typeof result !== 'object' || !Array.isArray(result.return) || !result.return.length)
				throw new Error('Malformed response from server');
			return result.return[0];
		});
	};

	// poll job for result
	SaltAPI.prototype.poll = function (job) {
		var _this = this;
		switch (typeof job) {
			case 'object':
				if (!job.jid || typeof job.jid != 'string')
					return Promise.reject(new Error('Object is not a proper job object'));
				job = job.jid;
				break;
			case 'array':
				return Promise.reject(new Error('Arrays of JIDs are not yet supported'));
				break;
		}
		return fetch(_this.url + '/jobs/' + job, {
			redirect: 'manual',
			headers: {
				'Accept': 'application/json',
				'X-Auth-Token': _this.token,
			},
		})
		.then(tResUnauthorized)
		.then(tResUnexpected)
		.then(tResOk)
		.then(function (obj) {
			if (obj === null || typeof obj !== 'object' || !Array.isArray(obj.return) || !obj.return.length)
				//TODO: more malformation tests?
				throw new Error('Malformed response from server');
			return obj.return[0];
		});
	};

	// wait for job completion
	SaltAPI.prototype.wait = function (job) {
		var _this = this;
		var tries = 0;
		return new Promise(function waiter(resolve, reject) {
			if (++tries > _this.waitTries ) {
				reject(new Error('Exceeded maximum number of poll attempts to wait for (' + _this.waitTries + ')'));
				return;
			}
			_this.poll(job)
			.then(function (job) {
				console.log('Wait poll', tries, job); //DEBUG
				if (job.Minions.length == Object.keys(job.Result).length) {
					// Job's done
					resolve(job);
				} else {
					// Try again after a bit
					setTimeout(waiter, _this.waitSeconds * 1000, resolve, reject);
				}
			})
			.catch(reject);
		});
	};

	// logout
	SaltAPI.prototype.logout = function () {
		this.token = null;
	};

})();
