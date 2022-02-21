(function() {

var exports = {};

exports.languageName = function(name) {
	switch (name) {
		case "c":
			return "cpp";
		case "c++":
			return "cpp";
		case "python":
			return "py";
		case "golang":
			return "go";
		case "javascript":
			return "js";
		case "csharp":
			return "cs";
		case "c#":
			return "cs";
		case "R":
			return "r";
		default:
			return name;
	}
}

/**
 * codeblock context value
 */
var codeblock = {
	initialized: false, /* initialized or not */
	nextUUID: 0, /* used to allocate uuid */
	runners: {}, /* code runners for each languages */
	programs: {}, /* programs */
	clipboard: null, /* clipboard API object */
};

/**
 * allocateUUID allocates an uuid
 */
function allocateUUID() {
	codeblock.nextUUID++;
	return codeblock.nextUUID;
}

// {code-block="-"}
// {code-block="program"}
// {code-block=":bad"}
// {code-block=":run"}
// {code-block="program:bad"}
// {code-block="program:run"}
var kTagBad = "bad";
var kTagRun = "run";

var kDefaultProgram = "main";
var kIgnoredProgram = "-";
var kProgramSeparator = ":";

var kOutputStdout = "stdout";
var kOutputStderr = "stderr";

/**
 * Block represents a code block
 */
function Block(id, lang, source) {
	this.id = id;
	this.lang = lang;
	this.source = source;
}

/**
 * registerRunner registers code runner for specific program language
 */
exports.registerRunner = function(lang, runner) {
	codeblock.runners[lang] = runner;
}

/**
 * encodeObjectURI turns the obj into an URL-encoded key/value pairs
 */
exports.encodeObjectURI = function(obj) {
	var builder = [];
	for(var name in obj) {
		if (obj.hasOwnProperty(name)) {
			builder.push(encodeURIComponent(name)+'='+encodeURIComponent(obj[name]));
		}
	}
	return builder.join('&');
}

/**
 * sendRequest sends a http request
 */
exports.sendRequest = function(xhr, data, responseType) {
	if (!xhr.responseType) {
		xhr.responseType = responseType || "json";
	}
	return new Promise(function(resolve, reject) {
		xhr.onload = function () {
			if (this.status >= 200 && this.status < 300) {
				resolve(xhr.response);
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
 * add buttons for all codeblock
 */
function addCodeButtons(options) {
	document.querySelectorAll(options.codeSelector).forEach(function (code) {
		var div = document.createElement("div");
		div.className = options.codeButtonContainerClass;
		var pre = code.parentNode;
		pre.parentNode.insertBefore(div, pre);

		if (options.enableClipboard) {
			addCopyButton(options, div, code);
		}
		if (options.enableRunner) {
			addRunButton(options, div, code);
		}
	});
}

/**
 * add "copy" button for codeblock
 */
function addCopyButton(options, parentNode, code) {
	var copyIcon = options.copyIcon;
	var copiedIcon = options.copiedIcon;
	var button = document.createElement("button");
	button.className = options.codeClipboardButtonClass;
	button.type = "button";
	button.innerHTML = copyIcon;
	button.addEventListener("click", function() {
		codeblock.clipboard.writeText(code.innerText).then(
			function() {
				button.blur();
				button.innerHTML = copiedIcon;
				setTimeout(function () {button.innerHTML = copyIcon}, 1000);
			},
			function (error) {
				button.blur();
				button.innerHTML = "Error";
				setTimeout(function () {button.innerHTML = copyIcon}, 3000);
			}
		);
	});
	parentNode.appendChild(button);
}

/**
 * add "run" button for codeblock
 */
function addRunButton(options, parentNode, code) {
	var lang = exports.languageName(code.getAttribute(options.langAttrName));
	if (!lang || !codeblock.runners[lang]) {
		return;
	}
	var id = allocateUUID();
	var highlight = code.parentNode.parentNode;
	var attrs = highlight.getAttribute(options.codeBlockAttrName) || "";
	if (attrs === kIgnoredProgram) {
		return;
	}
	var program = kDefaultProgram;
	var tag = "";
	var colon = attrs.indexOf(kProgramSeparator);
	if (colon >= 0) {
		program = attrs.substr(0, colon) || program;
		tag = attrs.substr(colon + 1);
	} else {
		program = attrs || program;
	}
	// program with language prefix
	program = lang + kProgramSeparator + program;
	if (tag === kTagBad) {
		return;
	}
	var runnable = tag === kTagRun;
	var block = new Block(id, lang, code.innerText);
	var blocks = codeblock.programs[program];
	if (!blocks) {
		codeblock.programs[program] = [block];
	} else {
		blocks.push(block);
	}
	if (!runnable) {
		return;
	}
	var runIcon = options.runIcon;
	var runningIcon = options.runningIcon;
	var button = document.createElement("button");
	button.className = options.codeRunButtonClass;
	button.type = "button";
	button.innerHTML = runIcon;
	button.addEventListener("click", function() {
		button.innerHTML = runningIcon;
		clearCodeOutput(options, code);
		runProgram(id, program).then(
			function(res) {
				if (res.Errors) {
					console.log(res.Errors);
					createCodeOutput(options, code, [{
						Message: res.Errors,
						Kind: kOutputStderr
					}]);
				} else {
					createCodeOutput(options, code, res.Events);
				}
				button.blur();
				button.innerHTML = runIcon;
			},
			function (error) {
				createCodeOutput(options, code, [{
					Message: error + "",
					Kind: kOutputStderr
				}]);
				button.blur();
				button.innerHTML = runIcon;
			}
		);
	});
	parentNode.appendChild(button);
}

/**
 * runProgram runs specific program
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
		var Runner = codeblock.runners[lang];
		if (!Runner) {
			reject("runner not found for " + lang);
			return;
		}
		for (var i = 0; i < blocks.length; i++) {
			if (Runner.runnableOne) {
				if (blocks[i].runnable && blocks[i].id !== id) {
					continue;
				}
			}
			selected.push(blocks[i]);
			if (blocks[i].id === id) {
				break;
			}
		}
		try {
			var runner = new Runner(lang);
			runner.parse(selected);
			runner.run().then(resolve).catch(reject);
		} catch (e) {
			reject(e + "");
		}
	});
}

/**
 * clears code output
 */
function clearCodeOutput(options, code) {
	var child = code.parentNode.parentNode.querySelector("." + options.codeOutputClass);
	if (child) {
		code.parentNode.parentNode.removeChild(child);
	}
}

/**
 * creates code output
 */
function createCodeOutput(options, code, results) {
	clearCodeOutput(options, code);
	var child = document.createElement("pre");
	child.className = options.codeOutputClass;
	var output = document.createElement("code");
	child.appendChild(output);
	if (options.outputPrefix && typeof options.outputPrefix === 'string') {
		output.insertAdjacentHTML('beforeend', options.outputPrefix);
	}
	for (var i = 0; i < results.length; i++) {
		var span = document.createElement("span");
		if (results[i].Kind === kOutputStderr) {
			span.style = options.errorOutputStyle;
		}
		span.innerText = results[i].Message;
		output.appendChild(span);
	}
	code.parentNode.after(child);
}

function getDefaultValue(value, defaultValue) {
	return value === undefined ? defaultValue : value;
}

/**
 * init initializes codeblock with options
 */
exports.init = function(options) {
	if (codeblock.initialized) {
		console.warn("codeblock already initialized");
		return;
	}
	codeblock.initialized = true;
	options = options || {};

	options.codeSelector = "pre > code";
	options.enableClipboard = getDefaultValue(options.enableClipboard, true);
	options.enableRunner = getDefaultValue(options.enableRunner, true);
	options.codeButtonContainerClass = options.codeButtonContainerClass || "code-button-container";
	options.langAttrName = options.langAttrName || "data-lang";
	options.codeBlockAttrName = options.codeBlockAttrName || "code-block";

	options.copyIcon = options.copyIcon || '<i class="fas fa-copy"></i>';
	options.copiedIcon = options.copiedIcon || '<i class="fas fa-check" style="color: #32CD32"></i>';
	options.codeClipboardButtonClass = options.codeClipboardButtonClass || "btn btn-light btn-code btn-code-clipboard";

	options.runIcon = options.runIcon || '<i class="fas fa-play"></i><span> Run</span>';
	options.runningIcon = options.runningIcon || 'Running';
	options.codeRunButtonClass = options.codeRunButtonClass || "btn btn-light btn-code btn-code-run";

	options.codeOutputClass = options.codeOutputClass || "code-output";
	options.errorOutputStyle = options.errorOutputStyle || "color: red";
	options.outputPrefix = getDefaultValue(options.outputPrefix, true);
	if (options.outputPrefix && typeof options.outputPrefix !== 'string') {
		options.outputPrefix = '<span style="color:grey">Output:\n</span>'
	}

	if (options.enableClipboard && !options.clipboard) {
		options.clipboard = navigator && navigator.clipboard ? navigator.clipboard : null;
	}
	if (options.clipboard) {
		codeblock.clipboard = options.clipboard;
	}

	console.log("codeblock initializing with options:", options);

	// DOM 加载后进行初始化
	document.addEventListener('DOMContentLoaded',function(){
		if (!options.enableClipboard) {
			addCodeButtons(options);
			return;
		}
		if (codeblock.clipboard) {
			addCodeButtons(options);
		} else {
			var script = document.createElement("script");
			script.src =
			  "https://cdnjs.cloudflare.com/ajax/libs/clipboard-polyfill/2.7.0/clipboard-polyfill.promise.js";
			script.integrity = "sha256-waClS2re9NUbXRsryKoof+F9qc1gjjIhc2eT7ZbIv94=";
			script.crossOrigin = "anonymous";
			script.onload = function() {
				codeblock.clipboard = clipboard;
				addCodeButtons(options);
			}
			document.body.appendChild(script);
		}
	});
}

window.codeblock = exports;

})();
