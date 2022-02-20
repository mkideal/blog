function CodeBlock(id, lang, source, group, tags) {
	this.id = id;
	this.lang = lang;
	this.source = source;
	this.group = group;
	this.tags = tags || [];
}
var nextUUID = 0;

function genUUID() {
	nextUUID++;
	return nextUUID;
}

var codeAttrGroup = "code-group"; // default "main"
var codeAttrTags = "code-tags";

// code tags
var codeTagBad = "bad";
var codeTagIgnore = "ignore";
var codeTagRunable = "runnable";

var codeGroups = {};

var playgroundList = {
	go: {
		run: 'https://gotipplay.golang.org/compile',
		format: 'https://gotipplay.golang.org/fmt',
		version: 2,
		withVet: true
	}
};

function sendRequest(xhr, data) {
	return new Promise(function(resolve, reject) {
		xhr.onload = function () {
			if (this.status >= 200 && this.status < 300) {
				try {
					let x = JSON.parse(xhr.response);
					resolve(x);
				} catch (e) {
					reject(e);
				}
			} else {
				reject(xhr.statusText);
			}
		};
		xhr.onerror = function () {
			reject(xhr.statusText);
		};
		xhr.send(data);
    });
}

function CodeRunner(blocks) {
	this.lang = blocks[0].lang;
	this.playground = playgroundList[this.lang];
	if (!this.playground) {
		console.log("playground", this.lang, "not found")
		return;
	}
	// parse blocks
	try {
		this.parseBlocks(blocks);
	} catch (e) {
		console.error(e)
	}
}

CodeRunner.prototype.parseBlocks = function(blocks) {
	var source = [];
	var regexp = /package main/g;
	source.push('package main\n');
	for (var i = 0; i < blocks.length; i++) {
		var snippet = blocks[i].source.replace(regexp, '');
		source.push(snippet);
	}
	this.source = source.join('\n');
};

CodeRunner.prototype.run = function() {
	console.log("ready run", this.lang, "code");
	var self = this;
	if (this.lang === "go") {
		return new Promise(function(resolove, reject) {
			self.goImports().then(function(res) {
				if (res.Error) {
					reject(res.Error);
					return;
				}
				console.log("go code formatted");
				self.source = res.Body;
				var xhr = new XMLHttpRequest();
				var data = self.setRequest(xhr);
				sendRequest(xhr, data).then(resolove).catch(reject);
			}).catch(reject);
		})
	}
	var xhr = new XMLHttpRequest();
	var data = this.setRequest(xhr);
	return sendRequest(xhr, data);
};

CodeRunner.prototype.goImports = function() {
	var xhr = new XMLHttpRequest();
	xhr.open('POST', this.playground.format);
	xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
	return sendRequest(xhr, buildFormParameters({
		imports: "true",
		body: this.source,
	}));
}

CodeRunner.prototype.setRequest = function(xhr) {
	var body;
	var url = this.playground.run;
	xhr.open('POST', url);
	switch (this.lang) {
		case "go":
			try {
				xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
			} catch(e) {
				console.log(e);
			}
			body = buildFormParameters({
				version: this.playground.version,
				body: this.source,
				withVet: this.playground.withVet
			});
			break;
	}
	return body || "";
};

function buildFormParameters(obj) {
	// Turn the data object into an array of URL-encoded key/value pairs.
	var builder = [];
	for(var name in obj) {
		if (obj.hasOwnProperty(name)) {
			builder.push(encodeURIComponent(name)+'='+encodeURIComponent(obj[name]));
		}
	}
	return builder.join('&');
}

function addCodeButtons(clipboard) {
	// 1. Look for pre > code elements in the DOM
	document.querySelectorAll("pre > code").forEach(function (codeBlock) {
		var div = document.createElement("div");
		div.className = "code-button-container";
		var pre = codeBlock.parentNode;
		pre.parentNode.insertBefore(div, pre);

		addCopyButton(div, codeBlock, clipboard);
		addRunButton(div, codeBlock);
	});
}

function addCopyButton(parentNode, codeBlock, clipboard) {
	var copyIcon = '<i class="fas fa-copy"></i>';
	var copiedIcon = '<i class="fas fa-check" style="color: #32CD32"></i>';
	var button = document.createElement("button");
	button.className = "btn btn-light btn-code";
	button.type = "button";
	button.innerHTML = copyIcon;
	button.addEventListener("click", function() {
		clipboard.writeText(codeBlock.innerText).then(
			function() {
				button.blur();
				button.innerHTML = copiedIcon;
				setTimeout(function () {button.innerHTML = copyIcon}, 1000);
			},
			function (error) {button.innerHTML = "Error"}
		);
	});
	console.log('append copy button');
	parentNode.appendChild(button);
}

