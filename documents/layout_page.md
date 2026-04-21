{#layouts}

# Layouts

Layouts are a powerful tool for building complex UIs.
They allow you to create a hierarchy of components that can be nested and positioned in a flexible way.
Components rendered within a layout, will render in every sub path of the origin route.

origin route: `/app`, then Navbar will render in `/app/about` and `/app/contact`.

```zig
fn registerLayouts() !void {
    try Vapor.registerLayout("/app", layout, .{});
    try Vapor.registerLayout("/docs", layoutDocs, .{ .reset = true });
}

pub fn layout(page: Vapor.PageFn) void {
    Navbar.render();
    page();
}

pub fn layoutDocs(page: Vapor.PageFn) void {
    DocsNavbar.render();
    page();
    Footer.render();
}
```

Every framework has its own way of defining layouts. Vapor uses a explicit functional approach, you can register a layout
anywhere in your codebase.

{#register-layout}

### registerLayout(string, LayoutFn, LayoutOptions)

`LayoutFn` is a function that takes a `page: PageFn` function as an argument, and renders the page within the layout.
`PageFn` is the same function that we use in `Page()` functions, it is nothing more than an alias for `*const fn () void`.

`.reset` is a field that is used to reset the layout hierarchy, this is useful for when you want to use a different layout in the same route path.

```zig
fn registerLayouts() !void {
    try Vapor.registerLayout("/app", layout, .{});
    try Vapor.registerLayout("/app/about", layoutAbout, .{ .reset = true });
}

pub fn layout(page: Vapor.PageFn) void {
    Navbar.render();
    page();
}

pub fn layoutAbout(page: Vapor.PageFn) void {
    About.render();
    page();
}
```

Now when we navigate to `/app/about`, the layout will be reset, and the About component will render. And the Navbar will not.
If we were to remove the `.reset` field, then the About component would render within the Navbar layout.
