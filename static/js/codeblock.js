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

window.copyInnerText = function(selector, result) {
	var elem = document.querySelector(selector);
	if (elem && codeblock.clipboard) {
		codeblock.clipboard.writeText(elem.innerText).then(function() {
			if (result) {
				var resultElem = document.querySelector(result);
				if (resultElem) {
					resultElem.innerText = "已复制";
				}
			}
		});
	}
}

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

function isMobile() {
	return (navigator && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
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
var kModeShare = "s"; // share code
var kModeNoNumber = "n"; // no line number

var kMaxHistories = 1000;

/**
 * output kinds
 */
exports.Stdout = "stdout";
exports.Stderr = "stderr";

/**
 * Block represents a code block
 */
function Block(id, lang, program, modes, code) {
	this.id = id;
	this.lang = lang;
	this.program = program;
	this.modes = modes;
	this.code = code;
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
		return this.code.innerText;
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
        var highlight = pre.parentNode;
		pre.insertBefore(div, code);
		var height = highlight.getAttribute("code-height");
		if (height) {
			var comma = height.indexOf(",");
			if (comma >= 0) {
				var forMobile = height.substr(0, comma);
				var forDesktop = height.substr(comma + 1);
				height = isMobile() ? forMobile : forDesktop;
			}
			if (height) {
				code.style.height = height;
			}
		}

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
	button.className = options.clipboardButtonClass;
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
				button.innerHTML = copyIcon;
				createTextAlert(error, "danger");
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
	var range = document.createRange();
	var sel = window.getSelection();

	if (element.childNodes.length > 0) {
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

function selectRange(element, begin, end) {
	var range = document.createRange();
	var sel = window.getSelection();
	if (element.childNodes.length > 0) {
		var beginTarget = {node: undefined, offset: 0};
		lookupCursor(element, begin, beginTarget);
		if (!beginTarget.node) {
			return false;
		}
		range.setStart(beginTarget.node, beginTarget.offset);

		var endTarget = {node: undefined, offset: 0};
		lookupCursor(element, end, endTarget);
		if (!endTarget.node) {
			return false;
		}
		range.setEnd(endTarget.node, endTarget.offset);

		sel.removeAllRanges();
		sel.addRange(range);
		element.focus();
		return true;
	}
	return false;
}

function scrollSelectionIntoView() {
	var selection = window.getSelection();
	if (!selection.rangeCount) {
		return;
	}
	var firstRange = selection.getRangeAt(0);
	if (firstRange.commonAncestorContainer === document) {
		return;
	}

	var tempAnchorEl = document.createElement('br');
	firstRange.insertNode(tempAnchorEl);
	tempAnchorEl.scrollIntoViewIfNeeded(false);
	tempAnchorEl.remove();
};

var spaceRegexp = /\s/;

function isHidden(elem) {
	return elem.offsetParent == null;
}

/**
 * add run/undo/share button for codeblock
 */
function addLanguageButton(options, parentNode, code) {
	if (isHidden(code)) {
		return;
	}
	var lang = exports.languageName(code.getAttribute(options.langAttrName));
	var hasRunner = lang && codeblock.runners[lang];
	var id = code.id;
	if (!id) {
		id = guid();
		code.id = id;
	}
	var highlight = code.parentNode.parentNode;

	// parse "code" attributes: [programName][+xbew] | "-" | ""
	var attrs = highlight.getAttribute(options.codeAttrName) || "";
	var isIgnored = attrs === kIgnoredProgram;
	var program = kDefaultProgram;
	var modes = "";
	var isBad = false;
	var splitIndex = attrs.indexOf(kProgramSeparator);
	if (splitIndex >= 0) {
		// program+modes
		program = attrs.substr(0, splitIndex) || program;
		modes = attrs.substr(splitIndex + 1);
		if (modes.includes(kModeBad)) {
			code.className += ' bad-code';
			isBad = true;
		}
	} else {
		program = attrs || program;
	}
	if (program === kAutoProgram || isBad) {
		program = guid().replace(/-/g, "");
	}
	// program with language prefix
	program = lang + kProgramSeparator + program;
	var block = new Block(id, lang, program, modes, code);
	if (hasRunner && !isIgnored && !isBad) {
		codeblock.blocks[id] = block;
		var blocks = codeblock.programs[program];
		if (!blocks) {
			codeblock.programs[program] = [block];
		} else {
			blocks.push(block);
		}
	}
	console.log("isIgnored", isIgnored, ", hasRunner", hasRunner);
	var runnable = !isIgnored && hasRunner && modes.includes(kModeExe);
	if (runnable) {
		block.buttons["run"] = addRunButton(options, parentNode, block);
	}
	if (modes.includes(kModeWrite)) {
		if (runnable && modes.includes(kModeShare) && window.mongo) {
			block.buttons["share"] = addShareButton(options, parentNode, block);
		}
		var button = addUndoButton(options, parentNode, block);
		block.buttons["undo"] = button;
		setEditMode(options, block, button);
	}
	if (!modes.includes(kModeNoNumber)) {
		var container = document.createElement("div");
		container.className = "codeblock-container";
		var flex = document.createElement("div");
		flex.className = "codeblock-source";
		container.appendChild(flex);
		highlight.parentNode.insertBefore(container, highlight);

		var numbersContainer = document.createElement("div");
		var numbersPre = document.createElement("pre");
		var numbersCode = document.createElement("code");
		flex.appendChild(numbersContainer);
		numbersContainer.className = "highlight codeblock-left";
		numbersContainer.appendChild(numbersPre);
		numbersPre.appendChild(numbersCode);
		numbersPre.style.overflow = "hidden";
		numbersPre.style.height = "100%";
		numbersPre.className = "language-c";
		numbersCode.className = "language-c";

		highlight.className += " codeblock-right";
		flex.appendChild(highlight);

		var numbers = syncLineNumbers(block);
		code.onscroll = function(e) {
			numbers.scrollTop = e.target.scrollTop;
		};
		window.addEventListener("resize", function(e) {
			syncLineNumbers(block);
		});
	}
}

function syncLineNumbers(block) {
	var code = block.code;
	var numbers = code.parentNode.parentNode.parentNode.querySelector(".codeblock-left > pre > code");
	numbers.style.height = block.code.offsetHeight + "px";
	var lines = 0;
	var source = code.innerText;
	var lineend = "\n";
	var lastIndex = -1;
	if (source) {
		for (var i = 0; i < source.length; i++) {
			if (source.charAt(i) === lineend) {
				lastIndex = i;
				lines++;
			}
		}
		if (lastIndex + 1 < source.length) {
			lines++;
		}
	}
	if (lines === 0) {
		lines = 1;
	}
	if (numbers.childNodes.length === lines) {
		return numbers;
	}
	while (numbers.childNodes.length > lines) {
		numbers.removeChild(numbers.lastChild);
	}
	while (numbers.childNodes.length < lines) {
		var span = document.createElement("span");
		span.innerText = (numbers.childNodes.length + 1) + "\n";
		numbers.appendChild(span);
	}
	return numbers;
}

function setEditMode(options, block, undoButton) {
	var code = block.code;
	var lastSaveTime = new Date().getTime();
	var lastInputTime = lastSaveTime;
	var idleInterval = 2000; // 2s
	var maxSaveInterval = 20000; // 20s
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
					if (selectRange(code, lineStart, cursor)) {
						document.execCommand('delete', null, false);
						setCaret(code, lineStart);
					} else {
						setCaret(code, lineStart);
						for (var i = lineStart; i < cursor; i++) {
							document.execCommand('forwardDelete', false);
						}
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
			undoButton.hidden = false;
		}
		lastInputTime = now;
		updateCodeBlock(block);
	});
	code.addEventListener('compositionstart', function(e) {
		code.setAttribute("compositionstart", "true");
	});
	code.addEventListener('compositionend', function(e) {
		code.setAttribute("compositionstart", "false");
		code.dispatchEvent(new Event('input', {bubbles:true}));
	});
}

function updateCodeBlock(block, cursor) {
	var code = block.code;
	var lang = block.lang;
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
	syncLineNumbers(block);
	scrollSelectionIntoView();
}

function addRunButton(options, parentNode, block) {
	var code = block.code;
	var runIcon = options.runIcon;
	var runningIcon = options.runningIcon;
	var button = document.createElement("button");
	button.className = options.runButtonClass;
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
		clearCodeOutput(block);
		runProgram(block.id, block.program).then(
			function(res) {
				if (res.Errors) {
					console.log(res.Errors);
					createCodeOutput(options, block, [{
						Message: res.Errors,
						Kind: exports.Stderr
					}]);
				} else {
					createCodeOutput(options, block, res.Events);
				}
				button.blur();
				button.innerHTML = runIcon;
			},
			function (error) {
				createCodeOutput(options, block, [{
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
	button.className = options.undoButtonClass;
	button.type = "button";
	button.innerHTML = undoIcon;
	button.setAttribute("data-toggle", "tooltip");
	button.setAttribute("data-placement", "bottom");
	button.setAttribute("title", "Undo");
	$(button).tooltip({
		trigger: "hover",
		delay: {show: 250, hide: 250}
	});
	button.hidden = block.history.length <= 1;
	button.addEventListener("click", function() {
		if (block.history.length > 1) {
			block.history.pop();
		}
		var last = block.history[block.history.length - 1];
		block.code.innerText = last.source;
		updateCodeBlock(block, last.cursor);
		button.hidden = block.history.length <= 1;
		clearCodeOutput(block);
	});
	parentNode.appendChild(button);
	return button;
}

function addShareButton(options, parentNode, block) {
	var shareIcon = options.shareIcon;
	var sharingIcon = options.sharingIcon;
	var button = document.createElement("button");
	button.className = options.shareButtonClass;
	button.type = "button";
	button.innerHTML = shareIcon;
	button.setAttribute("data-toggle", "tooltip");
	button.setAttribute("data-placement", "bottom");
	button.setAttribute("title", "Share");
	$(button).tooltip({
		trigger: "hover",
		delay: {show: 250, hide: 250}
	});
	button.addEventListener("click", function() {
		button.innerHTML = sharingIcon;
		shareCode(options, {
			lang: block.lang,
			code: block.code.innerText,
		}).then(function(res) {
			button.innerHTML = shareIcon;
			button.blur();
			if (res.error) {
				console.log("share code error", res.error);
				createTextAlert(error, "danger");
				return;
			}
			console.log("share code ok");
			createShareAlert(block.code, res.url);
		}).catch(function(e) {
			console.log("share code error", e);
			button.innerHTML = shareIcon;
			button.blur();
			createTextAlert(e, "danger");
		});
	});
	parentNode.appendChild(button);
}
 
function fakeShareCode(options, obj) {
	return new Promise(function(resolve, reject) {
		resolve({
			url: options.shareCodeURL + "?id=testId"
		});
	});
}

function shareCode(options, obj) {
	//return fakeShareCode(options, obj);

	obj.time = new Date().getTime();
	return new Promise(function(resolve, reject) {
		if (obj.code.length > 65536) {
			alert("代码过长，无法分享！");
			resolve("source too long");
			return;
		}
		mongo.send(mongo.actions.insertOne, {
			collection: "share-code",
			document: obj
		}).then(function(res) {
			console.log("insert success: ", res.insertedId);
			resolve({
				url: options.shareCodeURL + "?id=" + res.insertedId
			});
		}).catch(reject);
	});
}

var alertElementId = "alert-top-fixed";

function clearAlert() {
	var child = document.getElementById(alertElementId);
	if (child) {
		console.log("remove child", child);
		child.parentNode.removeChild(child);
	}
}

// type: primary,secondary,success,danger,warning,info,light,dark
// @see: https://getbootstrap.com/docs/4.0/components/alerts/
function createAlert(html, type, callback) {
	clearAlert();
	html = '<div class="alert alert-' + (type || "primary") + ' alert-dismissible fade show" role="alert" ' +
		'style="border-radius: 0; animation-duration: 0.5s; animation-name: show-alert-top-fixed;">\n' +
		html + 
		'  <button type="button" class="close" data-dismiss="alert" id="close-alert-top-fixed" aria-label="Close">\n' +
		'    <span aria-hidden="true">&times;</span>\n' +
		'  </button>\n' +
		'</div>'
	var container = document.createElement("div");
	container.className = "alert-top-fixed";
	document.body.appendChild(container);
	container.id = alertElementId;
	container.insertAdjacentHTML('beforeend', html);
	if (callback) {
		callback(container);
	}
}

function createTextAlert(text, type) {
	text = text + "";
	var html = "<span>" + text.replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#39;") + "</span>";
	createAlert(html, type);
}

function createShareAlert(code, url) {
	var shareHTML =
		'<strong>已分享至: </strong><span id="share-output-url" style="cursor: pointer;" ' +
		"onclick=\"copyInnerText('#share-output-url', '#share-output-copy');\"></span> " +
		"<button type=\"button\" class=\"btn btn-primary\" id=\"share-output-copy\" onclick=\"copyInnerText('#share-output-url', '#share-output-copy');\"" +
		'>复制</span>';
	createAlert(shareHTML, "success", function(container) {
		document.getElementById("share-output-url").innerText = url;
	});
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
function clearCodeOutput(block) {
	var child = document.querySelector('[for-output="' + block.code.id + '"]');
	if (child) {
		child.parentNode.removeChild(child);
	}
	if (!block.modes.includes(kModeNoNumber)) {
		var container = block.code.parentNode.parentNode.parentNode;
		for (var i = 0; i < container.childNodes.length; i++) {
			container.childNodes[i].className = container.childNodes[i].className.replaceAll(" has-output", "");
		}
	}
}

/**
 * creates code output
 */
function createCodeOutput(options, block, results) {
	clearCodeOutput(block);
	var child = document.createElement("pre");
	child.setAttribute("for-output", block.code.id);
	var output = document.createElement("code");
	child.appendChild(output);
	if (options.outputPrefix && typeof options.outputPrefix === 'string') {
		output.insertAdjacentHTML('beforeend', options.outputPrefix);
	}
	if (block.modes.includes(kModeNoNumber)) {
		block.code.parentNode.after(child);
	} else {
		child.className = "codeblock-output";
		var container = block.code.parentNode.parentNode.parentNode;
		container.after(child);
		for (var i = 0; i < container.childNodes.length; i++) {
			container.childNodes[i].className += " has-output";
		}
	}
	appendOutput(options, results, output, 0, false);
}

function appendOutput(options, results, output, index, delayed) {
	if (!results || !results.length) {
		return;
	}
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
	options.clipboardButtonClass = options.clipboardButtonClass || "btn btn-light btn-code btn-code-clipboard";

	options.runIcon = options.runIcon || '<i class="fas fa-play"></i>';
	options.runningIcon = options.runningIcon || '<i class="fas fa-sync fa-spin"></i>';
	options.runButtonClass = options.runButtonClass || "btn btn-light btn-code btn-code-run";
	options.undoIcon = options.undoIcon || '<i class="fas fa-undo"></i>';
	options.undoButtonClass = options.undoButtonClass || "btn btn-light btn-code btn-code-undo";

	options.shareIcon = options.shareIcon || '<i class="fas fa-share"></i>';
	options.sharingIcon = options.sharingIcon || '<i class="fas fa-circle-notch fa-spin"></i>';
	options.shareButtonClass = options.shareButtonClass || "btn btn-light btn-code btn-code-share";
	options.shareOutputClass = options.shareOutputClass || "code-share";

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
	console.log('bindSelector', options);
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
		block.lang = lang;
		code.innerText = languageCodes[lang] || options.codes[lang] || "";
		refreshEditor(block, lang)
	});
	if (options.shareId) {
		code.setAttribute("contenteditable", "false");
		code.innerText = "Loading ...";
		mongo.send(mongo.actions.findOne, {
			collection: "share-code",
			filter: {_id: {"$oid": options.shareId}},
		}).then(function(res) {
			console.log("load shared code:", res);
			code.setAttribute("contenteditable", "true");
			block.lang = res.document.lang;
			block.code.innerText = res.document.code;
			refreshEditor(block);
		}).catch(function(e) {
			code.innerText = "Load fail: " + e;
			code.setAttribute("contenteditable", "true");
		});
	}
}

function refreshEditor(block) {
	var code = block.code;
	code.className = "language-" + exports.syntaxName(block.lang);
	code.parentNode.className = "language-" + exports.syntaxName(block.lang);
	code.setAttribute("data-lang", block.lang);
	block.resetHistory();
	updateCodeBlock(block);
	clearCodeOutput(block);

	// @begin: strange code for fixing ``code'' element offsetTop bug on safari
	code.parentNode.focus();
	code.focus();
	// @end

	code.blur();
	var undoButton = block.buttons["undo"];
	if (undoButton) {
		undoButton.hidden = block.history.length <= 1;
	}
}

window.codeblock = exports;

})();
