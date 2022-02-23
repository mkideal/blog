---
title: "Go 泛型初步"
date: 2022-02-12
toc: "float-right"
keywords: ["go", "泛型", "类型参数"]
abstract: "Go 1.18 版本之后正式引入泛型，它被称作类型参数（type parameters），本文初步介绍 Go 中泛型的使用。"
---

## 1. Go 的泛型

长期以来 go 都没有泛型的概念，只有接口 `interface` 偶尔类似的充当泛型的作用，然而接口终究无法满足一些基本的泛型需求，比如

(1). 函数体内需要对参数做运算而不是使用接口方法，如下的写法连编译都不可行。

```go {code="+b"}
// Sum 函数尝试对输入的任意多个参数求和。
// 然而 interface{} 不可以做加法，这段代码是不能编译的
func Sum(values ...interface{}) interface{} {
	var sum interface{}
	for _, v := range values {
		sum += v
	}
	return sum
}
```

(2). 使用接口常常存在极其令人厌恶的接口转换，一个例子是标准库 `container/heap`。`Pop` 方法返回值几乎总是需要在逻辑上再转换为 `Push` 时传入的类型，这使得代码不仅丑陋而且低效（曾经因为 interface{} 实际是 int 类型，但是因为类型转换导致大量的内存分配次数）

```go {code="-"}
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

因为没有泛型而带来的其他问题就不一一列举，相信许多开发者都有遇到需要泛型的场景。从 go 1.18 版本开始，将正式引入泛型，官方称谓叫做类型参数 `type parameter`，由于各种原因，现阶段的泛型比起一些流行语言中的泛型功能上还是差很多，不过总比没有好了。目前泛型主要使用的方式有两类：`函数`的类型参数，`类型`的类型参数。

## 2. 安装 go 1.18 以上的版本

在 go1.18 尚未正式发布时可以通过如下命令安装 beta 版本体验

```bash
go install golang.org/dl/go1.18beta2@latest
go1.18beta2 download
```

此后可以使用 `go1.18beta2` 命令取代原来的 go 命令编译支持泛型的代码。

## 3. 函数类型参数

### 3.1. 泛型版本的求和函数

仍以求和函数为例，泛型版本的写法如下：

```go {code="sum" hl_lines=[5]}
import (
	"golang.org/x/exp/constraints"
)

func Sum[T constraints.Integer](values ...T) T {
	var sum T
	for _, v := range values {
		sum += v
	}
	return sum
}
```

> constraints 原本是放在标准库的包，但是近期被移除了，改到了 x/exp 中，参见 <a href="https://github.com/golang/go/issues/50792" target="_blank">#50792</a>

这个版本实现了对任意多个同类型的整数求和。`Sum` 后面的中括号 `[]` 内就是定义类型参数的地方，其中 `T` 为类型参数名，`constraints.Integer` 是对该类型参数的约束，即 T 应该满足的条件，在这里我们要求 `T` 是一个整数。剩下的代码就和普通没有泛型的代码一致了，只不过后面 T 可以当作一个类型来使用。标准库 `constraints` 中预定义了一些基本的约束，另外还有两个特殊的内置类型可用作约束：`any` 和 `comparable`，其中 `any` 就是原来的 `interface{}`，在 go1.18 开始所有空 interface{} 都改成 any 了，而 `comparable` 则表示类型是可以通过 `==` 运算符进行比较的。

> go 的泛型参数为什么不使用其他流行语言的 `< >` 定义泛型？这个主要是会引起语法上的歧义，比如下面这一段代码
>
> x, y := a < b, c > d

现在可以来使用一下刚才定义的 `Sum` 方法：

```go {code="sum+x"}
func main() {
	fmt.Println(Sum(1, 2, 3))

	var ints = []int{1, 2,3}
	fmt.Println(Sum(ints...))

	var int32s = []int32{-1, 2,3}
	fmt.Println(Sum(int32s...))

	var uint32s = []uint32{1, 2,3}
	fmt.Println(Sum(uint32s...))

	// 调用 Sum 函数时也可以将类型参数带上，只是经常都能够通过实际参数
	// 类型推断类型参数，所以常常省略
	fmt.Println(Sum[uint32](uint32s...))
}
```

这个版本仍有一些问题，比如可以做加法的不止整数啊，还有浮点数，甚至是复数。修改类型参数 `T` 的约束来支持浮点数和复数：

```go {code="sum2+x" hl_lines=[5]}
import (
	"golang.org/x/exp/constraints"
)

