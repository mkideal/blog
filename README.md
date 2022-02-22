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
code="+b"        // 错误的代码块（默认程序为 main）
code="+r"        // 可运行的代码块（默认程序为 main）
code="+rw"       // 可运行且可编辑的代码块（默认程序为 main）
code="main"      // 属于程序 main 的代码块
code="main+b"    // 属于程序 main 的错误的代码块
code="main+r"    // 属于程序 main 的可运行代码块
code="main+rw"   // 属于程序 main 的可运行且可编辑的代码块
code="other"     // 属于程序 other 的代码块
code="other+b"   // 属于程序 other 的错误的代码块
code="other+r"   // 属于程序 other 的可运行代码块
code="other+rw"  // 属于程序 other 的可运行且可编辑的代码块
```

当可运行时，可编辑属性才会生效。

一个典型的代码块标注例子

```go {code="+r"}
func main() {
	fmt.Println("hello")
}
```
