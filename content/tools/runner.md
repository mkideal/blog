---
title: "代码在线运行"
date: 2022-02-08
abstract: 搜集多种编程语言的代码在线运行工具，所有代码均可编辑和运行。
showAll: true
---

> go 语言默认会自动添加 `package main` 并且自动引入所需的标准库。

<span>
<label for="languages" style="margin: 0">选择语言:</label>
<select name="languages" id="languages-selector">
  <option value="go">go</option>
  <option value="rust">rust</option>
  <option value="c">c</option>
  <option value="cpp">c++</option>
  <option value="csharp">c#</option>
  <option value="lua">lua</option>
  <option value="python">python</option>
  <option value="java">java</option>
  <option value="js">javascript</option>
  <option value="perl">perl</option>
  <option value="r">R</option>
  <option value="swift">swift</option>
  <option value="php">php</option>
</select>
</span>
<style>

</style>
<script>
document.addEventListener('DOMContentLoaded',function(){
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
		codeblock.bindSelector({
			selector: "#languages-selector",
			editor: "global-code-editor",
			codes: codes
		});
	} else {
		console.log("codeblock undefined");
	}
})
</script>

```go {code="global-code-editor+xw" id="global-code-editor" class="line-numbers"}
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
