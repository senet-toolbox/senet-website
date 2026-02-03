{#opaque-ui-guide}

# Opaque UI Component Library

#### A comprehensive guide to using and building components with Vapor's Opaque UI library.

---

{#getting-started}

## Getting Started

### Installation

```bash
metal add opaque-ui
```

### Imports

```zig
const Opaque = @import("opaque");

// Components
const Select = Opaque.Select;
const Table = Opaque.Table;
const Column = Opaque.Column;
const Action = Opaque.Action;
const Chart = Opaque.Chart;
const Field = Opaque.Field;
const Accordion = Opaque.Accordion;
const Alert = Opaque.Alert;
const Sheet = Opaque.Sheet;
const Toast = Opaque.Toast;
const Tooltip = Opaque.Tooltip;
const ComboBox = Opaque.ComboBox;
const ComboBoxDialog = Opaque.ComboBoxDialog;
const CommandPalette = Opaque.CommandPalette;
const Switch = Opaque.Switch;
const Group = Opaque.Group;
const Tabs = Opaque.Tabs;
const Button = Opaque.Button;
```

### Initialization

```zig
pub fn init() void {
    // Initialize all Opaque components
    Opaque.new();

    // Or initialize specific components
    Select.new();
    Field.new();
    // etc.
}
```

---

{#select-component}

## Select Component

Type-safe dropdown with search support.

### Basic Usage

```zig
const Status = enum { pending, success, err };

var status_select: Select(Status) = undefined;

var options = [_]Select(Status).Item{
    .{ .value = Status.pending, .label = "Pending" },
    .{ .value = Status.success, .label = "Success" },
    .{ .value = Status.err, .label = "Error" },
};

fn init() void {
    Select.new();
    status_select = .fromItems(&options);
    status_select.trigger = "Select Status";
    status_select.on_select = onStatusSelect;
}

fn onStatusSelect(_: *Select(Status), item: *Select(Status).Item) void {
    Vapor.print("Selected: {s}", .{item.label});
}

fn render() void {
    status_select.render();
}
```

### With Default Value

```zig
fn init() void {
    status_select = .fromItems(&options);
    status_select.default(.{ .value = Status.pending, .label = "Pending" });
}
```

### Select Item Structure

```zig
pub const Item = struct {
    value: T,                              // The actual value
    label: []const u8,                     // Display text
    icon: ?*const Vapor.IconTokens = null, // Optional icon
    is_selected: bool = false,             // Selection state
    _is_shown: bool = true,                // Visibility (for search)
};
```

### Select Methods

| Method              | Description            |
| ------------------- | ---------------------- |
| `.fromItems(items)` | Create from item array |
| `.render()`         | Render the select      |
| `.toggle()`         | Toggle dropdown        |
| `.open()`           | Open dropdown          |
| `.close()`          | Close dropdown         |
| `.default(item)`    | Set default selection  |

---

{#table-component}

## Table Component

Data table with sorting, filtering, pagination, and actions.

### Basic Table

```zig
const Data = struct {
    id: usize,              // REQUIRED: Table needs an 'id' field
    status: Status,
    email: []const u8,
    amount: i32,
};

const Status = enum { pending, success, err };

const columns = [_]Column(Data){
    Column(Data){
        .title = "Status",
        .key = "status",
        .width = 100,
        .filter = true,     // Enable enum filtering
    },
    Column(Data){
        .title = "Email",
        .key = "email",
        .width = 100,
        .sort = .asc,       // Enable sorting
        .search = true,     // Enable text search
    },
    Column(Data){
        .title = "Amount",
        .key = "amount",
        .width = 100,
    },
};

fn handleDelete(item: *Data) void {
    Vapor.print("Delete: {s}", .{item.email});
}

fn handleEdit(item: *Data) void {
    Vapor.print("Edit: {s}", .{item.email});
}

const MyTable = Table(Data, &columns, .{
    .actions = &[_]Action(Data){
        .{ .label = "Delete", .on_action = handleDelete, .icon = .trash },
        .{ .label = "Edit", .on_action = handleEdit, .icon = .pencil },
    },
});

var table: MyTable = undefined;
var data: []Data = // your data array

fn init() void {
    table.init(&data);
    table.on_select = onRowSelect;
}

fn onRowSelect(item: *Data) void {
    Vapor.print("Selected row: {d}", .{item.id});
}

fn render() void {
    table.render();
}
```

### Column Configuration

```zig
pub const Column = struct {
    title: []const u8,                     // Column header
    key: []const u8,                       // Field name in struct
    width: f32 = 0,                        // Column width
    alignment: ?Align = .none,             // Text alignment
    sort: ?Sort = null,                    // .asc, .desc, or null
    render: ?*const fn (*Row(T)) void = null, // Custom cell renderer
    search: bool = false,                  // Enable text search
    filter: bool = false,                  // Enable enum filtering
};
```

### Table Methods

| Method         | Description               |
| -------------- | ------------------------- |
| `.init(&data)` | Initialize with data      |
| `.render()`    | Render the table          |
| `.refresh()`   | Refresh after data change |

---

{#chart-component}

## Chart Component

Bar and line charts with animations.

### Basic Chart

```zig
var chart: Chart = undefined;

fn init() void {
    chart = Chart.init(Vapor.arena(.persist), .{
        .height = 300,
        .width = 600,
        .palette = .{ .colors = &.{ "#3b82f6", "#ef4444" } },
    });

    const sales = [_]Chart.Point{
        .{ .x = 1, .y = 90 },
        .{ .x = 2, .y = 70 },
        .{ .x = 3, .y = 45 },
        .{ .x = 4, .y = 50 },
        .{ .x = 5, .y = 65 },
    };

    const costs = [_]Chart.Point{
        .{ .x = 1, .y = 20 },
        .{ .x = 2, .y = 35 },
        .{ .x = 3, .y = 30 },
        .{ .x = 4, .y = 50 },
        .{ .x = 5, .y = 45 },
    };

    chart.addSeries(.bar, "Sales", &sales, .{ .color = .palette(.chart_bar_color) }) catch unreachable;
    chart.addSeries(.line_smooth, "Costs", &costs, .{ .color = .palette(.tint) }) catch unreachable;

    chart.xAxis(.{ .label = "Month", .tick_count = 6 });
    chart.yAxis(.{ .label = "USD ($)", .tick_count = 5 });
    chart.legend(.{ .position = .top_left });
    chart.build() catch unreachable;
}

fn render() void {
    chart.render();
}
```

### Update Chart Data

```zig
fn updateData() void {
    const new_sales = [_]Chart.Point{
        .{ .x = 1, .y = 40 },
        .{ .x = 2, .y = 95 },
        // ...
    };

    const new_costs = [_]Chart.Point{
        .{ .x = 1, .y = 80 },
        .{ .x = 2, .y = 20 },
        // ...
    };

    chart.updateSeries(&.{
        Chart.SeriesData{ .name = "Sales", .data = &new_sales },
        Chart.SeriesData{ .name = "Costs", .data = &new_costs },
    });
}
```

### Series Types

| Type           | Description       |
| -------------- | ----------------- |
| `.bar`         | Bar chart         |
| `.line`        | Line chart        |
| `.line_smooth` | Smooth line chart |

---

{#field-component}

## Field Component

Form input field with floating labels and validation.

### Basic Usage

```zig
var email: []const u8 = "";
var password: []const u8 = "";
var age: i32 = 0;

fn init() void {
    Field.new();
}

fn render() void {
    Stack().spacing(16).children({
        Field.render(.{
            .label = "Email",
            .value = .{ .email = &email },
        });

        Field.render(.{
            .label = "Password",
            .value = .{ .password = &password },
        });

        Field.render(.{
            .label = "Age",
            .value = .{ .number = &age },
        });
    });
}
```

### Field Types

```zig
pub const FieldValue = union(enum) {
    string: *[]const u8,
    password: *[]const u8,
    number: *i32,
    bool: *bool,
    email: *[]const u8,
    credit_card: *[]const u8,
    telephone: *[]const u8,
};
```

### Field Options

```zig
Field.render(.{
    .label = "Card Number",
    .value = .{ .credit_card = &card_number },
    .trans_label = true,           // Always show label above
    .placeholder = .{ .string = "1234 5678 9012 3456" },
    .on_change = handleChange,
    .id = "unique-id",             // Custom stable ID
});
```

### Auto-Formatting

The Field component automatically formats:

- **Credit cards**: `1234567890123456` → `1234 5678 9012 3456`
- **Phone numbers**: `1234567890` → `(123) 456-7890`

---

{#accordion-component}

## Accordion Component

Expandable content sections.

```zig
var accordion: Accordion = undefined;

var items = [_]Accordion.AccordionItem{
    .{
        .title = "Section 1",
        .description = "Content for section 1...",
        .trigger = AccordionTrigger,
        .content = AccordionContent,
    },
    .{
        .title = "Section 2",
        .description = "Content for section 2...",
        .trigger = AccordionTrigger,
        .content = AccordionContent,
    },
};

fn AccordionTrigger(item: *Accordion.AccordionItem) void {
    Text(item.title).font(16, 700, .palette(.text_color)).end();
}

fn AccordionContent(item: *Accordion.AccordionItem) void {
    Text(item.description).font(14, 400, .palette(.text_color)).end();
}

fn init() void {
    accordion = Accordion.init(&items);
}

fn render() void {
    accordion.render();
}
```

---

{#sheet-drawer}

## Sheet (Drawer) Component

Slide-in panel from any edge.

```zig
var sheet: Sheet = undefined;

fn sheetContent(_: *Sheet) void {
    Stack().padding(.all(24)).children({
        Text("Sheet Content").font(24, 700, .palette(.text_color)).end();
        Button(.{ .on_press = closeSheet }).children({
            Text("Close").end();
        });
    });
}

fn closeSheet() void {
    sheet.close();
}

fn openSheet() void {
    sheet.open();
}

fn init() void {
    sheet = Sheet.init(.bottom);  // .top, .left, .right, .bottom
    sheet.content = sheetContent;
}

fn render() void {
    Button(.{ .on_press = openSheet }).children({
        Text("Open Drawer").end();
    });
    sheet.render();
}
```

---

{#toast-component}

## Toast Component

Notification messages.

```zig
fn init() void {
    Toast.new();
}

fn showToasts() void {
    Toast.success(.{ .title = "Success", .description = "Operation completed" });
    Toast.err(.{ .title = "Error", .description = "Something went wrong" });
    Toast.warning(.{ .title = "Warning", .description = "Please check input" });
    Toast.info(.{ .title = "Info", .description = "New update available" });
}

fn render() void {
    Button(.{ .on_press = showToasts }).children({
        Text("Show Toast").end();
    });

    // Render toast stack (usually at root level)
    Toast.renderStack();
}
```

---

{#alert-dialog}

## Alert Component

Modal dialog for confirmations.

```zig
var alert: Alert = undefined;

fn alertContent(_: *Alert) void {
    Stack().spacing(16).children({
        Text("Are you sure?").font(22, 700, .palette(.text_color)).end();
        Text("This action cannot be undone.").font(14, 400, .palette(.text_color)).end();

        Box().layout(.right_center).spacing(16).children({
            ButtonCtx(Alert.close, .{&alert}).children({
                Text("Cancel").end();
            });
            Button(.{ .on_press = confirmAction }).children({
                Text("Confirm").end();
            });
        });
    });
}

fn confirmAction() void {
    // Do action
    alert.close();
}

fn init() void {
    alert = Alert.init(alertContent);
}

fn render() void {
    Button(.{ .on_press = alert.open }).children({
        Text("Delete Item").end();
    });
    alert.render();
}
```

---

{#combobox-component}

## ComboBox Component

Searchable select with keyboard navigation.

```zig
const Status = enum { pending, success, err };

var combobox: ComboBox(Status) = undefined;

var options = [_]ComboBox(Status).Item{
    .{ .value = Status.pending, .label = "Pending" },
    .{ .value = Status.success, .label = "Success" },
    .{ .value = Status.err, .label = "Error" },
};

fn init() void {
    ComboBox.new();
    combobox = .fromItems(&options);
}

fn render() void {
    combobox.render();
}
```

---

{#combobox-dialog}

## ComboBox Dialog Component

Full-screen searchable command palette.

```zig
const MenuItem = struct {
    label: []const u8,
    icon: ?*const Vapor.IconTokens = null,
    value: []const u8 = "",
};

var dialog: ComboBoxDialog(MenuItem) = undefined;

var menu_items = [_]MenuItem{
    .{ .label = "Home", .value = "/", .icon = Vapor.IconTokens.house },
    .{ .label = "Settings", .value = "/settings", .icon = Vapor.IconTokens.gear },
    .{ .label = "Profile", .value = "/profile", .icon = Vapor.IconTokens.person },
};

fn onSelect(item: *ComboBoxDialog(MenuItem).Item) void {
    Vapor.Kit.navigate(item.value.value);
    dialog.close();
}

fn init() void {
    dialog = .fromItems(&menu_items);
    dialog.on_select = onSelect;
    dialog.on_mount = onDialogMount;
    dialog.on_close = onDialogClose;
}

fn openDialog() void {
    dialog.clearAll();
    dialog.clearText();
    dialog.open();
}

fn render() void {
    Button(.{ .on_press = openDialog }).children({
        Text("Open Command Palette").end();
    });
    dialog.render();
}
```

---

{#switch-component}

## Switch Component

Toggle switch control.

```zig
fn init() void {
    Switch.new();
}

fn render() void {
    Box().layout(.x_between_center).children({
        Text("Enable Feature").end();
        Switch.render("feature-switch");
    });
}
```

---

{#tabs-component}

## Tabs Component

Tabbed content navigation.

```zig
fn init() void {
    Tabs.new();
}

fn render() void {
    Tabs.render();
}
```

---

{#vaporize-forms}

## Vaporize Form Generation

Generate forms automatically from Zig structs.

### Basic Form

```zig
const Vaporize = @import("vaporize");
const Validation = Vaporize.Validation;

const LoginForm = struct {
    email: []const u8 = "",
    password: []const u8 = "",

    pub const __validations = .{
        .email = Validation{ .field_type = .email },
        .password = Validation{ .field_type = .password },
    };
};

var vaporizer: Vaporize.Compiler = undefined;
var login_form: vaporizer.Form(LoginForm) = undefined;

fn init() void {
    vaporizer = Vaporize.init(Vapor.arena(.persist), .{}) catch unreachable;
    login_form.compile() catch unreachable;
    login_form.inner_form.on_submit = onSubmit;
}

fn onSubmit(form: LoginForm) void {
    Vapor.print("Email: {s}", .{form.email});
}

fn render() void {
    login_form.render();
}
```

### Complex Nested Form

```zig
const CheckoutForm = struct {
    account: struct {
        email: []const u8 = "",
        password: []const u8 = "",
        confirm_password: []const u8 = "",
        contact: struct {
            phone: []const u8 = "",
        } = .{},
    } = .{},

    payment: struct {
        method: []const u8 = "",
        card_number: []const u8 = "",
        expiry: []const u8 = "",
        cvv: []const u8 = "",
    } = .{},

    shipping: struct {
        address: []const u8 = "",
        city: []const u8 = "",
        country: []const u8 = "",
    } = .{},

    pub const __validations = .{
        .email = Validation{ .field_type = .email },
        .password = Validation{ .field_type = .password },
        .confirm_password = Validation{
            .field_type = .password,
            .target_field = "password",
            .match = true,
        },
        .phone = Validation{
            .field_type = .telephone,
            .depends_on = "country",
        },
        .card_number = Validation{ .field_type = .credit_card },
        .expiry = Validation{
            .field_type = .expiry,
            .placeholder = "MM/YY",
        },
        .cvv = Validation{
            .field_type = .cvv,
            .placeholder = "123",
            .err = "CVV is required",
        },
        .address = Validation{ .field_type = .string, .required = true },
        .city = Validation{ .field_type = .string, .required = true },
    };

    // Custom components for specific fields
    pub const __components = .{
        .method = PaymentMethodComponent,
        .country = CountryComponent,
    };
};

fn PaymentMethodComponent(_: *CheckoutForm, _: ?Vaporize.ValidationError) void {
    payment_method_select.render();
}

fn CountryComponent(_: *CheckoutForm, _: ?Vaporize.ValidationError) void {
    country_select.render();
}
```

### Validation Options

```zig
pub const Validation = struct {
    field_type: FieldType = .string,   // Field input type
    min: ?usize = null,                 // Min string length
    max: ?usize = null,                 // Max string length
    min_value: ?i32 = null,             // Min numeric value
    max_value: ?i32 = null,             // Max numeric value
    required: bool = false,             // Required field
    err: ?[]const u8 = null,            // Custom error message
    placeholder: ?[]const u8 = null,    // Placeholder text
    target_field: ?[]const u8 = null,   // Field to match against
    match: bool = false,                // Must match target field
    depends_on: ?[]const u8 = null,     // Dependent field
};
```

### Conditional Fields

```zig
const Form = struct {
    shipping_details: struct {
        same_as_billing: Vaporize.Condition(Form) = .{
            .callback = handleCondition,
            .target_field = "shipping",  // Controls visibility of shipping section
        },
    } = .{},

    shipping: struct {
        address: []const u8 = "",
    } = .{},
};

fn handleCondition(form: *Form) void {
    // Toggle based on condition value
    const show_shipping = !form.shipping_details.same_as_billing.value;
    // Logic to show/hide shipping section
}
```

---

{#building-custom-components}

## Building Custom Opaque Components

### Component Structure Pattern

```zig
const std = @import("std");
const Vapor = @import("vapor");
const Box = Vapor.Box;
const Text = Vapor.Text;
const Button = Vapor.Button;
const ButtonCtx = Vapor.CtxButton;
const Stack = Vapor.Stack;

// Animation definitions
pub const animEnter = Vapor.Animation.init("mycomponent-enter")
    .prop(.opacity, 0, 1)
    .prop(.scale, 0.9, 1)
    .duration(100)
    .easing(.easeInOut);

pub const animExit = Vapor.Animation.init("mycomponent-exit")
    .prop(.opacity, 1, 0)
    .prop(.scale, 1, 0.9)
    .duration(100)
    .easing(.easeInOut);

// Initialize function (call from main init)
pub fn new() void {
    animEnter.build();
    animExit.build();
}

// Generic component with type parameter
pub fn MySelect(comptime T: type) type {
    // Compile-time validation
    comptime {
        if (!@hasField(T, "value")) {
            @compileError("MySelect requires a field named 'value'");
        }
        if (!@hasField(T, "label")) {
            @compileError("MySelect requires a field named 'label'");
        }
    }

    return struct {
        const Self = @This();

        // Item structure
        pub const Item = struct {
            value: T,
            label: []const u8,
            icon: ?*const Vapor.IconTokens = null,
            is_selected: bool = false,
        };

        // Component state
        items: []Item,
        _selected_item: ?*Item = null,
        _is_open: bool = false,
        trigger: []const u8 = "Select",

        // Callbacks
        on_select: ?*const fn (*Self, *Item) void = null,

        // Binded elements
        _binded: Vapor.Binded = .{},

        // Factory method
        pub fn fromItems(items: []Item) Self {
            return Self{ .items = items };
        }

        // Toggle method
        pub fn toggle(self: *Self) void {
            self._is_open = !self._is_open;
        }

        pub fn open(self: *Self) void {
            self._is_open = true;
        }

        pub fn close(self: *Self) void {
            self._is_open = false;
        }

        // Select handler
        fn selectItem(self: *Self, item: *Item) void {
            // Deselect all
            for (self.items) |*i| {
                i.is_selected = false;
            }
            // Select this item
            item.is_selected = true;
            self._selected_item = item;
            self.close();

            // Call callback
            if (self.on_select) |callback| {
                callback(self, item);
            }
        }

        // Render trigger button
        fn renderTrigger(self: *Self) void {
            ButtonCtx(toggle, .{self})
                .padding(.tblr(12, 12, 16, 16))
                .border(.round(.palette(.border_color), .all(8)))
                .layout(.x_between_center)
                .cursor(.pointer)
                .children({
                    const label = if (self._selected_item) |item|
                        item.label
                    else
                        self.trigger;
                    Text(label).font(14, 400, .palette(.text_color)).end();
                    Vapor.Icon(.chevron_down)
                        .font(12, 400, .palette(.text_color))
                        .end();
                });
        }

        // Render dropdown
        fn renderDropdown(self: *Self) void {
            if (!self._is_open) return;

            Stack()
                .pos(.tl(.px(0), .percent(100), .absolute))
                .width(.percent(100))
                .background(.palette(.background))
                .border(.round(.palette(.border_color), .all(8)))
                .shadow(.card(.transparentizeHex(.black, 0.1)))
                .animationEnter(&animEnter)
                .animationExit(&animExit)
                .zIndex(100)
                .children({
                    for (self.items) |*item| {
                        ButtonCtx(selectItem, .{ self, item })
                            .width(.percent(100))
                            .padding(.tblr(10, 10, 16, 16))
                            .background(if (item.is_selected)
                                .palette(.tint)
                            else
                                .transparent)
                            .cursor(.pointer)
                            .hover(.{
                                .background = .transparentizeHex(.palette(.tint), 0.1),
                            })
                            .children({
                                if (item.icon) |icon| {
                                    Vapor.Icon(icon)
                                        .font(14, 400, .palette(.text_color))
                                        .end();
                                }
                                Text(item.label)
                                    .font(14, 400, if (item.is_selected)
                                        .white
                                    else
                                        .palette(.text_color))
                                    .end();
                            });
                    }
                });
        }

        // Main render
        pub fn render(self: *Self) void {
            Box()
                .pos(.relative)
                .width(.px(200))
                .ref(&self._binded)
                .children({
                    self.renderTrigger();
                    self.renderDropdown();
                });
        }
    };
}
```

### Using Custom Component

```zig
const MyComponent = @import("MyComponent.zig");

const Status = struct {
    value: u32,
    label: []const u8,
};

var my_select: MyComponent.MySelect(Status) = undefined;

fn init() void {
    MyComponent.new();

    my_select = .fromItems(&.{
        .{ .value = 1, .label = "Option 1" },
        .{ .value = 2, .label = "Option 2" },
        .{ .value = 3, .label = "Option 3" },
    });
    my_select.trigger = "Choose Option";
    my_select.on_select = onSelect;
}

fn onSelect(_: *MyComponent.MySelect(Status), item: *MyComponent.MySelect(Status).Item) void {
    Vapor.print("Selected: {s}", .{item.label});
}

fn render() void {
    my_select.render();
}
```

---

{#overlay-management}

## Overlay Management

Pattern for managing keyboard events across overlays.

```zig
const OverlayManager = @import("OverlayManager.zig");

var my_dialog_binded: Vapor.Binded = .{};

fn mount() void {
    OverlayManager.register(.keydown, handleKeyPress, &my_dialog_binded);
}

fn destroy() void {
    OverlayManager.unregister(.keydown, &my_dialog_binded);
}

fn handleKeyPress(_: *Vapor.Binded, evt: *Vapor.Event) void {
    evt.preventDefault();
    const key = evt.key();

    if (std.mem.eql(u8, key, "Escape")) {
        close();
    }

    if (std.mem.eql(u8, key, "ArrowDown")) {
        navigateDown();
    }

    if (std.mem.eql(u8, key, "ArrowUp")) {
        navigateUp();
    }

    if (std.mem.eql(u8, key, "Enter")) {
        selectCurrent();
    }
}

fn render() void {
    if (is_open) {
        Vapor.Static.HooksCtx(.mounted, mount, .{})({
            Vapor.Static.HooksCtx(.destroy, destroy, .{})({
                // Dialog content
            });
        });
    }
}
```

---

{#styling-conventions}

## Styling Conventions

### Common Style Variables

```zig
// Define at module level for consistency
var background: Vapor.Types.Background = .palette(.background);
var border: Vapor.Types.BorderGrouped = .round(.palette(.border_color_light), .all(6));
var border_color: Vapor.Types.Color = .palette(.border_color_light);
var text_color: Vapor.Types.Color = .palette(.text_color);
var tint: Vapor.Types.Background = .transparentizeHex(.palette(.tint), 0.8);
var font_family: []const u8 = "IBM Plex Sans,monospace";
```

### Reusable Button Styles

```zig
fn CommonButton(func: anytype, args: anytype) Vapor.ButtonBuilder(.pure) {
    return ButtonCtx(func, args)
        .cursor(.pointer)
        .border(.round(.transparent, .all(4)))
        .padding(.all(4))
        .duration(100)
        .hover(.{
            .background = tint,
            .text_color = .white,
        });
}

fn CheckBox(func: anytype, args: anytype) Vapor.ButtonBuilder(.pure) {
    return ButtonCtx(func, args)
        .width(.px(20))
        .height(.px(20))
        .cursor(.pointer)
        .duration(100)
        .hoverScale();
}
```

---

{#best-practices}

## Best Practices

### 1. Initialize in `new()` Function

```zig
pub fn new() void {
    // Build animations
    animEnter.build();
    animExit.build();

    // Initialize state maps
    focus_states = std.StringHashMap(bool).init(Vapor.arena(.scratch));
}
```

### 2. Use Appropriate Memory Arenas

```zig
// Component items - persist
items = Vapor.arena(.persist).alloc(Item, count) catch unreachable;

// Temporary formatting - frame
const label = Vapor.fmtln("{d} items", .{count});

// Page-specific state - view
page_data = Vapor.arena(.view).create(PageData) catch unreachable;

// Manually managed - scratch
temp_buffer = Vapor.arena(.scratch).alloc(u8, 1024) catch unreachable;
```

### 3. Compile-Time Validation

```zig
pub fn Component(comptime T: type) type {
    comptime {
        if (!@hasField(T, "id")) {
            @compileError("Component requires a field named 'id'");
        }
        if (!@hasField(T, "label")) {
            @compileError("Component requires a field named 'label'");
        }
    }

    return struct {
        // ...
    };
}
```

### 4. Clean Lifecycle Management

```zig
fn mount() void {
    // Register listeners
    OverlayManager.register(.keydown, handleKeys, &binded);
    // Focus input
    search_box.focus();
}

fn destroy() void {
    // Unregister listeners
    OverlayManager.unregister(.keydown, &binded);
    // Clean up state
    clearSelections();
}
```

### 5. Callback Patterns

```zig
// Allow optional callbacks
on_select: ?*const fn (*Self, *Item) void = null,
on_close: ?*const fn () void = null,

// Safe callback invocation
if (self.on_select) |callback| {
    callback(self, item);
}
```

---

{#animation-reference}

## Animation Reference

### Standard Animations

```zig
// Enter animation
pub const animEnter = Vapor.Animation.init("component-enter")
    .prop(.opacity, 0, 1)
    .prop(.scale, 0.9, 1)
    .duration(100)
    .easing(.easeInOut);

// Exit animation
pub const animExit = Vapor.Animation.init("component-exit")
    .prop(.opacity, 1, 0)
    .prop(.scale, 1, 0.9)
    .duration(100)
    .easing(.easeInOut);

// Glitch effect
pub const glitch = Vapor.Animation.init("glitch")
    .duration(200)
    .at(25).set(.translateX, -10).setColor(.backgroundColor, .red)
    .at(35).set(.translateX, 10).setColor(.backgroundColor, .green)
    .at(60).set(.opacity, 1).set(.translateX, -10).set(.blur, 5)
    .at(100).set(.blur, 5).setColor(.backgroundColor, .yellow);

// Blink effect
pub const blink = Vapor.Animation.init("blink")
    .duration(100)
    .infinite()
    .at(50).set(.opacity, 0);
```

### Applying Animations

```zig
Box()
    .animationEnter(&animEnter)
    .animationExit(&animExit)
    .children({ /* ... */ });

// Conditional animation
Text("Status")
    .animation(if (loading) &blink else null)
    .end();

// Hover animation
Button(.{ .on_press = action })
    .hover(.{ .animation = &glitch })
    .children({ /* ... */ });
```
