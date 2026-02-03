{#events-and-handlers}

# Events and Handlers

Events and Handlers in Fabric use a very similar approach to fetching.
We pass a callback which is called when an event is triggered.

![Diagram](/assets/event.svg)

There are element event listeners and global event lisenters.
Each takes a callback function and returns the callback id, which can then be used to unMount the listener.

{#basic-event-listener}

### Basic event listener

Here is a basic example of an global event listener. Which listens for the `keydown` event, and then checks if the key pressed is `k` and the meta key is pressed.

```zig
const Vapor = @import("vapor");

fn onKeyPress(evt: *Vapor.Event) void {
    const key = evt.key();
    if (std.mem.eql(u8, key, "k") and evt.metaKey()) {
        evt.preventDefault();
        Vapor.println("Open dialog\n", .{});
    } else if (std.mem.eql(u8, key, "Escape")) {
        evt.preventDefault();
        Vapor.println("Close dialog\n", .{});
    }
}

fn mount() void {
    // Here we set globally and event listener for onKeyDown
    Vapor.eventListener(.keydown, onKeyPress);
}
```

All we have to do is call `Vapor.eventListener` and pass in the event type, and the callback function.
The event system is very similar to how native web events work, when rendering to IOS, the same system will be used.
There is no need to change or alter the syntax or code.

{#binded-event-listener}

### Binded event listener

Binded is a struct that contains functions and fields of a native element, we can attach event listeners and mutate the underlying element.
We first create a binded element width `Binded{}`, and then attach a listener to it. By default, Vapor will auto attach ids to the binded element,
and update the values. For example, there is no need to do the typical `getText` and `setText` implementation.

```zig
const std = @import("std");
const Vapor = @import("vapor");
const Binded = Vapor.Binded;
const Static = Vapor.Static;
const TextField = Static.TextField;
const Text = Static.Text;

var binded_textfield: Binded = Binded{};
fn onWrite(evt: *Vapor.Event) void {
    const input_text = evt.text(); // this is from the event itself
    Vapor.println("{s}", .{input_text});
}

var listener_id: ?u32 = null;
fn mount() void {
    // here we attache a listener to the element itself
    listener_id = Vapor.addListener(binded_textfield.element, .keydown, onKeyPress);
}

fn destroy() void {
    // Here we remove the listener
    if (listener_id) |id| {
        Vapor.removeListener(id);
    }
}

pub fn render() void {
    // Hooks calls to mount when all its children have been added to screen.
    Static.Hooks(.{ .mounted = mount, .destroy = destroy })({
        TextField(.string)
            .bind(&binded_textfield)
            .onChange(onWrite)
            .plain();
    });
    Text(binded_textfield.text).plain(); // binded_textfield.text is updated automatically
}
```

{#type-safety}

### Type safety

Since we are using Zig, Vapor is type safe, and will not allow for events to be called on the wrong element.
For example, a `click` event will not work on non-buttons, or non-links Components, similarly, an `onChange` event will not work on a non-textfield
component. Vapor will return an error if this occurs.

{#field-saftey}

### Field saftey

Similarly, Vapor will disallow specific fields from being set, or retrieved from the element. The `key` field is not allowed on a Box component,
or a Text component, ect.
