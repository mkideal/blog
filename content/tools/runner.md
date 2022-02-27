---
title: "代码在线运行"
date: 2022-02-08
abstract: 支持40余种语言的代码在线运行环境。
showAll: true
---

<span>
<label for="languages" style="margin: 0">语&nbsp;&nbsp;言:</label>
<select name="languages" id="languages-selector">
  <option value="go">go</option>

  <option value="ada">ada</option>
  <option value="assembly">assembly</option>
  <option value="bash">bash</option>
  <option value="c">c</option>
  <option value="clojure">clojure</option>
  <option value="cobol">cobol</option>
  <option value="cpp">c++</option>
  <option value="csharp">c#</option>
  <option value="d">D</option>
  <option value="elixir">elixir</option>
  <option value="erlang">erlang</option>
  <option value="fortran">fortran</option>
  <option value="fsharp">f#</option>
  <option value="groovy">groovy</option>
  <option value="haskell">haskell</option>
  <option value="java">java</option>
  <option value="javascript">javascript</option>
  <option value="jshell">jshell</option>
  <option value="kotlin">kotlin</option>
  <option value="lisp">lisp</option>
  <option value="lua">lua</option>
  <option value="mongodb">mongodb</option>
  <option value="mysql">mysql</option>
  <option value="ocaml">ocaml</option>
  <option value="octave">octave</option>
  <option value="pascal">pascal</option>
  <option value="perl">perl</option>
  <option value="php">php</option>
  <option value="postgresql">postgresql</option>
  <option value="prolog">prolog</option>
  <option value="python">python</option>
  <option value="r">R</option>
  <option value="racket">racket</option>
  <option value="redis">redis</option>
  <option value="rust">rust</option>
  <option value="scala">scala</option>
  <option value="sqlite">sqlite</option>
  <option value="swift">swift</option>
  <option value="tcl">tcl</option>
  <option value="typescript">typescript</option>
  <option value="vb">Visual Basic</option>
</select>
</span>
<style>

</style>
<script>
document.addEventListener('DOMContentLoaded',function(){
	var dropdownElementList = [].slice.call(document.querySelectorAll('.dropdown-toggle'))
	var dropdownList = dropdownElementList.map(function (dropdownToggleEl) {
		return new bootstrap.Dropdown(dropdownToggleEl);
	})
	if (window.codeblock) {
		var codes = {};
		document.querySelectorAll('.highlight').forEach(function(h) {
			if (h.hasAttribute("hidden")) {
				var code = h.querySelector("pre > code");
				var lang = code.getAttribute("data-lang");
				if (lang) {
					codes[codeblock.languageName(lang)] = code.innerText;
				}
			}
		});
		console.log("codes", codes);
		function getParameterByName(name, url) {
			if (!url) url = window.location.href;
			name = name.replace(/[\[\]]/g, '\\$&');
			var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
				results = regex.exec(url);
			if (!results) return null;
			if (!results[2]) return '';
			return decodeURIComponent(results[2].replace(/\+/g, ' '));
		}
		codeblock.bindSelector({
			shareId: getParameterByName("id"),
			selector: "#languages-selector",
			editor: "global-code-editor",
			codes: codes
		});
	} else {
		console.log("codeblock undefined");
	}
})
</script>

```go {code="global-code-editor+xws" id="global-code-editor" code-height="350px,500px"}
func main() {
	fmt.Println("hello, go!")
}
```

```rust {hidden="true"}
fn main() {
	println!("hello, rust!");
}
```

```c {hidden="true"}
#include <stdio.h>

int main() {
	printf("hello, c!\n");
	return 0;
}
```

```cpp {hidden="true"}
#include <iostream>

int main() {
	std::cout << "hello, c++!" << std::endl;
	return 0;
}
```

```csharp {hidden="true"}
class Hello {
	static void Main(string[] args)
	{
		System.Console.WriteLine("hello csharp!");
	}
}
```

```lua {hidden="true"}
print("hello, lua!")
```

```python {hidden="true"}
print("hello, python!")
```

```java {hidden="true"}
class Main {
    public static void main(String[ ] args) {
        System.out.println("hello java!");
    }
}
```

```js {hidden="true"}
console.log("hello, javascript!");
```

```perl {hidden="true"}
print "hello, perl!";
```

