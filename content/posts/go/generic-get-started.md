---
title: "Go 泛型初步"
date: 2022-02-12
keywords: ["go", "generic", "type parameters"]
abstract: "Go 1.18 版本之后正式引入范型，它被称作类型参数（type parameters），本文初步介绍 Go 中范型的使用。"
---

## Go 的范型

长期以来 go 都没有范型的概念，只有接口 `interface` 偶尔类似的充当范型的作用，然而接口终究无法满足一些基本的范型需求，比如

`1.` 函数体内需要对参数做运算而不是使用接口方法，如下的写法连编译都不可行。

```go
func Sum(values ...interface{}) interface{} {
	var sum interface{}
	for _, v := range values {
		sum += v
	}
	return sum
}
```

`2.` 使用接口常常存在极其令人厌恶的接口转换，一个例子是标准库 `container/heap`。`Pop` 方法返回值几乎总是需要在逻辑上再转换为 `Push` 时传入的类型，这使得代码不仅丑陋而且低效（曾经因为 interface{} 实际是 int 类型，但是因为类型转换导致大量的小内存分配）

```go
// Push pushes the element x onto the heap.
// The complexity is O(log n) where n = h.Len().
func Push(h Interface, x interface{}) {
	// ...
}

// Pop removes and returns the minimum element (according to Less) from the heap.
// The complexity is O(log n) where n = h.Len().
// Pop is equivalent to Remove(h, 0).
func Pop(h Interface) interface{} {
	// ...
}
```

因为没有范型带来的其他问题就不一一列举，相信许多开发者都有遇到的很需要范型的场景。从 go 1.18 版本开始，将正式引入范型，但是官方称谓叫做类型参数 `type parameter`，由于各种原因，现阶段的范型比起一些流行语言的中范型功能上还是差很多，不过总比没有好了。目前范型主要使用的方式有两类：`函数`的类型参数，`类型`的类型参数。

## 安装 go 1.18 以上的版本

如果目前 go1.18 尚未正式发布则可以通过如下命令安装 beta 版本体验，反之就在官方下载最新版本即可。

```bash
go install golang.org/dl/go1.18beta2@latest
go1.18beta2 download
```

此后可以使用 `go1.18beta2` 命令取代原来的 go 命令编译支持范型的代码。

## 函数类型参数

仍以求和函数为例，范型版本的写法如下：

```go
package main

import (
	"constraints"
)

func Sum[T constraints.Integer](values ...T) T {
	var sum T
	for _, v := range values {
		sum += v
	}
	return sum
}
```

这个版本实现了对任意多个同类型的整数求和。`Sum` 后面的中括号 `[]` 内就是定义类型参数的地方，其中 `T` 为类型参数名，`constraints.Integer` 是对该类型参数的约束，即 T 应该满足的条件，在这里我们要求 `T` 是一个整数。剩下的代码就喝普通没有范型的代码一致了，只不过后面 T 可以当作一个类型来使用了。标准库 `constraints` 中预定义了一些基本的约束，另外还有两个特殊的内置类型可用作约束：`any` 和 `comparable`，其中 `any` 就是原来的 `interface{}`，在 go1.18 开始所有空 interface{} 都改成 any 了，而 `comparable` 则表示类型是可以通过 `==` 进行比较的。

> go 的范型参数为什么不使用其他流行语言的 `<>` 定义范型？这个主要是会引起语法上的歧义，比如下面这一段代码
>
> x, y := a < b, c > d()

现在可以来调用一下刚才定义的 `Sum` 方法

```go
func main() {
	println(Sum(1, 2, 3))

	var ints = []int{1, 2,3} 
	println(Sum(ints...))

	var int32s = []int{-1, 2,3} 
	println(Sum(int32s...))

	var uint32s = []int{1, 2,3} 
	println(Sum(uint32s...))
}
```

到这里一个很简单的范型求和函数就实现了。不过仍有一些问题，比如可以做加法的不止整数啊，还有浮点数，甚至是复数。为此我们修改类型参数 `T` 的约束如下：

```go
func Sum[T constraints.Integer | constraints.Float | constraints.Complex](values ...T) T {
	var sum T
	for _, v := range values {
		sum += v
	}
	return sum
}
```

通过符号 `|` 连接多个约束表示 `T` 只需满足其中任意一个。这个版本增加了对浮点数和复数的支持。

`Sum` 函数的例子只是用了一个类型参数，go 的类型承诺书也支持多个，这个定义常规函数参数的格式类似，比如如下两种：

```go
func Max[T, U constraits.Float](x T, y U) T {
	return T(math.Max(float64(x), float64(y))
}
```

```go
func Scale[T constraits.Complex, U constraits.Float](z T, x U) T {
	return z * T(u)
}
```

## 类型范型

## 几个比较实用的例子

### 实现类似脚本语言（比如 javascript）的或 `||` 运算
