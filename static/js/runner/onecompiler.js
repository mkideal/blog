(function() {
/**
 * lua code runner
 */
var playground = {
	forward: "https://code.gopherd.com/forward",
	host: "onecompiler.com",
	origin: "https://onecompiler.com",
	run: "https://onecompiler.com/api/code/exec"
};

function Runner(lang) {
	this.lang = lang;
	this.source = null;
}

var ignoredError = 'timeout: warning: timer_create: Resource temporarily unavailable';

/**
 * implements Runner.parse method
 */
Runner.prototype.parse = function(blocks) {
	var source = [];
	for (var i = 0; i < blocks.length; i++) {
		source.push(blocks[i].source);
	}
	this.source = source.join('\n');
	switch (this.lang) {
		case "typescript":
			this.source = "(function() {\n" + this.source + "\n})();";
			return;
	}
};

function filename(lang, source) {
	switch (lang) {
		case "erlang":
			var mod = source.match(/^-module\(\w+\)/g);
			if (mod && mod.length > 0) {
				var r = /\([^\)]+\)/g;
				var s = mod[0].match(r)[0];
				return s.substring(1, s.length-1);
			}
			break;
	}
	return "helloworld";
}

/**
 * implements Runner.run method
 */
Runner.prototype.run = function() {
	var self = this;
	return new Promise(function(resolve, reject) {
		console.log("%s: running", self.lang);
		var xhr = new XMLHttpRequest();
		xhr.open('POST', playground.forward);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.setRequestHeader("X-Forward-URL", playground.run);
        xhr.setRequestHeader("X-Forward-Host", playground.host);
        xhr.setRequestHeader("X-Forward-Origin", playground.origin);
        xhr.setRequestHeader("X-Forward-Referer", playground.run + "/");
		var data = JSON.stringify({
			active: true,
			description: null,
			extension: codeblock.extensionName(self.lang),
			languageType: "programming",
			mode: codeblock.modeName(self.lang),
			name: toTitleCase(self.lang),
			properties: {
				cheatsheets: false,
				docs: true,
				language: self.lang,
				tutorials: false,
				files: [{
					name: filename(self.lang, self.source) + "." + codeblock.extensionName(self.lang),
					content: self.source
				}]
			},
			title: self.lang + " Hello world",
			visibility: "public"
		});
		codeblock.sendRequest(xhr, data).then(function(result) {
			var events = [];
			if (result.stdout) {
				events.push({
					Message: result.stdout,
					Kind: "stdout"
				});
			}
			if (result.stderr && result.stderr !== ignoredError && result.stderr !== ignoredError + "\n") {
				events.push({
					Message: result.stderr,
					Kind: "stderr"
				});
			}
			resolve({Events: events});
		}).catch(reject);
	})
};

function toTitleCase(str) {
	return str.replace(
		/\w\S*/g,
		function(txt) {
			return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
		}
	);
}

/**
 * register Runner
 */
codeblock.registerRunner("scala", Runner);
codeblock.registerRunner("groovy", Runner);
codeblock.registerRunner("haskell", Runner);
codeblock.registerRunner("commonlisp", Runner);
codeblock.registerRunner("elixir", Runner);
codeblock.registerRunner("fsharp", Runner);
codeblock.registerRunner("assembly", Runner);
codeblock.registerRunner("ocaml", Runner);
codeblock.registerRunner("bash", Runner);
codeblock.registerRunner("typescript", Runner);
codeblock.registerRunner("prolog", Runner);
codeblock.registerRunner("jshell", Runner);
codeblock.registerRunner("tcl", Runner);
codeblock.registerRunner("ada", Runner);
codeblock.registerRunner("d", Runner);
codeblock.registerRunner("erlang", Runner);
codeblock.registerRunner("fortran", Runner);
codeblock.registerRunner("racket", Runner);
codeblock.registerRunner("vb", Runner);
codeblock.registerRunner("clojure", Runner);
codeblock.registerRunner("cobol", Runner);
codeblock.registerRunner("pascal", Runner);
codeblock.registerRunner("octave", Runner);
codeblock.registerRunner("mysql", Runner);
codeblock.registerRunner("postgresql", Runner);
codeblock.registerRunner("sqlite", Runner);
codeblock.registerRunner("mongodb", Runner);
codeblock.registerRunner("redis", Runner);

})();