```r {hidden="true"}
print("hello R!")
```

```swift {hidden="true"}
print("hello swift!")
```

```php {hidden="true"}
<?php echo 'hello php!'; ?>
```

```kotlin {hidden="true"}
fun main(args: Array<String>) {
	println("hello, kotlin!")
}
```

```scala {hidden="true"}
object Main {
	def main(args: Array[String]): Unit = {
		println("hello, scala!")
	}
}
```

```groovy {hidden="true"}
println "hello groovy!"
```

```haskell {hidden="true"}
main = putStrLn "hello, haskell!"
```

```lisp {hidden="true"}
(print "hello, lisp!")
```

```elixir {hidden="true"}
IO.puts "hello, elixir!"
```

```fsharp {hidden="true"}
open System
printfn "hello, fsharp!"
```

```asm {hidden="true"}
section .data
	hello:     db 'hello asm!',10
	helloLen:  equ $-hello

section .text
	global _start

_start:
	mov eax,4
	mov ebx,1
	mov ecx,hello
	mov edx,helloLen
	int 80h
	mov eax,1
	mov ebx,0
	int 80h;
```

```ocaml {hidden="true"}
print_string "hello ocaml!"
```

```bash {hidden="true"}
echo "hello bash!"
```

```ts {hidden="true"}
const name: string = "typescript";
console.log(`hello ${name}!`);
```

```prolog {hidden="true"}
:- initialization(main).
main :- write('hello prolog!').
```

<div class="highlight" hidden>
<pre class="language-jshell"><code class="language-jshell" data-lang="jshell">System.out.println("hello jshell!");</code></pre>
</div>

```tcl {hidden="true"}
puts "hello, tcl!"
```

```ada {hidden="true"}
with Ada.Text_IO; use Ada.Text_IO;
procedure Hello is
begin
	Put_Line ("hello, ada!");
end Hello;
```

```d {hidden="true"}
import std.stdio;

void main()
{
	writeln("hello, d!");
}
```

```erlang {hidden="true"}
-module(helloworld).
-export([start/0]).
start() ->
		io:fwrite("hello erlang!").
```

```fortran {hidden="true"}
program hello
	print *, "hello fortran!"
end program hello
```

```racket {hidden="true"}
#lang racket/base
(print "hello, racket!")
```

```vb {hidden="true"}
Public Module Program
	Public Sub Main(args() As string)
		Console.WriteLine("hello, vb!")
	End Sub
End Module
```

```clojure {hidden="true"}
(defn greetings [msg]
(println (format "Hello %s" msg)))

(greetings "clojure!")
```

```cobol {hidden="true"}
IDENTIFICATION DIVISION.
PROGRAM-ID. HELLO-WORLD.
PROCEDURE DIVISION.
DISPLAY 'hello cobol!'.
STOP RUN.
```

<div class="highlight" hidden>
<pre class="language-pascal"><code class="language-pascal" data-lang="pascal">program Hello;
begin
  writeln ('hello pascal!')
end.</code></pre>
</div>

```octave {hidden="true"}
disp('hello octave!')
```


```mysql {hidden="true"}
CREATE TABLE Hello (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL
);
INSERT INTO Hello VALUES (1, 'hello, mysql!');
SELECT * FROM Hello WHERE id = '1';
```

```postgresql {hidden="true"}
CREATE TABLE Hello (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL
);
INSERT INTO Hello VALUES (1, 'hello, postgresql!');
SELECT * FROM Hello WHERE id = '1';
```

<div class="highlight" hidden>
<pre class="language-sqlite"><code class="language-sqlite" data-lang="sqlite">CREATE TABLE Hello (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL
);
INSERT INTO Hello VALUES (1, 'hello, sqlite!');
SELECT * FROM Hello WHERE id = '1';
</code></pre>
</div>

<div class="highlight" hidden>
<pre class="language-mongodb"><code class="language-mongodb" data-lang="mongodb">db.helloworld.insertMany([
  {id: 1, name: 'hello, mongodb' },
]);
db.helloworld.find({id: 1});
</code></pre>
</div>

<div class="highlight" hidden>
<pre class="language-redis"><code class="language-redis" data-lang="redis">set key 'hello, redis!'
get key
</code></pre>
</div>
