{#performance}

# Performance

Performance, is a major concern in all of Tether. It is one of the core reasons why I chose Zig, and why I built Tether.

{#memory-speed-runtime}

## Memory, Speed, Runtime

{#memory}

### Memory

Vapor, is highley optimized for memory usage. While A Hello World example in debug mode is 2.2MB, in release mode
this drops down to 28kb of memory.

**For context:**

- React + ReactDOM (minified): ~130KB

- Vue 3 (minified): ~110KB

- Svelte runtime: ~5KB

- **Vapor Hello World: 33KB** ✨

This documentation site, is originally 7MB, in release mode, it drops down to 150kb. a 40x reduction in memory usage.

The compression ratio improves with larger applications,
plateauing around 40x for production sites. Larger apps
benefit more from dead code elimination and deduplication.

{#speed-runtime}

### Speed, Runtime

> ⚠️ All tests are run on a 2021 M1 MacBook M1 Pro.

Out the gate, Vapor handles rendering **1,000 rows** in (~50-55ms), and updating in (2-3ms).
With **10,000 rows**, (~450ms), for rendering and (2-3ms) updating.

Compare this to traditional frameworks:

- React: ~1000 rows **create** (~60ms), **update** (20ms).

- React: ~10000 rows **create** (544ms), **update** (94ms).

- Svelte: ~1000 rows **create** (50ms), **update** (17ms).

- Svelte: ~10000 rows **create** (347ms), **update** (108ms).

This is possible because Vapor's reconciliation runs in WASM
with linear memory, then sends a compact diff to the DOM
rather than traversing JavaScript objects. Moreover, Vapor at runtime, compacts styles, and removes dead css.
Resulting in a lower memory footprint, and faster rendering.

{#default-mode}

## Default Mode

By default, Vapor, will dedupe styles, reconcile pure nodes that are dirty, remove, update, and add nodes. Without the need for
any state management, external dependencies, configuration or build flags. The point of Vapor and Tether as a whole, is to focus on your
application, and not build systems or configuation.

{#full-stack}

## The Full Stack

Tether isn't just a frontend framework. Running a single
command spins up:

**Frontend (Vapor):**

- 10,000+ node updates at 60fps

- 20KB total bundle size

- Zero-config reactivity

**Backend (Reverb):**

- 220K requests/second (M1 MacBook Pro)

- HTTP/WebSocket support

- Zero external dependencies

**Database (Canopy):**

- SQL and RESP protocol support

- In-memory hashmap performance

- Embedded or standalone modes

All from one `metal release` command. No Docker, no config
files, no dependency hell.
