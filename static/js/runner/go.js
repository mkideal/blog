(function() {
/**
 * go code runner
 */
var host =  "gotipplay.golang.org";

var playground = {
	run: 'https://' + host + '/compile',
	format: 'https://' + host + '/fmt',
	version: 2,
	withVet: true
};

function Runner(lang) {
	this.lang = lang;
	this.source = null;
}

Runner.prototype.provider = function() {
	return {name: host, link: 'https://' + host};
};

/**
 * implements Runner.parse method
 */
Runner.prototype.parse = function(blocks) {
	var source = [];
	var regexp = /package main/g;
	source.push('package main\n');
	for (var i = 0; i < blocks.length; i++) {
		var snippet = blocks[i].source.replace(regexp, '');
		source.push(snippet);
	}
	this.source = source.join('\n');
};

/**
 * implements Runner.run method
 */
Runner.prototype.run = function() {
	var self = this;
	return new Promise(function(resolve, reject) {
		console.log("%s: formatting", self.lang);
		self.format().then(function(res) {
			if (res.Error) {
				reject(res.Error);
				return;
			}
			console.log("%s: running", self.lang);
			self.source = res.Body;
			var xhr = new XMLHttpRequest();
			xhr.open('POST', playground.run);
			xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
			var data = codeblock.encodeObjectURI({
				body: self.source,
				version: playground.version,
				withVet: playground.withVet
			});
			codeblock.sendRequest(xhr, data).then(resolve).catch(reject);
		}).catch(reject);
	})
};

/**
 * format go code and auto imports
 */
Runner.prototype.format = function() {
	var xhr = new XMLHttpRequest();
	xhr.open('POST', playground.format);
	xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
	return codeblock.sendRequest(xhr, codeblock.encodeObjectURI({
		imports: "true",
		body: this.source,
	}));
}

/**
 * register Runner
 */
codeblock.register("go", Runner);

})();
