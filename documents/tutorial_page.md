{#vapor-tictactoe-tutorial}

# Building Tic-Tac-Toe with Vapor

#### Learn Vapor's core concepts by building a classic game.

In this tutorial, we'll build a fully functional Tic-Tac-Toe game using Vapor. Along the way, you'll learn:

- How to structure a Vapor application
- State management without hooks or signals
- Event handling and user interaction
- Conditional rendering and loops
- Styling with the builder pattern

By the end, you'll have a working game and a solid understanding of Vapor's fundamentals.

{#prerequisites}

## Prerequisites

Before starting, make sure you have Vapor installed:

%curl -sSL https://raw.githubusercontent.com/tether-labs/metal/main/install.sh | bash

%metal create vapor tictactoe

%cd tictactoe && metal run web

Visit [localhost:5173](http://localhost:5173/) to see your app running.

{#project-setup}

## Project Setup

Our Tic-Tac-Toe game will have a simple structure:

```
tictactoe/
├── src/
│   ├── main.zig          # Entry point
│   └── routes/
│       └── home/
│           └── Page.zig   # Our game lives here
└── web/
    └── index.html
```

{#game-state}

## Step 1: Define the Game State

First, let's think about what state our game needs:

- A 3x3 board to track X's and O's
- Whose turn it is (X or O)
- Whether the game is over
- Who won (if anyone)

In Vapor, state lives **outside** the render function. This is different from React where you'd use `useState`. Let's define our state:

```zig
// src/routes/home/Page.zig
const std = @import("std");
const Vapor = @import("vapor");
const Box = Vapor.Box;
const Text = Vapor.Text;
const Button = Vapor.Button;
const Center = Vapor.Center;
const ButtonCtx = Vapor.CtxButton;

// Game state - lives OUTSIDE render()
var board: [9]?bool = .{ null, null, null, null, null, null, null, null, null };
var is_x_turn: bool = true;
var game_over: bool = false;
var winner: ?bool = null; // null = draw, true = X wins, false = O wins

pub fn init() void {
    Vapor.Page(.{ .src = @src() }, render, null);
}
```

**Key Insight:** In Vapor, `null` represents an empty cell. `true` represents X, and `false` represents O. This is idiomatic Zig - using optionals (`?bool`) to represent "maybe a value".

{#render-board}

## Step 2: Render the Game Board

Now let's create the visual board. We'll use a grid of 9 cells:

```zig
fn render() void {
    Center().height(.percent(100)).background(.hex("#ecf0f1")).children({
        Box().direction(.column).layout(.center).spacing(16).children({
            // Title
            Text("Tic-Tac-Toe").style(&title_style).end();

            // Status message
            renderStatus();

            // Game board
            Box().style(&board_container_style).children({
                renderBoard();
            });

            // Reset button
            Button(resetGame).style(&reset_button_style).children({
                Text("New Game").end();
            });
        });
    });
}
```

Notice how we break the UI into smaller functions: `renderStatus()` and `renderBoard()`. This keeps our code organized and readable.

{#board-grid}

## Step 3: Create the Board Grid

The board is a 3x3 grid. We'll use Vapor's `Box` component with a `wrap` modifier:

```zig
fn renderBoard() void {
    Box().width(.px(306)).wrap(.wrap).children({
        for (0..9) |i| {
            renderCell(i);
        }
    });
}

fn renderCell(index: usize) void {
    const cell_value = board[index];
    const is_clickable = !game_over and cell_value == null;
    const is_winning = isWinningCell(index);

    // Dynamic background color
    const bg_color: Vapor.Types.Background = if (is_winning)
        if (winner.?) .hex("#fadbd8") else .hex("#d4e6f1")
    else if (is_clickable)
        .hex("#ffffff")
    else
        .hex("#f5f5f5");

    var cell = ButtonCtx(makeMove, .{index})
        .baseStyle(&cell_base)
        .background(bg_color);

    if (is_clickable) {
        cell = cell.hoverBackground(.hex("#e8e8e8")).cursor(.pointer);
    }

    if (is_winning) {
        cell = cell.animation("win-pulse");
    }

    cell.children({
        if (cell_value) |is_x| {
            Text(if (is_x) "X" else "O")
                .font(44, 700, if (is_x) .hex("#e74c3c") else .hex("#3498db"))
                .animationEnter(&place_animation)
                .end();
        }
    });
}
```

**Important Concepts:**

1. **Loops in Vapor:** We use standard Zig `for` loops directly in our UI code
2. **Conditional Rendering:** Standard `if` statements work naturally
3. **ButtonCtx:** `ButtonCtx(makeMove, .{index})` lets us pass context data to our click handler
4. **Vapor.Types.Background:** Use this type for background colors (not `Vapor.Types.Color`)

{#game-logic}

## Step 4: Implement Game Logic

Now for the heart of our game - the logic that handles moves and determines winners:

```zig
fn makeMove(index: usize) void {
    // Ignore clicks if game is over or cell is taken
    if (game_over) return;
    if (board[index] != null) return;

    // Make the move
    board[index] = is_x_turn;

    // Check for winner
    if (checkWinner()) |result| {
        game_over = true;
        winner = result.winner;
        winning_line = result.line;
        return;
    }

    // Check for draw
    if (isBoardFull()) {
        game_over = true;
        winner = null;
        return;
    }

    // Switch turns
    is_x_turn = !is_x_turn;
}

const WinResult = struct {
    winner: bool,
    line: [3]usize,
};

fn checkWinner() ?WinResult {
    const patterns = [_][3]usize{
        .{ 0, 1, 2 }, .{ 3, 4, 5 }, .{ 6, 7, 8 }, // Rows
        .{ 0, 3, 6 }, .{ 1, 4, 7 }, .{ 2, 5, 8 }, // Columns
        .{ 0, 4, 8 }, .{ 2, 4, 6 },               // Diagonals
    };

    for (patterns) |pattern| {
        const a = board[pattern[0]];
        const b = board[pattern[1]];
        const c = board[pattern[2]];

        if (a != null and a == b and b == c) {
            return WinResult{
                .winner = a.?,
                .line = pattern,
            };
        }
    }
    return null;
}

fn isBoardFull() bool {
    for (board) |cell| {
        if (cell == null) return false;
    }
    return true;
}

fn isWinningCell(index: usize) bool {
    if (winning_line) |line| {
        return index == line[0] or index == line[1] or index == line[2];
    }
    return false;
}

fn resetGame() void {
    board = .{ null, null, null, null, null, null, null, null, null };
    is_x_turn = true;
    game_over = false;
    winner = null;
    winning_line = null;
}
```

**Zig Pattern:** The `checkWinner()` function returns `?WinResult` - an optional struct containing both the winner and the winning line. This lets us track which cells to highlight.

{#status-display}

## Step 5: Display Game Status

Let's add a status message that shows whose turn it is or who won:

```zig
fn renderStatus() void {
    const message: []const u8 = if (game_over)
        if (winner) |is_x|
            if (is_x) "🎉 X Wins!" else "🎉 O Wins!"
        else
            "🤝 It's a Draw!"
    else if (is_x_turn)
        "X's Turn"
    else
        "O's Turn";

    const color: Vapor.Types.Color = if (game_over and winner != null)
        if (winner.?) .hex("#e74c3c") else .hex("#3498db")
    else
        .hex("#7f8c8d");

    Text(message)
        .font(22, 600, color)
        .margin(.b(8))
        .end();
}
```

**Note:** For text colors, use `Vapor.Types.Color`. For backgrounds, use `Vapor.Types.Background`. Margin shorthand uses `.b()` for bottom, `.t()` for top, etc.

{#styling}

## Step 6: Polish with Styling

Let's define our reusable styles using Vapor's Style struct:

```zig
const title_style = Vapor.Style{
    .visual = .{
        .font_size = 42,
        .font_weight = 700,
        .text_color = .hex("#2c3e50"),
    },
    .margin = .b(10),
};

const board_container_style = Vapor.Style{
    .visual = .{
        .background = .hex("#34495e"),
        .border = .solid(.all(4), .hex("#2c3e50"), .all(12)),
        .shadow = .card(.hex("#00000033")),
    },
    .padding = .all(8),
};

const cell_base = Vapor.Style{
    .size = .square_px(90),
    .margin = .all(4),
    .visual = .{
        .border = .solid(.all(1), .hex("#ecf0f1"), .all(4)),
    },
    .layout = .center,
    .transition = .{ .duration = 100 },
};

const reset_button_style = Vapor.Style{
    .padding = .tblr(14, 14, 28, 28),
    .visual = .{
        .background = .hex("#27ae60"),
        .font_size = 16,
        .font_weight = 600,
        .text_color = .white,
        .border_radius = .all(8),
    },
    .interactive = .hover_scale(),
    .margin = .t(20),
};
```

**Style API Notes:**

- `.margin = .b(10)` - shorthand for bottom margin (also `.t()`, `.l()`, `.r()`)
- `.size = .square_px(90)` - creates a 90x90 pixel square
- `.border = .solid(.all(4), .hex("#color"), .all(12))` - thickness, color, radius

{#winning-animation}

## Step 7: Add Animations

Let's add animations for placing pieces and highlighting wins:

```zig
const Animation = Vapor.Animation;

// Define animations at file scope
const win_animation = Animation.init("winPulse")
    .prop(.scale, 1, 1.05)
    .duration(400)
    .easing(.easeInOut)
    .iterations(0) // infinite
    .dir(.alternate);

const place_animation = Animation.init("place")
    .prop(.scale, 0.5, 1)
    .prop(.opacity, 0, 1)
    .duration(150)
    .easing(.easeOutBack)
    .fill(.forwards);

pub fn init() void {
    // Build animations after Vapor initialization
    win_animation.build();
    place_animation.build();
    Vapor.Page(.{ .src = @src() }, render, null);
}
```

Apply animations in your render code:

```zig
// For winning cells
if (is_winning) {
    cell = cell.animation(&win_animation);
}

// For newly placed pieces
Text(if (is_x) "X" else "O")
    .font(44, 700, if (is_x) .hex("#e74c3c") else .hex("#3498db"))
    .animationEnter("place")
    .end();
```

{#complete-code}

## Complete Code

Here's the full implementation:

```zig
// src/routes/home/Page.zig
const std = @import("std");
const Vapor = @import("vapor");
const Animation = Vapor.Animation;
const Box = Vapor.Box;
const Text = Vapor.Text;
const Button = Vapor.Button;
const Center = Vapor.Center;
const ButtonCtx = Vapor.CtxButton;

// ============================================
// GAME STATE
// ============================================
var board: [9]?bool = .{ null, null, null, null, null, null, null, null, null };
var is_x_turn: bool = true;
var game_over: bool = false;
var winner: ?bool = null;
var winning_line: ?[3]usize = null;

// ============================================
// ANIMATIONS
// ============================================
const win_animation = Animation.init("winPulse")
    .prop(.scale, 1, 1.05)
    .duration(400)
    .easing(.easeInOut)
    .iterations(0) // infinite
    .dir(.alternate);

const place_animation = Animation.init("place")
    .prop(.scale, 0.5, 1)
    .prop(.opacity, 0, 1)
    .duration(150)
    .easing(.easeOutBack)
    .fill(.forwards);

// ============================================
// STYLES
// ============================================
const title_style = Vapor.Style{
    .visual = .{
        .font_size = 42,
        .font_weight = 700,
        .text_color = .hex("#2c3e50"),
    },
    .margin = .b(10),
};

const board_container_style = Vapor.Style{
    .visual = .{
        .background = .hex("#34495e"),
        .border = .solid(.all(4), .hex("#2c3e50"), .all(12)),
        .shadow = .card(.hex("#00000033")),
    },
    .padding = .all(8),
};

const cell_base = Vapor.Style{
    .size = .square_px(90),
    .margin = .all(4),
    .visual = .{
        .border = .solid(.all(1), .hex("#ecf0f1"), .all(4)),
    },
    .layout = .center,
    .transition = .{ .duration = 100 },
};

const reset_button_style = Vapor.Style{
    .padding = .tblr(14, 14, 28, 28),
    .visual = .{
        .background = .hex("#27ae60"),
        .font_size = 16,
        .font_weight = 600,
        .text_color = .white,
        .border_radius = .all(8),
    },
    .interactive = .hover_scale(),
    .margin = .t(20),
};

// ============================================
// INITIALIZATION
// ============================================
pub fn init() void {
    win_animation.build();
    place_animation.build();
    Vapor.Page(.{ .src = @src() }, render, null);
}

// ============================================
// RENDER FUNCTIONS
// ============================================
fn render() void {
    Center()
        .height(.percent(100))
        .background(.hex("#ecf0f1"))
        .children({
            Box()
                .direction(.column)
                .layout(.center)
                .spacing(16)
                .children({
                    // Title
                    Text("Tic-Tac-Toe")
                        .style(&title_style).end();

                    // Status
                    renderStatus();

                    // Board
                    Box()
                        .style(&board_container_style).children({
                            renderBoard();
                    });

                    // Reset Button
                    Button(resetGame)
                        .style(&reset_button_style).children({
                            Text("New Game").end();
                    });
            });
    });
}

fn renderStatus() void {
    const message: []const u8 = if (game_over)
        if (winner) |is_x|
            if (is_x) "🎉 X Wins!" else "🎉 O Wins!"
        else
            "🤝 It's a Draw!"
    else if (is_x_turn)
        "X's Turn"
    else
        "O's Turn";

    const color: Vapor.Types.Color = if (game_over and winner != null)
        if (winner.?) .hex("#e74c3c") else .hex("#3498db")
    else
        .hex("#7f8c8d");

    Text(message)
        .font(22, 600, color)
        .margin(.b(8))
        .end();
}

fn renderBoard() void {
    Box()
        .width(.px(306))
        .wrap(.wrap)
        .children({
            for (0..9) |i| {
                renderCell(i);
            }
    });
}

fn renderCell(index: usize) void {
    const cell_value = board[index];
    const is_clickable = !game_over and cell_value == null;
    const is_winning = isWinningCell(index);

    // Dynamic background color
    const bg_color: Vapor.Types.Background = if (is_winning)
        if (winner.?) .hex("#fadbd8") else .hex("#d4e6f1")
    else if (is_clickable)
        .hex("#ffffff")
    else
        .hex("#f5f5f5");

    var cell = ButtonCtx(makeMove, .{index})
        .baseStyle(&cell_base)
        .background(bg_color);

    if (is_clickable) {
        cell = cell.hoverBackground(.hex("#e8e8e8")).cursor(.pointer);
    }

    if (is_winning) {
        cell = cell.animation("win-pulse");
    }

    cell.children({
        if (cell_value) |is_x| {
            Text(if (is_x) "X" else "O")
                .font(44, 700, if (is_x) .hex("#e74c3c") else .hex("#3498db"))
                .animationEnter("place")
                .end();
        }
    });
}

// ============================================
// GAME LOGIC
// ============================================
fn makeMove(index: usize) void {
    if (game_over) return;
    if (board[index] != null) return;

    board[index] = is_x_turn;

    if (checkWinner()) |result| {
        game_over = true;
        winner = result.winner;
        winning_line = result.line;
        return;
    }

    if (isBoardFull()) {
        game_over = true;
        winner = null;
        return;
    }

    is_x_turn = !is_x_turn;
}

const WinResult = struct {
    winner: bool,
    line: [3]usize,
};

fn checkWinner() ?WinResult {
    const patterns = [_][3]usize{
        .{ 0, 1, 2 }, .{ 3, 4, 5 }, .{ 6, 7, 8 }, // Rows
        .{ 0, 3, 6 }, .{ 1, 4, 7 }, .{ 2, 5, 8 }, // Columns
        .{ 0, 4, 8 }, .{ 2, 4, 6 },               // Diagonals
    };

    for (patterns) |pattern| {
        const a = board[pattern[0]];
        const b = board[pattern[1]];
        const c = board[pattern[2]];

        if (a != null and a == b and b == c) {
            return WinResult{
                .winner = a.?,
                .line = pattern,
            };
        }
    }
    return null;
}

fn isBoardFull() bool {
    for (board) |cell| {
        if (cell == null) return false;
    }
    return true;
}

fn isWinningCell(index: usize) bool {
    if (winning_line) |line| {
        return index == line[0] or index == line[1] or index == line[2];
    }
    return false;
}

fn resetGame() void {
    board = .{ null, null, null, null, null, null, null, null, null };
    is_x_turn = true;
    game_over = false;
    winner = null;
    winning_line = null;
}

```

```tsx
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ============================================
// ANIMATION VARIANTS
// ============================================
const winPulse = {
  scale: [1, 1.05, 1],
  transition: { duration: 0.4, repeat: Infinity, ease: "easeInOut" },
};

const placeEffect = {
  initial: { scale: 0.5, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  transition: { type: "spring", stiffness: 300, damping: 15 },
};

const TicTacToe = () => {
  // ============================================
  // GAME STATE
  // ============================================
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isXTurn, setIsXTurn] = useState(true);
  const [gameState, setGameState] = useState({
    gameOver: false,
    winner: null,
    winningLine: null,
  });

  // ============================================
  // GAME LOGIC
  // ============================================
  const checkWinner = (squares) => {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8], // Rows
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8], // Cols
      [0, 4, 8],
      [2, 4, 6], // Diagonals
    ];

    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (
        squares[a] !== null &&
        squares[a] === squares[b] &&
        squares[a] === squares[c]
      ) {
        return { winner: squares[a], line: lines[i] };
      }
    }
    return null;
  };

  const makeMove = (index) => {
    if (gameState.gameOver || board[index] !== null) return;

    const newBoard = [...board];
    newBoard[index] = isXTurn; // true for X, false for O
    setBoard(newBoard);

    const winResult = checkWinner(newBoard);
    if (winResult) {
      setGameState({
        gameOver: true,
        winner: winResult.winner,
        winningLine: winResult.line,
      });
    } else if (newBoard.every((cell) => cell !== null)) {
      setGameState({ gameOver: true, winner: null, winningLine: null });
    } else {
      setIsXTurn(!isXTurn);
    }
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setIsXTurn(true);
    setGameState({ gameOver: false, winner: null, winningLine: null });
  };

  // ============================================
  // RENDER HELPERS
  // ============================================
  const getStatusMessage = () => {
    const { gameOver, winner } = gameState;
    if (gameOver) {
      if (winner === null) return "🤝 It's a Draw!";
      return winner ? "🎉 X Wins!" : "🎉 O Wins!";
    }
    return isXTurn ? "X's Turn" : "O's Turn";
  };

  const statusColor =
    gameState.gameOver && gameState.winner !== null
      ? gameState.winner
        ? "text-[#e74c3c]"
        : "text-[#3498db]"
      : "text-[#7f8c8d]";

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#ecf0f1] font-sans">
      {/* Title */}
      <h1 className="text-[42px] font-bold text-[#2c3e50] mb-2">Tic-Tac-Toe</h1>

      {/* Status */}
      <div className={`text-[22px] font-semibold mb-4 ${statusColor}`}>
        {getStatusMessage()}
      </div>

      {/* Board Container */}
      <div className="bg-[#34495e] p-2 rounded-xl shadow-lg">
        <div className="grid grid-cols-3 gap-2 w-[306px]">
          {board.map((cell, i) => {
            const isWinning = gameState.winningLine?.includes(i);
            const isClickable = !gameState.gameOver && cell === null;

            // Dynamic cell background
            const bgColor = isWinning
              ? gameState.winner
                ? "bg-[#fadbd8]"
                : "bg-[#d4e6f1]"
              : isClickable
                ? "bg-white hover:bg-[#e8e8e8]"
                : "bg-[#f5f5f5]";

            return (
              <button
                key={i}
                onClick={() => makeMove(i)}
                disabled={!isClickable}
                className={`w-[90px] h-[90px] rounded flex items-center justify-center transition-colors duration-100 border border-[#ecf0f1] ${bgColor} ${isClickable ? "cursor-pointer" : ""}`}
              >
                <motion.div animate={isWinning ? winPulse : {}}>
                  <AnimatePresence>
                    {cell !== null && (
                      <motion.span
                        variants={placeEffect}
                        initial="initial"
                        animate="animate"
                        className={`text-[44px] font-bold ${cell ? "text-[#e74c3c]" : "text-[#3498db]"}`}
                      >
                        {cell ? "X" : "O"}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Reset Button */}
      <button
        onClick={resetGame}
        className="mt-5 px-7 py-3.5 bg-[#27ae60] text-white font-semibold rounded-lg hover:scale-105 active:scale-95 transition-transform"
      >
        New Game
      </button>
    </div>
  );
};

export default TicTacToe;
```

{#whats-next}

## What You've Learned

Congratulations! You've built a complete Tic-Tac-Toe game and learned:

| Concept                   | What You Did                                         |
| ------------------------- | ---------------------------------------------------- |
| **State Management**      | Variables outside `render()` persist between updates |
| **Event Handling**        | `Button(fn)` and `ButtonCtx(fn, .{args})`            |
| **Conditional Rendering** | Standard Zig `if` statements in UI code              |
| **Loops**                 | Zig `for` loops to generate repeated UI elements     |
| **Styling**               | Builder pattern and Style structs                    |
| **Animations**            | Declarative animations with `Animation.init()`       |

{#api-quick-reference}

## API Quick Reference

| Pattern                                      | Usage                                                 |
| -------------------------------------------- | ----------------------------------------------------- |
| `ButtonCtx(fn, .{args})`                     | Button with context passed to handler                 |
| `.margin(.b(10))`                            | Bottom margin shorthand (also `.t()`, `.l()`, `.r()`) |
| `.size = .square_px(90)`                     | 90x90 pixel square                                    |
| `Vapor.Types.Background`                     | Type for background colors                            |
| `Vapor.Types.Color`                          | Type for text colors                                  |
| `.border = .solid(.all(4), color, .all(12))` | Border with thickness, color, radius                  |

{#challenges}

## Challenges

Ready to level up? Try these extensions:

1. **Add a Score Tracker** - Track wins for X and O across multiple games
2. **Implement AI** - Add a simple computer opponent using minimax algorithm
3. **Add Sound Effects** - Play sounds on moves and wins
4. **Create Themes** - Let players switch between light/dark or custom color themes
5. **Add Online Multiplayer** - Use Reverb (Vapor's backend) for real-time games

{#key-takeaways}

## Key Takeaways

**Vapor vs React/Vue/Svelte:**

| React                     | Vapor                       |
| ------------------------- | --------------------------- |
| `useState(0)`             | `var count: i32 = 0;`       |
| `setCount(c => c + 1)`    | `count += 1;`               |
| `{items.map(i => ...)}`   | `for (items) \|i\| { ... }` |
| `{cond && <UI />}`        | `if (cond) { UI(); }`       |
| `onClick={() => fn(arg)}` | `ButtonCtx(fn, .{arg})`     |

**Remember:** In Vapor, the UI is reactive, not the variables. Just mutate your state directly, and Vapor handles the rest.

Happy coding with Vapor! 🚀
