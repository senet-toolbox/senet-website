{#what-is-vapor}

# What is Vapor?

#### A framework without all the ceremony.

_"Vapor isn't trying to be React in Zig. It's showing what's possible when your framework disappears at compile time."_

#### Vapor manages state for you

Vapor keeps state throughout the entire lifecycle—navigation, re-renders, everything. No _context_, no _stores_, no _prop drilling_. Just **functions** and **simple** programming.

```zig
// Vapor
var count: i32 = 0;
fn increment() void { count += 1; }

fn Counter() void {
    // callback, .{ ..args.. }
    Button(increment, .{}).children({
        Text(count).end();
    });
}
```

@counter

As opposed to the typical JS approach:

```jsx
// JSX Frameworks
function Counter() {
  // useState hooks, batching, and magic
  const [count, setCount] = useState(0);

  function increment() {
    setCount((c) => c + 1);
  }

  return <button onClick={() => increment()}>{count}</button>;
}
```

{#quickstart}

## Quickstart

#### Build small Blogs to full-blown production apps, without installing a single dependency.

@video

%curl -sSL https://raw.githubusercontent.com/senet-toolbox/metal/main/install.sh | bash

%metal create vapor my-app

%cd my-app && metal run web

{#vapor-is-simple}

## Vapor is simple by nature

- **Bundle sizes that don't grow** — A hello world is 65KB (Brotli). A full Shadcn-style component library site with its own chart lib, data tables, dashboard templates, and kanban boards? 453KB. A Sentry/Supabase/Postman-scale dashboard? 379KB. Zero external dependencies for any of it.
- **Back to the Basics** - Your components are Zig functions. Your state is variables. Your events are function calls. That's the whole API.
- **Powerful Styling** - Styling is built into the component API, no CSS files or class strings needed.

{#how-it-works}

### How it works

**Server-Side Pre-rendering**
Vapor compiles your Zig components into static HTML at build time. This is sent to the browser for an instant, SEO-friendly first paint.

**Client-Side Hydration**
The browser also receives your compact _`vapor.wasm`_ binary, and a thin JS glue bridge. This WASM binary runs and **hydrates** the static HTML,
seamlessly taking control of the page. These are both in sync, since they are generated from the same source code and engine.

**Native Performance Runtime**
From that point on, all UI updates, routing, and logic are handled directly by high-performance WebAssembly, not JavaScript, giving you a smooth, native-like feel in the browser.

**You write Zig, it compiles to WASM, it runs in the browser. That's it.**

{#why-zig}

### Why Zig?

Zig compiles to tiny, fast WebAssembly binaries.
No garbage collector means predictable performance. And unlike Rust, Zig's syntax is straightforward.

Vapor makes it easy to write performant, native-like UIs, with _minimal to no memory management._
