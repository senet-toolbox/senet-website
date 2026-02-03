{#components}

# Components

Components are reusable pieces of UI. In Vapor, a component is just a Zig file with a `render()` function—no special syntax, no decorators, no magic.

```zig
// components/Greeting.zig
const Vapor = @import("vapor");
const Text = Vapor.Text;

pub fn render() void {
    Text("Hello from a component!").end();
}
```

```zig
// Use it anywhere
const Greeting = @import("components/Greeting.zig");

fn render() void {
    Greeting.render();
}
```

| Pattern  | Use When                                 |
| -------- | ---------------------------------------- |
| Global   | Single instance, simple state            |
| Instance | Multiple instances, each needs own state |
| Function | Multiple instances with different types  |

Most of the time, you'll use Global components. Start there and reach for the others when you need independent state or type generics.

{#global-components}

### Global Components

These are the most common component type you will use in your applications. They declare there variables globally, but are only available within the file they are declared in.

Global Components take no reference to themselves, and instead just operate on their local variables.

⚠️ All instances of a Global Component share the same variables. If you need independent state, use Instance or Function components instead.

```zig
const std = @import("std");
const Vapor = @import("vapor");
const Box = Vapor.Box;
const Text = Vapor.Text;
const Button = Vapor.Button;

// Global state
var count: i32 = 0;

fn increment() void {
    count += 1;
}

fn decrement() void {
    count -= 1;
}

pub fn render() void {
    Box().layout(.center).spacing(16).padding(.all(20)).children({
        Button(.{ .on_press = decrement }).children({
            Text("-").fontSize(18).end();
        });

        Text(count).font(24, 700, .palette(.text_color)).end();

        Button(.{ .on_press = increment }).children({
            Text("+").fontSize(18).end();
        });
    });
}
```

```zig
// Render in /routes/about/Page.zig
const Vapor = @import("vapor");
const Counter = @import("components/Counter.zig");

pub fn init() void {
    Page(.{ .src = @src() }, render, null);
}

fn render() void {
    Counter.render();
}
```

```zig
// Render in /routes/contact/Page.zig
const Vapor = @import("vapor");
const Counter = @import("components/Counter.zig");

pub fn init() void {
    Page(.{ .src = @src() }, render, null);
}

fn render() void {
    Counter.render();
}
```

Below we can see that both instances of `Counter` use the same local set of variables, and share the same `count` variable. Just like in a normal programming language, if you
call the same function in two different files, they will share the same variables.

@global_sample

@global_sample

{#instance-components}

### Instance Components

Instance components, do reference themselves, they are akin to classes in other languages. They have their own set of local variables. That are bound to the struct.

We use these when we want to create multiple instances of the same component, with different data. For example a counter component that has the same styling, but we want
to have seperate `count` data.

```zig
const std = @import("std");
const Vapor = @import("vapor");
const Allocator = std.mem.Allocator;
const Box = Vapor.Box;
const Text = Vapor.Text;
const ButtonCtx = Vapor.ButtonCtx;

/// Counter component
const Counter = @This();
count: i32 = 0,

fn increment(counter: *Counter) void {
    counter.count += 1;
}

fn decrement(counter: *Counter) void {
    counter.count -= 1;
}

pub fn render(counter: *Counter) void {
    Box().layout(.center).spacing(16).padding(.all(20)).children({

        // ButtonCtx lets us pass a context to the button, which is the Counter struct
        ButtonCtx(decrement, .{counter}).children({
            Text("-").fontSize(18).end();
        });

        Text(counter.count).font(24, 700, .palette(.text_color)).end();

        ButtonCtx(increment, .{counter}).children({
            Text("+").fontSize(18).end();
        });
    });
}
```

```zig
// Render in /routes/about/Page.zig
const Vapor = @import("vapor");
const Counter = @import("components/Counter.zig");

var i32_counter: Counter = .{};
pub fn init() void {
    Page(.{ .src = @src() }, render, null);
}

fn render() void {
    i32_counter.render();
}
```

```zig
// Render in /routes/contact/Page.zig
const Vapor = @import("vapor");
const Counter = @import("components/Counter.zig");

var i32_counter: Counter = .{};
pub fn init() void {
    Page(.{ .src = @src() }, render, null);
}

fn render() void {
    i32_counter.render();
}
```

@instance_sample

@instance_sample2

##### Now they are different instances of the same component, with different data.

Incrementing one, will not affect the other.

{#function-components}

### Function Components

Vapor is just Zig, so you can structure the application however you want. There is no magic transpilation. What you see is what you get.

Zig has a special keyword called `comptime`.

`comptime `is an incredibly powerful tool, that is part of the language, and can be used to generate various components of different types.

`comptime`: Code Generation at Compile Time
The comptime keyword tells Zig: "Run this function during compilation, not at runtime."

For example, we can use `comptime` to generate a `Counter` with various values types, the `comptime` system is used for the `DataTable` component
in Vapor.

##### This is like function components in React, Solid, or other such frameworks.

##### These can be created multiple times, and have their own local variables.

```zig
const Vapor = @import("vapor");
const Box = Vapor.Box;
const Button = Vapor.Button;

pub fn Counter(comptime T: type, initial_value: T) type {
    return struct {
        var count: T = initial_value;

        fn increment() void {
            count += 1;
        }

        fn decrement() void {
            count -= 1;
        }

        pub fn render() void {
            Box().layout(.center).spacing(16).padding(.all(20)).children({
                Button(decrement).children({
                    Text("-").fontSize(18).end();
                });

                Text(count).font(24, 700, .palette(.text_color)).end();

                Button(increment).children({
                    Text("+").fontSize(18).end();
                });
            });
        }
    };
}
```

```zig
// Render in /routes/about/Page.zig
const Vapor = @import("vapor");
const Counter = @import("components/Counter.zig");

const i32_counter = Counter(i32, -1);
pub fn init() void {
    Page(.{ .src = @src() }, render, null);
}

fn render() void {
    i32_counter.render();
}
```

```zig
// Render in /routes/contact/Page.zig
const Vapor = @import("vapor");
const Counter = @import("components/Counter.zig");

const u32_counter = Counter(u32, 1);
pub fn init() void {
    Page(.{ .src = @src() }, render, null);
}

fn render() void {
    u32_counter.render();
}
```

@i32_sample

@u32_sample

{#passing-props}

## Passing Props

#### We can also pass props to the different components

```zig
const Vapor = @import("vapor");
const Box = Vapor.Box;
const ButtonCtx = Vapor.ButtonCtx;

pub fn Counter(comptime T: type, initial_value: T, multiplier: T) type {
    return struct {
        var count: T = initial_value;

        fn multiPos(multi: T) void {
            count = count * multi;
        }

        fn multiNeg(multi: T) void {
            count = -1 * count * multi;
        }

        pub fn render() void {
            Box().layout(.center).spacing(16).padding(.all(20)).children({
                // Again here we use ButtonCtx, not Button
                ButtonCtx(multiNeg, .{multiplier}).children({
                    Text("-").fontSize(18).end();
                });

                Text(count).font(24, 700, .palette(.text_color)).end();

                // We use ButtonCtx here so that we can pass the multiplier
                ButtonCtx(multiPos, .{multiplier}).children({
                    Text("+").fontSize(18).end();
                });
            });
        }
    };
}
```

#### Typescript Comparison

In typescript, you would need to use generics, and this would all occur at runtime. We also need to create a new class for each type, and therefore need to reference the class
inside all our functions. In the Zig version, above we can just treat the varaible as a normal, akin to the global component, but with all the benefits of local bounded variables.

```ts
class Counter<T extends number> {
  private count: T;

  constructor(initialValue: T) {
    this.count = initialValue;
  }

  increment = () => {
    this.count += 1;
  }

  decrement = () => {
    this.count -= 1;
  }

  render() {
    return (
      <Box layout="center" spacing={16} padding={20}>
        <Button onPress={this.decrement}>
          <Text fontSize={18}>-</Text>
        </Button>
        <Text fontSize={24} fontWeight={700}>
          {this.count}
        </Text>
        <Button onPress={this.increment}>
          <Text fontSize={18}>+</Text>
        </Button>
      </Box>
    );
  }
}
```

{#engine}

## Engine

Vapor is akin to modern game engines, where the entire rendering is handled by the engine.

The rendering system uses a virtual DOM approach with the following features:

1. **Tree Construction**: Builds a UI tree representation in memory

2. **Diffing Algorithm**: Compares current and new tree states

3. **Dirty Tracking**: Marks nodes that require updates

4. **Additions**: Marks nodes that need to be added

5. **Removals**: Marks nodes that need to be removed

6. **Selective Updates**: Only updates nodes that have changed

![Diagram](/src/assets/tree.svg)

Vapor runs the entire render cycle, on every state change. Vapor generates a Virtual Tree (DOM),
and then reconciles the differences between the old and new tree.

This is done in a single pass, and is extremely fast, even with large trees. Vapor can rerender a total of **10,000 nodes** in just **12ms** on a 2021 M1 MacBook Pro.
**At 80FPS.** This includes the time to update the DOM, and the time to render the UI.

##### After reconciliation, Vapor spits out an array of nodes:

1. An array of nodes that need to be **removed**

2. An array of nodes that need to be **added**

3. An array of nodes that need to be **updated**

These are then applied to the DOM **granularly** for minimal overhead.

We can access these via the following commands:

```zig
const dirty_nodes = Vapor.dirty_nodes;
const added_nodes = Vapor.added_nodes;
const removed_nodes = Vapor.removed_nodes;

for (dirty_nodes.items) |node| {
    // Do something with the dirty node
}
```

#### How it's different

This is different from React, where changing a parent's state triggers
re-renders of all children—even if their props didn't change. Vapor's
reconciliation is component-agnostic: it doesn't matter where the state lives,
only which elements display it.

{#performance}

## Performance

Instead of traversing the entire tree in the JS or native code side, we loop through the arrays of nodes and update those only.

This gives us both the power and control of reconcilation, and virtualization, but also the speed of native code, and simple looping mechanics.
