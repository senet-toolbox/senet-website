{#common-patterns}

# Common Patterns

#### Practical patterns you'll use in real applications.

{#form-handling}

## Form Handling & User Input

When capturing user input from `TextField`, the text slice points to an internal buffer that gets reused.
If you need to store the input (like adding items to a list), you must copy it to persistent memory.

### The Problem

```zig
var input_text: []const u8 = "";
var saved_items: [100][]const u8 = undefined;
var item_count: usize = 0;

fn saveItem() void {
    // ❌ WRONG - input_text points to TextField's buffer
    // It will be overwritten when user types again!
    saved_items[item_count] = input_text;
    item_count += 1;
}
```

### The Solution

```zig
var input_text: []const u8 = "";
var saved_items: [100][]const u8 = undefined;
var item_count: usize = 0;

fn saveItem() void {
    if (input_text.len == 0) return;

    // ✅ CORRECT - copy to persistent arena
    const persisted = Vapor.persist.dupe(input_text);
    saved_items[item_count] = persisted;
    item_count += 1;
    input_text = ""; // Clear the input
}

fn render() void {
    TextField(.string)
        .bind(&input_text)
        .placeholder("Enter item...")
        .end();

    Button(saveItem, .{}).children({
        Text("Add").end();
    });

    // Display saved items
    for (saved_items[0..item_count]) |item| {
        Text(item).end();
    }
}
```

### Arena Quick Reference for Forms

| Arena      | Use When                           | Example                               |
| ---------- | ---------------------------------- | ------------------------------------- |
| `.persist` | Data that lives for entire session | User's todo items, saved preferences  |
| `.view`    | Data that lives until route change | Current page's form state             |
| `.frame`   | Temporary formatting within render | `Vapor.frame.fmt("Count: {d}", .{n})` |

{#keyboard-events-in-forms}

## Keyboard Events in Forms

Handle enter key to submit forms without a button:

```zig
var input_text: []const u8 = "";

fn handleKeyDown(evt: *Vapor.Event) void {
    const key = evt.key();
    if (std.mem.eql(u8, key, "Enter")) {
        evt.preventDefault();
        submitForm();
    }
}

fn submitForm() void {
    if (input_text.len == 0) return;
    // Process the input...
    input_text = "";
}

fn render() void {
    TextField(.string)
        .bind(&input_text)
        .onEvent(.keydown, handleKeyDown, .{})
        .placeholder("Press Enter to submit")
        .end();
}
```

### With Context Data

```zig
fn handleKeyDownArgs(form_id: u32, evt: *Vapor.Event) void {
    if (std.mem.eql(u8, evt.key(), "Enter")) {
        evt.preventDefault();
        submitFormById(form_id);
    }
}

fn render() void {
    TextField(.string)
        .bind(&input_text)
        .onEvent(.keydown, handleKeyDownArgs, .{1})
        .end();
}
```

### Using Dynamic Arrays

```zig
var items: []Item = undefined;
var dynamic_list = Vapor.persist.Array(Item);

fn init() void {
    // We want to use the persist arena for items
    // We use the persist arena when we want to store data that lives for the entire session
    items = Vapor.persist.alloc(Item, 100);

    // We only use the numbers inside the init function so we can use frame arena
    var numbers = Vapor.frame.Array(i32);
    for (0..4) |i| {
        numbers.append(i);
    }

    for (4..20) |i| {
        numbers.append(i);
    }
    numbers.append(100);
    numbers.append(200);

    for (numbers.items) |item| {
        std.debug.print("{d}\n", .{item});
    }

}

fn addItem() void {
    if (input_text.len == 0) return;
    // Here we check the length of the array, since our items length is 100 max
    if (item_count >= items.len) return;

    // Copy text to persistent memory
    const text_copy = Vapor.persist.dupe(input_text);

    items[item_count] = .{
        .text = text_copy,
        .completed = false,
    };
    item_count += 1;
    input_text = "";
}

fn addDynamicItem() void {
    if (input_text.len == 0) return;

    // Copy text to persistent memory
    const text_copy = Vapor.persist.dupe(input_text);

    dynamic_list.append(.{
        .text = text_copy,
        .completed = false,
    });
    input_text = "";
}
```

{#todo-list-example}

## Complete Example: Todo List

Here's a full todo list implementation demonstrating form handling, state management, and list operations:

```zig
const std = @import("std");
const Vapor = @import("vapor");
const Row = Vapor.Row;
const Stack = Vapor.Stack;
const Text = Vapor.Text;
const TextField = Vapor.TextField;
const Button = Vapor.Button;
const Spacer = Vapor.Spacer;
const TextFmt = Vapor.TextFmt;

// ─────────────────────────────────────────────
// Theme
// ─────────────────────────────────────────────
const C = struct {
    const bg       = Vapor.Types.Color.hex("#0f0f11");
    const surface  = Vapor.Types.Color.hex("#1a1a1f");
    const card     = Vapor.Types.Color.hex("#222228");
    const border   = Vapor.Types.Color.hex("#2e2e38");
    const accent   = Vapor.Types.Color.hex("#7c6af7");
    const accent2  = Vapor.Types.Color.hex("#a78bfa");
    const done_clr = Vapor.Types.Color.hex("#34d399");
    const danger   = Vapor.Types.Color.hex("#f87171");
    const text     = Vapor.Types.Color.hex("#e8e8f0");
    const muted    = Vapor.Types.Color.hex("#6b6b85");
    const white_t  = Vapor.Types.Color.hex("#ffffff");
};

// ─────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────
const Filter = enum { all, active, done };

const Todo = struct {
    id:        u32,
    text:      []const u8,
    completed: bool,
};

var todos    = Vapor.persist.array(Todo);
var next_id: u32        = 1;
var input:   []const u8 = "";
var filter:  Filter     = .all;

// ─────────────────────────────────────────────
// Animations
// ─────────────────────────────────────────────
const slideIn = Vapor.Animation.init("slideIn")
    .prop(.opacity, 0, 1)
    .prop(.translateY, 12, 0)
    .duration(260)
    .easing(.easeOut)
    .fill(.forwards);

const fadeUp = Vapor.Animation.init("fadeUp")
    .prop(.opacity, 0, 1)
    .prop(.translateY, 20, 0)
    .duration(400)
    .easing(.easeOutBack)
    .fill(.forwards);

// ─────────────────────────────────────────────
// Init
// ─────────────────────────────────────────────
pub export fn init() void {
    Vapor.init(.{});
    Vapor.Animation.new();
    slideIn.build();
    fadeUp.build();
    Vapor.Page(.{ .route = "/" }, render, null);
}

// ─────────────────────────────────────────────
// Handlers
// ─────────────────────────────────────────────
fn addTodo() void {
    if (input.len == 0) return;
    todos.append(.{
        .id        = next_id,
        .text      = Vapor.persist.dupe(input),
        .completed = false,
    });
    next_id += 1;
    input = "";
}

fn onKey(evt: *Vapor.Event) void {
    if (std.mem.eql(u8, evt.key(), "Enter")) {
        evt.preventDefault();
        addTodo();
    }
}

fn toggleTodo(id: u32) void {
    for (todos.items) |*t| {
        if (t.id == id) {
            t.completed = !t.completed;
            break;
        }
    }
}

fn deleteTodo(id: u32) void {
    for (todos.items, 0..) |t, i| {
        if (t.id == id) {
            _ = todos.orderedRemove(i);
            break;
        }
    }
}

fn clearDone() void {
    var i: usize = 0;
    while (i < todos.items.len) {
        if (todos.items[i].completed) {
            _ = todos.orderedRemove(i);
        } else {
            i += 1;
        }
    }
}

fn setFilter(f: Filter) void { filter = f; }

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
fn activeCount() usize {
    var n: usize = 0;
    for (todos.items) |t| { if (!t.completed) n += 1; }
    return n;
}

fn hasDone() bool {
    for (todos.items) |t| { if (t.completed) return true; }
    return false;
}

fn visible(t: Todo) bool {
    return switch (filter) {
        .all    => true,
        .active => !t.completed,
        .done   => t.completed,
    };
}

// ─────────────────────────────────────────────
// Sub-renders
// ─────────────────────────────────────────────
fn renderHeader() void {
    Stack().spacing(4).pb(32).animationEnter("fadeUp").children({
        Text("tasks").font(48, 800, C.accent).fontFamily("Georgia, serif").end();
        Text("stay on top of what matters").font(13, 400, C.muted).end();
    });
}

fn renderInput() void {
    Row()
        .width(.percent(100))
        .spacing(10)
        .padding(.all(4))
        .background(C.surface)
        .border(.round(C.border, .all(14)))
        .children({
            TextField(.string)
                .bind(&input)
                .placeholder("add a new task…")
                .width(.expand)
                .padding(.tblr(14, 14, 12, 16))
                .background(.transparent)
                .border(.none)
                .font(15, 400, C.text)
                .onEvent(.keydown, onKey, .{})
                .end();

            Button(addTodo, .{})
                .padding(.tblr(10, 10, 16, 16))
                .background(C.accent)
                .border(.round(.transparent, .all(10)))
                .pointer()
                .hoverScale()
                .duration(150)
                .children({
                    Text("+").font(22, 300, C.white_t).end();
                });
        });
}

fn renderFilterBar() void {
    Row().spacing(6).pt(24).pb(8).children({
        filterBtn("all",    Filter.all);
        filterBtn("active", Filter.active);
        filterBtn("done",   Filter.done);
        Spacer(8).end();
        if (hasDone()) {
            Button(clearDone, .{})
                .padding(.tblr(6, 6, 12, 12))
                .background(.transparent)
                .border(.round(C.danger, .all(8)))
                .pointer()
                .hoverBackground(C.danger)
                .hoverText(C.white_t)
                .duration(150)
                .children({
                    Text("clear done").font(12, 500, C.danger).end();
                });
        }
    });
}

fn filterBtn(label: []const u8, f: Filter) void {
    const active = filter == f;
    Button(setFilter, .{f})
        .padding(.tblr(6, 6, 14, 14))
        .background(if (active) C.accent else .transparent)
        .border(.round(if (active) C.accent else C.border, .all(8)))
        .pointer()
        .duration(150)
        .children({
            Text(label).font(12, if (active) @as(u16, 600) else @as(u16, 400), if (active) C.white_t else C.muted).end();
        });
}

fn renderTodoItem(t: Todo) void {
    Row()
        .width(.percent(100))
        .spacing(12)
        .padding(.tblr(14, 14, 16, 16))
        .background(C.card)
        .border(.round(C.border, .all(12)))
        .animationEnter("slideIn")
        .children({
            // Checkbox
            Button(toggleTodo, .{t.id})
                .hw(.px(24), .px(24))
                .layout(.center)
                .background(if (t.completed) C.done_clr else .transparent)
                .border(.round(if (t.completed) C.done_clr else C.muted, .all(6)))
                .pointer()
                .duration(150)
                .children({
                    if (t.completed) {
                        Text("✓").font(13, 700, C.white_t).end();
                    }
                });

            // Text
            Stack().width(.expand).spacing(0).children({
                Text(t.text)
                    .font(15, 400, if (t.completed) C.muted else C.text)
                    .textDecoration(if (t.completed) .line_through else .none)
                    .end();
            });

            // Delete
            Button(deleteTodo, .{t.id})
                .hw(.px(28), .px(28))
                .layout(.center)
                .background(.transparent)
                .border(.round(.transparent, .all(6)))
                .pointer()
                .hoverBackground(C.danger)
                .duration(150)
                .children({
                    Text("×").font(18, 300, C.muted).end();
                });
        });
}

fn renderList() void {
    Stack().width(.percent(100)).spacing(8).pt(8).children({
        for (todos.items) |t| {
            if (visible(t)) {
                renderTodoItem(t);
            }
        }
        if (todos.items.len == 0) {
            Stack().width(.percent(100)).padding(.all(40)).layout(.center).children({
                Text("nothing here yet").font(14, 400, C.muted).end();
            });
        }
    });
}

fn renderFooter() void {
    if (todos.items.len == 0) return;
    const left = activeCount();
    Row().width(.percent(100)).pt(16).children({
        TextFmt("{d} task{s} left", .{ left, if (left == 1) "" else "s" })
            .font(12, 400, C.muted)
            .end();
    });
}

// ─────────────────────────────────────────────
// Main render
// ─────────────────────────────────────────────
fn render() void {
    Stack()
        .size(.full)
        .background(C.bg)
        .layout(.top_left)
        .scroll(.scroll_y())
        .children({
            Stack()
                .width(.percent(100))
                .padding(.tblr(60, 80, 0, 0))
                .layout(.top_left)
                .children({
                    Stack()
                        .width(.px(520))
                        .spacing(0)
                        .children({
                            renderHeader();
                            renderInput();
                            renderFilterBar();
                            renderList();
                            renderFooter();
                        });
                });
        });
}
```

@todo_demo

### Key Takeaways

1. **Copy user input** with `Vapor.arena(.persist).dupe(u8, text)` before storing
2. **Use `ButtonCtx`** to pass index/id to handlers for list operations
3. **Handle keyboard events** with `.onEvent(.keydown, handler)` on TextField
4. **Conditional styling** with inline `if` expressions in builder chains
5. **Array shifting** for delete operations in fixed-size arrays
