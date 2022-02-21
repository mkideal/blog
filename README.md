blog 网站: [www.mkideal.com](www.mkideal.com)
=============================================

撰写说明
--------

### 内容分类

### 代码块标注

通过 markdown 的代码块语法可以在网站中使用代码块，并且在语言参数后面可以添加代码块标注参数，格式如下:

```
lang {[code-block="[program]:<tag>"] [hightlight options]}
```

code-block 可选，正确的示例如下:

```
code-block="-"         // 忽略的代码块
code-block=":bad"      // 错误的代码块（默认程序为 main）
code-block=":run"      // 可运行的代码块（默认程序为 main）
code-block="main"      // 属于程序 main 的代码块
code-block="main:bad"  // 属于程序 main 的错误的代码块
code-block="main:run"  // 属于程序 main 的可运行代码块
code-block="other"     // 属于程序 other 的代码块
code-block="other:bad" // 属于程序 other 的错误的代码块
code-block="other:run" // 属于程序 other 的可运行代码块
```

一个典型的代码块标注例子

```go {code-block=":run"}
func main() {
	fmt.Println("hello")
}
```

TODO
----

* 代码块和代码输出添加折叠按钮
