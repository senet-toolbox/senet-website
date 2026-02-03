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
    const persisted = Vapor.arena(.persist).dupe(u8, input_text) catch return;
    saved_items[item_count] = persisted;
    item_count += 1;
    input_text = ""; // Clear the input
}

fn render() void {
    TextField(.string)
        .bind(&input_text)
        .placeholder("Enter item...")
        .end();

    Button(saveItem).children({
        Text("Add").end();
    });

    // Display saved items
    for (saved_items[0..item_count]) |item| {
        Text(item).end();
    }
}
```

### Arena Quick Reference for Forms

| Arena      | Use When                           | Example                              |
| ---------- | ---------------------------------- | ------------------------------------ |
| `.persist` | Data that lives for entire session | User's todo items, saved preferences |
| `.view`    | Data that lives until route change | Current page's form state            |
| `.frame`   | Temporary formatting within render | `Vapor.fmtln("Count: {d}", .{n})`    |

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
        .onEvent(.keydown, handleKeyDown)
        .placeholder("Press Enter to submit")
        .end();
}
```

### With Context Data

```zig
fn handleKeyDownCtx(form_id: u32, evt: *Vapor.Event) void {
    if (std.mem.eql(u8, evt.key(), "Enter")) {
        evt.preventDefault();
        submitFormById(form_id);
    }
}

fn render() void {
    TextField(.string)
        .bind(&input_text)
        .onEventCtx(.keydown, handleKeyDownCtx, 1)
        .end();
}
```

### Using Dynamic Arrays

```zig
var items: []Item = undefined;
var dynamic_list: Vapor.Array(Item) = undefined;

fn init() void {
    // We want to use the persist arena for items
    // We use the persist arena when we want to store data that lives for the entire session
    items = Vapor.arena(.persist).alloc(Item, 100) catch return;
    dynamic_list = Vapor.array(Item, .persist);

    // We only use the numbers inside the init function so we can use frame arena
    var numbers = std.array_list.Managed(i32).init(Vapor.arena(.frame));
    for (0..4) |i| {
        try numbers.append(i);
    }

    for (4..20) |i| {
        try numbers.append(i);
    }
    numbers.append(100) catch {};
    numbers.append(200) catch {};

    for (numbers.items) |item| {
        std.debug.print("{d}\n", .{item});
    }

}

fn addItem() void {
    if (input_text.len == 0) return;
    if (item_count >= items.len) return;

    // Copy text to persistent memory
    const text_copy = Vapor.arena(.persist).dupe(u8, input_text) catch return;

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
    const text_copy = Vapor.arena(.persist).dupe(u8, input_text) catch return;

    dynamic_list.append(.{
        .text = text_copy,
        .completed = false,
    }) catch return;
    input_text = "";
}
```

