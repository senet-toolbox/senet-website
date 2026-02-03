{#vaporize}

# Vaporize

#### Turn structs into forms. Turn markdown into UI. No templates, no JSX, just Zig.

Vaporize compiles markup and data structures into the same component tree as hand-written Zig code. The result is identical to what you'd write manually - same function calls, same memory model, same performance.

Two main use cases:

- **Forms from structs** - Define a struct, get a fully validated form with zero boilerplate
- **UI from Markdown** - Write content in markdown, embed interactive Vapor components

{#generating-forms}

## Generating Forms

This is where Vaporize shines. Define a struct, and Vaporize generates a complete form with inputs, validation, error handling, and submission.

```zig
const Form = struct {
    email: []const u8 = "",
    password: []const u8 = "",
};

var vaporizer: Vaporize.Compiler = undefined;
var form: vaporizer.Form(Form) = .{};

pub fn init() void {
    // Initialize the vaporize compiler
    vaporize = Vaporize.init(Vapor.arena(.persist), .{}) catch |err| {
        std.log.err("Failed to initialize vaporizer: {any}", .{err});
        return;
    };

    // Compile the form
    form.compile() catch |err| {
        std.log.err("Failed to compile form: {any}", .{err});
        return;
    };
}

fn render() void {
    form.render() catch |err| {
        TextFmt("Failed to render form: {any}", .{err}).end();
        return;
    };
}
```

That's it. Two fields in a struct, and you have a working form.

@simple_form

### Type-Driven Field Generation

Vaporize inspects your struct types and generates the appropriate input:

| Zig Type             | Generated Input  |
| -------------------- | ---------------- |
| `[]const u8`         | TextField        |
| `[]const []const u8` | TextArea         |
| `i32`, `u32`, etc.   | Number TextField |
| `bool`               | Checkbox         |
| `enum`               | Radio buttons    |

Your types _are_ your schema. No duplication, no drift between data and UI.

### Adding Validation

Add a `__validations` field to your struct for field-level validation:

```zig
const Form = struct {
    username: []const u8 = "",
    email: []const u8 = "",
    phonenumber: []const u8 = "",
    password: []const u8 = "",
    age: u6 = 0,

    pub var __validations = .{
        .username = Validation{ .min = 3, .max = 10, .err = "Username must be between 3 and 10 characters" },
        .email = Validation{ .field_type = .email },
        .phonenumber = Validation{ .field_type = .telephone },
        .password = Validation{ .field_type = .password },
        .age = Validation{
            .min_value = 18,
            .max_value = 120,
            .err = "Age must be between 18 and 120",
        },
    };
};
```

Validation field names must match struct field names. The `__` prefix is a convention to indicate "framework metadata" - these fields are read at comptime, not included in your form data.

@form

### Type Boundaries as Validation

Notice `age: u6` above. A `u6` can only hold values 0-63. Vaporize uses this - you get compile-time guarantees _and_ runtime validation from your type choice.

Same with strings: `[16]u8` instead of `[]const u8` limits input to 16 characters. Your types enforce your constraints.

### Custom Components

Override any field's rendering with `__components`:

```zig
const CheckoutForm = struct {
    payment_method: []const u8 = "",
    country: []const u8 = "",

    pub const __validations = .{
        // ...
    };

    pub const __components = .{
        .payment_method = PaymentMethodComponent,
        .country = CountryComponent,
    };
};

fn PaymentMethodComponent(form: *CheckoutForm, err: ?ValidationError) void {
    // Render your custom Select, DatePicker, whatever
    payment_method_select.render();
}
```

You get full control when you need it, automatic generation when you don't.

### Nested Structs and Conditionals

Forms can have sections via nested structs, and conditional fields:

```zig
const CheckoutForm = struct {
    account: struct {
        email: []const u8 = "",
        password: []const u8 = "",
        contact: struct {
            phone: []const u8 = "",
        } = .{},
    } = .{},

    shipping_details: struct {
        shipping_same_as_billing: Vaporize.Condition(CheckoutForm) = .{
            .callback = sameAsBilling,
            .target_field = "shipping",
        },
    } = .{},

    shipping: struct {
        address: []const u8 = "",
        city: []const u8 = "",
        // ...
    } = .{},
};

fn sameAsBilling(form: *CheckoutForm) void {
    // Toggle shipping section visibility
}
```

Nested structs become form sections. `Vaporize.Condition` creates conditional visibility. The callback fires when the condition changes.

### Handling Submission

```zig
var form: vaporizer.Form(Form) = .{
    .on_submit = onSubmit,
};

fn onSubmit(form: Form) void {
    // form is your struct, fully typed, validated
    Vapor.print("Submitted: {s}", .{form.email});
}
```

Your submit handler receives the actual struct type. Not a hashmap of strings - your struct, with your types.

---

{#vaporizing-markdown}

## Vaporizing Markdown

Vaporize also converts markdown into native Vapor components. Same rendering pipeline as hand-written UI.

```zig
const std = @import("std");
const Vapor = @import("vapor");
const Vaporize = @import("vaporize");

var vaporizer: Vaporize.Compiler = undefined;
var markdown: vaporizer.MarkDown(.{}) = .{};

const markdown_text =
    \\# Main Heading
    \\
    \\- Item 1
    \\  - Nested item 1
    \\  - Nested item 2
    \\- Item 2
    \\
    \\This is the second paragraph.
;

export fn init() void {
    vaporizer = Vaporize.init(Vapor.arena(.persist), .{}) catch |err| {
        std.log.err("Failed to initialize vaporizer: {any}", .{err});
        return;
    };

    markdown.compile(markdown_text) catch |err| {
        std.log.err("Failed to compile markdown: {any}", .{err});
        return;
    };
}

fn render() void {
    markdown.render() catch |err| {
        TextFmt("Failed to render markdown: {any}", .{err}).end();
    };
}
```

Vaporize works as a runtime compiler in the browser, or a build-time compiler in your Zig build. Runtime for dynamic content (user-generated markdown, live editors). Build-time for static content (docs, blog posts).

### Embedding Components in Markdown

Pass Vapor components as arguments, reference them with `@tag`:

```zig
var markdown: vaporizer.MarkDown(.{
    .{ .tag = "counter", .function = counter },
    .{ .tag = "demo", .function = interactiveDemo },
}) = .{};

const markdown_text =
    \\# Interactive Documentation
    \\
    \\Here's a live counter:
    \\
    \\@counter
    \\
    \\And a more complex demo:
    \\
    \\@demo
;
```

This is how the Vapor documentation site works. Markdown for prose, `@component` tags for interactive examples. Best of both worlds.

@text_area

@realtime_markdown

### One Vaporizer Instance

Initialize once, use everywhere:

```zig
// instances.zig
pub var vaporizer: Vaporize.Compiler = undefined;

pub fn init() void {
    Vapor.init(.{});
    vaporizer = Vaporize.init(Vapor.arena(.persist), style_config) catch unreachable;
}
```

```zig
// any other file
const Instances = @import("instances.zig");

var markdown: Instances.vaporizer.MarkDown(.{}) = .{};
```

Since we compile to a single WASM binary, all vaporized content shares the same `Text`, `Box`, `ListItem` function calls. Memory scales logarithmically - ten markdown files don't cost ten times the memory.

---

### Vaporize API Reference

**Markdown**

- `vaporizer.MarkDown(.{})` - Create a markdown type, optionally with component tags
- `.compile(string)` - Parse and compile markdown to component tree
- `.render()` - Render the compiled tree

**Forms**

- `vaporizer.Form(StructType)` - Create a form type from a struct
- `.compile()` - Compile struct to form components
- `.render()` - Render the form
- `__validations` - Field validation rules (field names must match struct)
- `__components` - Custom component overrides

**Validation Options**

- `.field_type` - `.email`, `.password`, `.telephone`, `.credit_card`, `.expiry`, `.cvv`, `.string`
- `.min`, `.max` - String length constraints
- `.min_value`, `.max_value` - Numeric constraints
- `.required` - Field cannot be empty
- `.match` - Must match another field (with `.target_field`)
- `.depends_on` - Validation depends on another field's value
- `.placeholder` - Input placeholder text
- `.err` - Custom error message
