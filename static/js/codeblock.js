(function() {

var exports = {};

// https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/String/includes
if (!String.prototype.includes) {
	String.prototype.includes = function(search, start) {
		'use strict';
		if (typeof start !== 'number') {
			start = 0;
		}
		if (start + search.length > this.length) {
			return false;
		} else {
			return this.indexOf(search, start) !== -1;
		}
	};
}

/**
 * codeblock context value
 */
var codeblock = {
	initialized: false, /* initialized or not */
	nextUUID: 0, /* used to allocate uuid */
	runners: {}, /* code runners for each languages */
	programs: {}, /* programs by program name */
	blocks: {}, /* code blocks by id */
	clipboard: null, /* clipboard API object */
};

/**
 * allocateUUID allocates an uuid
 */
function allocateUUID() {
	codeblock.nextUUID++;
	return codeblock.nextUUID;
}

/**
 * guid allocates a guid
 */
function guid() {
	var d = new Date().getTime();
	if (typeof performance !== 'undefined' && typeof performance.now === 'function'){
		d += performance.now();
	}
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
		var r = (d + Math.random() * 16) % 16 | 0;
		d = Math.floor(d / 16);
		return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
	});
};

/**
 * languageName get internal standard language name
 */
function languageName(name) {
	if (name) {
		name = name.toLowerCase();
	}
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
		default:
			return name;
	}
}

// code examples
//
// For html:
//	<pre><code code="-"></code></pre>
//	<pre><code code="main"></code></pre>
//	<pre><code code="main+b"></code></pre>
//	<pre><code code="main+r"></code></pre>
//	<pre><code code="main+rb"></code></pre>
//	<pre><code code="+b"></code></pre>
//	<pre><code code="+r"></code></pre>
//	<pre><code code="$+r"></code></pre>
//
// For hugo:
//  {code="-"}
//  {code="main"}
//  {code="main+b"}
//  {code="main+r"}
//  {code="main+rb"}
//  {code="+b"}
//  {code="+r"}
//  {code="$+r"}

var kDefaultProgram = "main";
var kIgnoredProgram = "-";
var kAutoProgram = "$";
var kProgramSeparator = "+";

// modes: xbew
var kModeExe = "x";   // executable
var kModeBad = "b";   // bad code and not executed
var kModeErr = "e";   // TODO: error code but can executed
var kModeWrite = "w"; // TODO: writable

/**
 * output kinds
 */
exports.Stdout = "stdout";
exports.Stderr = "stderr";

/**
 * Block represents a code block
 */
function Block(id, lang, source, element) {
	this.id = id;
	this.lang = lang;
	this.source = source;
	this.element = element;
}