{#todo-list-example}

## Complete Example: Todo List

Here's a full todo list implementation demonstrating form handling, state management, and list operations:

```zig
const std = @import("std");
const Vapor = @import("vapor");
const Box = Vapor.Box;
const Text = Vapor.Text;
const Button = Vapor.Button;
const TextField = Vapor.TextField;
const ButtonCtx = Vapor.ButtonCtx;
const Stack = Vapor.Stack;
const Center = Vapor.Center;

// ============================================
// DATA STRUCTURES
// ============================================
const TodoItem = struct {
    id: u32,
    text: []const u8,
    completed: bool,
};

// ============================================
// STATE
// ============================================
var todos: [100]?TodoItem = .{null} ** 100;
var todo_count: usize = 0;
var next_id: u32 = 0;
var input_text: []const u8 = "";

// ============================================
// STYLES
// ============================================
const container_style = Vapor.Style{
    .size = .{ .width = .px(400) },
    .padding = .all(24),
    .visual = .{
        .background = .white,
        .border = .round(.hex("#e2e8f0"), .all(12)),
        .shadow = .card(.hex("#00000011")),
    },
};

const input_container_style = Vapor.Style{
    .layout = .left_center,
    .child_gap = 8,
    .margin = .b(16),
};

const todo_item_style = Vapor.Style{
    .layout = .x_between_center,
    .padding = .tblr(12, 12, 16, 16),
    .margin = .b(8),
    .visual = .{
        .background = .hex("#f7fafc"),
        .border = .round(.hex("#e2e8f0"), .all(8)),
    },
};

const checkbox_base = Vapor.Style{
    .size = .square_px(24),
    .layout = .center,
    .visual = .{
        .border = .round(.hex("#cbd5e0"), .all(4)),
    },
    .margin = .r(12),
    .interactive = .hover_scale(),
};

const delete_btn_style = Vapor.Style{
    .padding = .tblr(6, 6, 12, 12),
    .visual = .{
        .background = .transparent,
        .text_color = .hex("#e53e3e"),
        .font_size = 14,
    },
    .interactive = .hover_scale(),
};

const add_btn_style = Vapor.Style{
    .padding = .tblr(10, 10, 16, 16),
    .visual = .{
        .background = .hex("#4299e1"),
        .text_color = .white,
        .font_weight = 600,
        .border = .round(.transparent, .all(8)),
    },
    .interactive = .hover_scale(),
};

// ============================================
// INITIALIZATION
// ============================================
pub fn init() void {
    Vapor.Page(.{ .src = @src() }, render, null);
}

// ============================================
// ACTIONS
// ============================================
fn addTodo() void {
    if (input_text.len == 0) return;
    if (todo_count >= todos.len) return;

    // Copy text to persistent memory
    const text_copy = Vapor.arena(.persist).dupe(u8, input_text) catch return;

    todos[todo_count] = TodoItem{
        .id = next_id,
        .text = text_copy,
        .completed = false,
    };
    todo_count += 1;
    next_id += 1;
    input_text = "";
}

fn toggleTodo(index: usize) void {
    if (todos[index]) |*todo| {
        todo.completed = !todo.completed;
    }
}

fn deleteTodo(index: usize) void {
    if (index >= todo_count) return;

    // Shift remaining todos down
    var i = index;
    while (i < todo_count - 1) : (i += 1) {
        todos[i] = todos[i + 1];
    }
    todos[todo_count - 1] = null;
    todo_count -= 1;
}

fn handleKeyDown(evt: *Vapor.Event) void {
    if (std.mem.eql(u8, evt.key(), "Enter")) {
        evt.preventDefault();
        addTodo();
    }
}

// ============================================
// RENDER
// ============================================
fn render() void {
    Center().height(.percent(100)).background(.hex("#edf2f7")).children({
        Box().style(&container_style)({
            // Header
            Text("My Todos")
                .font(28, 700, .hex("#2d3748"))
                .margin(.b(20))
                .end();

            // Input row
            Box().style(&input_container_style)({
                TextField(.string)
                    .bind(&input_text)
                    .placeholder("What needs to be done?")
                    .width(.grow)
                    .padding(.all(12))
                    .border(.round(.hex("#e2e8f0"), .all(8)))
                    .onEvent(.keydown, handleKeyDown)
                    .end();

                Button(addTodo).style(&add_btn_style)({
                    Text("Add").end();
                });
            });

            // Todo list
            Stack().spacing(0).children({
                if (todo_count == 0) {
                    Text("No todos yet. Add one above!")
                        .font(14, 400, .hex("#a0aec0"))
                        .padding(.all(20))
                        .end();
                } else {
                    for (0..todo_count) |i| {
                        if (todos[i]) |todo| {
                            renderTodoItem(todo, i);
                        }
                    }
                }
            });

            // Footer
            if (todo_count > 0) {
                Text(Vapor.fmtln("{d} item{s}", .{
                    todo_count,
                    if (todo_count == 1) "" else "s",
                }))
                    .font(12, 400, .hex("#a0aec0"))
                    .margin(.t(16))
                    .end();
            }
        });
    });
}

fn renderTodoItem(todo: TodoItem, index: usize) void {
    Box().style(&todo_item_style)({
        // Left side: checkbox + text
        Box().layout(.left_center).children({
            // Checkbox
            ButtonCtx(toggleTodo, .{index})
                .baseStyle(&checkbox_base)
                .background(if (todo.completed) .hex("#48bb78") else .white)
                .children({
                    if (todo.completed) {
                        Text("✓").font(14, 700, .white).end();
                    }
                });

            // Todo text
            Text(todo.text)
                .font(16, if (todo.completed) 400 else 500,
                    if (todo.completed) .hex("#a0aec0") else .hex("#2d3748"))
                .textDecoration(if (todo.completed) .line_through else .none)
                .end();
        });

        // Delete button
        ButtonCtx(deleteTodo, .{index}).style(&delete_btn_style)({
            Text("Delete").end();
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
