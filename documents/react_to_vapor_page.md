# Web-Dev to Vapor Cheat Sheet

This guide helps developers transition from **React**, **Vue**, or **Svelte** to the high-performance world of **Vapor**. While traditional frameworks manage heavy JavaScript runtimes, Vapor acts as a compiled instruction engine that treats the browser like a graphics driver.

## 1. Conceptual Mapping

| Feature | React / Vue / Svelte Habit | Vapor Paradigm | Mental Shift |
| :--- | :--- | :--- | :--- |
| **Component Body** | Re-runs on every change (React) or uses Observers (Vue/Svelte). | The `render()` function runs as a native instruction pass. | From "Component Instance" to "Render Loop Instruction". |
| **State Persistence** | `useState`, `ref`, or `$state`. | normal variables living **outside** `render()`. | Data and UI are separate; no "rescuing" variables is needed. |
| **Side Effects** | `useEffect`, `watch`, or `$effect`. | Procedural logic within Event Handlers or functional triggers. | Move away from implicit subscriptions to explicit Zig logic. |
| **Conditional UI** | `{cond && <UI />}`, `v-if`, or `{#if}`. | Standard Zig `if` or `switch` statements. | Use native programming control flow instead of template syntax. |
| **List Rendering** | `.map()`, `v-for`, or `{#each}`. | Standard Zig `for` and `while` loops iterating over arrays or slices. | Direct iteration over memory-contiguous data. |


## 2. Reactivity & State Logic

In JavaScript frameworks, state is often "reactive" via proxies or setters. In Vapor, the **UI is reactive**, not the variables.

| Task | React (useState) | Vue (ref) | Svelte ($state) | **Vapor (Zig)** |
| :--- | :--- | :--- | :--- | :--- |
| **Declare State** | `const [val, setVal] = useState(0);` | `const val = ref(0);` | `let val = $state(0);` | `var val: u32 = 0;` |
| **Update State** | `setVal(v => v + 1);` | `val.value++;` | `val += 1;` | `val += 1;` |
| **Derived State** | `useMemo(() => val * 2, [val])` | `computed(() => val.value * 2)` | `let double = $derived(val * 2)` | Zig function or variable. |

> **Note:** Vapor's **Atomic Mode** detects these direct mutations during events and performs fine-grained updates to the DOM only where necessary.

## 3. Lifecycle & Hooks

Vapor replaces the complex hook system with predictable Zig entry points.

| Lifecycle Event | React Hook | **Vapor Lifecycle / Hook** |
| :--- | :--- | :--- |
| **Initial Load** | `useEffect(fn, [])` | `pub fn init() { ... }` (Global) or `.mounted` (Component). |
| **Component Mount**| `useLayoutEffect` | `Hooks(.{ .mounted = func })`. |
| **Data Cleanup** | `return () => cleanup` | `.destroyed` hook or `deinit` function in Routing. |
| **Route Navigation**| `useNavigate` | `Vapor.Kit.navigate("/url")`. |

## 4. Memory Management: The "Web Dev Hack"

Because WASM has a fixed memory linear buffer, you must manage it. Vapor simplifies this using **Arenas**.

| Arena Type | Equivalent JS Concept | When to use it in Vapor |
| :--- | :--- | :--- |
| **`.frame`** | Local variables in a function. | Temporary data used only for the current render frame (e.g., formatting strings). |
| **`.view`** | Data scoped to a specific URL/Page. | Large datasets or lists specific to the current page (automatically freed on navigate). |
| **`.persist`** | Global variables / Redux store. | Core application state that must exist for the entire session. |


A good rule of thumb is to use `.persist` in anything within the `init()` function. `.view` for anything within the `mount` or `navigation functions`, 
and `.frame` for anything within the `render`. Feel free to create your own arenas if you need to, for example a `.scratch` arena for temporary data, 
that is tied to the Component itself, then call `destroy()` hook, and deinitialize the arena or reset its memory.

You can take a look at Opaque UI lib at [vapor-ui](https://vapor-ui) for examples of how to use arenas, that are tied to the Component itself.

## 5. Quick Syntax Reference

### Styling & Layout
If you are coming from a framework that requires wrapping everything in `<div>` or `<span>`, Vapor's builder pattern will feel much cleaner.

**React (Tailwind):**

```jsx
<div className="flex justify-center p-4">
  <p className="text-lg font-bold">Hello World</p>
</div>
```

**Vapor (Auto Complete and Type Safe):**

```zig
Box().layout(.center).padding(.all(16)).children({
    Text("Hello World").font(18, 700, .black).end();
});
```