Block.prototype.update = function() {
	if (this.element) {
		this.source = this.element.innerText;
	}
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

function getCaret(element) {
	var caretOffset = 0;
	var doc = element.ownerDocument || element.document;
	var win = doc.defaultView || doc.parentWindow;
	var sel;
	if (typeof win.getSelection != "undefined") {
		sel = win.getSelection();
		if (sel.rangeCount > 0) {
			var range = win.getSelection().getRangeAt(0);
			var preCaretRange = range.cloneRange();
			preCaretRange.selectNodeContents(element);
			preCaretRange.setEnd(range.endContainer, range.endOffset);
			caretOffset = preCaretRange.toString().length;
		}
	} else if ((sel = doc.selection) && sel.type != "Control") {
		var textRange = sel.createRange();
		var preCaretTextRange = doc.body.createTextRange();
		preCaretTextRange.moveToElementText(element);
		preCaretTextRange.setEndPoint("EndToEnd", textRange);
		caretOffset = preCaretTextRange.text.length;
	}
	return caretOffset;
}

function getContentLength(node) {
	var n = 0;
	if (node.childNodes && node.childNodes.length) {
		for (var i = 0; i < node.childNodes.length; i++) {
			if (node.childNodes[i].textContent) {
				n += node.childNodes[i].textContent.length;
				return n;
			}
		}
	}
	if (node.textContent) {
		n += node.textContent.length;
	}
	return n;
}

function setCaret(element, lastPos) {
	var curNode=0;
	var range = document.createRange();
	var sel = window.getSelection();

	var n = 0;
	if (element.childNodes.length > 0) {
		while (true) {
			n = getContentLength(element.childNodes[curNode]);
			if (lastPos <= n) {
				break;
			}
			lastPos = lastPos - n;
			curNode++;
		}
		var parentNode = element.childNodes[curNode];
		if (parentNode.childNodes && parentNode.childNodes.length > 0) {
			range.setStart(parentNode.childNodes[0], lastPos);
		} else {
			range.setStart(parentNode, lastPos);
		}
		range.collapse(true);
		sel.removeAllRanges();
		sel.addRange(range);
	}
	element.focus();
};

var spaceRegexp = /\s/;

/**
 * add "run" button for codeblock
 */
function addRunButton(options, parentNode, code) {
	var lang = languageName(code.getAttribute(options.langAttrName));
	if (!lang || !codeblock.runners[lang]) {
		return;
	}
	var id = allocateUUID();
	var highlight = code.parentNode.parentNode;

	// parse "code" attributes: [programName][+xbew] | "-" | ""
	var attrs = highlight.getAttribute(options.codeAttrName) || "";
	if (attrs === kIgnoredProgram) {
		return;
	}
	var program = kDefaultProgram;
	var modes = "";
	var splitIndex = attrs.indexOf(kProgramSeparator);
	if (splitIndex >= 0) {
		// program+modes
		program = attrs.substr(0, splitIndex) || program;
		modes = attrs.substr(splitIndex + 1);
		if (modes.includes(kModeBad)) {
			return;
		}
	} else {
		program = attrs || program;
	}
	if (program === kAutoProgram) {
		program = guid().replace(/-/g, "");
	}
	var dynamic = false;
	if (modes.includes(kModeWrite)) {
		code.setAttribute("contenteditable", "true");
		code.spellcheck = false;
		code.addEventListener('keydown', function(e){
			if (e.keyCode == 9/*tab*/){
				e.preventDefault();
				document.execCommand('insertHTML', false, '&#009');
			} else if (e.keyCode == 13/*enter*/) {
				e.preventDefault();
				var prefix;
				if (code.innerText) {
					var cursor = getCaret(code);
					var lastLineIndex = code.innerText.substr(0, cursor).lastIndexOf("\n");
					var isEmptyLine = true;
					var lineStart = lastLineIndex + 1;
					if (lastLineIndex >= 0) {
						for (var i = lineStart; i < cursor; i++) {
							if (!spaceRegexp.test(code.innerText.charAt(i))) {
								isEmptyLine = false;
								if (i > lineStart) {
									prefix = code.innerText.substr(lineStart, i - lineStart);
								}
								break;
							}
						}
						if (isEmptyLine && cursor > lineStart) {
							prefix = code.innerText.substr(lineStart, cursor - lineStart);
						}
					}
					if (isEmptyLine && lineStart < cursor) {
						// remove current empty line but line endings
						setCaret(code, lineStart);
						for (var i = lineStart; i < cursor; i++) {
							document.execCommand('forwardDelete', false);
						}
					}
				}
				document.execCommand('insertParagraph', false);
				if (prefix) {
					document.execCommand('insertText', false, prefix);
				}
			}
		})
		code.addEventListener('input', function(e) {
			if (code.getAttribute("compositionstart") === "true") {
				return;
			}
			if (options.highlighter) {
				var grammer = options.highlighter.languages[lang];
				if (grammer) {
					var res = options.highlighter.highlight(code.innerText, grammer, lang);
					var cursor = getCaret(code);
					code.innerHTML = res;
					setCaret(code, cursor);
				}
			}
		});
		code.addEventListener('compositionstart', function(e) {
			code.setAttribute("compositionstart", "true");
		});
		code.addEventListener('compositionend', function(e) {
			code.setAttribute("compositionstart", "false");
			code.dispatchEvent(new Event('input', {bubbles:true}));
		});
		code.style.whiteSpace = 'pre-wrap';
		dynamic = true;
	}
	// program with language prefix
	program = lang + kProgramSeparator + program;
	var runnable = modes.includes(kModeExe);
	var block = new Block(id, lang, code.innerText, dynamic ? code : null);
	codeblock.blocks[id] = block;
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
						Kind: exports.Stderr
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
					Kind: exports.Stderr
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
			blocks[i].update();
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
		if (results[i].Kind === exports.Stderr) {
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

	// Request JSON:
	//	  {
	//		  classes: false
	//		  language: "languageName"
	//		  style: "stylename"
	//		  text: "code"
	//	  }
	//
	// Response JSON: {html: ""}
	options.highlighter = getDefaultValue(options.highlighter, window.Prism ? window.Prism : null);
	options.highlightStyle = options.highlightStyle || "pygments";

	options.codeSelector = "pre > code";
	options.enableClipboard = getDefaultValue(options.enableClipboard, true);
	options.enableRunner = getDefaultValue(options.enableRunner, true);
	options.codeButtonContainerClass = options.codeButtonContainerClass || "code-button-container";
	options.langAttrName = options.langAttrName || "data-lang";
	options.codeAttrName = options.codeAttrName || "code";

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
