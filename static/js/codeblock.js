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
	runners: {}, /* code runners for each languages */
	programs: {}, /* programs by program name */
	blocks: {}, /* code blocks by id */
	clipboard: null, /* clipboard API object */
	highlighter: null, /* syntax highlighter */
};

/**
 * languages list all predecalred language names
 */
exports.languages = {
	go: "go",
	rust: "rust",
	lua: "lua",
	c: "c",
	cpp: "cpp",
	csharp: "csharp",
	java: "java",
	swift: "swift",
	r: "r",
	python: "python",
	javascript: "javascript",
	perl: "perl",
	php: "php",
	kotlin: "kotlin",
	scala: "scala",
	groovy: "groovy",
	haskell: "haskell",
	lisp: "lisp",
	elixir: "elixir",
	fsharp: "fsharp",
	assembly: "assembly",
	ocaml: "ocaml",
	bash: "bash",
	typescript: "typescript",
	prolog: "prolog",
	jshell: "jshell",
	tcl: "tcl",
	ada: "ada",
	d: "d",
	erlang: "erlang",
	fortran: "fortran",
	racket: "racket",
	vb: "vb",
	clojure: "clojure",
	cobol: "cobol",
	pascal: "pascal",
	octave: "octave",
	mysql: "mysql",
	postgresql: "postgresql",
	sqlite: "sqlite",
	mongodb: "mongodb",
	redis: "redis",
};

var languageAliases = {
	"c++": exports.languages.cpp,
	"py": exports.languages.python,
	"golang": exports.languages.go,
	"js": exports.languages.javascript,
	"ts": exports.languages.typescript,
	"cs": exports.languages.csharp,
	"c#": exports.languages.csharp,
	"f#": exports.languages.fsharp,
	"fs": exports.languages.fsharp,
	"kt": exports.languages.kotlin,
	"lisp": exports.languages.lisp,
	"asm": exports.languages.assembly,
}

/**
 * extensions of source filename
 */
var extensions = {};

extensions[exports.languages.haskell] = "hs";
extensions[exports.languages.csharp] = "cs";
extensions[exports.languages.fsharp] = "fs";
extensions[exports.languages.rust] = "rs";
extensions[exports.languages.lisp] = "lsp";
extensions[exports.languages.assembly] = "asm";
extensions[exports.languages.ocaml] = "ml";
extensions[exports.languages.bash] = "sh";
extensions[exports.languages.typescript] = "ts";
extensions[exports.languages.prolog] = "pl";
extensions[exports.languages.jshell] = "jsh";
extensions[exports.languages.ada] = "adb";
extensions[exports.languages.erlang] = "erl";
extensions[exports.languages.fortran] = "ftn";
extensions[exports.languages.racket] = "rkt";
extensions[exports.languages.clojure] = "clj";
extensions[exports.languages.cobol] = "cbl";
extensions[exports.languages.pascal] = "pas";
extensions[exports.languages.octave]= "m";
extensions[exports.languages.mysql] = "sql";
extensions[exports.languages.postgresql] = "sql";
extensions[exports.languages.sqlite] = "sql";
extensions[exports.languages.mongodb] = "js";

var syntaxAliases = {};

syntaxAliases[exports.languages.mysql] = "sql";
syntaxAliases[exports.languages.postgresql] = "sql";
syntaxAliases[exports.languages.sqlite] = "sql";
syntaxAliases[exports.languages.mongodb] = "js";
syntaxAliases[exports.languages.redis] = "bash";
syntaxAliases[exports.languages.jshell] = "java";
syntaxAliases[exports.languages.assembly] = "nasm";
syntaxAliases[exports.languages.octave] = "matlab";

/**
 * languageName get predecalred language name
 */
exports.languageName = function(lang) {
	if (lang) {
		lang = lang.toLowerCase();
	}
	return languageAliases[lang] || lang;
}

/**
 * extensionName returns source file extension by language name
 */
exports.extensionName = function(lang) {
	lang = exports.languageName(lang);
	return extensions[lang] || lang;
}

