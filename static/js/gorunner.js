(function() {

var rootURL = "https://gotipplay.golang.org";

/**
 * playground 配置 go 语言的运行环境
 */
var playground = {
	run: rootURL + '/compile',
	format: rootURL + '/fmt',
	version: 2,
	withVet: true
};

/**
 * Go 代码运行器
 */
function GoRunner() {
	this.source = null;
}

/**
 * 实现 Runner.parse 方法
 */
GoRunner.prototype.parse = function(blocks) {
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
 * 实现 Runner.run 方法
 */
GoRunner.prototype.run = function() {
	var self = this;
	return new Promise(function(resolove, reject) {
		console.log("go: formatting");
		self.format().then(function(res) {
			if (res.Error) {
				reject(res.Error);
				return;
			}
			console.log("go: running");
			self.source = res.Body;
			var xhr = new XMLHttpRequest();
			xhr.open('POST', playground.run);
			xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
			var data = codeblock.encodeObjectURI({
				body: self.source,
				version: playground.version,
				withVet: playground.withVet
			});
			codeblock.sendRequest(xhr, data).then(resolove).catch(reject);
		}).catch(reject);
	})
};

/**
 * 格式化代码并且自动添加 imports
 */
GoRunner.prototype.format = function() {
	var xhr = new XMLHttpRequest();
	xhr.open('POST', playground.format);
	xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
	return codeblock.sendRequest(xhr, codeblock.encodeObjectURI({
		imports: "true",
		body: this.source,
	}));
}

/**
 * 注册 GoRunner
 */
codeblock.registerRunner("go", GoRunner);

})();
