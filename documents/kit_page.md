{#kit}

# Kit

Vapor Kit is a utils module which contains the functions for fetching, navigation, parsing, url encoding and decoding.

Vapor is a frontend framework, and takes a hard stance on the underlying fetching system. **It is callback based**.

{#why-callbacks}

## Why Callbacks again?

**Reverb** is a backend framework, and should be the main engine for handling requests, parsing and overall data processing.
Instead of fetching, `/users` and then `/users/posts` and then `/users/posts/comments` we can fetch `/users` once, from the server,
returning all the data necessary on the client side.

**Callbacks** were introduced to deter developers from performing multiple requests, or doing processing on the client side.
Client side frameworks should be focused on rendering content, and interaction, not data processing. This is fundamentally a server side problem.

**🔥Callback Hell is a decision, not a feature.🔥**

Kit also contains a set of functions for interacting with the browser, or native APIs, such as `Clipboard`, and `Storage`.

![Diagram](/assets/wasi_bridge.svg)

While the above does look complex in implementation, usage is quite simple.
In the future fetching will become even simpler with greater integration of WASM and JS.

{#example}

## Example

Vapor adopts a straightforward, callback-based approach for handling HTTP requests and responses,
viewing the application as a static state machine.

This means all application code executes sequentially, without waiting for asynchronous operations to complete.
Such a design compels a more deliberate consideration of the application's state when data is not yet available.

![Diagram](/assets/fetching.svg)

The above diagram, compels developers to handle cases where data is not yet available, or is being fetched.
This improves the user experience, and makes the application feel more responsive.

{#fetch}

## fetch(url, callback, http_req)

Performs asynchronous HTTP requests to the specified URL with customizable headers, body, and request options, executing the provided callback when the response is received.

```zig
const Kit = @import("vapor").Kit;

const Users = struct {
    uuid: []const u8,
    name: []const u8,
    email: []const u8,
};

var users: []Users = undefined;

fn getUsers() void {
    Kit.fetch("http://localhost:8443/api/users", handleUsers, .{
        .method = .GET,
        .credentials = "include",
    });
}

fn handleUsers(resp: Kit.Response) void {
    const parsed = Kit.glue([]Users, resp.body) catch {};
    users = parsed.value;
}
```

{#fetchCtx}

## fetchCtx(url, ctx, callback, http_req)

Similar to fetch but includes additional context argument, allowing for more complex callback scenarios where state needs to be passed through the request lifecycle.

```zig
const Kit = @import("vapor").Kit;

const LocalCtx = struct { message: []const u8 };

fn sendExampleRequest() void {
    const json_body = "{\"message\": \"Hello from Vapor!\"}";
    const ctx = LocalCtx{ .message = "Local State" };

    // Perform a POST request with JSON body
    Kit.fetchCtx("http://localhost:8080/api/example", ctx, handleResponse, .{
        .method = "POST",
        .body = json_body,
        .credentials = "include", // optional: include cookies
        .headers = .{
            .content_type = "application/json",
        },
        .body_type = .string, // indicates the body is a plain string
    });
}


fn handleResponse(ctx: LocalCtx, resp: Kit.Response) void {
    Fabric.printlnSrc("Passed ctx: {s} Response status: {d}", .{ctx.message ,resp.code}, @src());

    if (resp.body) |body| {
        Fabric.printlnSrc("Response body: {s}", .{body}, @src());
    } else {
        Fabric.printlnSrc("No response body", .{}, @src());
    }

    // Example routing logic based on response code
    if (resp.code == 200) {
        Kit.routePush("/success");
    } else {
        Kit.routePush("/error");
    }
}

```

{#navigate}

## navigate(url)

Navigates to the specified URL.

```zig
Kit.navigate("/app/about");
```

{#routePush}

## routePush(url)

Pushes a new route onto the stack.

```zig
Kit.routePush("/app/about");
```

{#getWindowPath}

## getWindowPath()

Returns the current window path.

```zig
const path = Kit.getWindowPath();
```

{#getWindowParams}

## getWindowParams()

Returns the current window params.

```zig
const params = Kit.getWindowParams();
```

{#persist}

## persist(key, value)

Persists a value in local storage.

```zig
var counter: i32 = 0;
Kit.persist("counter", counter);
```

{#getPersist}

## getPersist(key)

Retrieves a persisted value from local storage.

```zig
const counter = Kit.getPersist(i32, "counter") orelse 0;
```