exports.syntaxName = function(lang) {
	lang = exports.languageName(lang);
	return syntaxAliases[lang] || lang;
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

var kMaxHistories = 1000;

/**
 * output kinds
 */
exports.Stdout = "stdout";
exports.Stderr = "stderr";

/**
 * Block represents a code block
 */
function Block(id, lang, element) {
	this.id = id;
	this.lang = lang;
	this.element = element;
	this.resetHistory();
	this.buttons = {};
}

Block.prototype.resetHistory = function() {
	this.history = [{
		cursor: 0,
		source: this.source,
	}];
};

Object.defineProperty(Block.prototype, "source", {
	get: function() {
		return this.element.innerText;
	}
});

/**
 * register registers code runner for specific program language
 */
exports.register = function(lang, runner) {
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
			addLanguageButton(options, div, code);
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
	button.setAttribute("data-toggle", "tooltip");
	button.setAttribute("data-placement", "bottom");
	button.setAttribute("title", "Copy");
	$(button).tooltip({
		trigger: "hover",
		delay: {show: 250, hide: 250}
	});
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

function lookupCursor(element, lastPos, target) {
	if (element.childNodes && element.childNodes.length) {
		for (var i = 0; i < element.childNodes.length; i++) {
			if (lookupCursor(element.childNodes[i], lastPos, target)) {
				return true;
			}
		}
	} else {
		if (lastPos <= target.offset + element.textContent.length) {
			target.node = element;
			target.offset = lastPos - target.offset;
			return true;
		} else {
			target.offset += element.textContent.length;
		}
	}
	return false;
}

function setCaret(element, lastPos) {
	var curNode=0;
	var range = document.createRange();
	var sel = window.getSelection();

	if (element.childNodes.length > 0) {
		var node = element;
		var target = {node: undefined, offset: 0};
		lookupCursor(element, lastPos, target);
		if (target.node) {
			range.setStart(target.node, target.offset);
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
function addLanguageButton(options, parentNode, code) {
	var lang = exports.languageName(code.getAttribute(options.langAttrName));
	if (!lang || !codeblock.runners[lang]) {
		return;
	}
	var id = code.id;
	if (!id) {
		id = guid();
		code.id = id;
	}
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
	// program with language prefix
	program = lang + kProgramSeparator + program;
	var runnable = modes.includes(kModeExe);
	var block = new Block(id, lang, code);
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
	block.buttons["run"] = addRunButton(options, parentNode, code, id, program);
	if (modes.includes(kModeWrite)) {
		var button = addUndoButton(options, parentNode, block);
		block.buttons["undo"] = button;
		setEditMode(options, block, button);
	}
}

function setEditMode(options, block, undoButton) {
	var code = block.element;
	var lastSaveTime = new Date().getTime();
	var lastInputTime = lastSaveTime;
	var idleInterval = 500; // 500ms
	var maxSaveInterval = 5000; // 5s
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
		var now = new Date().getTime();
		if (now > lastSaveTime + maxSaveInterval || now > lastInputTime + idleInterval) {
			lastSaveTime = now;
			var size = block.history.length;
			var source = code.innerText;
			if (size === 0 || block.history[size-1].source !== source) {
				var last = block.history[size-1];
				block.history.push({
					cursor: getCaret(code),
					source: source
				});
				if (block.history.length > kMaxHistories) {
					console.log("merge the first half");
					// 1 2 3 4 | 5 6 7 8
					// y n y n | y y y y
					// 1 3 5 6 7 8
					var quarter = Math.floor(block.history.length / 4);
					for (var i = 1; i < quarter; i++) {
						block.history[i] = block.history[2*i];
					}
					for (var i = 2*quarter; i < block.history.length; i++) {
						block.history[i - quarter] = block.history[i];
					}
					block.history = block.history.slice(0, block.history.length - quarter);
				}
			} else if (size > 0) {
				block.history[size-1].cursor = getCaret(code);
			}
			undoButton.style.visibility = 'visible';
		}
		lastInputTime = now;
		updateCodeBlock(code, block.lang);
	});
	code.addEventListener('compositionstart', function(e) {
		code.setAttribute("compositionstart", "true");
	});
	code.addEventListener('compositionend', function(e) {
		code.setAttribute("compositionstart", "false");
		code.dispatchEvent(new Event('input', {bubbles:true}));
	});
	code.style.whiteSpace = 'pre-wrap';
}

function updateCodeBlock(code, lang, cursor) {
	if (codeblock.highlighter) {
		var grammer = codeblock.highlighter.languages[exports.syntaxName(lang)];
		if (grammer) {
			var res = codeblock.highlighter.highlight(code.innerText, grammer, lang);
			if (cursor == undefined || cursor == null) {
				cursor = getCaret(code);
			}
			code.innerHTML = res;
			setCaret(code, cursor);
		}
	}
}

function addRunButton(options, parentNode, code, id, program) {
	var runIcon = options.runIcon;
	var runningIcon = options.runningIcon;
	var button = document.createElement("button");
	button.className = options.codeRunButtonClass;
	button.type = "button";
	button.innerHTML = runIcon;
	button.setAttribute("data-toggle", "tooltip");
	button.setAttribute("data-placement", "bottom");
	button.setAttribute("title", "Run");
	$(button).tooltip({
		trigger: "hover",
		delay: {show: 250, hide: 250}
	});
	button.addEventListener("click", function() {
		button.innerHTML = runningIcon;
		clearCodeOutput(code);
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

function addUndoButton(options, parentNode, block) {
	var undoIcon = options.undoIcon;
	var button = document.createElement("button");
	button.className = options.codeUndoButtonClass;
	button.type = "button";
	button.innerHTML = undoIcon;
	button.setAttribute("data-toggle", "tooltip");
	button.setAttribute("data-placement", "bottom");
	button.setAttribute("title", "Undo");
	$(button).tooltip({
		trigger: "hover",
		delay: {show: 250, hide: 250}
	});
	button.style.visibility = block.history.length > 1 ? 'visible' : 'hidden';
	button.addEventListener("click", function() {
		if (block.history.length > 1) {
			block.history.pop();
		}
		var last = block.history[block.history.length - 1];
		block.element.innerText = last.source;
		updateCodeBlock(block.element, block.lang, last.cursor);
		button.style.visibility = block.history.length > 1 ? 'visible' : 'hidden';
		clearCodeOutput(block.element);
	});
	parentNode.appendChild(button);
	return button;
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
function clearCodeOutput(code) {
	var child = code.parentNode.parentNode.querySelector('[for="' + code.id + '"]');
	if (child) {
		code.parentNode.parentNode.removeChild(child);
	}
}

/**
 * creates code output
 */
function createCodeOutput(options, code, results) {
	clearCodeOutput(code);
	var child = document.createElement("pre");
	child.setAttribute("for", code.id);
	var output = document.createElement("code");
	child.appendChild(output);
	if (options.outputPrefix && typeof options.outputPrefix === 'string') {
		output.insertAdjacentHTML('beforeend', options.outputPrefix);
	}
	code.parentNode.after(child);
	appendOutput(options, results, output, 0, false);
}

function appendOutput(options, results, output, index, delayed) {
	for (var i = index; i < results.length; i++) {
		var e = results[i];
		if (!delayed && e.Delay > 0) {
			var nextIndex = i;
			console.log("timeout:", e.Delay);
			setTimeout(function() {
				appendOutput(options, results, output, nextIndex, true);
			}, e.Delay / 1e6);
			return;
		}
		delayed = false;
		if (results[i].Kind === exports.Stderr) {
			var span = document.createElement("span");
			span.innerText = results[i].Message;
			span.style = options.errorOutputStyle;
			output.appendChild(span);
			continue;
		}
		var hasFlush = results[i].Message.startsWith("\f");
		if (hasFlush && output.lastChild && output.lastChild.getAttribute("data-has-flush") === "true") {
			output.lastChild.innerText = results[i].Message;
		} else {
			var span = document.createElement("span");
			span.innerText = results[i].Message;
			if (hasFlush) {
				span.setAttribute("data-has-flush", "true");
			}
			output.appendChild(span);
		}
	}
}

function flushOutputContent(output, content) {
	var span = document.createElement("span");
	span.innerText = content.join('');
	output.appendChild(output);
	context.splice(0, content.length);
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

	codeblock.highlighter = getDefaultValue(options.highlighter, window.Prism ? window.Prism : null);
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

	options.runIcon = options.runIcon || '<i class="fas fa-play"></i>';
	options.runningIcon = options.runningIcon || '<i class="fas fa-sync fa-spin"></i>';
	options.codeRunButtonClass = options.codeRunButtonClass || "btn btn-light btn-code btn-code-run";
	options.undoIcon = options.undoIcon || '<i class="fas fa-undo"></i>';
	options.codeUndoButtonClass = options.codeUndoButtonClass || "btn btn-light btn-code btn-code-undo";

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

exports.bindSelector = function(options) {
	console.log('bindSelector');
	options.codes = options.codes || {};
	var selector = document.querySelector(options.selector);
	var highlight = document.getElementById(options.editor);
	if (!highlight) {
		console.log("bindSelector: highlight not found");
		return;
	}
	var code = highlight.querySelector("pre > code");
	if (!code) {
		console.log("bindSelector: code not found");
		return;
	}
	var block = codeblock.blocks[code.id];
	if (!block) {
		console.log("bindSelector: block %s not found", code.id);
		return;
	}
	var languageCodes = {};
	selector.addEventListener("change", function(e) {
		var oldLang = code.getAttribute("data-lang");
		var lang = exports.languageName(e.target.value);
		if (oldLang === lang) {
			return;
		}
		if (oldLang) {
			languageCodes[oldLang] = code.innerText;
		}
		console.log("language changed from %s to %s", oldLang, lang);
		code.className = "language-" + exports.syntaxName(lang);
		code.parentNode.className = "language-" + exports.syntaxName(lang);
		code.setAttribute("data-lang", lang);
		code.innerText = languageCodes[lang] || options.codes[lang] || "";
		block.lang = lang;
		block.resetHistory();
		updateCodeBlock(code, lang);
		clearCodeOutput(code);
		code.blur();
		var undoButton = block.buttons["undo"];
		if (undoButton) {
			undoButton.style.visibility = block.history.length > 1 ? 'visible' : 'hidden';
		}
	});
}

window.codeblock = exports;

})();