func Sum[T constraints.Integer | constraints.Float | constraints.Complex](values ...T) T {
	var sum T
	for _, v := range values {
		sum += v
	}
	return sum
}

func main() {
	fmt.Println(Sum(1.0, 2.0, 3.5))
}
```

通过符号 `|` 连接多个约束表示 `T` 只需满足其中任意一个。

`Sum` 函数的例子只用了一个类型参数，go 的类型参数也支持多个，这个定义和函数参数的格式类似。

```go {code="-"}
func FuncA[T, U any]() {
	// ...
}

func FuncB[T any, U, V comparable]() {
	// ...
}
```

接下来通过几个简单的例子熟练一下泛型函数的使用。

### 3.2. 使用泛型实现一个类似脚本语言（比如 javascript）的或运算

这个例子用于判定 `a` 是否为 zero 值，如果是则返回 `b`，反之返回 `a`。

```go {code="$+x"}
func Or[T comparable](a, b T) T {
	var zero T
	if a == zero {
		return b
	}
	return a
}

func doSomething(x int, y, z string) {
	fmt.Println(Or(x, 1))
	fmt.Println(Or(y, "default"))
	fmt.Println(Or(z, createString()))
}

func createString() string {
	return "hello"
}

func main() {
	doSomething(0, "", "")
	doSomething(12, "y", "z")
}
```

不过不同于一般的或运算，这里 `Or(a, b)` 时 b 的值已经确定，如果 b 是一个函数调用，那么当 a 不是 zero 值时，b 的函数调用完全浪费了。

> javascript 中的 `a || b()` 不同于此处的 `Or(a, b())`，前者在 a 非空时不会调用函数 b

可以再实现一个延迟函数调用的版本 `OrNew` 处理这种情况：

```go {code="$+x" hl_lines=["9-15",20]}
func Or[T comparable](a, b T) T {
	var zero T
	if a == zero {
		return b
	}
	return a
}

func OrNew[T comparable](a T, new func()T) T {
	var zero T
	if a == zero {
		return new()
	}
	return a
}

func doSomething(x int, y, z string) {
	fmt.Println(Or(x, 1))
	fmt.Println(Or(y, "default"))
	fmt.Println(OrNew(z, createString))
}

func createString() string {
	return "hello"
}

func main() {
	doSomething(0, "", "")
	doSomething(12, "y", "z")
}
```

### 3.3. 使用泛型实现三元条件运算

go 语言不存在三元条件运算符 `<condition>? value1 : value2`，导致经常存在需要这种场景时只好用 `if` 写好几行的代码，不过现在可以通过泛型实现一个条件运算了。

```go {code="$+x"}
func If[T any](yes bool, a, b T) T {
	if yes {
		return a
	}
	return b
}

func IfNew[T any](yes bool, a, b func() T) T {
	if yes {
		return a()
	}
	return b()
}

func createA() string { return "a" }
func createB() string { return "b" }

func main() {
	var a = true
	var b = false
	fmt.Println(If(a, 1, 2))
	fmt.Println(IfNew(b, createA, createB))
}
```

## 4. 类型泛型

### 4.1. 类型泛型的基本使用方法

以一个 c++ 的 `std::pair` 为例，来说明 go 的类型泛型的使用。`pair` 包含 first 和 second 两个成员，并且每一个都有独立的类型，所以我们需要两个类型参数，先看代码：

```go
type Pair[T1, T2 any] struct {
	First  T1
	Second T2
}

func MakePair[T1, T2 any](first T1, second T2) Pair[T1, T2] {
	return Pair[T1, T2]{First: first, Second: second}
}

func (pair Pair[T1, T2]) Elements() (T1, T2) {
	return pair.First, pair.Second
}
```

在定义 Pair 时在类型名称之后使用 `[T1, T2 any]` 定义了类型参数，即 T1, T2 都可以是任意类型。

然后定义了泛型函数 `MakePair` 用于创建 Pair 对象，函数的返回值类型为 `Pair[T1, T2]`。

最后实现了 Pair 的成员方法 `Elements` 返回两个成员值，这个函数看起来很无聊，似乎没什么用，就是用来展示如何定义泛型类型的成员方法。和一般的类型的成员方法的定义的区别在于类型 Pair 之后必须要使用声明 Pair 类型时定义的类型参数（就是这里的 `[T1, T2]`）。

另外 go 的泛型目前不支持给成员方法声明新的类型参数，比如这种成员方法的定义就不允许：

```go {code="+b"}
// Bad: 成员方法后面不能声明类型参数
func (pair Pair[T1, T2]) Something[T any]() {}
```

除了 `struct` 之外，interface 的定义也支持类型参数（但是它的接口方法不支持类型参数），但是 `type alias` 不支持类型参数

```go {code="-"}
type Interface[T any] interface {
	// ...
}

