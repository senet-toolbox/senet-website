{#animation}

# Animation

#### Vapor's animation system lets you create smooth, performant css animations entirely in Zig.

**Vapor treats animations like everything else: data.**

```zig
const Vapor = @import("vapor");
const Animation = Vapor.Animation;

const bounce_animation = Animation.init("bounce")
        .prop(.translateY, 0, -20)
        .prop(.scale, 1, 1.1)
        .duration(300)
        .easing(.easeOutBack)
        .iterations(2)
        .build();


fn init() void {
    bounce_animation.build();
}
```

{#quick-start}

### Quickstart

Animations in Vapor are created using the `Animation` struct. you define properties to animate,
timing, and easing, then call `.build()` to register it.

⚠️ **important:** `.build()` stores the animation in an internal hashmap.
This means you **must** call `.build()` within and init function ie runtime, you cannot call it during compilation.

```zig
const Vapor = @import("vapor");
const Animation = Vapor.Animation;
const Box = Vapor.Box;
const Text = Vapor.Text;

const fadeIn = Animation.init("fadeIn")
        .prop(.opacity, 0, 1)
        .duration(500)
        .fill(.forwards);

fn init() void {
    // now we can build animations
    fadeIn.build();
}

fn render() void {
    // use it on any element
    Box().animationEnter("fadeIn").children({
        Text("hello world!").end();
    });
}
```

{#core-concepts}

## Core Concepts

Animations in Vapor work through three main concepts:

1. **properties** - what values change (opacity, position, scale, etc.)
2. **timing** - duration, delay, easing, iterations
3. **keyframes** - for complex multi-step animations

### Defining Animations as Constants

You can define animations as compile-time constants, then call `.build()` in your init function:

```zig
const Vapor = @import("vapor");
const Animation = Vapor.Animation;

// define at comptime
const spinner: Animation = Animation.init("spin")
    .easing(.easeInOut)
    .duration(100)
    .prop(.rotate, 0, 180);

const fadeIn: Animation = Animation.init("fadeIn")
    .prop(.opacity, 0, 1)
    .duration(300)
    .fill(.forwards);

fn init() void {
    // build at runtime
    spinner.build();
    fadeIn.build();

    Vapor.Page(.{ .route = "/" }, render, null);
}
```

{#property-types}

### Property Types

Vapor supports a wide range of animatable properties through the `AnimationType` enum:

#### transforms

1. `.translateX`, `.translateY`, `.translateZ` - position movement
2. `.scale`, `.scaleX`, `.scaleY` - scaling
3. `.rotate`, `.rotateX`, `.rotateY`, `.rotateZ` - rotation
4. `.skewX`, `.skewY` - skewing

#### visual

1. `.opacity` - transparency
2. `.blur`, `.brightness`, `.saturate` - filters
3. `.backgroundColor` - color transitions

#### layout

1. `.width`, `.height` - size
2. `.top`, `.bottom`, `.left`, `.right` - positioning
3. `.marginTop`, `.marginBottom`, `.marginLeft`, `.marginRight` - margins
4. `.paddingTop`, `.paddingBottom`, `.paddingLeft`, `.paddingRight` - padding
5. `.borderRadius`, `.borderWidth` - borders

{#basic-animations}

## Basic Animations

The simplest way to create an animation is with the `.prop()` method.
it takes a property type, a starting value, and an ending value.

```zig
const Vapor = @import("vapor");
const Animation = Vapor.Animation;

// fade from invisible to visible
const fadeIn = Animation.init("fadeIn")
        .prop(.opacity, 0, 1);

const slideIn = Animation.init("slideIn")
        .prop(.translateX, -100, 0);

const growIn = Animation.init("growIn")
        .prop(.scale, 0.5, 1)
        .prop(.opacity, 0, 1);


export fn init() void {
    fadeIn.build();
    slideIn.build();
    growIn.build();
}
```

You can chain multiple `.prop()` calls to animate several properties simultaneously.

{#timing-controls}

## Timing Controls

Vapor provides full control over animation timing:

```zig
Animation.init("customTiming")
    .prop(.translateY, 0, 50)
    .duration(1000)      // 1 second
    .delay(200)          // wait 200ms before starting
    .easing(.easeInOut)  // smooth start and end
    .fill(.forwards)     // keep final state
    .build();
```

### duration and delay

Both `.duration()` and `.delay()` accept milliseconds:

```zig
.duration(500)  // animation takes 500ms
.delay(100)     // wait 100ms before starting
```

### iteration count

Control how many times the animation plays:

```zig
.iterations(3)  // play 3 times
.infinite()     // loop forever
```

### direction

Control the playback direction:

```zig
.dir(.normal)           // play forward
.dir(.reverse)          // play backward
.dir(.alternate)        // forward then backward
.dir(.alternateReverse) // backward then forward
```

### fill mode

Control what happens before and after the animation:

```zig
.fill(.none)      // return to initial state
.fill(.forwards)  // keep final state
.fill(.backwards) // apply initial state during delay
.fill(.both)      // both forwards and backwards
```

{#easing-functions}

## Easing Functions

Vapor includes a comprehensive set of easing functions:

#### basic

- `.linear` - constant speed
- `.ease` - default browser easing
- `.easeIn` - start slow
- `.easeOut` - end slow
- `.easeInOut` - slow start and end

#### quad (power of 2)

- `.easeInQuad`
- `.easeOutQuad`
- `.easeInOutQuad`

#### cubic (power of 3)

- `.easeInCubic`
- `.easeOutCubic`
- `.easeInOutCubic`

#### back (overshoot)

- `.easeInBack` - pull back before animating
- `.easeOutBack` - overshoot then settle
- `.easeInOutBack` - both effects

#### bounce

- `.easeOutBounce` - bouncy landing effect

```zig
const Vapor = @import("vapor");
const Animation = Vapor.Animation;

// bouncy button press
_ = Animation.init("buttonPress")
    .prop(.scale, 1, 0.95)
    .duration(100)
    .easing(.easeOutBack);
```

{#keyframe-animations}

## Keyframe Animations

For complex, multi-step animations, use the keyframe api with `.at()` and `.set()`:

```zig
const glitch = Animation.init("glitch")
    .at(0)
        .set(.translateX, 0)
        .set(.opacity, 1)
    .at(20)
        .set(.translateX, -5)
        .set(.opacity, 0.8)
    .at(40)
        .set(.translateX, 5)
        .set(.opacity, 1)
    .at(60)
        .set(.translateX, -3)
        .set(.opacity, 0.9)
    .at(80)
        .set(.translateX, 3)
        .set(.opacity, 1)
    .at(100)
        .set(.translateX, 0)
        .set(.opacity, 1)
    .duration(200)
    .infinite();

fn init() void {
    glitch.build();
}
```

### keyframe methods

#### `.at(percent)`

Sets the current keyframe position (0-100):

```zig
.at(0)    // start of animation (0%)
.at(50)   // middle of animation (50%)
.at(100)  // end of animation (100%)
```

#### `.set(property, value)`

Adds a property value at the current keyframe:

```zig
.at(0).set(.opacity, 0).set(.scale, 0.5)
.at(100).set(.opacity, 1).set(.scale, 1)
```

#### `.setUnit(property, value, unit)`

Adds a property with a specific unit:

```zig
.at(50).setUnit(.translateX, 50, .percent)  // 50%
.at(100).setUnit(.rotate, 180, .deg)        // 180deg
```

#### `.setColor(property, color)`

Adds a color property at the current keyframe:

```zig
.at(0).setColor(.backgroundColor, .red)
.at(100).setColor(.backgroundColor, .blue)
```

{#units}

## Units

Vapor supports multiple units for different property types:

- `.px` - pixels (default for most properties)
- `.percent` - percentage
- `.em` - relative to font size
- `.rem` - relative to root font size
- `.vw` - viewport width
- `.vh` - viewport height
- `.deg` - degrees (default for rotation)
- `.none` - unitless (default for opacity, scale)

```zig
// explicit unit control
_ = Animation.init("slidePercent")
    .propUnit(.translateX, 0, 100, .percent);
```

{#presets}

## Presets

Vapor includes common animation presets you can use directly:

#### fade animations

```zig
Animation.fadeIn("myFadeIn")
Animation.fadeOut("myFadeOut")
```

#### slide animations

```zig
Animation.slideInLeft("slideL", 100)   // slide from 100px left
Animation.slideInRight("slideR", 100)  // slide from 100px right
Animation.slideInUp("slideU", 100)     // slide from 100px below
Animation.slideInDown("slideD", 100)   // slide from 100px above

Animation.slideOutLeft("outL", 100)
Animation.slideOutRight("outR", 100)
Animation.slideOutUp("outU", 100)
Animation.slideOutDown("outD", 100)
```

#### zoom animations

```zig
Animation.zoomIn("zoomIn")
Animation.zoomOut("zoomOut")
```

#### continuous animations

```zig
Animation.spin("spinner")   // 360° rotation, infinite
Animation.pulse("pulse")    // subtle scale pulse, infinite
```

### using presets

Presets return an `Animation` struct, so you can further customize them:

```zig
// customize a preset
_ = Animation.fadeIn("customFade")
    .duration(800)
    .easing(.easeOutCubic);
```

{#exit-animations}

## Exit Animations

Vapor supports exit animations for elements being removed from the dom.
when an element with an exit animation is removed, Vapor automatically:

1. plays the exit animation
2. waits for it to complete
3. removes the element from the dom

```zig
const Vapor = @import("vapor");
const Animation = Vapor.Animation;
const Box = Vapor.Box;
const Text = Vapor.Text;

// define as constants
const anim_enter = Animation.init("toast-enter")
    .prop(.translateY, -20, 0)
    .prop(.opacity, 0, 1)
    .duration(300)
    .easing(.easeOut)
    .fill(.forwards);

const anim_exit = Animation.init("toast-exit")
    .prop(.opacity, 1, 0)
    .prop(.scale, 1, 0.95)
    .duration(200)
    .easing(.easeIn)
    .fill(.forwards);

export fn init() void {
    anim_enter.build();
    anim_exit.build();
    Vapor.page(.{ .route = "/" }, render, null);
}

fn render() void {
    // use animation pointers for enter/exit
    Box()
        .animationEnter("toast-enter")
        .animationExit("toast-exit")
        .children({
            Text("i will animate in and out!").end();
    });
}
```

{#transitions}

## Transitions

In addition to keyframe animations, Vapor supports css transitions for smooth property changes.
use the `.transition()` builder method to define which properties should animate when changed:

```zig
const Vapor = @import("vapor");
const Box = Vapor.Box;
const Text = Vapor.Text;

fn render() void {
    Box()
        .transition(.{
            .properties = &.{ .top, .scale, .opacity, .transform },
            .duration = 200,
            .timing = .easeInOut,
        })
        .scale(scale_value)
        .pos(.tr(.px(top_offset), .px(0), .absolute))
        .children({
            Text("smooth transitions!").end();
    });
}
```

Transitions are ideal for:

- hover effects
- state-driven position/size changes
- interactive ui feedback

Use keyframe animations for:

- complex multi-step sequences
- entrance/exit animations
- continuous loops (spinners, pulses)

{#complete-example}

## Complete Example

Here's a complete example showing various animation techniques:

```zig
const Vapor = @import("vapor");
const Animation = Vapor.Animation;
const Box = Vapor.Box;
const Text = Vapor.Text;
const Button = Vapor.Button;
const Center = Vapor.Center;
const Icon = Vapor.Icon;

var show_modal: bool = false;

// define animations as constants (no allocation yet)
const modalIn = Animation.init("modalIn")
    .prop(.scale, 0.8, 1)
    .prop(.opacity, 0, 1)
    .duration(300)
    .easing(.easeOutBack)
    .fill(.forwards);

const modalOut = Animation.init("modalOut")
    .prop(.scale, 1, 0.8)
    .prop(.opacity, 1, 0)
    .duration(200)
    .easing(.easeIn)
    .fill(.forwards);

const spinner = Animation.init("spin")
    .prop(.rotate, 0, 360)
    .duration(1000)
    .easing(.linear)
    .infinite();

const buttonHover = Animation.init("buttonHover")
    .prop(.scale, 1, 1.05)
    .prop(.translateY, 0, -2)
    .duration(150)
    .easing(.easeOut);

export fn init() void {
    // register all animations (requires allocator from Vapor.init)
    modalIn.build();
    modalOut.build();
    spinner.build();
    buttonHover.build();

    Vapor.page(.{ .route = "/" }, render, null);
}

fn toggleModal() void {
    show_modal = !show_modal;
}

fn render() void {
    Center().children({
        Button(toggleModal)
            .hoverAnimation("buttonHover")
            .children({
                Text("toggle modal").end();
        });

        if (show_modal) {
            Box()
                .animationEnter("modalIn")
                .animationExit("modalOut")
                .background(.white)
                .padding(.all(24))
                .radius(.all(12))
                .shadow(.card(.black))
                .children({
                    Text("hello from modal!").font(18, 600, .black).end();
            });
        }
    });
}
```

{#api-reference}

## Api Reference

### Animation struct

| method                           | description                                |
| -------------------------------- | ------------------------------------------ |
| `init(name)`                     | create a new animation with the given name |
| `prop(type, from, to)`           | add a property to animate                  |
| `propUnit(type, from, to, unit)` | add a property with custom unit            |
| `at(percent)`                    | set keyframe position (0-100)              |
| `set(type, value)`               | set property at current keyframe           |
| `setUnit(type, value, unit)`     | set property with unit at keyframe         |
| `setColor(type, color)`          | set color property at keyframe             |
| `duration(ms)`                   | set animation duration in milliseconds     |
| `delay(ms)`                      | set animation delay in milliseconds        |
| `easing(fn)`                     | set easing function                        |
| `fill(mode)`                     | set fill mode                              |
| `dir(direction)`                 | set animation direction                    |
| `iterations(count)`              | set iteration count                        |
| `infinite()`                     | loop animation forever                     |
| `build()`                        | register the animation                     |

### presets

| preset                          | description                 |
| ------------------------------- | --------------------------- |
| `fadeIn(name)`                  | fade from 0 to 1 opacity    |
| `fadeOut(name)`                 | fade from 1 to 0 opacity    |
| `slideInLeft(name, distance)`   | slide in from left          |
| `slideInRight(name, distance)`  | slide in from right         |
| `slideInUp(name, distance)`     | slide in from bottom        |
| `slideInDown(name, distance)`   | slide in from top           |
| `slideOutLeft(name, distance)`  | slide out to left           |
| `slideOutRight(name, distance)` | slide out to right          |
| `slideOutUp(name, distance)`    | slide out to top            |
| `slideOutDown(name, distance)`  | slide out to bottom         |
| `zoomIn(name)`                  | scale from 0 to 1           |
| `zoomOut(name)`                 | scale from 1 to 0           |
| `spin(name)`                    | 360° infinite rotation      |
| `pulse(name)`                   | subtle infinite scale pulse |

{#best-practices}

## Best Practices

1. **call Vapor.init() first** - `.build()` requires the internal allocator, so always initialize Vapor before building animations

2. **define animations as constants** - declare animations at file scope, then call `.build()` in your init function

3. **use meaningful names** - animations are registered globally, so use descriptive names like `"modalFadeIn"` instead of `"fade"`

4. **set fill mode** - use `.fill(.forwards)` to keep the final state, otherwise elements snap back

5. **prefer transforms** - `translateX/Y`, `scale`, and `rotate` are gpu-accelerated and perform better than animating `width/height`

6. **keep durations short** - animations over 500ms often feel sluggish. 150-300ms is usually ideal

7. **use appropriate easing** - `.easeOut` for entrances, `.easeIn` for exits, `.easeInOut` for state changes

8. **use animation pointers for enter/exit** - pass `&animation` to `.animationEnter()` and `.animationExit()`

```zig
const Vapor = @import("vapor");
const Animation = Vapor.Animation;
const Box = Vapor.Box;
const Text = Vapor.Text;

// ✅ good - define as constants at file scope
const fadeIn = Animation.init("fadeIn")
    .prop(.opacity, 0, 1)
    .duration(300)
    .fill(.forwards);

const fadeOut = Animation.init("fadeOut")
    .prop(.opacity, 1, 0)
    .duration(200)
    .fill(.forwards);

fn init() void {
    // ✅ build after Vapor.init
    fadeIn.build();
    fadeOut.build();

    Vapor.page(.{ .route = "/" }, render, null);
}

fn render() void {
    // ✅ use pointer for animationEnter/Exit
    Box()
        .animationEnter("fadeIn")
        .animationExit("fadeOut")
        .children({
            Text("animated content").end();
    });
}
```

```zig
const Animation = Vapor.Animation;

// ❌ bad - could forget to set the animation, leading to undefined behavior
var animation: Animation = undefined;
fn init() void {
    animation = Animation.init("fade").prop(.opacity, 0, 1).build(); // crash! no allocator yet
}

// ❌ bad - building inside render
fn render() void {
    Animation.init("fade").build(); // don't do this! builds every frame
    Box().animation("fade").children({ ... });
}
```
