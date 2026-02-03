{#thats-ok}

# "I don't know zig, that's ok"

**You don't need to know zig to start building with vapor.**

If you've written javascript, typescript, c, java, or really any programming language, you already understand 90% of what you need. Zig just looks a little different.

This section will get you comfortable in about 10 minutes.

{#the-basics-variables}

### The basics: variables

```zig
// mutable (can change)
var count = 0;
var name = "hello";

// immutable (cannot change)
const max_size = 100;
const title = "my app";
```

`var` for things that change, `const` for things that don't.

**javascript equivalent:**

```js
let count = 0;
const maxsize = 100;
```

{#functions}

### functions

```zig
fn sayhello() void {
    // do something
}

fn add(a: i32, b: i32) i32 {
    return a + b;
}
```

- `void` means "returns nothing" (like `void` in typescript)
- `i32` means "32-bit integer" (just a number, that can be negative and positive)

**javascript equivalent:**

```js
function sayhello() {
  // do something
}

function add(a, b) {
  return a + b;
}
```

{#the-one-weird-type-strings}

### The one weird type: strings

at first glance, this looks strange, in comparison to other languages, but it's actually incredibly handy.

```zig
var message: []const u8 = "hello world";
```

what does `[]const u8` mean?

- `u8` = a byte (each character is a byte)
- `[]` = a bunch of them in a row (an array)
- `const` = the characters themselves can't be changed

**translation:** "a string."

that's it. whenever you see `[]const u8`, just think "string."

```zig
// these are all just strings
var greeting: []const u8 = "hello";
var name: []const u8 = "vapor";
const url: []const u8 = "/home";
```

⚠️ **pro tip:** zig often infers types, so you can frequently just write:

```zig
var greeting = "hello";
```

#### handiness

since `[]const u8` is an array of bytes, you can index into it or pull out slices of it.

```zig
const hello_world: []const u8 = "hello world";

// index into the string
const first_letter = hello_world[0];

// slice the string
const first_three_letters = hello_world[0..3];
```

this is a very handy feature, and is used throughout vapor, for example with url paths.

{#if-statements}

### if statements

zig has no concept of ternary statements, but we can use if statements to achieve the same effect.

```zig
if (count > 10) {
    // do something
} else {
    // do something else
}

const flag = if (is_active) "America" else "Denmark";
const flag = is_active ? "America" : "Denmark" ❌ // Error: ternary operator is not allowed;
```

`if else if else` statement are identical to javascript. no surprises here.

{#loops}

### loops

```zig
// loop through items
for (items) |item| {
    Text(item).end();
}

// with index
for (items, 0..) |item, index| {
    Text(item).end();
}

// while loop
while (count < 10) {
    count += 1;
}

// ✅ Value only
for (items) |item| { }

// ✅ Index only
for (0..items.len) |i| { }

// ✅ Both value AND index (note the 0..)
for (items, 0..) |item, i| { }

// ❌ Wrong - can't use |_, i| without 0..
for (items) |_, i| { }  // Won't compile!
```

**javascript equivalent:**

```js
for (const item of items) {
  // ...
}

items.foreach((item, index) => {
  // ...
});

while (count < 10) {
  count += 1;
}
```

the `|item|` syntax is called "capture" - it's just how zig names the loop variable.

{#structs}

### Structs (like objects)

```zig
const user = struct {
    name: []const u8,
    age: u32,
};

var user = user{
    .name = "alice",
    .age = 30,
};

// access fields
const username = user.name;
```

**javascript equivalent:**

```js
const user = {
  name: "alice",
  age: 30,
};

const username = user.name;
```

the only difference: zig uses `.name = value` instead of `name: value`.

{#the-dot-brace-pattern}

### The dot-brace pattern

you'll see this everywhere in vapor:

```zig
// The left side is the function, the right side are the args
printCount(.{ .count = 12 })

fn printCount(args: struct { count: i32 }) void {
    std.log.info(("Count: {d}", .{args.count});
}
```

that `.{ }` is just an anonymous struct (like an inline object in js):

```js
// javascript
printCount({ count: 12 });

function printCount({ count }) {
  console.log(`Count: ${count}`);
}
```

same concept, slightly different punctuation.

{#printing-debugging}

### printing / debugging

```zig
// print to console
std.log.info("hello", .{}); // info
std.log.debug("count is: {d}", .{count}); // debug
std.log.err("name is: {s}", .{name}); // error
```

the `{d}` means "digit" (number), `{s}` means "string". the `.{}` passes the values to insert.

**javascript equivalent:**

```js
console.log("hello");
console.log(`count is: ${count}`);
console.log(`name is: ${name}`);
```

{#what-you-can-ignore}

### What you can ignore (for now)

these zig concepts exist but **you won't need them** to build uis:

| concept             | why you can skip it                         |
| ------------------- | ------------------------------------------- |
| `comptime`          | vapor uses it internally; you don't have to |
| allocators / arenas | vapor manages memory for you                |
| pointers (`*t`)     | only needed for advanced patterns           |
| error unions (`!t`) | vapor handles errors internally             |
| optionals (`?t`)    | you'll learn when you need it               |

{#a-complete-example}

### A complete example

Here's a real Vapor component. See if you can read it:

```zig
const Vapor = @import("vapor");
const Button = Vapor.Button;
const Text = Vapor.Text;
const Box = Vapor.Box;

var count: i32 = 0;
var message: []const u8 = "click the button!";

fn handleclick() void {
    count += 1;
    if (count == 1) {
        message = "you clicked once!";
    } else {
        message = "keep going!";
    }
}

pub fn render() void {
    Box().layout(.center).spacing(16).children({
        Text(message).font(18, 400, .black).end();

        Button(handleclick).children({
            Text("click me").font(16, 700, .white).end();
        });

        Text(count).font(24, 700, .blue).end();
    });
}
```

If you understood that, **you're ready to build with Vapor.**

{#quick-reference-card}

### Quick reference card

Keep this handy for your first few hours:

| javascript             | zig                              |
| ---------------------- | -------------------------------- |
| `let x = 0`            | `var x: i32 = 0`                 |
| `const x = 0`          | `const x: i32 = 0`               |
| `"hello"`              | `"hello"` (type is `[]const u8`) |
| `function fn() {}`     | `fn name() void {}`              |
| `console.log(x)`       | `std.log.info("{d}", .{x})`      |
| `for (const x of arr)` | `for (arr) \|x\|`                |
| `{ key: value }`       | `.{ .key = value }`              |
| `obj.method()`         | `obj.method()`                   |
| `// comment`           | `// comment`                     |

{#next-steps}

### Next steps

Now that you're comfortable with the basics, you're ready to build something real.

Head over to [making a button](#making-a-button) to create your first interactive vapor component.
