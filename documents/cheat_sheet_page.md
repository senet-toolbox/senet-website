{#vapor-api-cheatsheet}

# Vapor API Cheat Sheet

#### Quick reference for building UIs with Vapor's Zig-powered WebAssembly framework.

---

{#imports-and-setup}

## Imports & Setup

```zig
const std = @import("std");
const Vapor = @import("vapor");

// Core Components
const Box = Vapor.Box;
const Text = Vapor.Text;
const Button = Vapor.Button;
const Stack = Vapor.Stack;
const Center = Vapor.Center;
const Icon = Vapor.Icon;
const TextField = Vapor.TextField;
const TextArea = Vapor.TextArea;
const Label = Vapor.Label;
const Link = Vapor.Link;
const Image = Vapor.Image;
const List = Vapor.List;
const ListItem = Vapor.ListItem;
const TextFmt = Vapor.TextFmt;
const Spacer = Vapor.Spacer;

// Context Components
const ButtonCtx = Vapor.ButtonCtx;
const TextFmt = Vapor.TextFmt;

// Static Components (never update)
const Static = Vapor.Static;

// Hooks
const HooksCtx = Vapor.Static.HooksCtx;

// Utilities
const Binded = Vapor.Binded;
const Animation = Vapor.Animation;
```

---

{#application-initialization}

## Application Initialization

```zig
// main.zig
export fn init() void {
    Vapor.init(.{});

    // Register routes
    Vapor.Page(.{ .route = "/" }, Home, null);
    Vapor.Page(.{ .route = "/about" }, About, deinit);

    // Or use @src() for file-based routing
    Vapor.Page(.{ .src = @src() }, render, null);
}

fn Home() void {
    Text("Hello Vapor!").end();
}

fn About() void {
    Text("About Page").end();
}

fn deinit() void {
    // Called when navigating away
}
```

---

{#state-management}

## State Management

### Basic State (Outside Render)

```zig
// State lives OUTSIDE render function
var counter: i32 = 0;
var text: []const u8 = "Hello";
var items: []const Item = &.{};

fn multiply(multiplier: i32) void {
    counter = counter * multiplier;
}

fn render() void {
    // UI declaration runs every update
    Text(counter).end();
    Button(multiply, .{2}).children({
        Text("Click").end();
    });
}
```

### Signal-Based State (Explicit Reactivity)

```zig
const Signal = Vapor.Signal;

var counter: Signal(u32) = undefined;

fn init() void {
    counter.init(0);
}

fn increment() void {
    counter.increment();  // Auto-triggers UI update
}

fn render() void {
    Text(counter.get()).end();
}
```

### Signal Methods

| Method          | Description             |
| --------------- | ----------------------- |
| `.init(value)`  | Initialize with value   |
| `.get()`        | Get current value       |
| `.set(value)`   | Set new value           |
| `.increment()`  | Increment numeric value |
| `.decrement()`  | Decrement numeric value |
| `.toggle()`     | Toggle boolean value    |
| `.append(item)` | Append to array         |

---

{#component-patterns}

## Component Patterns

### Global Component (Shared State)

```zig
// components/Counter.zig
const Vapor = @import("vapor");
const Box = Vapor.Box;
const Text = Vapor.Text;
const Button = Vapor.Button;

var count: i32 = 0;

fn increment() void { count += 1; }
fn decrement() void { count -= 1; }

pub fn render() void {
    Box().layout(.center).spacing(16).children({
        Button(decrement).children({ Text("-").end(); });
        Text(count).font(24, 700, .palette(.text_color)).end();
        Button(increment).children({ Text("+").end(); });
    });
}
```

### Instance Component (Independent State)

```zig
// components/Counter.zig
const Counter = @This();
count: i32 = 0,

fn increment(counter: *Counter) void {
    counter.count += 1;
}

fn decrement(counter: *Counter) void {
    counter.count -= 1;
}

pub fn render(counter: *Counter) void {
    Box().layout(.center).spacing(16).children({
        ButtonCtx(decrement, .{counter}).children({ Text("-").end(); });
        Text(counter.count).font(24, 700, .palette(.text_color)).end();
        ButtonCtx(increment, .{counter}).children({ Text("+").end(); });
    });
}

// Usage
var my_counter: Counter = .{};
fn render() void {
    my_counter.render();
}
```

### Function Component (Generic/Comptime)

```zig
pub fn Counter(comptime T: type, initial_value: T) type {
    return struct {
        var count: T = initial_value;

        fn increment() void { count += 1; }
        fn decrement() void { count -= 1; }

        pub fn render() void {
            Box().layout(.center).spacing(16).children({
                Button(decrement).children({ Text("-").end(); });
                Text(count).font(24, 700, .palette(.text_color)).end();
                Button(increment).children({ Text("+").end(); });
            });
        }
    };
}

// Usage
const i32_counter = Counter(i32, 0);
const u64_counter = Counter(u64, 100);
```

---

{#core-components}

## Core Components

### Text

```zig
Text("Hello World").end();
Text(counter).end();                           // Numbers
Text(enum_value).end();                        // Enums
Text(text_variable).end();                     // Strings

// Styled
Text("Styled")
    .font(18, 700, .palette(.text_color))      // size, weight, color
    .fontFamily("Montserrat")
    .ellipsis(.dot)                            // Truncation
    .end();
```

### TextFmt (Formatted Text)

```zig
TextFmt("Count: {d}", .{counter}).end();
TextFmt("Hello {s}!", .{name}).end();
TextFmt("Page {d}/{d}", .{current, total}).end();
```

### Box (Container)

```zig
Box().children({
    Text("Child 1").end();
    Text("Child 2").end();
});

// Styled Box
Box()
    .layout(.center)
    .direction(.column)
    .spacing(16)
    .padding(.all(20))
    .background(.palette(.background))
    .border(.round(.palette(.border_color), .all(8)))
    .children({ /* children */ });

// Styled Box with style struct
Box()
    .style(&.{
        .visual = .{
            .background = .palette(.background),
            .border = .simple(.palette(.border_color)),
        },
    })({ /* children */ });
```

### Stack (Vertical Container)

```zig
Stack()
    .spacing(8)
    .width(.percent(100))
    .children({
        Text("Item 1").end();
        Text("Item 2").end();
    });
```

### Center

```zig
Center()
    .height(.percent(100))
    .children({
        Text("Centered Content").end();
    });
```

### Button

```zig
// Simple button
Button(handleClick).children({
    Text("Click Me").end();
});

// Button with context (pass data to handler)
ButtonCtx(handleAction, .{ item, index }).children({
    Text("Action").end();
});

// Styled button
Button(submit)
    .padding(.tblr(12, 12, 24, 24))
    .background(.palette(.tint))
    .border(.round(.transparent, .all(8)))
    .cursor(.pointer)
    .hoverScale()
    .children({
        Text("Submit").font(16, 600, .white).end();
    });
```

Button(handler)
→ Handler takes no arguments

ButtonCtx(handler, .{args})
→ Handler receives args
→ Example: ButtonCtx(deleteTodo, .{item.id})

```zig

// Button - no arguments to handler
Vapor.Button(doSomething)

// ButtonCtx - pass arguments to handler
Vapor.ButtonCtx(doSomething, .{arg1, arg2})

// ❌ This doesn't exist:
Vapor.Button(handler, .{args})
```

### TextField

```zig
var input_text: []const u8 = "";

TextField(.string)
    .bind(&input_text)
    .placeholder("Enter text...")
    .width(.percent(100))
    .padding(.all(12))
    .border(.round(.palette(.border_color), .all(8)))
    .end();

// Input types
TextField(.string)     // Text
TextField(.int)        // Numbers
TextField(.password)   // Password
TextField(.email)      // Email
```

### TextField Events

```zig
var text: []const u8 = "";

// Basic binding
TextField(.string)
    .bind(&text)
    .end();

// With change handler
TextField(.string)
    .bind(&text)
    .onChange(handleChange)
    .end();

fn handleChange(evt: *Vapor.Event) void {
    const new_text = evt.text();
    std.log.debug("Text changed to: {s}", .{new_text});
}

// With keyboard events (e.g., submit on Enter)
TextField(.string)
    .bind(&text)
    .onEvent(.keydown, handleKeyDown)
    .end();

fn handleKeyDown(evt: *Vapor.Event) void {
    if (std.mem.eql(u8, evt.key(), "Enter")) {
        evt.preventDefault();
        submitForm();
    }
}

// With context
TextField(.string)
    .bind(&text)
    .onEventCtx(.keydown, handleKeyDownCtx, form_id)
    .end();

fn handleKeyDownCtx(id: u32, evt: *Vapor.Event) void {
    if (std.mem.eql(u8, evt.key(), "Enter")) {
        submitFormById(id);
    }
}
```

### Common TextField Events

| Event                    | Trigger              | Use Case                   |
| ------------------------ | -------------------- | -------------------------- |
| `.onChange`              | Text content changes | Validation, live search    |
| `.onEvent(.keydown, fn)` | Key pressed          | Submit on Enter, shortcuts |
| `.onEvent(.focus, fn)`   | Field gains focus    | Show suggestions           |
| `.onEvent(.blur, fn)`    | Field loses focus    | Validate on blur           |

### TextArea

```zig
TextArea()
    .width(.percent(100))
    .height(.px(200))
    .padding(.all(12))
    .border(.round(.palette(.border_color), .all(8)))
    .resize(.none)
    .end();
```

### Link

```zig
Link(.{ .url = "/about" }).children({
    Text("Go to About").end();
});

// External link
Link(.{ .url = "https://vapor.dev" })
    .textDecoration(.none)
    .children({
        Text("Visit Vapor").end();
    });
```

### Image

```zig
Image(.{ .src = "/images/logo.png" })
    .width(.px(200))
    .height(.px(100))
    .border(.round(.transparent, .all(8)))
    .end();
```

### Icon

```zig
Icon(.search).end();
Icon(.plus).font(24, 300, .palette(.tint)).end();
Icon(.chevron_right).font(16, 700, .white).end();
```

### List & ListItem

```zig
List()
    .direction(.column)
    .spacing(8)
    .children({
        for (items) |item| {
            ListItem().children({
                Text(item.name).end();
            });
        }
    });
```

---

{#styling-reference}

## Styling Reference

### Layout

```zig
.layout(.center)              // Center both axes
.layout(.left_center)         // Left horizontal, center vertical
.layout(.right_center)        // Right horizontal, center vertical
.layout(.top_left)            // Top left corner
.layout(.top_right)           // Top right corner
.layout(.top_center)          // Top center
.layout(.bottom_left)         // Bottom left corner
.layout(.bottom_right)        // Bottom right corner
.layout(.bottom_center)       // Bottom center
.layout(.x_between_center)    // Space between, center vertical
.layout(.x_even_center)       // Space evenly, center vertical
.layout(.y_between)           // Vertical space between
```

### Sizing

```zig
.width(.px(200))              // Fixed pixels
.width(.percent(100))         // Percentage
.width(.fit)                  // Fit content
.width(.grow)                 // Flex grow
.width(.full)                 // 100%
.height(.px(100))
.height(.percent(50))
.height(.auto)

// Shorthand
.hw(.px(100), .px(200))       // height, width
.size(.full)                  // width & height 100%
.size(.square_px(100))        // Square 100x100
```

### Spacing & Padding

```zig
.spacing(16)                  // Gap between children
.padding(.all(20))            // All sides
.padding(.horizontal(16))     // Left & right
.padding(.vertical(12))       // Top & bottom
.padding(.tblr(10, 10, 20, 20)) // top, bottom, left, right
.padding(.tb(12, 12))         // top, bottom
.margin(.all(8))
.margin(.b(16))               // Bottom only
.margin(.t(16))               // Top only
.margin(.l(8))                // Left only
.margin(.r(8))                // Right only
```

### Direction & Wrapping

```zig
.direction(.row)              // Horizontal (default)
.direction(.column)           // Vertical
.wrap(.wrap)                  // Allow wrapping
.wrap(.nowrap)                // No wrapping
```

### Colors & Backgrounds

```zig
// Colors
.palette(.text_color)         // Theme color
.palette(.tint)
.palette(.background)
.palette(.border_color)
.hex("#FF5733")               // Hex color
.rgba(255, 87, 51, 255)       // RGBA
.rgb(255, 87, 51)             // RGB
.white
.black
.transparent
.transparentize(.palette(.tint), 0.5)  // Semi-transparent

// Backgrounds
.background(.palette(.background))
.background(.hex("#F5F5F5"))
.background(.transparent)
.background(.transparentize(.palette(.tint), 0.5))  // Semi-transparent
.layer(.grid(14, 1, .palette(.grid_color)))
.layer(.dot(0.5, 20, .white))
```

### Borders

```zig
.border(.none)
.border(.simple(.palette(.border_color)))
.border(.round(.palette(.border_color), .all(8)))
.border(.solid(.all(2), .palette(.tint), .all(12)))
.border(.bottom(.palette(.border_color)))
.border(.top(.palette(.border_color)))
```

### Shadows

```zig
.shadow(.card(.hex("#00000033")))
.shadow(.glow(30, .transparentize(.black, 0.1)))
.shadow(.{
    .top = 4,
    .spread = 2,
    .blur = 6,
    .color = .transparentize(.black, 0.05),
})
```

### Typography

```zig
.font(16, 400, .palette(.text_color))  // size, weight, color
.font(24, 700, null)                   // Inherit color
.fontSize(18)
.fontWeight(700)
.fontFamily("Montserrat")
.textDecoration(.none)
.textDecoration(.underline)
```

### Positioning

```zig
.pos(.relative)
.pos(.absolute)
.pos(.fixed)
.pos(.tl(.px(0), .px(0), .absolute))   // top, left, position
.pos(.tr(.px(0), .px(0), .absolute))   // top, right, position
.zIndex(100)
```

### Interactivity

```zig
.cursor(.pointer)
.cursor(.default)
.hoverScale()
.hoverBackground(.palette(.tint))
.hoverText(.white)
.hover(.{
    .background = .palette(.tint),
    .text_color = .white,
    .transform = .scaleDecimal(1.1),
})
.duration(200)                         // Transition duration (ms)
```

### Scroll

```zig
.scroll(.scroll_y())                   // Vertical scroll
.scroll(.scroll_x())                   // Horizontal scroll
.scroll(.none())                       // No scroll
```

---

{#style-structs}

## Style Structs

```zig
const button_style = Vapor.Style{
    .layout = .center,
    .size = .hw(.px(48), .px(160)),
    .padding = .tblr(12, 12, 24, 24),
    .visual = .{
        .background = .palette(.tint),
        .border = .round(.transparent, .all(8)),
        .font_size = 16,
        .font_weight = 600,
        .text_color = .white,
    },
    .transition = .{ .duration = 200 },
    .interactive = .hover_scale(),
};

// Apply with .style()
Button(action).style(&button_style)({
    Text("Click").end();
});

// Or with .baseStyle() to allow overrides
Box().baseStyle(&card_style).padding(.all(32)).children({
    // children
});

// Merge styles
fn mergedStyle() Vapor.Style {
    var base = button_style;
    return base.merge(Vapor.Style{
        .visual = .{ .background = .hex("#FF0000") },
    });
}
```

---

{#events-and-handlers}

## Events & Handlers

### Element Events

```zig
// On change (TextField)
TextField(.string)
    .onChange(handleChange)
    .end();

fn handleChange(evt: *Vapor.Event) void {
    const text = evt.text();
    // Handle text change
}

// Hover events
Box()
    .onHover(handleHover)
    .onLeave(handleLeave)
    .children({ /* ... */ });

fn handleHover(_: *Vapor.Event) void {
    hovered = true;
}

fn handleLeave(_: *Vapor.Event) void {
    hovered = false;
}

// Context events
Box()
    .onEventCtx(.pointerenter, handleHoverItem, item)
    .children({ /* ... */ });

fn handleHoverItem(item: *Item, _: *Vapor.Event) void {
    current_item = item;
}

// Focus/Blur
TextField(.string)
    .onEventCtx(.focus, handleFocus, id)
    .onEventCtx(.blur, handleBlur, id)
    .end();
```

### Global Events

```zig
fn mount() void {
    Vapor.eventListener(.keydown, handleKeyPress);
}

fn handleKeyPress(evt: *Vapor.Event) void {
    const key = evt.key();

    if (std.mem.eql(u8, key, "Escape")) {
        evt.preventDefault();
        close();
    }

    if (std.mem.eql(u8, key, "k") and evt.metaKey()) {
        evt.preventDefault();
        openSearch();
    }
}
```

### Event Methods

| Method                 | Description               |
| ---------------------- | ------------------------- |
| `evt.key()`            | Get pressed key name      |
| `evt.text()`           | Get input text value      |
| `evt.number()`         | Get numeric input value   |
| `evt.metaKey()`        | Check if meta/cmd pressed |
| `evt.shiftKey()`       | Check if shift pressed    |
| `evt.ctrlKey()`        | Check if ctrl pressed     |
| `evt.preventDefault()` | Prevent default action    |

---

{#lifecycle-hooks}

## Lifecycle Hooks

### Component Hooks

```zig
fn mount() void {
    // Called after component is mounted
    std.log.debug("Mounted", .{});
}

fn destroy() void {
    // Called when component is removed
    std.log.debug("Destroyed", .{});
}

fn render() void {
    Vapor.Static.HooksCtx(.mounted, mount, .{})({
        Vapor.Static.HooksCtx(.destroy, destroy, .{})({
            // Component content
            Text("Hello").end();
        });
    });
}
```

### Tree Hooks

```zig
// Called after entire tree is rendered
Vapor.onEnd(callback);

// Called after virtual DOM is generated
Vapor.onCommit(callback);

// Manual update cycle
Vapor.cycle();
```

---

{#memory-arenas}

## Memory Arenas

```zig
// Frame arena - freed each render cycle
const frame_alloc = Vapor.arena(.frame);
const temp_string = Vapor.fmtln("Count: {d}", .{counter});

// View arena - freed on route change
const view_alloc = Vapor.arena(.view);
var page_items = view_alloc.alloc(Item, 100) catch unreachable;

// Persist arena - lives entire session
const persist_alloc = Vapor.arena(.persist);
var app_state = persist_alloc.create(AppState) catch unreachable;

// Scratch arena - manually managed
const scratch_alloc = Vapor.arena(.scratch);
// Free when done: scratch_alloc.free(ptr);

// Dynamic arrays
var items = Vapor.array(Item, .persist);
items.append(item) catch unreachable;
items.clearRetainingCapacity();
```

{#dynamic-arrays}

## Dynamic Arrays

Vapor provides a convenient wrapper around Zig's `std.array_list.Managed` that automatically uses the correct arena allocator.

### Creating Arrays
```zig
const Vapor = @import("vapor");

// Create a dynamic array with a specific arena lifetime
var todos = Vapor.array(TodoItem, .persist);    // Lives entire session
var search_results = Vapor.array(Result, .view); // Lives until route change
var temp_items = Vapor.array(Item, .frame);      // Lives only this render

// The type annotation (optional but helpful)
var todos: Vapor.Array(TodoItem) = Vapor.array(TodoItem, .persist);
```

### Array Methods

`Vapor.Array(T)` is an alias for `std.array_list.Managed(T)`, so you get all standard ArrayList methods:
```zig
var items = Vapor.array(Item, .persist);

// Adding items
items.append(item) catch return;                    // Add single item
items.appendSlice(&.{ item1, item2 }) catch return; // Add multiple items

// Accessing items
const first = items.items[0];           // Direct index access
const all = items.items;                // Get underlying slice
const count = items.items.len;          // Get count

// Removing items
_ = items.orderedRemove(index);         // Remove at index, preserve order
_ = items.swapRemove(index);            // Remove at index, swap with last (faster)
items.clearRetainingCapacity();         // Remove all, keep memory allocated
items.clearAndFree();                   // Remove all, free memory

// Iteration
for (items.items) |item| {
    // Use item
}

for (items.items, 0..) |item, i| {
    // Use item and index
}
```

### Choosing the Right Arena

| Arena | Array Lifetime | Use Case |
|-------|----------------|----------|
| `.persist` | Entire session | User data, app state, settings |
| `.view` | Until route change | Page-specific lists, search results |
| `.frame` | Single render | Temporary filtering, sorting for display |
| `.scratch` | Manual control | Advanced use cases |

### Complete Example: Todo List with Dynamic Array
```zig
const std = @import("std");
const Vapor = @import("vapor");
const Box = Vapor.Box;
const Text = Vapor.Text;
const Button = Vapor.Button;
const ButtonCtx = Vapor.ButtonCtx;
const TextField = Vapor.TextField;

const TodoItem = struct {
    text: []const u8,
    completed: bool = false,
};

// Dynamic array that persists across navigations
var todos: Vapor.Array(TodoItem) = undefined;
var input_text: []const u8 = "";

pub fn init() void {
    // Initialize with persist arena - todos survive page navigation
    todos = Vapor.array(TodoItem, .persist);
    Vapor.Page(.{ .src = @src() }, render, null);
}

fn addTodo() void {
    if (input_text.len == 0) return;
    
    // Copy text to same arena as the array
    const text_copy = Vapor.arena(.persist).dupe(u8, input_text) catch return;
    
    todos.append(.{
        .text = text_copy,
        .completed = false,
    }) catch return;
    
    input_text = "";
}

fn deleteTodo(index: usize) void {
    if (index >= todos.items.len) return;
    _ = todos.orderedRemove(index);
}

fn toggleTodo(index: usize) void {
    if (index >= todos.items.len) return;
    todos.items[index].completed = !todos.items[index].completed;
}

fn render() void {
    Box().direction(.column).spacing(16).padding(.all(20)).children({
        // Input
        TextField(.string)
            .bind(&input_text)
            .placeholder("New todo...")
            .end();
        
        Button(addTodo).children({
            Text("Add").end();
        });
        
        // List - iterate with index for delete/toggle operations
        for (todos.items, 0..) |todo, i| {
            Box().layout(.x_between_center).children({
                Text(todo.text)
                    .textDecoration(if (todo.completed) .line_through else .none)
                    .end();
                
                ButtonCtx(toggleTodo, .{i}).children({
                    Text(if (todo.completed) "Undo" else "Done").end();
                });
                
                ButtonCtx(deleteTodo, .{i}).children({
                    Text("Delete").end();
                });
            });
        }
        
        // Count display
        Text(Vapor.fmtln("{d} items", .{todos.items.len})).end();
    });
}
```

### Why Use Vapor.array() Instead of std.ArrayList Directly?

1. **Automatic allocator selection** - No need to manually get the allocator
2. **Consistent lifetime semantics** - Arena type clearly indicates data lifetime
3. **Less boilerplate** - One line instead of three
```zig
// Without Vapor.array()
const allocator = Vapor.arena(.persist);
var todos = std.array_list.Managed(TodoItem).init(allocator);

// With Vapor.array()
var todos = Vapor.array(TodoItem, .persist);
```

### Common Patterns

**Filtering for display (use .frame):**
```zig
fn render() void {
    // Create temporary filtered list just for this render
    var active_todos = Vapor.array(TodoItem, .frame);
    
    for (todos.items) |todo| {
        if (!todo.completed) {
            active_todos.append(todo) catch continue;
        }
    }
    
    // Render only active todos
    for (active_todos.items) |todo| {
        Text(todo.text).end();
    }
    // active_todos is automatically freed after render
}
```

**Page-specific data (use .view):**
```zig
var search_results: Vapor.Array(SearchResult) = undefined;

pub fn init() void {
    // Results cleared when user navigates away
    search_results = Vapor.array(SearchResult, .view);
    Vapor.Page(.{ .src = @src() }, render, null);
}

fn performSearch(query: []const u8) void {
    search_results.clearRetainingCapacity();
    // ... populate with new results
}
```

**Persistent app state (use .persist):**
```zig
var user_favorites: Vapor.Array(FavoriteItem) = undefined;
var cart_items: Vapor.Array(CartItem) = undefined;

pub fn init() void {
    // These survive the entire session
    user_favorites = Vapor.array(FavoriteItem, .persist);
    cart_items = Vapor.array(CartItem, .persist);
}
```

### ⚠️ Important: Match Array and Item Arenas

When storing strings or allocated data in an array, use the **same arena** for both:
```zig
// ✅ Correct - both use .persist
var todos = Vapor.array(TodoItem, .persist);
const text = Vapor.arena(.persist).dupe(u8, input) catch return;
todos.append(.{ .text = text }) catch return;

// ❌ Wrong - mismatched lifetimes
var todos = Vapor.array(TodoItem, .persist);  // Lives forever
const text = Vapor.arena(.frame).dupe(u8, input) catch return;  // Freed after render!
todos.append(.{ .text = text }) catch return;  // Dangling pointer!
```


### Practical Example: When to Use Each Arena
```zig
const std = @import("std");
const Vapor = @import("vapor");

// ============================================
// PERSIST ARENA - Lives entire session
// ============================================
// Use for: User data, app state, anything that survives navigation

var user_todos: [100][]const u8 = undefined;
var todo_count: usize = 0;

fn addTodo(input: []const u8) void {
    // Copy string to persistent memory
    const copied = Vapor.arena(.persist).dupe(u8, input) catch return;
    user_todos[todo_count] = copied;
    todo_count += 1;
}

// ============================================
// VIEW ARENA - Lives until route change  
// ============================================
// Use for: Page-specific state, form data, temporary lists

var page_search_results: []SearchResult = &.{};

fn loadPageData() void {
    const view_alloc = Vapor.arena(.view);
    page_search_results = view_alloc.alloc(SearchResult, 50) catch return;
    // This memory is freed when user navigates away
}

// ============================================
// FRAME ARENA - Lives only during this render
// ============================================
// Use for: Formatted strings, temporary display values

fn render() void {
    // fmtln uses frame arena internally - perfect for display
    Text(Vapor.fmtln("You have {d} todos", .{todo_count})).end();
    
    // This string only needs to exist during render
    const status = Vapor.fmtln("Page {d} of {d}", .{current_page, total_pages});
    Text(status).end();
}
```

### Arena Decision Flowchart
```
Is this data needed after render completes?
├── No → Use .frame (or Vapor.fmtln)
└── Yes → Is this data needed after leaving the page?
    ├── No → Use .view
    └── Yes → Use .persist
```

---

{#routing}

## Routing

### Route Registration

```zig
export fn init() void {
    Vapor.init(.{});

    // Static routes
    Vapor.Page(.{ .route = "/" }, Home, null);
    Vapor.Page(.{ .route = "/about" }, About, aboutDeinit);

    // Dynamic routes
    Vapor.Page(.{ .route = "/user/:id" }, UserPage, null);

    // File-based routing
    Vapor.Page(.{ .src = @src() }, render, deinit);
}
```

### Navigation

```zig
fn navigate(url: []const u8) void {
    Vapor.Kit.navigate(url);
}

// Usage
Button(goHome).children({ Text("Home").end(); });

fn goHome() void {
    Vapor.Kit.navigate("/");
}
```

### Layouts

```zig
fn registerLayouts() !void {
    try Vapor.registerLayout("/app", appLayout, .{});
    try Vapor.registerLayout("/docs", docsLayout, .{ .reset = true });
}

fn appLayout(page: Vapor.PageFn) void {
    Navbar.render();
    page();
    Footer.render();
}
```

---

{#animations}

## Animations

### Define Animation

```zig
const Animation = Vapor.Animation;

const fadeIn = Animation.init("fadeIn")
    .prop(.opacity, 0, 1)
    .duration(300)
    .easing(.easeOut)
    .fill(.forwards);

const slideIn = Animation.init("slideIn")
    .prop(.translateY, -20, 0)
    .prop(.opacity, 0, 1)
    .duration(200)
    .easing(.easeOutBack);

const spin = Animation.init("spin")
    .prop(.rotate, 0, 360)
    .duration(1000)
    .easing(.linear)
    .infinite();

// Build in init
fn init() void {
    fadeIn.build();
    slideIn.build();
    spin.build();
}
```

### Apply Animation

```zig
Box()
    .animationEnter("fadeIn")
    .animationExit("slideOut")
    .children({ /* ... */ });

// Hover animation
Button(action)
    .hover(.{ .animation = "pulse" })
    .children({ /* ... */ });

// Conditional
Text("Loading")
    .animation(if (loading) "spin" else null)
    .end();
```

### Animation Properties

| Property                       | Description  |
| ------------------------------ | ------------ |
| `.translateX`, `.translateY`   | Position     |
| `.scale`, `.scaleX`, `.scaleY` | Scaling      |
| `.rotate`                      | Rotation     |
| `.opacity`                     | Transparency |
| `.blur`                        | Blur filter  |
| `.backgroundColor`             | Color        |

### Easing Functions

| Function         | Description        |
| ---------------- | ------------------ |
| `.linear`        | Constant speed     |
| `.ease`          | Default            |
| `.easeIn`        | Start slow         |
| `.easeOut`       | End slow           |
| `.easeInOut`     | Slow start and end |
| `.easeOutBack`   | Overshoot          |
| `.easeOutBounce` | Bounce             |

---

{#binded-elements}

## Binded Elements

```zig
var binded_box: Vapor.Binded = .{};
var search_box: Vapor.Binded = .{};

fn mount() void {
    search_box.focus();
}

fn render() void {
    Box()
        .ref(&binded_box)
        .children({ /* ... */ });

    TextField(.string)
        .ref(&search_box)
        .val(&search_box.text)
        .end();
}

// Get bounds
fn getPosition() void {
    if (binded_box.getBoundingClientRect()) |bounds| {
        const x = bounds.left;
        const y = bounds.top;
        const w = bounds.width;
        const h = bounds.height;
    }
}

// Scroll
binded_box.scrollToTop(100);
binded_box.scrollIntoView(.{ .block = .nearest });
```

---

{#conditionals-and-loops}

## Conditionals & Loops

### Conditionals

```zig
fn render() void {
    if (show_modal) {
        Modal.render();
    }

    // Ternary in styles
    Text("Status")
        .font(16, 400, if (active) .palette(.tint) else .palette(.text_color))
        .end();

    // Conditional rendering
    Box()
        .background(if (hovered) .palette(.tint) else .transparent)
        .children({
            if (loading) {
                Spinner.render();
            } else {
                Text("Content").end();
            }
        });
}
```

### Loops

```zig
fn render() void {
    Stack().children({
        for (items) |item| {
            Text(item.name).end();
        }
    });

    // With index
    List().children({
        for (items, 0..) |item, i| {
            ListItem().children({
                TextFmt("{d}. {s}", .{i + 1, item.name}).end();
            });
        }
    });

    // Range
    Box().children({
        for (0..5) |i| {
            Text(i).end();
        }
    });
}
```

---

{#utility-functions}

## Utility Functions

### Formatting

```zig
// Frame-scoped formatted string
const text = Vapor.fmtln("Count: {d}", .{counter});

// Print to console
std.log.debug("Debug: {s}", .{message});
std.log.err("Error: {any}", .{err});
```

### DOM Utilities

```zig
// Alert
Vapor.alert("Say {s}", .{"Hi"});

// Scroll into view
Vapor.scrollIntoView(element_id, .{ .block = .nearest });

// Get bounds
if (Vapor.getBoundingClientRect(element_id)) |bounds| {
    // Use bounds
}

// Query components
const heading_ids = Vapor.queryComponentIds(.Heading) catch &.{};
```

### File Operations

```zig
const File = Vapor.FileReader;

// Download file
File.downloadFile("data.json", json_content, .@"application/json");
```

---

{#quick-syntax-reference}

## Quick Syntax Reference

| Pattern                                              | Description                      |
| ---------------------------------------------------- | -------------------------------- |
| `Component().children({ ... });`                     | Container with children          |
| `Component().end();`                                 | Leaf element (no children)       |
| `Component().style(&style)({ ... });`                | Apply style struct with children |
| `.children({ ... })`                                 | Block for child elements         |
| `ButtonCtx(fn, .{args})`                             | Button with context arguments    |
| `.onEventCtx(.event, fn, ctx)`                       | Event handler with context       |
| `Vapor.Static.HooksCtx(.mounted, fn, .{})({ ... });` | Lifecycle hook                   |
| `for (items) \|item\| { ... }`                       | Loop over items                  |
| `if (cond) { ... }`                                  | Conditional render               |

---

{#common-patterns}

## Common Patterns

### Modal/Overlay

```zig
if (show_modal) {
    // Backdrop
    Box()
        .pos(.full(.fixed))
        .zIndex(999)
        .background(.transparentize(.black, 0.5))
        .children({
            Button(closeModal).size(.full).end();
        });

    // Modal content
    Center()
        .pos(.full(.fixed))
        .zIndex(1000)
        .children({
            Box()
                .width(.px(400))
                .padding(.all(24))
                .background(.palette(.background))
                .border(.round(.palette(.border_color), .all(12)))
                .children({
                    Text("Modal Content").end();
                });
        });
}
```

### Dropdown/Select

```zig
var show_dropdown: bool = false;

fn toggleDropdown() void {
    show_dropdown = !show_dropdown;
}

fn render() void {
    Box().pos(.relative).children({
        Button(toggleDropdown).children({
            Text("Select Option").end();
        });

        if (show_dropdown) {
            Stack()
                .pos(.tl(.px(0), .percent(100), .absolute))
                .zIndex(100)
                .background(.palette(.background))
                .border(.round(.palette(.border_color), .all(8)))
                .shadow(.card(.transparentize(.black, 0.1)))
                .children({
                    for (options) |option| {
                        ButtonCtx(selectOption, .{option}).children({
                            Text(option.label).end();
                        });
                    }
                });
        }
    });
}
```

### Form with Validation

```zig
var email: []const u8 = "";
var error_message: ?[]const u8 = null;

fn validateEmail() bool {
    if (email.len == 0) {
        error_message = "Email is required";
        return false;
    }
    if (std.mem.indexOf(u8, email, "@") == null) {
        error_message = "Invalid email format";
        return false;
    }
    error_message = null;
    return true;
}

fn submit() void {
    if (validateEmail()) {
        // Submit form
    }
}

fn render() void {
    Stack().spacing(8).children({
        Label("Email").end();
        TextField(.email)
            .bind(&email)
            .border(.round(
                if (error_message != null) .hex("#FF0000") else .palette(.border_color),
                .all(8)
            ))
            .end();
        if (error_message) |err| {
            Text(err).font(12, 400, .hex("#FF0000")).end();
        }
        Button(submit).children({
            Text("Submit").end();
        });
    });
}
```
