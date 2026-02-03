{#theme-and-icons}

# Theme and Icons

Vapor includes its own theming and icon system. Instead of relying on HTML classes or external libraries like Lucide or Font Awesome, you define your own icon set that is passed during compilation, giving you auto-completion and type-safety benefits.

Each Vapor application comes with a `config.zig` file and a `Theme.zig` file.

---

{#theme-system}

## Theme System

The theme system provides type-safe color tokens that can be referenced throughout your application. Colors are defined once and accessed via the `.palette()` function, ensuring consistency and making theme changes trivial.

### Defining Theme Colors

```zig
// Theme.zig
const std = @import("std");
const Vapor = @import("vapor");
const Color = Vapor.Types.Color;

pub const Mode = enum(u8) {
    light,
    dark,
};

pub const ThemeTokens = enum(u8) {
    tint,
    border_color,
    text_color,
    background,
    primary,
    secondary,
};

pub const Colors = struct {
    tint: Color,
    border_color: Color,
    text_color: Color,
    background: Color,
    primary: Color,
    secondary: Color,
};

pub const Light = Colors{
    .tint = .hex("#002bff"),
    .border_color = .hex("#262626"),
    .text_color = .hex("#212121"),
    .background = .white,
    .primary = .rgba(255, 255, 255, 255),
    .secondary = .rgba(0, 0, 0, 255),
};

pub const Dark = Colors{
    .tint = .hex("#F2FF00"),
    .border_color = .hex("#27272a"),
    .text_color = .hex("#EAEAEA"),
    .background = .hex("#0F0F0F"),
    .primary = .rgba(0, 0, 0, 255),
    .secondary = .rgba(255, 255, 255, 1),
};

pub var mode: Mode = .light;

pub export fn setTheme(new_mode: Mode) void {
    mode = new_mode;
}

pub fn toggleTheme() void {
    mode = switch (mode) {
        .dark => .light,
        .light => .dark,
    };
    Vapor.lib.store("theme", @tagName(mode));
    Vapor.lib.toggleTheme();
}
```

{#using-theme-colors}

### Using Theme Colors

Reference theme colors in your styles using `.palette()`:

```zig
pub fn render() void {
    Box()
        .background(.palette(.background))
        .border(.simple(.palette(.border_color)))
        .font(16, 500, .palette(.text_color))
        .children({
        //...
    });
}
```

When the theme mode changes, all components using `.palette()` automatically update to reflect the new colors.

{#registering-themes}

### Registering Themes

Before using theme colors, you must register your themes globally using `Vapor.setGlobalStyleVariables()`. This is typically done in your application's entry point:

```zig
const Vapor = @import("vapor");
const Theme = @import("Theme.zig");

pub fn main() void {
    // Global style variables
    Vapor.setGlobalStyleVariables(.{
        .themes = &[_]Vapor.ThemeDefinition{
            Vapor.ThemeDefinition{ .name = "light", .theme = Theme.Light, .default = true },
            Vapor.ThemeDefinition{ .name = "dark", .theme = Theme.Dark },
        },
    });

    // ... rest of your application
}
```

The `ThemeDefinition` struct takes:

- **`name`**: A string identifier for the theme (used for persistence and toggling)
- **`theme`**: The `Colors` struct containing your color definitions
- **`default`**: Set to `true` for the theme that should be active on first load

You can register as many themes as you need:

```zig
Vapor.setGlobalStyleVariables(.{
    .themes = &[_]Vapor.ThemeDefinition{
        Vapor.ThemeDefinition{ .name = "light", .theme = Theme.Light, .default = true },
        Vapor.ThemeDefinition{ .name = "dark", .theme = Theme.Dark },
        Vapor.ThemeDefinition{ .name = "midnight", .theme = Theme.Midnight },
        Vapor.ThemeDefinition{ .name = "forest", .theme = Theme.Forest },
    },
});
```

> **Note:** Registering themes adds approximately 11kb to your bundle size.

{#color-formats}

### Color Formats

Vapor supports multiple color formats:

```zig
.hex("#FF5733")           // Hex string
.rgba(255, 87, 51, 255)   // RGBA values (0-255)
.white                    // Named colors
.transparent              // Transparent
.palette(.text_color)     // Theme token reference
```

---

{#icon-system}

## Icon System

The icon system maps semantic names to both web font classes and SVG unicode points, allowing the same icon definitions to work across different rendering contexts.

### Defining Icons

```zig
// config.zig
pub const IconTokens = struct {
    web: ?[]const u8 = null,
    svg: ?[]const u8 = null,

    pub const list_task = &IconTokens{ .web = "bi bi-view-list", .svg = "\u{f0e1}" };
    pub const cloud_download_fill = &IconTokens{ .web = "bi bi-cloud-download-fill", .svg = "\u{f0e2}" };
    pub const plus = &IconTokens{ .web = "bi bi-plus", .svg = "\u{f0fe}" };
    pub const arrow_right = &IconTokens{ .web = "bi bi-arrow-right", .svg = "\u{f0e9}" };
    pub const clipboard = &IconTokens{ .web = "bi bi-clipboard", .svg = "\u{f0ea}" };
    pub const check = &IconTokens{ .web = "bi bi-check", .svg = "\u{f0e7}" };
    pub const home = &IconTokens{ .web = "bi bi-house", .svg = "\u{f0e3}" };
    pub const cloud_moon = &IconTokens{ .web = "bi bi-cloud-moon", .svg = "\u{f0e6}" };
    pub const search = &IconTokens{ .web = "bi bi-search", .svg = "\u{f0e8}" };
    pub const command = &IconTokens{ .web = "bi bi-command", .svg = "\u{f0eb}" };
};
```

Each icon token has two representations:

- **`web`**: CSS class names for web font rendering (e.g., Bootstrap Icons)
- **`svg`**: Unicode code point for SVG/native rendering

### Using Icons

Display icons with `Icon()`:

```zig
Icon(.search).end();

Icon(.home).style(&.{
    .visual = .{ .font_size = 24 },
})
```

### Styling Icons

Icons accept the same styling system as other components:

```zig
Icon(.check).style(&.{
    .visual = .{
        .font_size = 16,
        .text_color = .palette(.tint),
    },
    .margin = .all(8),
})
```

---

{#complete-example}

## Complete Example

Here's a example App combining theme colors and icons:

```zig
const Vapor = @import("vapor");
const Theme = @import("Theme.zig");
const Box = Vapor.Box;
const Text = Vapor.Text;
const Button = Vapor.Button;
const Icon = Vapor.Icon;

pub fn main() void {
    Vapor.init(.{});
    // Register themes
    Vapor.setGlobalStyleVariables(.{
        .themes = &[_]Vapor.ThemeDefinition{
            Vapor.ThemeDefinition{ .name = "light", .theme = Theme.Light, .default = true },
            Vapor.ThemeDefinition{ .name = "dark", .theme = Theme.Dark },
        },
    });

    Vapor.Page(.{ .route = "/" }, App, null);
}

fn App() void {
    Box()
        .width(.percent(100))
        .height(.px(60))
        .padding(.all(16))
        .background(.palette(.background))
        .border(.round(.palette(.border_color), .all(8)))
        .layout(.x_between_center)
        .children({

        // Left side with icon and text
        Box()
            .layout(.left_center)
            .spacing(12)
            .children({
            Icon(.home)
                .font(20, 400, .palette(.tint))
                .end();
            Text("Welcome to Vapor")
                .font(18, 500, .palette(.text_color))
                .end();
        });

        // Theme toggle button
        Button(Theme.toggleTheme)
            .padding(.tblr(8, 8, 12, 12))
            .background(.palette(.primary))
            .border(.round(.palette(.border_color), .all(6)))
            .pointer()
            .children({
            Icon(.cloud_moon)
                .font(16, 400, .palette(.text_color))
                .end();
        });
    });
}
```

---

{#benefits-over-external-libraries}

## Benefits Over External Libraries

| Feature         | External Libraries | Vapor Icons             |
| --------------- | ------------------ | ----------------------- |
| Type safety     | ❌ String-based    | ✅ Compile-time checked |
| Auto-completion | ❌ None            | ✅ Full IDE support     |
| Bundle size     | ❌ Full icon font  | ✅ Only used icons      |
| Typo protection | ❌ Silent failures | ✅ Compile errors       |
| Cross-platform  | ❌ Web-only        | ✅ Web + Native SVG     |
