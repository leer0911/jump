# typescript 与 es6 不同之处

## 基础类型

* 布尔值

`let isDone:boolean = false`

* 数字

`let decLiteral:number = 6`

* 字符串

`let name:string = "bob"`

* 数组 有两种方式可以定义数组

  * 在元素类型后面接上[] `let list:number[] = [1,2,3]`
  * 使用数组泛型，Array<元素类型> `let list:Array<number> = [1,2,3]`

* 元组 Tuple

允许表示一个已知元素数量和类型的数组，各元素的类型不必相同 `let x:[string,number]` 当访问一个越界的元素，会使用联合类型替代。`x[3] = 'world'` 字符串可以赋值给 (string|number) 类型

* 枚举 enum

`enum Color {Red,Green,Blue}`

枚举类型供的一个便利是你可以由枚举的值得到它的名字。例如，我们知道数值 2，但是不确定它隐射到 Color 里的哪个名字。

```typescript
enum Color {
  Red = 1,
  Green,
  Blue
}
let colorName: string = Color[2];
```

* Any

这些值可能来自于动态的内容 `let notSure:any = 4`

Object 有相似的作用，但是 Object 类型的变量只是允许你给它赋任意值，但是却不能够在它上面调用任意的方法，即便它真的有这些方法

```typescript
let notSoure: any = 4;
notSoure.toFixed(); // ok

let prettySure: Object = 4;
prettySure.toFixed(); // Error
```

当你只知道一部分数据的类型时，any 类型也是有用的。

```typescript
let list: any[] = [1, true, 'free'];
list[1] = 100;
```

* void

类型与 any 类型相反，它表示没有任何类型。当一个函数没有返回值时，你通常会见到其返回值类型时 void

```typescript
function warnUser(): void {
  alert('This is my warning message');
}
```

声明一个 void 类型的变量没有什么大用，因为你只能为它赋予 undefined 和 null

* undefined null

Typescript 里，undefined 和 null 两者各自有自己的类型分别叫做 undefined 和 null。和 void 相似，它们的本身的类型用处不是很大

默认情况下 null 和 undefined 是所有类型的子类型。就是说你可以把 null 和 undefined 赋值给 number 类型的变量。

* Never

Never 类型 表示的是那些永不存在的值得类型。例如，never 类型 是哪些总是会抛出异常或者根本就不会有返回值的函数表达式或箭头函数表达式的返回值类型。never 类型是任何类型的子类型，也可以赋值给任何类型，即使 any 也不可以赋值给 never。

```typescript
function error(message: string): never {
  throw new Error(message);
}
```

* 类型断言

类型断言有两种形式，其一是"尖括号"语法：

```typescript
let someValue: any = 'this is a string';
let strLength: number = (<string>someValue).length;
```

另一个为 as 语法：

```typescript
let someValue: any = 'this is a string';

let strLength: number = (someValue as string).length;
```

两种形式是等价的。至于使用哪个大多数情况下是凭个人喜好;然而，当你在 typescript 里使用 JSX 时，只有 as 语法断言是被允许的。

## 接口

Typescript 的核心原则之一是对值所具有的结构进行类型检查。它有时被称做"鸭式辩型法"或者"结构性子类型化"。在 TypeScript 里，接口的作用就是为这些类型命名和为你的代码或第三方代码定义契约。

接口初探

下面通过一个简单示例来观察接口是如何工作的。

```typescript
function printLabel(labelledObj: { label: string }) {
  console.log(labelledObj.label);
}

let myObj = { size: 10, label: 'size 10 Object' };
printLabel(myObj);
```

类型检查器会查看 printLabel 的调用。printLabe 有一个参数，并要求这个对象参数有一个名为 label 类型为 string 的属性。

需要注意的是，我们传入的对象参数实际上会包含很多属性，但是编译器只会检查那些必需的属性是否存在，并且其类型是否匹配然而，有些时候 Typescript 却并不会这么宽松

```typescript
interface LabelledValue {
  label: string;
}

function printLabel(labelledObj: LabelledValue) {
  console.log(labelledObj.label);
}

let myObj = { size: 10, label: 'size 10 Object' };
printLabel(myobj);
```

"option bags"例子

```typescript
interface SquareConfig {
  color?: string;
  width?: number;
}

function createSquare(config: SquareConfig): { color: string; area: number } {
  let newSquare = { color: 'white', area: 100 };
  if (config.color) {
    newSquare.color = config.color;
  }
  if (config.width) {
    newSquare.area = config.width * config.width;
  }
  return newSquare;
}

let mySquare = createSquare({ color: 'black' });
```

带有可选属性的接口与普通的接口定义差不多，只是在可选属性名字定义的后面加了一个?符号。

可选属性的好处之一是可以对可能存在的属性进行预定义，好处之二是可以捕获引用了不存在的属性时的错误。

### 只读属性

一些对象属性只能在对象刚刚创建的时候修改其值。你可以在属性名前用 `readonly` 来指定只读属性

```typescript
interface Point {
  readonly x: number;
  readonly y: number;
}
```

你可以通过赋值一个对象字面量来构造一个 Point。赋值后，x 和 y 再也不能改变了。

```typescript
let p1: Point = { x: 10, y: 20 };
p1.x = 5;
```

TypeScript 具有 ReadonlyArray<T>类型，它与 Array<T>相似，只是把所有可变方法去掉了，因此可以确保数组创建后再也不能被修改。

```typescript
let a: number[] = [1, 2, 3, 4];
let ro: ReadonlyArray<number> = a;
```

就算把整个 ReadonlyArray 赋值到一个普通数组也是不可以的。但是你可以用类型断言重写

`a = ro as number[]`

最简单判断改用 readonly 还是 const 的方法是看要把它作为变量使用还是作为一个属性。作为变量使用的话用 const，若作为属性则使用 readonly

### 函数类型

为了使用接口表示函数类型，我们需要给接口定义一个调用签名。它就像是一个只有参数列表和返回值类型的函数定义。参数列表里的每个参数都需要名字和类型。

```typescript
interface SearchFunc {
  (source: string, subString: string): boolean;
}
```

### 可索引的类型

与使用接口描述函数类型差不多，我们也可以描述那些能够"通过索引得到"的类型

```typescript
interface StringArray {
  [index: number]: string;
}

let myArray: StringArray;
myArray = ['Bob', 'Fred'];

let myStr: string = myArray[0];
```
