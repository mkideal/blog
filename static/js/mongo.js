(function() {

	var exports = {};

	var script = document.currentScript;
	var options = {
		/* required */
		forwardURL: script.getAttribute("data-forward-url"),
		appId: script.getAttribute("data-app-id"),
		dataSource: script.getAttribute("data-source"),
		database: script.getAttribute("data-database"),
		/* optional */
		collection: script.getAttribute("data-collection"),
		host: script.getAttribute("data-mongo-host") || "data.mongodb-api.com",
		rootURL: script.getAttribute("data-root-url"),
	};
	options.rootURL = options.rootURL || ('https://' + options.host + '/app/' + options.appId + '/endpoint/data/beta/action');

	exports.actions = {};

	function registerAction(action) { exports.actions[action] = action; };

	// @see https://docs.atlas.mongodb.com/api/data-api-resources
	registerAction("findOne");
	registerAction("find");
	registerAction("insertOne");
	registerAction("insertMany");
	registerAction("updateOne");
	registerAction("updateMany");
	registerAction("replaceOne");
	registerAction("deleteOne");
	registerAction("deleteMany");
	registerAction("aggregate");

	/**
	 * send mongodb action request
	 */
	exports.send = function(action, data) {
		data.dataSource = data.dataSource || options.dataSource;
		data.database = data.database || options.database;
		data.collection = data.collection || options.collection;
		var xhr = new XMLHttpRequest();
		xhr.open('POST', options.forwardURL);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.setRequestHeader("X-Mongo-App-Id", options.appId);
        xhr.setRequestHeader("X-Forward-URL", options.rootURL + "/" + action);
        xhr.setRequestHeader("X-Forward-Host", options.host);
        xhr.setRequestHeader("X-Forward-Origin", "https://" + options.host);
        xhr.setRequestHeader("X-Forward-Referer", "https://" + options.host + "/");
		xhr.responseType = 'json';
		data = JSON.stringify(data);
		return new Promise(function(resolve, reject) {
			xhr.onload = function () {
				console.log("mongo.send result:", xhr.response);
				if (this.status >= 200 && this.status < 300) {
					resolve(xhr.response);
				} else {
					reject(xhr.statusText);
				}
			};
			xhr.onerror = function (e) { reject("Network error"); };
			xhr.ontimeout = function (e) { reject("Network timeout"); }
			xhr.send(data);
		});
	};

	console.log("exports mongo");
	window.mongo = exports;

})();
