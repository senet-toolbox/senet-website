{#project-structure}

# Project Structure

Project structure in Vapor, is really up to you, by default Vapor, uses the routes directory to hold all the routes.
Vapor, as you know, Web, and more are to come. Other than that, you can create any folder, and import whatever you want, the routes directory is just
used for when we make use of the `@src()` function.

![Diagram](/assets/project_structure.svg)

- The **/web** directory holds the wasm bridge files, for connecting JS to vapor.wasm.
- The **/src** directory hold `main` and `routes`, and anything else you want to use or create.

```zig
// 📁 main.zig
const Vapor = @import("vapor");
const Vaporize = @import("vaporize");
const Docs = @import("routes/docs/Docs.zig");
const Home = @import("routes/users/DateUsersPage.zig");
const Home = @import("routes/home/Page.zig");

// Page initialization
pub fn init() void {
    Vapor.init(.{});
    Vapor.Page(.{ .route = "/" }, Home, null);
    Vapor.Page(.{ .route = "/docs" }, Docs, null);
    Vapor.Page(.{ .route = "/app/data/:users" }, Users, null);

    // Or use @src() for file-based routing
    Home.init();
}
```

```zig
// 📁 /routes/home/Page.zig
const Vapor = @import("vapor");
pub fn init() void {
    Vapor.Page(.{ .src = @src() }, render, null);
}
```