type User interface {
	// ...
}

// 自己定义的接口 User 可用作类型参数的约束
type InterfaceTwo[T any, U User] interface {
	// ...
}

type IntPair Pair[int, int]

type Slice[T any] []T

// Bad: 这个不允许
type Vector[T any] = []T
```

类型约束除了内置的 `any`, `comparable` 以及 `golang.org/x/exp/constraints` 中定义的之外，也可以使用自己定义的任意接口用作约束，就像上例中的 `User`。另外现在除了以前概念中的 interface 定义之外，还有一种纯粹只能用于类型参数约束的 interface。像这类使用了基础类型或者 `|` 运算的接口。

```go {code="-"}
// 实数约束 Real 只能用于类型参数约束，而不能作为普通参数或变量类型。
type Real interface {
	constraints.Integer | constraints.Float
}

// Number 包含一个只能用于约束的接口，所以也只能用于类型参数的约束了
type Number interface {
	Real
	Cat()
}

type Float interface {
	~float32 | ~float64
}

type String interface {
	~string
}

type PureString interface {
	string
}

// Name 满足 String 约束，但是不满足 PureString
type Name string
```

go 1.18 开始引入一个新的符号 `~` 用于约束前缀，这表示该约束包含 underlying 为该类型的参数。比如上面的 `Name` 类型的 underlying 是 string，所以 `Name` 也满足 `String` 约束，但是不满足 `PureString` 约束。

### 4.2. 实现一个通用的事件系统

有了类型泛型可以实现一个比较实用的功能：事件派发系统。

首先我们需要定义一个事件接口：

```go
// Event 是一个事件接口，类型参数 T 表示事件类别的数据类型，比如可以使用
//
//	string
//	int
//	reflect.Type
//	...
//
// 该接口定义 Type 方法获取事件类别
type Event[T comparable] interface {
	Type() T
}
```

然后定一个事件处理接口 `Listener`，同时为了使用方便实现一个内置的 listener

```go {hl_lines=["8-10"]}
// Listener 接口用于处理被触发的事件
type Listener[T comparable] interface {
	EventType() T
	Handle(Event[T])
}

// Listen 创建一个 Listener 对象
func Listen[T comparable, E Event[T]](eventType T, handler func(E)) Listener[T] {
	return listenerFunc[T, E]{eventType, handler}
}

type listenerFunc[T comparable, E Event[T]] struct {
	eventType T
	handler   func(E)
}

func (h listenerFunc[T, E]) EventType() T {
	return h.eventType
}

func (h listenerFunc[T, E]) Handle(event Event[T]) {
	if e, ok := event.(E); ok {
		h.handler(e)
	} else {
		panic(fmt.Sprintf("unexpected event %T for type %v", event, event.Type()))
	}
}
```

上面这段代码需要特别说明一下 `Listen` 函数，该函数有 2 个类型参数 `T` 和 `E`，前者是事件类别的类型参数，后者是事件类型参数，而 `E` 的约束 `Event[T]` 中依赖了前一个泛型参数，这样一来事件处理函数 `handler` 的参数就不再是 `Event` 接口而是一个泛型参数了，这避免了每次在回调函数中进行一次类型转换（因为已经统一在 listenerFunc.Handle 中转换了）。比如以前经常是这样写回调函数

```go {code="-"}
func onSomething(event Event) error {
	somethingEvent, ok := event.(*SomethingEvent)
	if !ok {
		return errors.New("unexpected event type")
	}
	// doSomething with somethingEvent
}
```

而现在回调函数就可以避免每次手动转换类型了

```go {code="-"}
func onSomething(event *SomethingEvent) error {
	// doSomething with event
}
```

接下来实现事件派发管理器 `Dispatcher`。`Dispatcher` 需要实现事件注册(Add)，删除(Remove)，检查(Has)和派发(Dispatch) 方法。

```go
// Dispatcher 管理事件注册与派发
type Dispatcher[T comparable] struct {
	nextid    int
	listeners map[T][]Pair[int, Listener[T]]
	mapping   map[int]Pair[T, int]
}

