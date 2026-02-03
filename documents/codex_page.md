{#codex-engine}

# Codex Engine

The Codex Engine refers to Vapor's core rendering engine, and is responsible for generating the render commands.

**Vapor is a compiled instruction engine for the web.**

Traditional frameworks parse templates and manage heavy Javascript runtimes.
**Vapor** compiles native Zig functions into a compact binary of render commands.
Despite compiling to binary instructions, Vapor is fully inspectable.

Vapor treats the browser like a graphics driver, you create the UI with simple functions, and then
Vapor & Zig work together to compile your UI into a compact, optimized set of instructions.
These instructions are sent to the DOM only when necessary.
No strings, no parsing, just direct-to-metal UI performance.

This gives Vapor the unique capability, of writing standard declarative UI code,
that compiles down to a high-performance runtime with a dramatically reduced memory footprint.

{#how-it-works}

## How it works

1. Write your UI.
2. Compile into optimized instruction function calls.
3. Generate a Virtual Tree by calling these instructions.
4. Reconcile the Virtual Tree against the old tree.
5. Generate a set of Render Commands:
   - Dirty Nodes
   - Added Nodes
   - Removed Nodes
6. Schedule a UI update.
7. Render the UI via native Web APIs.

We write our UI using the functions that Vapor exposes, like `Text`, `Button`, and `Box`.
These functions follow a unified builder pattern. This allows Zig and LLVM to generate identical machine code for the
internal logic of every builder, meaning we do not need to compile unique boilerplate for every component. We use one shared function for all builders.

This is further optimized by how Vapor handles tree generation. In a typical React environment, the runtime must transpile and read every specific element (e.g.,
`<p>Hello</p>`) to generate a DOM element (`document.createElement("p").textContent = "Hello"`). This compilation overhead occurs for every unique element in your application.

Vapor, conversely, uses the UI logic itself to generate the tree via a `LifeCycle` struct.

```zig
/// The LifeCycle struct
/// Allows control over a UI node in the tree.
/// Exposes open, configure, and close, which must be called in order.
pub const LifeCycle = struct {
    /// open takes an element decl and returns a *UINode
    /// This opens the element to allow for children.
    /// Within the tree, this newly opened node becomes the top of the stack;
    /// any subsequent children will reference this node as their parent.
    pub fn open(elem_decl: ElementDecl) ?*UINode {
        const ui_node = current_ctx.open(elem_decl) catch |err| {
            println("{any}\n", .{err});
            return null;
        };
        return ui_node;
    }
    /// close closes the current UINode
    pub fn close(_: void) void {
        _ = current_ctx.close();
        return;
    }
    /// configure is used internally to configure the UINode (e.g., adding text or hover props).
    /// We check if the node has an ID (using it if so, or generating one later).
    /// Any manipulation of the node after this point is considered undefined behavior.
    pub fn configure(elem_decl: ElementDecl) void {
        _ = current_ctx.configure(elem_decl);
    }
};
```

{#example}

## An Example

#### The Core Concept: Stack-Based Tree Building

Vapor does not build a virtual tree by allocating objects and linking them manually., instead it builds it via **side effects**
on a global stack.

This process relies on three functions: `open`, `configure`, and `close`.

1. `open` Pushes a node onto the global stack.
2. `configure` Applies styles and attributes to the current node.
3. `close` Pops the node off the stack.

### Step by Step Execution

```zig
Box().center().children({
    Text("Hello");
});
```

#### Box() The Constructor

Box() is called to, which in turn calls the `open` function, this pushes the Box Node onto the global stack.
This Node is now the "Current Parent".

The returned `Self` struct is the Builder struct itself, and now contains a pointer to the open `ui_node`.

```zig
pub fn Box(value: anytype) Self {
    ///... implementation details

   const elem_decl = ElementDecl{
        .state_type = _state_type,
        .elem_type = .Box,
    };

    const ui_node = LifeCycle.open(elem_decl) orelse {
        Vapor.printlnSrcErr("Could not add component Link to lifecycle {any}\n", .{error.CouldNotAllocate}, @src());
        unreachable;
    };

    return Self{
        ._elem_type = .Box,
        ._ui_node = ui_node,
    };
}
```

#### center() The Style Function

The builder method .center() is called on the result of Box().
**Engine State**: No change. This is purely a local Zig memory operation.
It copies the Builder struct, modifies the \_layout field, and returns the new struct. The UI tree is untouched.

```zig
pub fn center(self: *const Self) Self {
    var new_self: Self = self.*;
    new_self._layout = .center;
    return new_self;
}
```

#### Argument phase { Text("Hello") }

This is the most critical part. In Zig, function arguments are evaluated before the function is called.
Therefore, the block passed to .children(...) runs before .children executes.

Inside the block, we call Text("Hello"). This calls the `open` function, which pushes the Text Node onto the global stack.

#### Engine State:

1. The engine looks at the stack.
2. It sees the Box (from Step 1) is at the top.
3. It attaches Text as a child of Box.
4. It pushes Text onto the stack.
5. Since Text is a leaf, we immediately call close, popping itself off the stack.

The returned `Self` struct is the Builder struct itself, and now contains a pointer to the open `ui_node` which is the Text Node.

#### The Function Body: .children(...)

Now that the block (the argument `_: void`) has finished executing, the children function body finally runs.

The children function executes using the Self struct from Step 2 (which contains the .center() style of the Box Node).

1. **Aggregation:** It gathers all the styles (layout, padding, visuals) from the Self struct into a Style object .
2. **Configuration:** It calls Vapor.LifeCycle.configure(elem_decl). This applies the "center" layout to the Box node (which is still sitting open on the stack).
3. **Closure:** It calls Vapor.LifeCycle.close({}).

The Box() node is popped off the stack, and we can now continue to the next function call.

```zig
pub fn children(self: *const Self, _: void) void {
    ///... implementation details
    Vapor.LifeCycle.configure(elem_decl);
    return Vapor.LifeCycle.close({});
}
```

#### \_: void

The Syntax: \_: void means the function expects an argument of type void.

The Trick: A block in Zig { ... } evaluates to the value of its last statement. If the last statement is a semicolon or empty, it returns void.

The Purpose: It forces the developer to write a code block that executes prior to the configuration of the parent.

This architecture allows Vapor to be incredibly memory efficient.
It only allocates the lightweight Self structs temporarily on the stack to gather configuration data,
and then discards them immediately after the node is closed.

Above `_: void` is a special trick in Zig, (some call it **cursed**). This allows us to call the inner function first, but only return after the void argument has run.

{#comparison-to-typical-frameworks}

## Comparison to Typical Frameworks

### Compiler stage

The compiler stage is illustrated in the diagram below.
This is a simplified version of how compilers work, but since we use Zig, we inherit all its optimization and compilation benefits.
We also use LLVM to generate WebAssembly and wasm-opt to optimize the binary.

This results in an average 40x reduction in size. For example, the debug version of this documentation site is 7MB, while the release version is only 180KB.

@compiler_image

### Binary Deduplication

In the example below, we create 3 text elements in Svelte:

```svelte
<script>
	let step1 = 1;
	let step2 = 2;
	let step3 = 3;
</script>

<p>{step1}. Svelte</p>
<p>{step2}. Output</p>
<p>{step3}. Example</p>
```

#### Svelte Compiled result

When looking at the resulting compiled code,
we can see that multiple versions of the same elements are created.
Each is essentially the exact same code but with different arguments.
While the state management is compiled away, we are left with duplicated source code sent to the browser.

```js
import "svelte/internal/disclose-version";
import "svelte/internal/flags/legacy";
import "svelte/internal/flags/async";
import * as $ from "svelte/internal/client";

var root = $.from_html(`<p></p> <p></p> <p></p>`, 1);

export default function App($$anchor) {
  let step1 = 1;
  let step2 = 2;
  let step3 = 3;
  var fragment = root();
  var p = $.first_child(fragment);

  p.textContent = "1. Svelte";

  var p_1 = $.sibling(p, 2);

  p_1.textContent = "2. Output";

  var p_2 = $.sibling(p_1, 2);

  p_2.textContent = "3. Example";
  $.append($$anchor, fragment);
}
```

{#vapor-difference}

### Vapor Difference

You might argue that in Svelte you would use an {#each} loop to remove duplication.
However, not every element exists in a loop. Vapor dedupes all common elements at the core level, even across different pages.

In Svelte or React, you must manually extract common HTML elements into components to prevent code duplication.
In Vapor, there is only one single function call for each element type (like Text or Box) across the entire application.

This is why Vapor achieves such a small footprint.
For context, a single server-side rendered documentation page on [Next.js](https://nextjs.org/docs) is approximately 800KB of JavaScript.
Vapor's entire documentation site, with client-side rendering, is only 180KB.

#### The "Stamp" vs. "Sketch" Analogy

To understand why Vapor is so small, we have to look at how the machine code is generated.

In typical JavaScript frameworks, compiling a UI often acts like a Sketch. If you need three buttons, the compiler often writes
out the instructions to create Button A, then writes out the instructions to create Button B, and then Button C.
Even though they are similar, the specific "setup" code is repeated for every element in your application. As your app grows, your bundle size grows linearly.

Vapor acts like a Rubber Stamp. Because we compile to a native binary (WASM) using LLVM, the logic for how to create a
Button exists in memory at exactly one address.

Compared to other frameworks, Vapor gains the benefit of running like a game engine. Svelte, React,
and others may differentiate in how they handle and reconcile state changes, but they implement similar concepts regarding UI creation.

When you write:

```zig
Box().children({
    Text("Step 1");
    Text("Step 2");
    Text("Step 3");
});
```

The compiler does not generate the code for `Text` three times.
Instead, it generates the `Text` function **once** in the binary's "Text Section" (executable instructions).
The application then simply makes three lightweight function calls (jumps) to that same memory address, passing different arguments
("Step 1", "Step 2", etc.) each time.

{#instructions-vs-information}

### Instructions vs Information

**Instructions (The Logic):** The machine code that knows how to build the DOM, handle styles, and manage layout. This is constant.

**Information (The Arguments):** The strings, colors, and integers you pass in.

In the Svelte example previously shown, the compiler generated unique setup lines for every paragraph `(p.textContent = ..., p_1.textContent = ...)`.

In Vapor, adding 1,000 more text elements to your page adds almost zero overhead
to the logic size of your binary. It only adds the tiny footprint of the strings themselves and the function call instructions.
This is why Vapor scales like a game engine rather than a web page.
