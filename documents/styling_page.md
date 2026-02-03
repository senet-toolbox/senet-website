{#styling}

# Styling

Vapor treats styling, like Zig itself, there is no scoping, namespacing, css classes, ect. Just pure Zig code.

In Vapor, we reconcile the styles, and so not only is everything deduped, but also consolidated. A typical 50kb CSS file, is reduced to a single 10kb CSS file, when using Vapor.

### Three approaches to styling

1. Builder Pattern
2. Style Structs
3. Inline String Styles

{#new-approach}

## New approach

Vapor has taken a completely new approach. In the very early stages of Vapor's creation, an entire ui layout algorithmn
was built from scratch. The aim of this was, to design an ergonmic, and usable simple styling system, for developers to work
with. Today, Vapor does not use this ui algo, due to the benefits of the browser's dom engine, but still uses the same styling api interface.

To center any element in Vapor (including "text")

`.layout = .center` or `.layout(.center)`

Vapor, even exposes it own center element type, `Center()`, which will center any child elements within it.

No more justify-content, or align-items, or text-align. Now instead _.x = .start_,
_.y = .center_ or _.layout = .top_left_.

These are also direction independent, adding _direction = .row_
or _direction = .column_, will still layout elements in y and x axis, correctly, unlike justify-content, and align-items.

{#layout}

### Layout:

- `.center`

- `.left_center`

- `.right_center`

- `.top_left`

- `.top_right`

- `.bottom_left`

- `.bottom_right`

- `.top_center`

- `.bottom_center`

- `.x_even_center`

- `.y_between`

- `.and much more...`

{#two-types-of-styling}

### 3 types of styling in vapor

- **Builder Pattern**

- **Style Structs**

- **Inline String Styles**

{#builder-functions}

## Builder Pattern

For those coming from ios development, builder functions will be familiar to you.

```zig
const Vapor = @import("vapor");
const Box = Vapor.Box;
pub fn render() void {
    Box().layout(.center).spacing(16).padding(.all(20)).children({
        Text("hello there!")
            .hoverScale()
            .font(24, 700, .blue)
            .close();
        Text("...")
            .font(18, 700, .black)
            .close();
        Text("general kenobi")
            .fontStyle(.italic)
            .font(24, 700, .red)
            .close();
    });
}
```

Builder functions are a powerful tool, for creating quick styles, that do not need to be shared across the application.
Keep in mind, Vapor by default does **not support duplicate styles**, the above common styles while instantiated multiple times, during tree
rendering. Will be deduplicated. Instead a reference will be kept for the common styles.

_Think of it as a set of css classes, all being combined optimally, into multiple smaller classes, which are shared across each component._

{#builder-patterns}

### Builder Patterns

- `.layout(Layout)`

- `.spacing(u8)`

- `.padding(Padding)`

- `.direction(Direction)`

- `.font(u16, ?u16, ?Color)`

- `.pos(Position)`

- `.size(Sizing)`

- `.width(Sizing)`

- `.height(Sizing)`

- `.zIndex(i16)`

- `.blur(u8)`

- `.background(Background)`

- `.border(Border)`

- `.wrap(Wrap)`

- `.cursor(Cursor)`

- `.hoverScale()`

- `.hoverText(Color)`

- `.margin(Margin)`

- `.radius(Radius)`

- `.duration(Duration)`

- `.listStyle(ListStyle)`

- `.outline(Outline)`

- `.fontStyle(FontStyle)`

- `.resize(Resize)`

- `.hw(Sizing, Sizing)`

- `ariaLabel([]const u8)`

- `ect...`

{#style-struct}

## const Style = struct { ... }

The second type of styling in Vapor is the `Style` struct. This is contains all the styling properties, and is passed to the
components, via the `style(*const Style)` function. This is handy when we have a common style, shared across the application.

### what about .style(&style)?

when using a Style struct, the syntax changes slightly:

```zig
// builder chain → .children({})
Button(click).padding(.all(8)).children({
    Text("click").end();
});

// style struct → direct block ({})
Button(click).style(&button_style)({
    Text("click").end();
});

const button_style = Vapor.Style{
    .layout = .center,
    .size = .hw(.px(48), .px(160)),
    .padding = .all(8),
    .visual = .{ .border = .simple(.black), .background = .white },
};
```

we are taking a reference to the `button_style` variable, and passing it to the `.style()` function.

#### note on style vs children

**why?** `.style()` returns a different type that takes the children block directly. just remember:

- `.children({...})` after builder chains
- `({...})` after `.style(&style)`

```zig
ButtonCtx(clicked, .{12}).style(&button_style)({ // ✅ Correct
    Text("click").end();
});

ButtonCtx(clicked, .{12}).style(&button_style).children({ // ❌ Incorrect, cannot use children after style
    Text("click").end();
});
```

### quick reference

```zig
// leaf elements - use .end()
Text("hello").end();
Text(35).end();
Icon(.search).end();
Image(.{ .src = "photo.jpg" }).end();
TextField(.string).bind(&text).end();

// containers - use .children({})
Box().children({ ... });
Center().children({ ... });
Stack().children({ ... });
List().children({ ... });
Button(fn).children({ ... });
Link(.{ .url = "/" }).children({ ... });

// with style struct - use ({})
// ❌ Cannot use children({}) after style
Box().style(&my_style)({ ... });
ButtonCtx(fn, .{}).style(&btn_style)({ ... });
```

```zig
pub fn render() void {
    const text_style: *const Vapor.Style = &.{
        .visual = .{
            .font_size = 24,
            .font_weight = 700,
            .text_color = .red,
        },
    };

    Box.style(text_style)({
        Text("hello there!").style(text_style);
        Text("...").style(&.{
            .visual = .{
                .font_size = 18,
                .font_weight = 700,
                .text_color = .black,
            },
        });
        Text("general kenobi").style(text_style);
    });
}
```

{#inline-style}

## .inlineStyle(fmt, .{})

The `.inlineStyle()` function allows you to pass a string of CSS, and apply it to the element.

```zig
var font_size: u32 = 24;
var font_weight: u32 = 700;
var theme: []const u8 = "--tint";
var text_style: []const u8 = "font-size: {d}; font-weight: {d}; color: rgb(var({s}));";

Box().inlineStyle("display: flex; justify-content: center, align-items: center, border-radius: 8px; border: 1px solid rgb(var(--tint)); background: transparent;", .{})
    .children({
    Text("hello there!").end();
});

Box().inlineStyle(text_style, .{font_size, font_weight, theme})
    .children({
    Text("hello there!").end();
});
```

{#taking-it-even-further}

### Taking it even further

A Typical CSS styled button requires the following styling

```css
style="display: flex; justify-content: center, align-items: center, border-radius: 8px; border: 1px solid rgb(var(--tint)); background: transparent;"
```

While in Vapor we can do the following,

```zig
Style{ .layout = .center, .visual = .{ .border = .round(.palette(.tint)) } }
```

or...

```zig
.layout(.center).border(.round(.palette(.tint), .all(8)))
```

{#structs-are-insanely-powerful}

### Structs are insanely powerful!

As you may have noticed, `Style` is a struct, and has fields, which means it also has methods.
when we create a new Vapor project, we get the following default methods:

- visual `.font(size: u32, weight: ?u32, color: ?color)`

- when `.pill(color: color)`

- bg `.hex(hex_str: []const u8)`

- interactive `.hover_scale()`

- style `.extend(base: *style, extension: style)`

- padding `.tblr(top: u32, bottom: u32, left: u32, right: u32)`

- size `.hw(height: sizing, width: sizing)`

- size `.square_percent(size: f32)`

- width `.mobile_desktop_percent(mobile: f32, desktop: f32)`

- background `.grid(size: f32, thickness: i32, color: color)`

- background `.hex(hex_str: []const u8)`

- background `.linear_gradient(start: color, end: color)`

- border `.simple(color: color)`

- border `.round(color: color)`

- border `.solid(color: color, thickness: i32)`

- border `.dashed(color: color, thickness: i32)`

- merge `.merge(style: style)`

- extend `.extend(style: style)`

- and much more...

{#code-block}

### code block

below is a sample code block of various styling options.

```zig

const Vapor = @import("vapor");
const Box = Vapor.Box;

pub fn init() void {
    Page(.{ .src = @src() }, render, null);
}

const common_style = Style{
    .layout = .top_right,
    .size = .{
        .height = .px(120),
    },
    .visual = .{
        .border = .round(.vapor_blue, .all(4)),
    },
    .padding = .all(8),
};

pub const pill_button_base = Style{
    .layout = .center,
    .size = .hw(.px(45), .px(160)),
    .visual = .pill(.hex("#000000")),
    .transition = .{ .duration = 100 },
    .interactive = .hover_scale(),
    .child_gap = 8,
};

fn mergedstyle() style {
    var base = pill_button_base;
    return base.merge(style{
        .visual = .{ .border = .simple(.hex("#e1e1e1")) },
    });
}

fn clicked() void {
    Vapor.alert("you clicked me!");
}

fn samples() void {
    Box()
        .layer(.dot(0.5, 20, .white))
        .background(.vapor_blue)
        .width(.percent(100))
        .height(.auto)
        .layout(.center)
        .children({
        Text("i like dots!")
            .font(48, 700, .white).fontFamily("montserrat").end();
    });

    Box().style(&common_style)({
        Text("top right text").fontSize(14).end();
    });

    // here we use the basestyle, now we can override the default style
    Box().baseStyle(&common_style).layout(.top_left).children({
        Text("top left text").fontSize(14).end();
    });

    Button(clicked).style(&pill_button_base)({
        Text("click me").fontSize(18).end();
    });

    // here we merge the pill style,
    Button(clicked).style(&mergedStyle())({
        Text("click me").fontSize(18).end();
    });
}
```

@styling_samples

#### extend

The extend function allows you to extend a style with another style. It mutates the original style, and returns the mutated style.

#### merge

The merge function allows you to merge a style with another style. This creates an entirely new style, and returns the new style.
