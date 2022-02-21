(function() {
/**
 * c/c++/python/java/javascript/perl code runner
 */
var playground = {
	run: "https://api2.sololearn.com/v2/codeplayground/v2/compile"
};

function Runner(lang) {
	this.lang = lang;
	this.sourceLang = this.lang;
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
	switch (this.lang) {
		case "perl":
			this.sourceLang = "cpp";
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
			language: self.sourceLang === "c" ? "cpp" : self.sourceLang,
			input: "",
			code: self.source
		});
		codeblock.sendRequest(xhr, data).then(function(result) {
			if (result.success) {
				if (result.data.error) {
					resolve({
						Events: [{
							Message: result.data.output,
							Kind: "stderr"
						}]
					});
				} else {
					resolve({
						Events: [{
							Message: result.data.output,
							Kind: "stdout"
						}]
					});
				}
			} else {
				resolve({
					Events: [{
						Message: "error",
						Kind: "stderr"
					}]
				});
			}
		}).catch(reject);
	})
};

/**
 * register Runner
 */
codeblock.registerRunner("c", Runner);
codeblock.registerRunner("cpp", Runner);
codeblock.registerRunner("cs", Runner);
codeblock.registerRunner("java", Runner);
codeblock.registerRunner("swift", Runner);
codeblock.registerRunner("r", Runner);
codeblock.registerRunner("py", Runner);
codeblock.registerRunner("js", Runner);
codeblock.registerRunner("perl", Runner);
codeblock.registerRunner("php", Runner);

})();
