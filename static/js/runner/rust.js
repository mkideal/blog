(function() {
/**
 * rust code runner
 */
var playground = {
	run: "https://play.rust-lang.org/execute",
	backtrace: false,
	channel: "stable",
	edition: "2021",
	mode: "debug"
};

function Runner(lang) {
	this.lang = lang;
	this.source = null;
}

Runner.prototype.provider = function() {
	return {name: 'play.rust-lang.org', link: 'https://play.rust-lang.org'};
};

/**
 * implements Runner.parse method
 */
Runner.prototype.parse = function(blocks) {
	var source = [];
	for (var i = 0; i < blocks.length; i++) {
		source.push(blocks[i].source);
	}
	this.source = source.join('\n');
};

/**
 * implements Runner.run method
 */
Runner.prototype.run = function() {
	var self = this;
	return new Promise(function(resolve, reject) {
		console.log("%s: running", self.lang);
		var xhr = new XMLHttpRequest();
		xhr.open('POST', playground.run);
		xhr.setRequestHeader("Content-Type", "application/json");
		var data = JSON.stringify({
			backtrace: playground.backtrace,
			channel: playground.channel,
			code: self.source,
			crateType: "bin",
			edition: playground.edition,
			mode: playground.mode,
			tests: false
		});
		codeblock.sendRequest(xhr, data).then(function(result) {
			if (result.success) {
				resolve({
					Events: [{
						Message: result.stdout,
						Kind: codeblock.Stdout
					}]
				});
			} else {
				resolve({
					Events: [{
						Message: result.stderr,
						Kind: codeblock.Stderr
					}]
				});
			}
		}).catch(reject);
	})
};

/**
 * register Runner
 */
codeblock.register("rust", Runner);

})();
