blog 网站: [www.mkideal.com](www.mkideal.com)
=============================================

撰写说明
--------

### 代码块标注

通过 markdown 的代码块语法可以在网站中使用代码块，并且在语言参数后面可以添加代码块标注参数，格式如下:

```
lang {[code="[program]+<modes>"] [hightlight options]}
```

code 可选，正确的示例如下:

```
code="-"         // 忽略的代码块
code="+b"        // 错误且会被忽略的代码块（默认程序为 main）
code="+e"        // 错误但不可忽略的代码块（默认程序为 main）
code="+x"        // 可运行的代码块（默认程序为 main）
code="+xw"       // 可运行且可编辑的代码块（默认程序为 main）
code="main"      // 属于程序 main 的代码块
code="main+b"    // 属于程序 main 的错误的代码块
code="main+x"    // 属于程序 main 的可运行代码块
code="main+xw"   // 属于程序 main 的可运行且可编辑的代码块
code="other"     // 属于程序 other 的代码块
code="other+b"   // 属于程序 other 的错误的代码块
code="other+x"   // 属于程序 other 的可运行代码块
code="other+xw"  // 属于程序 other 的可运行且可编辑的代码块
```

一个典型的代码块标注例子

```go {code="+x"}
func main() {
	fmt.Println("hello")
}
```

TODO
----

* 数据库基础
* 数据结构基础
* 算法基础
* 网络基础
