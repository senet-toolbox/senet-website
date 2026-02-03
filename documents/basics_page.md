{#basics}

# Basics

#### The main.zig file is the root entry point for your Vapor application

{#creating-a-vapor-app}

### main.zig

In main.zig we intialize Vapor, set up our routes, and whatever else we need.
It's simple to set up a Vapor app, all we have to do is import Vapor with `const Vapor = @import("vapor");` and then
call `Vapor.init(.{});` to initialize Vapor within the `init()` function.

```zig
const std = @import("std");
const Vapor = @import("vapor");
const Button = Vapor.Button;
const Text = Vapor.Text;

// Initialize Vapor
export fn init() void {
    Vapor.init(.{});
    Vapor.Page(.{ .route = "/" }, Home, null);
}

var counter: u32 = 0;
fn increment() void {  counter += 1;  }

fn Home() void {
    Button(increment).children({
        Text("Increment").end();
    });
    Text(counter).end();
}
```

{#instantiate}

### Init and Export

The `init` function is called once when the vapor.wasm file is loaded. It initializes the Vapor framework and sets up the application environment.
We add our routes here, these routes are the pages that we can navigate to and from.

```zig
export fn init() void {
    Vapor.init(.{});
    Vapor.Page(.{ .route = "/" }, Home, null);
}
```

The `export` keyword gives the wasm bridge access to the zig functions.

```zig
export fn init() void {
    // ... init code
}
```

You can create other export functions to interact with JS, from Zig, or vice versa with `extern` functions.
This is useful when you want to integrate various JS libraries into your Vapor app.

⚠️ NOTE: Vapor comes with a plethora of UI components, and libraries.
You can add these via the metal CLI tool. Acorn, is built with **0** dependencies.

### How it works

We create our route via the `Page()` function. `Page()`, takes a render function, which will be called when we navigate to the route.
In the scenario above, we pass in `Home()`.
Then when we navigate to the "/", Vapor internally calls `Home()`, then reconciles the UI, and updates the DOM.

### The Render Loop: A Key Concept

It is common convention to use the `render()` and `init()` naming convention when creating Components, and use the
name of route like "Home" or "About" for the page render function, as this explicitly reads as "render the UI", and "initialize the Data".

The function passed to `Page(...)` is called every time Vapor needs to update the UI. Just like any function, variables **inside** `render()` are reset each call:

```zig
fn render() void {
    var counter: usize = 0; // ⚠️ Reset to 0 every render!
    // ... rest of your UI
}

fn renderCycle() void {
    while (true) {
        render();
    }
}
```

⚠️ Note: This is a conceptual model. In practice, Vapor only calls render()
when state changes are detected, not in an infinite loop. Think of it as
"render() gets called fresh each time we need to update the UI."

#### State is reset within render functions, so doing the following will not work:

```zig
// ❌ WRONG - resets every render
pub fn render() void {
    var count: usize = 0;  // Always 0!
}
```

#### Instead, move the state outside the render function:

```zig
// ✅ CORRECT - persists between renders
var count: usize = 0;  // Outside render

pub fn render() void {
    // Use count here
}
```

### State

```zig
var counter: usize = 0;  // ✅ Persists

fn increment() void { counter += 1; }

fn render() void {
    var temp: usize = 0;  // ❌ Resets every render
    Button(increment).children({
        Text(counter).end();
        Text(temp).end();
    });
}
```

In Vapor we seperate data, from UI. Everything inside the render function is UI, and gets called every time we want to update the UI. This is why, in all the examples
you will see, we have a `init()` function for initialization of data, and a `render()` function for rendering the UI.

Vapor treats, data and UI as two seperate things, This drastically improves readability, and debugging, since the lifecycle of the entire application is predictable, and deterministic.

- Everything inside `render()` is called every time we want to update the UI.
- Everything declared outside `render()` persists between renders. Functions outside `render()` can be called multiple times (like event handlers), but variables outside `render()` maintain their values.

In both frameworks, the UI declaration runs repeatedly. The difference is **where state lives**:

This is why you'll see two functions in Vapor apps:

- `init()` - Initialize state (runs once)
- `render()` - Declare UI (runs on every update)

```zig
// 📁 main.zig
const Home = @import("routes/home/Page.zig");
export fn init() void {
    Vapor.init(.{});
    Home.init();
}
```

```zig
// 📁 routes/home/Page.zig
const Vapor = @import("vapor");
const Box = Vapor.Box;
const Text = Vapor.Text;

var text: []const u8 = "";
pub fn init() void {
    text = "Welcome to Vapor!";
    Page(.{ .route = "/home" }, render, null);
}

fn render() void {
    Box().children({
        Text(text).end();
    });
}
```

{#structuring-your-application}

## Structuring your application

Every element type `(Box, Text, Link, Image, Svg, Button, TextField, ListItem, etc...)`. Is nothing more than a function call to add
a node to the UI tree.

1. **Elements** - Like `Box()`, can take arguments, and various builder functions.
2. **Style Builder** - These are functions operate on the component itself, and mutate the style of the component, like `layout(.center)`.
3. **Event Callbacks** - These functions are called based on events, for example, `on_press`, or `onHover`, or `onChange`.

![Diagram](/src/assets/tree.svg)
