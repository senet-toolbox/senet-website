{#gotchas}

# Gotchas & Common Mistakes

#### Avoid these pitfalls when building with Vapor.

{#string-slice-gotcha}

## String Slices Are References, Not Copies

**The Problem:** String slices (`[]const u8`) in Zig are just a pointer and length—they don't own the data.

```zig
var user_input: []const u8 = "";

fn saveInput() void {
    // ❌ This stores a reference to TextField's internal buffer
    // When the user types again, this reference points to new data!
    my_saved_data = user_input;
}
```

**The Fix:** Copy strings that need to outlive their source.

```zig
fn saveInput() void {
    // ✅ Copy to persistent memory
    my_saved_data = Vapor.arena(.persist).dupe(u8, user_input) catch return;
}
```

{#style-syntax-gotcha}

## Style Struct vs Builder Chain Syntax

**The Problem:** Mixing up `.children({})` and direct block `({})` syntax.

```zig
// ❌ WRONG - can't use .children() after .style()
Box().style(&my_style).children({
    Text("Hello").end();
});

// ❌ WRONG - forgetting to close leaf elements
Text("Hello");  // Missing .end()!

// ❌ WRONG - using ({}) without .style()
Box()({  // This won't compile
    Text("Hello").end();
});
```

**The Fix:** Follow these rules:

```zig
// ✅ With style struct: use direct block
Box().style(&my_style)({
    Text("Hello").end();
});

// ✅ With builder chain: use .children({})
Box().padding(.all(20)).children({
    Text("Hello").end();
});

// ✅ Leaf elements always use .end()
Text("Hello").end();
Icon(.search).end();
Image(.{ .src = "/img.png" }).end();
TextField(.string).bind(&text).end();
```

**Quick Reference:**

| Element Type                        | With Builder Chain | With Style Struct |
| ----------------------------------- | ------------------ | ----------------- |
| Container (Box, Stack, Center)      | `.children({})`    | `.style(&s)({})`  |
| Button                              | `.children({})`    | `.style(&s)({})`  |
| Leaf (Text, Icon, Image, TextField) | `.end()`           | `.end()`          |

{#event-handler-gotcha}

## Event Handler Signatures

**The Problem:** Wrong function signatures for event handlers.

```zig
// ❌ WRONG - Button handler shouldn't take Event
fn handleClick(evt: *Vapor.Event) void {
    // ...
}
Button(handleClick)  // Won't compile!

// ❌ WRONG - ButtonCtx handler has wrong parameter order
fn handleDelete(evt: *Vapor.Event, id: u32) void {
    // ...
}
ButtonCtx(handleDelete, .{42})  // Won't compile!
```

**The Fix:** Match the expected signatures:

```zig
// ✅ Button - no parameters
fn handleClick() void {
    // ...
}
Button(handleClick)

// ✅ ButtonCtx - context params only (no Event)
fn handleDelete(id: u32) void {
    // ...
}
ButtonCtx(handleDelete, .{42})

// ✅ onEvent - Event pointer
fn handleKeyDown(evt: *Vapor.Event) void {
    const key = evt.key();
    // ...
}
TextField(.string).onEvent(.keydown, handleKeyDown)

// ✅ onEventCtx - context first, then Event
fn handleHover(item_id: u32, evt: *Vapor.Event) void {
    // ...
}
Box().onEventCtx(.pointerenter, handleHover, item_id)
```

**Handler Signature Reference:**

| Pattern                        | Signature                    |
| ------------------------------ | ---------------------------- |
| `Button(fn)`                   | `fn() void`                  |
| `ButtonCtx(fn, .{a, b})`       | `fn(A, B) void`              |
| `.onEvent(.event, fn)`         | `fn(*Vapor.Event) void`      |
| `.onEventCtx(.event, fn, ctx)` | `fn(Ctx, *Vapor.Event) void` |

{#state-in-render-gotcha}

## State Inside Render Functions

**The Problem:** Declaring state inside `render()` resets it every frame.

```zig
fn render() void {
    var count: u32 = 0;  // ❌ Always 0!

    Button(increment).children({
        Text(count).end();
    });
}

fn increment() void {
    count += 1;  // ❌ Won't compile - count not in scope
}
```

**The Fix:** State lives outside render functions.

```zig
var count: u32 = 0;  // ✅ Persists between renders

fn render() void {
    Button(increment).children({
        Text(count).end();
    });
}

fn increment() void {
    count += 1;  // ✅ Works!
}
```

{#color-type-gotcha}

## Color vs Background Types

**The Problem:** Using the wrong color type for styling.

```zig
// ❌ WRONG - background expects Background type
.font(16, 400, .hex("#ffffff"))  // This is Color, correct for font
.background(.hex("#ffffff"))     // ⚠️ Works but semantically it's Background

// Explicit types help catch errors:
const my_color: Vapor.Types.Color = .hex("#ffffff");
const my_bg: Vapor.Types.Background = .hex("#ffffff");
```

**The Fix:** Be aware of context:

```zig
// ✅ Font color uses Color
Text("Hello").font(16, 400, .hex("#333333")).end();

// ✅ Background uses Background (same syntax, different type)
Box().background(.hex("#ffffff")).children({});

// ✅ In Style structs, fields have correct types
const style = Vapor.Style{
    .visual = .{
        .text_color = .hex("#333333"),     // Color
        .background = .hex("#ffffff"),      // Background
    },
};
```

{#loop-index-gotcha}

## Loop Index vs Value

**The Problem:** Confusing loop syntax when you need both index and value.

```zig
// ❌ WRONG - this only gives you the value
for (items) |item| {
    ButtonCtx(deleteItem, .{item})  // Can't identify which item!
}

// ❌ WRONG - range doesn't give you the item
for (0..items.len) |i| {
    Text(i).end();  // Just prints index, not item data
}
```

**The Fix:** Use the full loop syntax when needed.

```zig
// ✅ When you need just the value
for (items) |item| {
    Text(item.name).end();
}

// ✅ When you need just the index
for (0..10) |i| {
    Text(i).end();
}

// ✅ When you need both value AND index
for (items, 0..) |item, i| {
    Box().children({
        Text(item.name).end();
        ButtonCtx(deleteItem, .{i}).children({
            Text("Delete").end();
        });
    });
}
```
