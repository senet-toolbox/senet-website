{#what-is-vapor}

# What is Vapor?

#### A framework without all the ceremony.

_"Vapor isn't trying to be React in Zig. It's showing what's possible when your framework disappears at compile time."_

```jsx
// JSX Frameworks
function Counter() {
  // useState hooks, batching, and magic
  const [count, setCount] = useState(0);

  function increment() {
    setCount((c) => c + 1);
  }

  return <button onClick={increment}>{count}</button>;
}
```

#### Vapor manages state for you

Vapor keeps state throughout the entire lifecycle—navigation, re-renders, everything. No _context_, no _stores_, no _prop drilling_. Just **functions** and **simple** programming.

```zig
// Vapor
var count: i32 = 0;
fn increment() void { count += 1; }

fn Counter() void {
    Button(increment).children({
        Text(count).end();
    });
}
```

@counter

{#quickstart}

## Quickstart

#### Build small blogs, to full-blown production apps, without installing a single dependency.

@video

%curl -sSL https://raw.githubusercontent.com/tether-labs/metal/main/install.sh | bash

%metal create vapor my-app

%cd my-app && metal run web

{#vapor-is-simple}

## Vapor is simple by nature

- **Small bundle sizes** - _Hello World_ in only **28kb**, including router, hooks, reactivity, and more
- **No special syntax** - just normal programming
- **Powerful Styling** - `.layout(.center)`, `.grid(16, 1, .palette(.grid_color))`

{#how-it-works}

### How it works

**Server-Side Pre-rendering**
Vapor compiles your Zig components into static HTML at build time. This is sent to the browser for an instant, SEO-friendly first paint.

**Client-Side Hydration**
The browser also receives your compact _`vapor.wasm`_ binary, and a thin JS glue bridge. This WASM binary runs and **hydrates** the static HTML,
seamlessly taking control of the page.

**Native Performance Runtime**
From that point on, all UI updates, routing, and logic are handled directly by high-performance WebAssembly, not JavaScript, giving you a smooth, native-like feel in the browser.

**You write Zig, it compiles to WASM, it runs in the browser. That's it.**

{#why-zig}

### Why Zig?

Zig compiles to tiny, fast WebAssembly binaries.
No garbage collector means predictable performance. And unlike Rust,
Zig's syntax is straightforward.

Just like some of you, I came from the Javascript world, 2 years ago I started writing Zig, and 1 year ago I started building Senet.

Don't be afraid of the syntax, or the dreaded **Memory Management**, all will be explained, and you'll come to find that
Vapor makes it easy to write performant, native-like UIs,
with _minimal to no memory management._

**A Note on Syntax**

- `.end()` closes leaf elements (no children)
- `.children({})` wraps elements that contain others
- The `{}` block runs first, adding children before the parent closes
