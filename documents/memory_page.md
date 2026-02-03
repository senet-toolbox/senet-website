{#memory}

# Memory

### You Probably Don't Need This Section

**Seriously.** Look at the Tic-Tac-Toe tutorial—150 lines, zero memory management. For most Vapor apps:

```zig
// This is all you need
var counter: i32 = 0;
var items: [10]Item = undefined;
var text: []const u8 = "Hello";
```

Module-level variables live forever. Event handlers mutate them. Vapor re-renders. Done.

**When DO you need memory management?**

| Scenario                                         | Do you need arenas? |
| ------------------------------------------------ | ------------------- |
| Fixed-size state (counters, flags, small arrays) | ❌ No               |
| Strings known at compile time                    | ❌ No               |
| Dynamic lists that grow/shrink                   | ✅ Yes              |
| Formatted strings with runtime values            | ✅ Yes              |
| Data fetched from an API                         | ✅ Yes              |
| User-generated content                           | ✅ Yes              |

If your app is mostly static UI with simple state, skip to the next section.

---

### When You Need Dynamic Memory

Let's say you're building a todo app where users can add items:

```zig
// ❌ This won't work - can't grow a fixed array
var todos: [100]Todo = undefined;
var todo_count: usize = 0;

fn addTodo(text: []const u8) void {
    if (todo_count >= 100) return; // Stuck at 100!
    todos[todo_count] = .{ .text = text };
    todo_count += 1;
}
```

You need a dynamic array. This is where arenas come in.

---

### The Four Arenas (Mental Model)

Think of arenas as **buckets with different lifetimes**:

| Arena      | Lifetime       | Use Case             | Analogy                                   |
| ---------- | -------------- | -------------------- | ----------------------------------------- |
| `.frame`   | Single render  | Temporary formatting | Whiteboard (erased after meeting)         |
| `.view`    | Current page   | Page-specific data   | Notebook (thrown out when you leave room) |
| `.persist` | Entire session | App-wide state       | Filing cabinet (permanent)                |
| `.scratch` | You decide     | Manual control       | Sticky notes (you throw away)             |

```zig
┌─────────────────────────────────────────────────────┐
│ App Start                                           │
│  ┌─────────────────────────────────────────────┐    │
│  │ .persist (lives forever)                    │    │
│  │  - User settings                            │    │
│  │  - Auth state                               │    │
│  │  ┌─────────────────────────────────────┐    │    │
│  │  │ .view (cleared on navigation)       │    │    │
│  │  │  - Page-specific lists              │    │    │
│  │  │  - Form data                        │    │    │
│  │  │  ┌─────────────────────────────┐    │    │    │
│  │  │  │ .frame (cleared each render)│    │    │    │
│  │  │  │  - Formatted strings        │    │    │    │
│  │  │  │  - Temporary calculations   │    │    │    │
│  │  │  └─────────────────────────────┘    │    │    │
│  │  └─────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

---

### Practical Examples

**Example 1: Formatted text in UI**

```zig
var score: i32 = 0;

fn render() void {
    // ✅ fmtln uses .frame automatically - freed after render
    const label = Vapor.fmtln("Score: {d} points", .{score});
    Text(label).end();
}
```

**Example 2: Page-specific list**

Useful within `mount()` functions

```zig
// This list only matters on this page
var todos: std.ArrayList(Todo) = undefined;

pub fn init() void {
    // ✅ .view - freed when user navigates away
    todos = std.ArrayList(Todo).init(Vapor.arena(.view));
    Vapor.Page(.{ .route = "/todos" }, render, null);
}

fn addTodo(text: []const u8) void {
    todos.append(.{ .text = text }) catch return;
}
```

**Example 3: App-wide state**

```zig
// User stays logged in across all pages
var current_user: ?User = null;
var auth_token: []const u8 = "";

pub fn init() void {
    // ✅ .persist - lives until app closes
    const alloc = Vapor.arena(.persist);
    // ... fetch and store user data
}
```

---

### The Simple Rule

```zig
// Ask yourself: "When should this data disappear?"

// "After this render" → .frame (or just use Vapor.fmtln)
const temp = Vapor.fmtln("{d}", .{x});

// "When leaving this page" → .view
var page_data = Vapor.arena(.view).alloc(T, n);

// "Never (until refresh)" → .persist
var app_state = Vapor.arena(.persist).create(T);

// "When I say so" → .scratch
var manual = Vapor.arena(.scratch).alloc(T, n);
// Later: Vapor.arena(.scratch).free(manual);
```

---

### You Can Ignore This If...

- Your state is simple types (integers, bools, enums)
- Your strings are literals (`"hello"`) not runtime-generated
- Your arrays have fixed, known sizes
- You're not fetching data from APIs

The Tic-Tac-Toe game uses **zero** arena calls. Start simple, add memory management only when you need dynamic data.

In Vapor, the majority of memory is handled by the Vapor's engine _Codex_. If you haven't been exposed to memory management yet, it is recommended to read through the
New to Zig section first, and then come back here.

{#memory-is-not-scary}

### Memory is not Scary

I started writing Zig in 2024, and before that I was a web developer. Never touched memory or a low-level language. It took me just 1 week to start
writing Zig. Zig isn't C, C++ or Rust, it's **simple**, and **intutive**, all thanks to _Andrew Kelley_, and the core Zig team.

Rust prioritizes safety guarantees; **Zig prioritizes explicitness and simplicity**.

Zig makes memory management easy.

#### Vapor, takes it one step further.

Vapor exposes 4 memory arenas

#### `arena(memory_type)`

The `arena` function takes a **memory_type** argument, and returns the corresponding allocator, which is used for all memory allocations.

1. **.frame** the frame allocator, is used for memory that needs to be allocated and deallocated in a single render cycle. (Frames: are just a single render cycle, ie FPS)
2. **.view** the view allocator, is used for memory that needs to be allocated and deallocated per page.
3. **.persist** the persist allocator, is used for memory exists across your entire application, and is never freed.
4. **.scratch** the scratch allocator, is used for memory that can be freed by you the developer, at any time you want.

#### How they work in practice

```zig
const Vapor = @import("vapor");
const Box = Vapor.Box;
const Text = Vapor.Text;

pub fn init() void {
    Page(.{ .src = @src() }, render, null);
}

pub fn render() void {
    const u32_number = Vapor.arena(.frame).create(u32) catch {};
    Text(u32_number).end();
}
```

In the above example, we use the **frame** arena, to allocate memory for a u32 number. Since we are creating a new number, inside the `render()` function, This creates a new u32 number
, every time the UI is updated. (Remember, Vapor is akin to a game engine, everytime the UI changes, it re-runs the `render()` function)

We use the **frame** arena type, here, since Vapor will automatically free any memory that is allocated in the frame arena, when we have finished rendering the UI.

![Diagram](/assets/vapor_arena_frame_example.svg)

#### Another example

Imagine, we have two pages, one for contacting support, and another for applying for a job.

On the contact page, we have a list of problems. The user can select the most relevent problem, and then click a button, to send the contact information to support.

On the job page, we have a list of jobs. The user can select the most relevent job, and then click a button, to send the contact information to the employer.

Each page, uses a different list. There is no point is having both lists in memory, at the same time. We aren't sharing the lists across pages.

In Vapor, we can use the **view** arena type, to allocate memory for the lists. This is because when we navigate to the job page, we want to create the jobs list,
and when we navigate away we want to free the memory that was allocated.

Vapor handles this automatically, it listens to the route changes, and frees all the memory from the **view** arena, when we navigate away.

```zig
// Contact page
const std = @import("std");
const Vapor = @import("vapor");
const Box = Vapor.Box;
const Text = Vapor.Text;
const Button = Vapor.Button;

pub fn init() void {
    Page(.{ .src = @src() }, render, null);
}

pub fn mount() void {
    const view_allocator = Vapor.arena(.view);
    var problems = view_allocator.alloc([]const u8, 15) catch {};
    for (0..15) |i| {
        problems[i] = try std.fmt.allocPrint(view_allocator, "Problem {d}", .{i});
    }
    // ... Define the problems list
}

pub fn render() void {
    Hooks(.{ .mounted = mount })({
        Center().spacing(16).padding(.all(20)).children({
            Text("Contact").font(24, 700, .palette(.text_color)).end();
            List().direction(.column).layout(.{}).pos(.{}).children({
                for (problems) |problem| {
                    ListItem().children({
                        Text(problem).font(14, 700, .palette(.text_color)).end();
                    });
                }
            });
        });
    });
}
```

```zig
// Jobs page
const std = @import("std");
const Vapor = @import("vapor");
const Box = Vapor.Box;
const Text = Vapor.Text;
const Button = Vapor.Button;

pub fn init() void {
    Page(.{ .src = @src() }, render, null);
}

pub fn mount() void {
    const view_allocator = Vapor.arena(.view);
    var jobs = view_allocator.alloc([]const u8, 10) catch {};
    for (0..10) |i| {
        jobs[i] = try std.fmt.allocPrint(view_allocator, "Job {d}", .{i});
    }
    // ... Define the jobs list
}

pub fn render() void {
    Hooks(.{ .mounted = mount })({
        Center().spacing(16).padding(.all(20)).children({
            Text("Jobs").font(24, 700, .palette(.text_color)).end();
            List().direction(.column).layout(.{}).pos(.{}).children({
                for (jobs) |job| {
                    ListItem().children({
                        Text(job).font(14, 700, .palette(.text_color)).end();
                    });
                }
            });
        });
    });
}
```

### But that's not all!

Vapor includes a whole suite of memory management functions, that are used to allocate and free memory in a safe and efficient manner.
Some examples are shown below.

### `Array(T, memory_type)`

- A array allocated on the memory type specified.
  - This is useful, for creating arrays that live in a specific page, or frame, or should exist for the lifetime of the application.

```zig
// Allocated on the page, and deallocated when navigated away from
var array = Vapor.Array(u32, .view);
array.append(1);
array.append(2);
array.append(3);
```

### `fmtln(comptime fmt: type, args: anytype)`

- A function that is similar to `std.fmt.print`, but exists only for the frame.
  - This is useful, for creating strings within your UI.

```zig
pub fn SectionList() void {
    List().children({
        for (current.sections) |section| {
            // All normal Zig code in our UI!
            const title = section.title;

            // We create the url using fmtln, which is a function that is only available in the frame
            const url = Vapor.fmtln("#{s}", .{section.link});
            ListItem().children({
                Link(.{ .url = url, .aria_label = title }).children({
                    Text(title).end();
                });
            });
        }
    });
}
```
