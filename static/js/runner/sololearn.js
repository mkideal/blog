(function() {
/**
 * c/c++/python/java/javascript/perl code runner
 */
var playground = {
	run: "https://api2.sololearn.com/v2/codeplayground/v2/compile"
};

function Runner(lang) {
	this.lang = lang;
	this.source = null;
}

var languagesMapping = {};

languagesMapping[codeblock.languages.python] = "py";
languagesMapping[codeblock.languages.javascript] = "js";
languagesMapping[codeblock.languages.csharp] = "cs";
languagesMapping[codeblock.languages.c] = "cpp";
languagesMapping[codeblock.languages.perl] = "cpp";
languagesMapping[codeblock.languages.kotlin] = "kt";

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
		case codeblock.languages.perl:
			this.source = '#include <fstream>\n\nconstexpr char perlString[]=\nR"(\n' +
				this.source +
				'\n)";\n\n' +
				'int main(){\n' +
				'	std::ofstream mainFile;\n' +
				'	mainFile.open("brofarops.pl");\n' +
				'	mainFile<<perlString;\n' +
				'	mainFile.close();\n' +
				'	system("perl brofarops.pl");\n' +
				'	return 0;\n' +
				'}';

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
		xhr.open('POST', playground.run);
		xhr.setRequestHeader("Content-Type", "application/json; charset=utf-8");
		var data = JSON.stringify({
			language: languagesMapping[self.lang] || self.lang,
			input: "",
			code: self.source
		});
		codeblock.sendRequest(xhr, data).then(function(result) {
			if (result.success) {
				if (result.data.error) {
					resolve({
						Events: [{
							Message: result.data.output,
							Kind: codeblock.Stderr
						}]
					});
				} else {
					resolve({
						Events: [{
							Message: result.data.output,
							Kind: codeblock.Stdout
						}]
					});
				}
			} else {
				resolve({
					Events: [{
						Message: "error",
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
