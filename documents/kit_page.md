{#kit}

# Kit

Vapor Kit is a utils module which contains the functions for fetching, navigation, parsing, url encoding and decoding.

{#fetch}

## Fetch

`fetch` is a simple wrapper fucntion that takes a url, and a Request struct, and returns a Fetch struct.

```zig
const std = @import("std");
const Vapor = @import("vapor");
const Kit = Vapor.Kit;

pub export fn init() void {
    Vapor.init(.{});
    Vapor.Page(.{ .route = "/" }, render, null);
}

fn render() void {
    var f = Kit.fetch("https://some-api.com/todos/1", .{
        .method = .GET,
    });

    f.debug = true;
    f.handle(handleResponse);
}

fn handleResponse(response: Kit.Response) void {
    switch (response) {
        .Ok => |data| {
            std.debug.print("Status: {d}\n", .{response.status});
            std.debug.print("Body: {s}\n", .{response.body});
        },
        .Err => |err| {
            std.debug.print("Error: {s}\n", .{err.message});
        },
    }
}
```

The returned `Fetch` struct contains the following fields, and a `handle` function that takes a callback function.
The handle callback takes a Response struct, as an argument. The response must first be checked for `.Ok` or `.Err` before
accessing the body. This enforces developers to handle errors and success states.

The callback function approach leads a very simple request lifecycle:

1. We create a fetch request

```zig
var loading: bool = false;
fn getTodo() void {
    loading = true;
    Kit.fetch("https://some-api.com/todos/1", .{ .method = .GET }).handle(handleResponse);
}
```

2. Handle the response

```zig
fn handleResponse(response: Kit.Response) void {
    switch (response) {
        .Ok => |data| {
            // Do something with the response
        },
        .Err => |err| {
            // Handle the error
        },
    }
    loading = false;
}
```

3. Render the UI

```zig
Row().width(.percent(100)).spacing(8).padding(.tb(16, 16)).layout(.center).children({
    if (loading) {
        Text("Loading...").font(16, 400, .palette(.text_color)).end();
    } else {
        Text("Hello, world!").font(16, 400, .palette(.text_color)).end();
    }
});
```

Fetch struct also contains its own state, so you can use it in your own components.

```zig
const std = @import("std");
const Vapor = @import("vapor");
const Kit = Vapor.Kit;

var current_fetch: ?*Kit.Fetch = null;
pub export fn init() void {
    Vapor.init(.{});
    Vapor.Kit.new();

    current_fetch = Kit.fetch("https://some-api.com/todos/1", .{
        .method = .GET,
    });
    current_fetch.?.handle(handleResponse);

    Vapor.Page(.{ .route = "/" }, render, null);
}

fn handleResponse(response: Kit.Response) void {
    switch (response) {
        .Ok => |data| {
            std.debug.print("Status: {d}\n", .{response.status});
            std.debug.print("Body: {s}\n", .{response.body});
        },
        .Err => |err| {
            std.debug.print("Error: {s}\n", .{err.message});
        },
    }
}

fn render() void {
    if (current_fetch) |f| {
        switch (f.state()) {
            .idle => {
                Text("Idle").font(16, 400, .palette(.text_color)).end();
            },
            .loading => {
                Text("Loading...").font(16, 400, .palette(.text_color)).end();
            },
            .ok => {
                Text("Hello, world!").font(16, 400, .palette(.text_color)).end();
            },
            .err => {
                Text("Error!").font(16, 400, .palette(.text_color)).end();
            },
        }
    }
}
```

Typically, in application the state of a fetch request and the UI are decoupled, but in Vapor, we have a single source of truth.
