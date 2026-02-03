{#reactivity}

# Reactivity

#### Most frameworks make variables reactive. Vapor makes the UI reactive.

This simple inversion eliminates useState, useEffect,
and dependency arrays entirely.

If you're new to application development, reactivity, is the concept of being able to update your application in real time, without having to refresh the page.

Vapor is an even more simplified version of Svelte, just create variables, and mutate them, and the UI updates, THAT'S IT!

By default, every element is treated as a reactive. If it's state changes, the element will update in the UI **granularly**.

The following example shows a simple counter, that increments, and changes color when hovered.

Feel free to inspect the html elements, and see that only the text and color classes are updated.

```zig
const Vapor = @import("vapor");
var counter: usize = 0;
var text: []const u8 = "Current count: 0";

pub fn increment() void {
    counter += 1;
    text = std.log.debug("Current count: {d}", .{counter});
}

fn multiply(multiplier: usize) void {
    counter *= 2;
    text = std.log.debug("Current count: {d}", .{counter});
}

var color: Vapor.Types.Color = .palette(.text_color);
var changed_color: bool = false;
fn changeColor(_: *Vapor.Event) void {
    changed_color = !changed_color;
    if (changed_color) {
        color = .palette(.tint);
        return;
    }
    color = .palette(.text_color);
}

pub fn render() void {
    Button(increment)
        .onHover(changeColor)
        .shadow(.card(color))
        .children({
            Text(text).font(22, 700, color).end();
    });

    const multiplier = if (counter % 2 == 0) 2 else 3;

    ButtonCtx(multiply, .{multiplier})
        .onHover(changeColor)
        .shadow(.card(color))
        .children({
            Text("*").font(22, 700, color).end();
    });
}
```

@counter

### State is not reset

By default, Vapor will persist the state of the application, if you navigate away from the page, and return, the state will not be reset.
Feel free to increment the counter, and come back another time, the counter will still be incremented.

This also works for forms, modals, and other components, everything is considered stateful, it is up to the developer to decide how they want to handle it.

{#ui-as-reactivity}

## UI as reactivity

Vapor, is a toolkit, this means that the developer can decide how they want their application's reactivity to work.

- **Atomic Mode** ⚛️ (Default)

- **Static Mode**

- **Immediate Mode**

- **Retained Mode**

Vapor, has taken the concept of reactivity, and _Inversed It!_
Instead of defining a reactive variable like `let counter = $state(0);`
we define our UI as reactive.

There are two types of **State Elements** in Vapor,

- **Static Elements:** will never update!

- **Vapor Elements:** will only update if their styles or props change.

Static Element are best used for either readability, or improving performance.

```zig
const Vapor = @import("vapor");
const Static = Vapor.Static;
const TextField = Vapor.TextField;
var text: []const u8 = "Inital Text";

pub fn render() void {
    TextField(.string)
        .bind(&text)
        .end();

    Static.Text(text).end(); // This will never update
    Text(text).end(); // This will update
}
```

{#atomic-mode}

### Atomic Mode

Atomic mode is the default mode of Vapor. It is the simplest mode, if a **User interacts with the UI**, or an **Event is triggered**, like
`timeout`, `onChange`, `onPress`, `onHover`, `fetch` ect.
Vapor will check what is changed and only update the changed elements, ie their props or styles.

**The overhead cost of doing this is minimal, since we are working in WASM.**

Atomic mode acts a event engine, where each event into and out of Vapor's engine results in a call to check what is changed, and only update the changed elements.

This accomplishes the majority of the work needed to update and render the UI without any explicit state management. The remaining is handled through
Explicit State Containers called `Signal(T)` or manually calling `cycle()`.

**Just** because Vapor offers these features, doesn't mean they are needed, both this _Documentation_ site, and _Acorn_, are built using atomic mode, and use no
`Signal(T)` containers or `cycle()` calls.

The **Solution** to state management, isn't to solve it all, but to solve **+90%** of the problem.

The remaining **%** is when you want to use a state management system. Because now the user is not interacting and you are not receiving events.

```zig
const Vapor = @import("vapor");
const TextField = Vapor.TextField;
const Button = Vapor.Button;
const Text = Vapor.Text;
var text: []const u8 = "Inital Text";

var counter: usize = 0;
pub fn increment() void {
    counter += 1;
}

pub fn render() void {
    // The user interacts with the UI, via a text field
    TextField(.string).bind(&text).end();
    Text(text).end(); // This will update

    // The user interacts with the UI, via a button press
    Button(increment).children({
        Text("Increment").end();
    });
    Text(counter).end();

}
```

@graphics

Since the user interacts with the UI, an event is triggered, Vapor sees this, and then checks what is changed, added, or removed. And updates the UI accordingly.
Since Vapor runs in WASM, this process is extremely fast, and uses very little memory.

#### The remaining %

As long as there is an input into Vapor, then the UI will update, only small edge cases are not handled, for example, if you write your own external functionality.

Another scenario is, as you probably have noticed the numbered boxes on the right. These are generated after the Markdown file is compiled and the UI is rendered. After this
we query to see how many Section Elements were created, and then create a bunch of Numbered Boxes. But since no event happened, the UI does not update.
Thus we must call `cycle()` to trigger the UI update.

Querying elements is not an event, it is a function call, and thus not considered.

{#immediate-mode}

### Immediate Mode

Immediate mode works like GUIs where the entire render tree is ran, every frame. But unlike GUIs, Vapor only updates the elements that are affected.

Immediate mode is extremely fast.
In a worst case scenario, with a list of 10,000 nodes, no stable
keys, in which the first node is order removed,
the entire render
cycle from removal to UI update takes 12ms on a 2021 M1 MacBook Pro.

Immediate mode requires no state management, if a variable changes the UI will change, only the elements that are affected will be updated. **100%** of the work is done by Vapor.

```zig
const Vapor = @import("vapor");
const Button = Vapor.Button;
const Text = Vapor.Text;
const TextField = Vapor.TextField;

// Initialize Vapor
export fn init() void {
    Vapor.init(.{ .mode = .immediate });
    Vapor.Page(.{ .route = "/" }, Home, null);
}


var text: []const u8 = "Inital Text";
var counter: usize = 0;

pub fn increment() void {
    counter += 1;
}

pub fn Home() void {
    // The user interacts with the UI, via a text field
    TextField(.string).bind(&text).end();
    Text(text).end(); // This will update

    // The user interacts with the UI, via a button press
    Button(increment).children({
        Text("Increment").end();
    });
    Text(counter).end();

}
```

{#80-content-is-static}

### 80% of content in an application is static

Most UI elements never change after initial render.
Vapor optimizes for this reality by exposing `Static`
elements.

In practice, the only difference between a `Static` `Text` and a `Text` is the import.
This site, never uses `Static` elements, while Acorn does, this is mainly for readability and maintainability.
Since most of the documentation site, is made up of Mardown files.

```zig
const Vapor = @import("vapor");
const Static = Vapor.Static;
const Text = Static.Text;
const Button = Static.Button;
```

{#retained-mode}

### Retained Mode

As stated before, Vapor is a toolkit, and so you can decide how you want your application to work.
Retained mode is the most restrictive mode, you must define when a variable changes, or manually call `cycle()`, to ask Vapor to reconcile and update the UI.

There are two types of state functions in Vapor,

- **Signal(T)**

- **cycle()**

{#using-cycle}

### Using cycle()

The `cycle()` function tells Vapor, to update the UI, this is agnostic to the variables. It will update all UI elements that have changed, not just
the `counter` variable. For example the following will udpate both the
`counter` and the `text` variables.

```zig
const Vapor = @import("vapor");
const TextFmt = Vapor.TextFmt;

const Static = Vapor.Static;
const Text = Static.Text;
const Button = Static.Button;

var counter: usize = 0;

pub fn increment() void {
    counter += 1;
    Vapor.cycle(); // Here we call cycle, to ask Vapor to update the UI
}

pub fn render() void {
    Button(increment).children({
        Text("Increment").end();
    });
    TextFmt("I am a counter: {d}", .{counter}).end(); // Only this updates
}
```

```zig
const Vapor = @import("vapor");
const TextFmt = Vapor.TextFmt;
const Text = Vapor.Text; // We changed this to a Vapor element

const Static = Vapor.Static;
const Button = Static.Button;

var counter: usize = 0;
var text: []const u8 = "Increment";

pub fn increment() void {
    counter += 1;
    text = "Increment again";
    Vapor.cycle();
}

pub fn render() void {
    Button(increment).end()({
        Text(text).end(); // This now updates
    });
    TextFmt("{d}", .{counter}).end(); // This still updates
}
```

@cycle_example

{#zig-is-meant-to-be-explicit}

### Zig is meant to be Explicit!

Developers and Zig users alike, will most likely want to have explicit control over the UI at times, and not depend on the framework.
Svelte came to this realization, and implemented _Runes_, which are explicit UI state variables.

Vapor, has the same concept. When need be developers, can define their own UI variables through the `Signal(T)` type.

{#signalT}

### Signal(T)

`Signal(T)` is a type that is used to define UI state variables.
It is a wrapper around a `cycle()`.

```zig
const Vapor = @import("vapor");
const Signal = Vapor.Signal; // The Signal type
const Static = Vapor.Static;
const TextFmt = Vapor.TextFmt;

const Counter = struct {
    count: Signal(u32) = undefined,

    pub fn init() Counter {
        return .{ .count = count.init(0) };
    }

    pub fn increment(counter: *Counter) void {
        counter.count.increment();
    }

    pub fn render(counter: *Counter) void {
        Static.ButtonCtx(increment, .{counter}).end()({
            TextFmt("I am a counter: {d}", .{counter.count.get()}).end(); // This updates
        });
    }
};

```

`Signal(T)` has a number of methods, that can be used to change or update the state variable.

- `get()`

- `set()`

- `increment()`

- `decrement()`

- `toggle()`

- `append()`

- `getElement()`

- `compare()`

- and much more...

{#effects}

### Effects

Vapor, has decided to completely remove the concept of useEffect, useMemo, and subscriptions, entirely.
Instead, a functional approach should be used.

{#with-the-concept-of-effects}

### With the concept of effects

```zig
const Vapor = @import("vapor");
const Signal = Vapor.Signal;

var counter: Signal(u32) = undefined;
var text: Signal([]const u8) = undefined;
fn init() void {
    counter.init(0);
    text.init("Is 0");
++    counter.effect(updateText);
}

fn updateText(count: u32) void {
++    text.set(Vapor.fmtln("Is {d}", .{count}));
}

fn increment() void {
    counter.increment();
}
```

{#without-the-concept-of-effects}

### Without the concept of effects

```zig
const Vapor = @import("vapor");
const Signal = Vapor.Signal;

var counter: Signal(u32) = undefined;
var text: Signal([]const u8) = undefined;
fn init() void {
    counter.init(0);
    text.init("Is 0");
}

fn increment() void {
    counter.increment();
++    text.set(Vapor.fmtln("Is {d}", .{counter.get()}));
}
```

While Vapor, takes a strong stance against the use of effects, subscriptions, and such, it does not mean you cannot build your own effect system.
I did this originally, to determine if Vapor needed an effect system, however with the complexity and history of issues
with effects, I removed it.
If you truly want one, then you are going to have to build it yourself.

{#its-just-zig}

### Its just Zig

Since Vapor is not transpiled, and is just Zig, this means the variables can be passed from file to file.
Instead of defining `const [counter, setCounter] = useState(0);` variables,
and then passing them down the tree, to use in a child component.

We can just import the variable where needed. `const Parent = @import("parent.zig");`
`Parent.counter += 1;`

This also means that we can pass variables from parent to child, or child to parent.
This shows the immense power of Zig, and keeping the framework away from transpilation!

```zig
// GlobalCounter.zig
const std = @import("std");
const Vapor = @import("vapor");

pub var count: u32 = 0;

pub fn init() void {
    Page(.{ .src = "/global-counter" }, render, null);
}

fn render() void {
    TextFmt("I am a counter: {d}", .{count}).end();
}
```

```zig
// Parent.zig or Child.zig or Anywhere.zig
const Vapor = @import("vapor");
const GlobalCounter = @import("GlobalCounter.zig");

pub fn increment() void {
    GlobalCounter.count += 1;
}

pub fn render() void {
    Button(increment).children({
        Text("Increment the Global Counter").end();
    });
}
```