function addRunButton(parentNode, codeBlock) {
	var lang = codeBlock.getAttribute("data-lang");
	if (!lang || !playgroundList[lang]) {
		return;
	}
	var id = genUUID();
	var highlight = codeBlock.parentNode.parentNode;
	var group = highlight.getAttribute("code-group") || "main";
	var tags = (highlight.getAttribute("code-tags") || "").split(',');
	var runnable = false;
	console.log("code", lang, group, tags);
	for (var i = 0; i < tags.length; i++) {
		tags[i] = tags[i].trim();
		if (tags[i] === codeTagBad || tags[i] === codeTagIgnore) {
			// ignore code
			return;
		}
		if (tags[i] === codeTagRunable) {
			runnable = true;
		}
	}
	var block = new CodeBlock(id, lang, codeBlock.innerText, group, tags);
	var blocks = codeGroups[group];
	if (!blocks) {
		codeGroups[group] = [block];
	} else {
		blocks.push(block);
	}
	if (!runnable) {
		return;
	}
	var runIcon = '<i class="fas fa-play"></i><span> Run</span>';
	var runningIcon = 'Running';
	var button = document.createElement("button");
	button.className = "btn btn-light btn-code btn-code-run";
	button.type = "button";
	button.innerHTML = runIcon;
	button.addEventListener("click", function() {
		button.innerHTML = runningIcon;
		clearCodeResult(codeBlock);
		runCodeGroup(group, id).then(
			function(res) {
				if (res.Errors) {
					console.log(res.Errors);
					createCodeResult(codeBlock, [{
						Message: res.Errors,
						Kind: "stderr"
					}]);
				} else {
					createCodeResult(codeBlock, res.Events);
				}
				button.blur();
				setTimeout(function () {button.innerHTML = runIcon}, 1000);
			},
			function (error) {button.innerHTML = "Error"}
		);
	});
	console.log('append run button');
	parentNode.appendChild(button);
}

function runCodeGroup(group, id) {
	console.log("run code group", group, id);
	return new Promise(function(resolve, reject) {
		var blocks = codeGroups[group];
		console.log("run", blocks.length, "blocks");
		if (!blocks || blocks.length <= 0) {
			reject("group not found");
			return;
		}
		var lang = blocks[0].lang;
		var size = blocks.length;
		var selected = [];
		for (var i = 0; i < blocks.length; i++) {
			if (lang === "go") {
				// 只能有一个 main 函数
				if (blocks[i].runnable && blocks[i].id !== id) {
					continue;
				}
			}
			selected.push(blocks[i]);
			if (blocks[i].id === id) {
				break;
			}
		}
		console.log("new runner");
		var runner = new CodeRunner(selected);
		if (!runner.playground) {
			reject("invalid code");
			return
		}
		console.log("running");
		runner.run().then(resolve).catch(reject);
	});
}

var codeResultClassName = "code-result";

function clearCodeResult(codeBlock) {
	var child = codeBlock.parentNode.parentNode.querySelector("." + codeResultClassName);
	if (child) {
		codeBlock.parentNode.parentNode.removeChild(child);
	}
}

function createCodeResult(codeBlock, results) {
	console.log("results", results);
	clearCodeResult(codeBlock);
	var child = document.createElement("pre");
	child.className = codeResultClassName;
	var code = document.createElement("code");
	child.appendChild(code);
	code.insertAdjacentHTML('beforeend', '<span style="color:grey">Output:\n</span>');
	for (var i = 0; i < results.length; i++) {
		var span = document.createElement("span");
		if (results[i].Kind === "stderr") {
			span.style = "color: red";
		}
		span.innerText = results[i].Message;
		code.appendChild(span);
	}
	codeBlock.parentNode.after(child);
}

document.addEventListener('DOMContentLoaded',function(){
	if (navigator && navigator.clipboard) {
		addCodeButtons(navigator.clipboard);
	} else {
		var script = document.createElement("script");
		script.src =
		  "https://cdnjs.cloudflare.com/ajax/libs/clipboard-polyfill/2.7.0/clipboard-polyfill.promise.js";
		script.integrity = "sha256-waClS2re9NUbXRsryKoof+F9qc1gjjIhc2eT7ZbIv94=";
		script.crossOrigin = "anonymous";
		script.onload = () => addCodeButtons(clipboard);
		document.body.appendChild(script);
	}
});
