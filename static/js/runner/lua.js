(function() {
/**
 * lua code runner
 */
var playground = {
	forward: "https://code.gopherd.com/forward",
	host: "www.lua.org",
	run: "https://www.lua.org/cgi-bin/demo"
};

function Runner(lang) {
	this.lang = lang;
	this.source = null;
}

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
		xhr.open('POST', playground.forward);
        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        xhr.setRequestHeader("X-Forward-URL", playground.run);
        xhr.setRequestHeader("X-Forward-Host", playground.host);
        xhr.setRequestHeader("X-Forward-Origin", playground.run);
        xhr.setRequestHeader("X-Forward-Referer", playground.run + "/");
		var data = codeblock.encodeObjectURI({
			input: self.source
		});
		codeblock.sendRequest(xhr, data, 'document').then(function(result) {
			var events = [];
			result.querySelectorAll("textarea").forEach(function(area) {
				var prev = area.previousSibling;
				while (prev && prev.nodeName === "#text") {
					prev = prev.previousSibling;
				}
				if (prev && prev.innerText === "Output") {
					events.push({
						Message: area.innerText.substring(0, area.innerText.length - 1),
						Kind: codeblock.Stdout
					});
				}
			})
			resolve({Events: events});
		}).catch(reject);
	})
};

/**
 * register Runner
 */
codeblock.register("lua", Runner);

})();