// AddEventListener 注册事件回调
func (dispatcher *Dispatcher[T]) AddEventListener(listener Listener[T]) int {
	if dispatcher.listeners == nil {
		dispatcher.listeners = make(map[T][]Pair[int, Listener[T]])
		dispatcher.mapping = make(map[int]Pair[T, int])
	}
	dispatcher.nextid++
	var id = dispatcher.nextid
	var eventType = listener.EventType()
	var listeners = dispatcher.listeners[eventType]
	var index = len(listeners)
	dispatcher.listeners[eventType] = append(listeners, MakePair(id, listener))
	dispatcher.mapping[id] = MakePair(eventType, index)
	return id
}

// HasEventListener 判定是否存在事件回调
func (dispatcher *Dispatcher[T]) HasEventListener(id int) bool {
	if dispatcher.mapping == nil {
		return false
	}
	_, ok := dispatcher.mapping[id]
	return ok
}

// RemoveEventListener 删除事件回调
func (dispatcher *Dispatcher[T]) RemoveEventListener(id int) bool {
	if dispatcher.listeners == nil {
		return false
	}
	index, ok := dispatcher.mapping[id]
	if !ok {
		return false
	}
	var eventType = index.First
	var listeners = dispatcher.listeners[eventType]
	var last = len(listeners) - 1
	if index.Second != last {
		listeners[index.Second] = listeners[last]
		var newId = listeners[index.Second].First
		dispatcher.mapping[newId] = MakePair(eventType, index.Second)
	}
	listeners[last].Second = nil
	dispatcher.listeners[eventType] = listeners[:last]
	delete(dispatcher.mapping, id)
	return true
}

// DispatchEvent 派发事件
func (dispatcher *Dispatcher[T]) DispatchEvent(event Event[T]) bool {
	if dispatcher.listeners == nil {
		return false
	}
	listeners, ok := dispatcher.listeners[event.Type()]
	if !ok || len(listeners) == 0 {
		return false
	}
	for i := range listeners {
		listeners[i].Second.Handle(event)
	}
	return true
}
```

至此，一个基本的事件系统就完成了，接下来看看如何使用。

```go {code="+x"}
// 这个例子中事件的 Type 使用 string 类型
type testEventA struct {}
type testEventB struct {}

func (testEventA) Type() string { return "A" }
func (testEventB) Type() string { return "B" }

func main() {
	var dispatcher Dispatcher[string]

	// 注册事件，listener 通过 Listen 方法构建
	dispatcher.AddEventListener(Listen("A", func(e testEventA) {
		fmt.Println("test event 'A' fired")
	}))
	dispatcher.AddEventListener(Listen("B", func(e *testEventB) {
		fmt.Println("test event 'B' fired")
	}))

	// 派发事件，注意由于通过 Listen 注册的时候回调函数的参数
	// 没有使用指针，所以这里派发事件时也不能用 testEvent 的指针。
	// 这两者的类型必须要一致
	dispatcher.DispatchEvent(testEventA{})

	// 事件 B 的类型就需要指针了，因为注册时使用了指针。
	dispatcher.DispatchEvent(new(testEventB))
}
```

除了这个例子中的使用 string 作为事件类别的类型外，还可以使用整数，reflect.Type 或其他任意可比较的类型。

事件系统的完整代码可参见 <a href="https://github.com/gopherd/doge/blob/main/event/event.go" target="_blank">github.com/gopherd/doge/blob/main/event/event.go</a>

## 5. 结语

总体来说，go 的泛型功能还是较少的，使用限制较多。另外 go 1.18 版本的泛型存在一个严重的性能问题：范型参数存在不必要的内存逃逸，而且执行速度低下，在 go 1.19 的 Milestone 中已经有提交来修正这个问题了（<a href="https://github.com/golang/go/issues/50182" target="_blank">#50182</a>）。然而内存逃逸的问题修复了，性能却仍然比非范型的版本差。

目前建议只在满足以下条件之一的时候使用范型：

* 普通基础类型用作类型参数约束
* 参数类型约束没有成员方被调用
* 对性能没有极致要求
