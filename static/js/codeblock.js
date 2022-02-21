(function() {

var exports = {};

/**
 * 全局上下文
 */
var codeblock = {
	initialized: false,

	/**
	 * id 分配
	 */
	nextUUID: 0,

	/**
	 * 剪切板接口
	 */
	clipboard: navigator && navigator.clipboard ? navigator.clipboard: null,

	/**
	 * runners 为各个语言的运行器
	 */
	runners: {},

	/**
	 * programs 按代码的 program 名称分组
	 */
	programs: {}
};

/**
 * 注册代码运行器
 */
exports.registerRunner = function(lang, runner) {
	codeblock.runners[lang] = runner;
}

/**
 * 分配唯一 ID
 */
function genUUID() {
	codeblock.nextUUID++;
	return codeblock.nextUUID;
}

// {code-block="-"}
// {code-block="program"}
// {code-block=":bad"}
// {code-block=":run"}
// {code-block="program:bad"}
// {code-block="program:run"}
var codeAttrName = "code-block";

// code tag
var codeTagBad = "bad";
var codeTagRun = "run";

/**
 * Block 表示一个代码块
 */
function Block(id, lang, program, source) {
	this.id = id;
	this.lang = lang;
	this.program = program;
	this.source = source;
}

/**
 * 构建表单参数
 */
exports.buildFormParameters = function(obj) {
	// Turn the data object into an array of URL-encoded key/value pairs.
	var builder = [];
	for(var name in obj) {
		if (obj.hasOwnProperty(name)) {
			builder.push(encodeURIComponent(name)+'='+encodeURIComponent(obj[name]));
		}
	}
	return builder.join('&');
}

/**
 * 发送 http 请求
 */
exports.sendRequest = function(xhr, data) {
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
		xhr.onerror = function (e) {
			reject("Network error");
		};
		xhr.ontimeout = function (e) {
			reject("Network timeout");
		}
		xhr.send(data);
    });
}

/**
 * 代码块添加按钮组
 */
function addCodeButtons(clipboard) {
	// 1. Look for pre > code elements in the DOM
	document.querySelectorAll("pre > code").forEach(function (code) {
		var div = document.createElement("div");
		div.className = "code-button-container";
		var pre = code.parentNode;
		pre.parentNode.insertBefore(div, pre);

		addCopyButton(div, code, clipboard);
		addRunButton(div, code);
	});
}

/**
 * 添加复制按钮
 */
function addCopyButton(parentNode, code, clipboard) {
	var copyIcon = '<i class="fas fa-copy"></i>';
	var copiedIcon = '<i class="fas fa-check" style="color: #32CD32"></i>';
	var button = document.createElement("button");
	button.className = "btn btn-light btn-code";
	button.type = "button";
	button.innerHTML = copyIcon;
	button.addEventListener("click", function() {
		clipboard.writeText(code.innerText).then(
			function() {
				button.blur();
				button.innerHTML = copiedIcon;
				setTimeout(function () {button.innerHTML = copyIcon}, 1000);
			},
			function (error) {button.innerHTML = "Error"}
		);
	});
	parentNode.appendChild(button);
}

/**
 * 添加运行按钮
 */
function addRunButton(parentNode, code) {
	var lang = code.getAttribute("data-lang");
	if (!lang || !codeblock.runners[lang]) {
		return;
	}
	var id = genUUID();
	var highlight = code.parentNode.parentNode;
	var attrs = highlight.getAttribute("code-block") || "";
	if (attrs === "-") {
		return;
	}
	var program = "main";
	var tag = "";
	var colon = attrs.indexOf(":");
	if (colon >= 0) {
		program = attrs.substr(0, colon) || program;
		tag = attrs.substr(colon + 1);
	} else {
		program = attrs || program;
	}
	console.log("code info: lang=%s, attrs=%s, program=%s, tag=%s", lang, attrs, program, tag);
	if (tag === "bad") {
		return;
	}
	var runnable = tag === "run";
	var block = new Block(id, lang, program, code.innerText);
	var blocks = codeblock.programs[program];
	if (!blocks) {
		codeblock.programs[program] = [block];
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
		clearCodeResult(code);
		runProgram(id, program).then(
			function(res) {
				if (res.Errors) {
					console.log(res.Errors);
					createCodeResult(code, [{
						Message: res.Errors,
						Kind: "stderr"
					}]);
				} else {
					createCodeResult(code, res.Events);
				}
				button.blur();
				button.innerHTML = runIcon;
			},
			function (error) {
				createCodeResult(code, [{
					Message: error + "",
					Kind: "stderr"
				}]);
				button.blur();
				button.innerHTML = runIcon;
			}
		);
	});
	parentNode.appendChild(button);
}

/**
 * 运行代码
 */
function runProgram(id, program) {
	return new Promise(function(resolve, reject) {
		var blocks = codeblock.programs[program];
		if (!blocks || blocks.length <= 0) {
			reject("program not found");
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
		var Runner = codeblock.runners[lang];
		if (!Runner) {
			reject("runner not found for", lang);
			return;
		}
		try {
			var runner = new Runner();
			runner.parse(selected);
			runner.run().then(resolve).catch(reject);
		} catch (e) {
			reject(e + "");
		}
	});
}

/**
 * 代码运行结构显示组件
 */
var codeResultClassName = "code-result";

function clearCodeResult(code) {
	// code -> pre -> .highlight
	var child = code.parentNode.parentNode.querySelector("." + codeResultClassName);
	if (child) {
		code.parentNode.parentNode.removeChild(child);
	}
}

function createCodeResult(code, results) {
	clearCodeResult(code);
	var child = document.createElement("pre");
	child.className = codeResultClassName;
	var result = document.createElement("code");
	child.appendChild(result);
	result.insertAdjacentHTML('beforeend', '<span style="color:grey">Output:\n</span>');
	for (var i = 0; i < results.length; i++) {
		var span = document.createElement("span");
		if (results[i].Kind === "stderr") {
			span.style = "color: red";
		}
		span.innerText = results[i].Message;
		result.appendChild(span);
	}
	code.parentNode.after(child);
}

/**
 * 完成初始化
 */
exports.init = function() {
	if (codeblock.initialized) {
		console.warn("codeblock already initialized");
		return;
	}
	console.log("codeblock initializing");
	codeblock.initialized = true;
	// DOM 加载后进行初始化
	document.addEventListener('DOMContentLoaded',function(){
		if (codeblock.clipboard) {
			addCodeButtons(codeblock.clipboard);
		} else {
			var script = document.createElement("script");
			script.src =
			  "https://cdnjs.cloudflare.com/ajax/libs/clipboard-polyfill/2.7.0/clipboard-polyfill.promise.js";
			script.integrity = "sha256-waClS2re9NUbXRsryKoof+F9qc1gjjIhc2eT7ZbIv94=";
			script.crossOrigin = "anonymous";
			script.onload = function() {
				codeblock.clipboard = clipboard;
				addCodeButtons(codeblock.clipboard);
			}
			document.body.appendChild(script);
		}
	});
}

window.codeblock = exports;

})();
