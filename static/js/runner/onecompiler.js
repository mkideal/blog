(function() {
/**
 * code runner by "onecompiler"
 */
var playground = {
	forward: document.currentScript.getAttribute("data-forward-url"),
	host: "onecompiler.com",
	origin: "https://onecompiler.com",
	run: "https://onecompiler.com/api/code/exec"
};

function Runner(lang) {
	this.lang = lang;
	this.source = null;
}

Runner.prototype.provider = function() {
	return {name: playground.host, link: playground.origin + "/" + this.lang};
}

var ignoredError = 'timeout: warning: timer_create: Resource temporarily unavailable';

var languagesMapping = {};

languagesMapping[codeblock.languages.lisp] = "commonlisp";

var modes = {};

modes[codeblock.languages.assembly] = "assembly_x86";
modes[codeblock.languages.ocaml] = "perl";
modes[codeblock.languages.bash] = "tcl";
modes[codeblock.languages.typescript] = "javascript";
modes[codeblock.languages.prolog] = "javascript";
modes[codeblock.languages.jshell] = "java";
modes[codeblock.languages.d] = "c_cpp";
modes[codeblock.languages.erlang] = "c_cpp";
modes[codeblock.languages.racket] = "perl";
modes[codeblock.languages.vb] = "vbscript";
modes[codeblock.languages.clojure] = "lisp";
modes[codeblock.languages.cobol] = "assembly_x86";
modes[codeblock.languages.pascal] = "javascript";
modes[codeblock.languages.octave] = "javascript";
modes[codeblock.languages.mysql] = "sql";
modes[codeblock.languages.postgresql] = "sql";
modes[codeblock.languages.sqlite] = "sql";
modes[codeblock.languages.mongodb] = "javascript";
modes[codeblock.languages.redis] = "javascript";

function modeName(name) {
	name = codeblock.languageName(name);
	return modes[name] || name;
}

function filename(lang, source) {
	switch (lang) {
		case codeblock.languages.erlang:
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
		var extension = codeblock.extensionName(self.lang);
		var data = JSON.stringify({
			active: true,
			description: null,
			extension: extension,
			languageType: "programming",
			mode: modeName(self.lang),
			name: toTitleCase(self.lang),
			properties: {
				cheatsheets: false,
				docs: true,
				language: languagesMapping[self.lang] || self.lang,
				tutorials: false,
				files: [{
					name: filename(self.lang, self.source) + "." + extension,
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
					Kind: codeblock.Stdout
				});
			}
			if (result.stderr && result.stderr !== ignoredError && result.stderr !== ignoredError + "\n") {
				events.push({
					Message: result.stderr,
					Kind: codeblock.Stderr
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
codeblock.register(codeblock.languages.scala, Runner);
codeblock.register(codeblock.languages.groovy, Runner);
codeblock.register(codeblock.languages.haskell, Runner);
codeblock.register(codeblock.languages.lisp, Runner);
codeblock.register(codeblock.languages.elixir, Runner);
codeblock.register(codeblock.languages.fsharp, Runner);
codeblock.register(codeblock.languages.assembly, Runner);
codeblock.register(codeblock.languages.ocaml, Runner);
codeblock.register(codeblock.languages.bash, Runner);
codeblock.register(codeblock.languages.typescript, Runner);
codeblock.register(codeblock.languages.prolog, Runner);
codeblock.register(codeblock.languages.jshell, Runner);
codeblock.register(codeblock.languages.tcl, Runner);
codeblock.register(codeblock.languages.ada, Runner);
codeblock.register(codeblock.languages.d, Runner);
codeblock.register(codeblock.languages.erlang, Runner);
codeblock.register(codeblock.languages.fortran, Runner);
codeblock.register(codeblock.languages.racket, Runner);
codeblock.register(codeblock.languages.vb, Runner);
codeblock.register(codeblock.languages.clojure, Runner);
codeblock.register(codeblock.languages.cobol, Runner);
codeblock.register(codeblock.languages.pascal, Runner);
codeblock.register(codeblock.languages.octave, Runner);
codeblock.register(codeblock.languages.mysql, Runner);
codeblock.register(codeblock.languages.postgresql, Runner);
codeblock.register(codeblock.languages.sqlite, Runner);
codeblock.register(codeblock.languages.mongodb, Runner);
codeblock.register(codeblock.languages.redis, Runner);

codeblock.register(codeblock.languages.c, Runner);
codeblock.register(codeblock.languages.cpp, Runner);
codeblock.register(codeblock.languages.csharp, Runner);
codeblock.register(codeblock.languages.java, Runner);
codeblock.register(codeblock.languages.swift, Runner);
codeblock.register(codeblock.languages.r, Runner);
codeblock.register(codeblock.languages.python, Runner);
codeblock.register(codeblock.languages.javascript, Runner);
codeblock.register(codeblock.languages.perl, Runner);
codeblock.register(codeblock.languages.php, Runner);
codeblock.register(codeblock.languages.kotlin, Runner);

})();

