{#routing}

# Routing

Routing in vapor works off of the directory structure of your project using `@src()`, or hardcoded strings `/app/about`.
to use dynamic routes, you have to either set the directory to `:slug` or use a static string, like `/app/about/:slug`.

When using the `@src()` union tag, the `.zig` file must be located within `routes/` directory, for example `routes/app/about/page.zig`.

![diagram](/src/assets/routes.svg)

{#page-sample}

## Using Page()

Routes should be declared once, it is common convention to either put them in the `init()` function of main.zig, or in an `init()` function within the
`....zig` file, you are working on.
by using the `Page` function, you can easily define your routes.

```zig
// /main.zig
const Vapor = @import("vapor");
const Page = Vapor.Page;

// Page initialization
pub fn init() void {
    Page(.{ .src = @src() }, render, deinit); // this will refer to "/" since we are in main.zig
    // or
    Page(.{ .route = "/app/about" }, render, deinit); // this will refer to "/app/about"
}

// page deinitialization
pub fn deinit() void {
    Vapor.print("i get called when you navigate away from this page", .{});
}

pub fn render() void {
    Text("i get rendered when you navigate to this page").end();
}
```

Or within the `.zig` file level _("/routes/app/about/page.zig")_

```zig
// /routes/app/about/page.zig
const Vapor = @import("vapor");
const Page = Vapor.Page;
const Text = Vapor.Text;

// page initialization
pub fn init() void {
    Page(.{ .src = @src() }, render, deinit); // this will refer to "/app/about" since we are in /routes/app/about/page.zig
}

// page deinitialization
pub fn deinit() void {
    Vapor.print("i get called when you navigate away from this page", .{});
}

pub fn render() void {
    Text("i get rendered when you navigate to this page").end();
}
```

`Page()` is the entry point for your routes render and deinit functions, these are called when you navigate to and from routes.
it takes 3 arguments,

- either `@src()` or `"/..."`

- `renderfn`

- `deinitfn`

`@src()` is a builtin function that returns the current source location.

Vapor takes a function approach, you need to call `Vapor.Page()` to declare your routes. or the corresponding functions within the `.zig` file.

With the above example, we call our `Page(...)` function, within the `init()` function of `main.zig`. like this:

#### routes/app/about/page.zig

```zig
// /routes/app/about/page.zig
const Vapor = @import("vapor");
const Page = Vapor.Page;

// page initialization
pub fn init() void {
    Page(.{ .src = @src() }, render, deinit); // this will refer to "/app/about" since we are in /routes/app/about/page.zig
}
```

#### main.zig

```zig
// /routes/app/about/page.zig
const Vapor = @import("vapor");
const AboutPage = @import("routes/app/about/page.zig");

// page initialization
export fn init() void {
    Vapor.init(.{});
    AboutPage.init();
}
```

**Note:** Don't forget to mark functions as `pub` if you want to call them from other files.
