---
title: "代码块在线运行"
date: 2022-02-08
---

搜集多种编程语言的代码在线运行工具。

go
--

```go {code-block=":run"}
func main() {
	fmt.Println("hello, go!")
}
```

rust
----


```rust {code-block=":run"}
fn main() {
	println!("hello, rust!");
}
```

c/c++
-----

```c {code-block="$:run"}
#include <stdio.h>

int main() {
	printf("hello, c!\n");
	return 0;
}
```

```cpp {code-block="$:run"}
#include <iostream>

int main() {
	std::cout << "hello, c++!" << std::endl;
	return 0;
}
```

c#
--

```csharp {code-block=":run"}
class Hello {
	static void Main(string[] args)
	{
		System.Console.WriteLine("hello csharp!");
	}
}
```

lua
---

```lua {code-block=":run"}
print("hello, lua!")
```

python
------

```python {code-block=":run"}
print("hello, python!")
```

java
----

```java {code-block=":run"}
class Main {
    public static void main(String[ ] args) {
        System.out.println("hello java!");
    }
}
```

javascript
----------

```js {code-block=":run"}
console.log("hello, javascript!");
```

perl
----

```perl {code-block=":run"}
print "hello, perl!";
```

R
-

```r {code-block=":run"}
print("hello R!")
```

swift
-----

```swift {code-block=":run"}
print("hello swift!")
```

php
---

```php {code-block=":run"}
<?php echo 'hello php!'; ?>
```
