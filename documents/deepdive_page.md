{#new-to-zig}

# New to Zig

The following will be a small introduction to Zig, focused on the basics. This is not a comprehensive guide, but a starting point for those who are new to Zig.
The goal is to get you up and running with Vapor, not make you a master of Zig.

⚠️ **NOTE:** This is directed to those who have some experience in programming, whether that is python, javascript, or other languages. It
also helps if you have some basic understanding of types, control flow, and functions.

If you want to learn more about Zig, you can check out the

1. [Zig Book](https://pedropark99.github.io/zig-book/Chapters/01-zig-weird.html). A book that teaches you Zig by example. 🌟
2. [Zig Documentation](https://ziglang.org/documentation/master/). The official Zig website.

## Zig Basics

Zig is a general-purpose programming language, designed for robustness, optimality, and maintainability.
It is a compiled language, which means that it is compiled to native machine code, and then executed.

Zig is a statically typed language, which is incredibly helpful in catching bugs at compile time.

We will explore the following concepts:

1. **Zig Types**
2. **Zig Memory**
3. **Basic Zig Control Flow**

### Zig Types

In Zig, there are several types of data, these are all similar to other languages.

A common type or synbol set you will see in Zig is the '[]' this is called an array. An array is a collection of items of the same type.
for example, an array of integers is `[]i32`. We define an array with the number of items it contains, and the type of the items.

```zig
const numbers = [4]i32{ 1, 2, 3, 4 };
```

Above we have an array of 4 integers, the first item is 1, the second is 2, the third is 3, and the fourth is 4.

We index into an array with the square brackets, the index starts at 0, so the first item is at index 0, the second is at index 1, and so on.

```zig
const first_number = numbers[0]; // 1
const second_number = numbers[1]; // 2
const third_number = numbers[2]; // 3
const fourth_number = numbers[3]; // 4
```

Zig is smart, and so we can interpret the number of items in the array, with the '\_' symbol, like so:

```zig
const numbers = [_]i32{ 1, 2, 3, 4 };
```

At compile time, Zig will determine the number of items in the array.

The above is a constant array, meaning we cannot modify or the values it contains. To do that, we need to use the `var` keyword.

```zig
var numbers = [4]i32{ 1, 2, 3, 4 };
// or
var numbers = [_]i32{ 1, 2, 3, 4 };
```

Now we can modify the values in the array.

```zig
numbers[0] = 5;
numbers[1] = 6;
numbers[2] = 7;
numbers[3] = 8;
```

#### Slices

A slice is like a sub-array, is a reference to a part of an array. We can create a slice with the `[number..number]` syntax.

```zig
const numbers = [4]i32{ 1, 2, 3, 4 };
const first_three_numbers = numbers[0..3];
```

Just like arrays, we can index into a slice.

```zig
const first_number = first_three_numbers[0]; // 1
const second_number = first_three_numbers[1]; // 2
const third_number = first_three_numbers[2]; // 3
```

A slice is a reference to a part of an array, and it's length.

```zig
const numbers = [4]i32{ 1, 2, 3, 4 };
const first_three_numbers = numbers[0..3];

std.debug.print("Ptr of first_three_numbers: {*}\n", .{first_three_numbers.ptr}); // ...
std.debug.print("Length of first_three_numbers: {d}\n", .{first_three_numbers.len}); // 3

```

The `ptr` is like an address, to a house in a neighborhood.

Let's say we wanted to count the total number of houses on a street.

1. We first need to define the starting house.
2. Then we count from the starting house to the end of the street.

In our example above, we have a total of 4 houses, and our first house is at index 0, then we only want to record the first 3 houses.
so we cut or 'slice' the array, to only include the first 3 houses.

- The `ptr` refers to the starting elment of the slice.
- The `len` refers to the length of the slice.

In another example, let's say we had 100 houses, and house 1-10 are red, houses 11-20 are blue, houses 21-30 are green, and so on.

We can use a slice to only include the red houses, and then count the number of red houses.

```zig
const houses = [100]House{
     // ... a bunch of houses ...
};

const red_houses = houses[0..10]; // slice of 10 red houses
const blue_houses = houses[10..20]; // slice of 10 blue houses
const green_houses = houses[20..30]; // slice of 10 green houses
```

The ptr field in the slice `blue_houses.ptr` is the first address of the blue houses. the len field is the length of the slice, or number of houses.

We do this in Zig because then we are not copying the data around everywhere. Instead we just grab out the pointer to the start of the slice, and the length of the slice.
Now we can index into the slice.

```zig
const third_blue_house = blue_houses[2]; // the third blue house
// or with the big array
const third_blue_house = houses[12]; // the third blue house
```

#### Strings

In Zig, a string is a sequence of characters. We define a string literal as `[]const u8`.

```zig
// JS style string
const hello_world = "Hello World!";

// Zig style string
const hello_world: []const u8 = "Hello World!";
```

The type `[]const u8` is an array of characters. Essentially, u8 is a byte, it can be any number between 0 and 255. In computer science, we represent the alphabet as a set of numbers,
for example, 'A' is 65, 'B' is 66, 'n' is 110, and so on.

So the above string literal is techinically an array of numbers that represent the characters in the string.

- 'H' is 72
- 'e' is 101
- 'l' is 108
- 'l' is 108
- 'o' is 111

- 'W' is 87
- 'o' is 111
- 'r' is 114
- 'l' is 108
- 'd' is 100
- '!' is 33

Just like arrays, we can slice a string literal, and then index into the slice.

```zig
const hello_world: []const u8 = "Hello World!";
const first_letter = hello_world[0]; // 'H'
const second_letter = hello_world[1]; // 'e'
const third_letter = hello_world[2]; // 'l'
const fourth_letter = hello_world[3]; // 'l'
const fifth_letter = hello_world[4]; // 'o'

// Slice of the string literal
const world = hello_world[6..11]; // 'World'
const w = world[0]; // 'W'
```

And again, since they are just arrays, we can grab our the pointer and length of the string.

```zig
const hello_world: []const u8 = "Hello World!";
const hello_world_ptr = hello_world.ptr; // starting address of the string literal
const hello_world_len = hello_world.len; // 12
```

You probably noticed that for strings, we are `const`, instead of `[]u8`. This is because we do not want to modify the string's individual characters.
If you want to create a string, where you can modify the characters, you need to use the `var` keyword.

```zig
var string = [_]u8{ 'H', 'e', 'l', 'l', 'o' };
string[0] = 'H';
string[1] = 'E';
string[2] = 'L';
string[3] = 'L';
string[4] = '!';
```

If you just want to modify the entire string itself, you can do the following:

```zig
var string: []const u8  = "Hello";
string = "Hello World!";
```

#### Structs

A struct is a collection of fields and methods. Just like a class in other languages.

```zig
const House = struct {
    color: []const u8,
    number: i32,

    pub fn forSale(self: *House) bool {
        if (std.mem.eql(u8, self.color, "red")) {
            return true;
        }
        return false;
    }
};
```

Above we have a struct called `House`, it has two fields, a `color` field, and a `number` field.
It also has a method called `forSale`, which returns a boolean value.

Within the method, we have a special standard library function called `std.mem.eql`, which is used to compare two types.
In this case, we are comparing two strings. We define the type we are comparing as `u8` since underneath the hood, `std.mem.eql` compares each character in the string.

The `pub` keyword makes a variable or function public. This means we can access said function outside of the struct. This is useful when calling a function in a different file.
or methods, or anywhere other than the struct itself.

#### We can create a new House instance with the following:

```zig
var house = House{
    .color = "red",
    .number = 1234,
};
```

Then we can call the `forSale` method on the instance:

```zig
if (house.forSale()) {
    std.debug.print("House is for sale!\n", .{});
}
```

Structs are handy for encapsulating data and methods. In the Lego City tutroial, we will use structs to create a set of different types of Lego bricks, buildings, and other objects.

`std.debug.print` is a function that prints a string to the console, the first part is the format string, and the second part is the arguments to be formatted.

```zig
std.debug.print("Hello {s}!\n", .{"world"});
```

### To Summerize:

1. _[]const u8_ is a string literal, it is essentially an array of characters, like so &.{'h', 'e', 'l', 'l', 'o'}
2. _[]i32_ is an array of integers, like so [4]i32{1, 2, 3, 4}
3. _struct_ is like a class or object in other languages, it is a collection of fields and methods.
4. _fn_ is a function.
5. _pub_ makes a function or variable public.
6. _var_ is like a variable in other languages, it is a named value that can be changed.
7. _const_ is like a constant in other languages, it is a named value that cannot be changed.

{#memory}

# Memory

Memory, is a popular topic in programming, some argue it should be compiled away, completely avoided, handled by the programmer, or handled by the program.

In Zig, memory is typically handled with Arenas.

### What is an Arena?

Imagine, you work at a construction site. If you want to build a house, you need to first have a plot of land. This is where the arena comes in.

The arena is like a large piece of land, that is used for building the house. First we add the plumbing, and electrical wiring, this is like allocating memory for an array.
The we add the foundations, and walls, this is like allocating memory for a string.

Then we finally put the roof on, together all of these pieces make up the house. Just how the struct below is made up of the strings, and the arrays we allocated.

```zig
const House = struct {
    plumbing: [16]u32,
    electrical_wiring: [16]u32,
    foundations: []const u8,
    walls: []const u8,
    roof: bool,
};

pub fn init() void {
    const arena = std.heap.ArenaAllocator.init(std.heap.page_allocator);
    var allocator = arena.allocator();
    const plumbing = allocator.alloc(u32, 16) catch {};
    const electrical_wiring = allocator.alloc(u32, 16) catch {};
    const foundations = "foundations";
    const walls = "walls";
    const roof = true;

    const house = House{
        .plumbing = plumbing,
        .electrical_wiring = electrical_wiring,
        .foundations = foundations,
        .walls = walls,
        .roof = roof,
    };
}
```

The arena, is a large piece of memory, that we can use slices of. Just like how a large piece of land can be used to build multiple houses.

The usefulness of the arena, is that we can grab various slices of memory, and use them as we please, then when we are done with all of them, we just call `deinit` on the arena.
This will automatically free all the memory that was allocated. We do not need to track what memory we allocated, or how we used it, or when we freed it.

Vapor makes use of this arena pattern, by allocating memory for each render cycle, creating all the UI, and reconciling it. Then finally when we have made all the DOM changes, we call `deinit` on the arena.

This means that internally, Vapor never needs to be concerned with memory tracking, or deallocation.

### alloc and dynamic arrays

In the above example, we use the `alloc` memory to allocate memory for our arrays. This means that the arrays now live on the heap, and will live forever.
The `alloc` method returns an array of type `T` ie `[]T`. For example:

```zig
pub fn init() void {
    const arena = std.heap.ArenaAllocator.init(std.heap.page_allocator);
    var allocator = arena.allocator();
    var numbers: []i32 = allocator.alloc(i32, 4) catch {}; // Allocate 4 numbers []i32
    for (0..4) |i| {
        numbers[i] = i;
    }
}
```

We can also create dynamic arrays, by using the standard library's `std.array_list.Managed`

```zig
const std = @import("std");
const Vapor = @import("vapor");

pub fn init() void {
    const arena = std.heap.ArenaAllocator.init(std.heap.page_allocator);
    var allocator = arena.allocator();
    var numbers = std.array_list.Managed(i32).init(allocator);
    for (0..4) |i| {
        try numbers.append(i);
    }

    for (4..20) |i| {
        try numbers.append(i);
    }
    numbers.append(100) catch {};
    numbers.append(200) catch {};

    for (numbers.items) |item| {
        std.debug.print("{d}\n", .{item});
    }
}
```

### \* is a pointer

```zig
const House = struct {
    plumbing: [16]u32,
    electrical_wiring: [16]u32,
    foundations: []const u8,
    walls: []const u8,
    roof: bool,
};

pub fn init() void {
    const arena = std.heap.ArenaAllocator.init(std.heap.page_allocator);
    var allocator = arena.allocator();
    const plumbing = allocator.alloc(u32, 16) catch {};
    const electrical_wiring = allocator.alloc(u32, 16) catch {};
    const foundations = "foundations";
    const walls = "walls";
    const roof = true;

    const house = allocator.create(House) catch {};
    house.* = House{
        .plumbing = plumbing,
        .electrical_wiring = electrical_wiring,
        .foundations = foundations,
        .walls = walls,
        .roof = roof,
    };
}
```

In the above example, we use the `*` to refer to the actual memory that is allocated. This is called a pointer, just like how in real life, we have an address to a house, we have
an address to our memory slices. In the case above, we have an address to a slice memory, that is a string ([]const u8), and a bool (\*bool).

The reason, that the arena returns a pointer, is the same reason we use adresses in real life. If we wanted to go over to our friend's birthday party, it would be strange to ask her
to move her entire house to our place, so we can attend it. Imagine, if multiple people were attending the party, she would have to move the entire house contstantly.

Instead, she gives us an adress to the party, so that we can attend it.

Similarly, the arena returns a pointer, so that we don't copy all the memory over to our structure, we just take an adress to the memory, and we "go to it", with `.*`.

### .\* is a dereference

`.*` is a dereference operator, it takes a pointer, and returns the actual memory that is allocated. This is the same as and address in real life, we take an address to a
house, and we go to it, by car or by foot. In Zig, we can do the same thing, by using `.*`.

```zig
pub fn init() void {
    const address: *House = Vapor.arena(.persist).create(House) catch {};
    const house = address.*;
}
```

### Error Handling

In the above examples, we have used the `catch` keyword to handle errors. In Zig, errors are values, meaning they can be returned, and they can be handled.

#### Catching Errors

```zig
const result = someFunction() catch |err| {
    std.debug.print("Error: {s}\n", .{err});
    // Handle the error
    return err;
};

// Or ignore the error (not recommended in real code)
const result = someFunction() catch {};

// Or use `try` to propagate the error up
const result = try someFunction();
```

#### Optionals

Values can be optional (might be null):

```zig
var maybe_house: ?House = null;

// Check if it exists
if (maybe_house) |house| {
    // Use house here
}

// Or provide a default
const house = maybe_house orelse default_house;
```

### Basic Control Flow

#### If statements

```zig
if (house.number > 100) {
    std.debug.print("High number!\n", .{});
} else {
    std.debug.print("Low number!\n", .{});
}
```

#### For loops

```zig
for (numbers, 0..) |num, i| {
    std.debug.print("{d}\n", .{num});
}
```

#### While loops

```zig
var i: i32 = 0;
while (i < 10) : (i += 1) {
    std.debug.print("{d}\n", .{i});
}
```
