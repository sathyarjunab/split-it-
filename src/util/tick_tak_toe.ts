export function winnerChecker(board: string[][]): boolean {
  const n = board.length;

  // check rows
  for (let i = 0; i < n; i++) {
    if (
      board[i].every((cell) => cell === "X") ||
      board[i].every((cell) => cell === "O")
    ) {
      return true;
    }
  }

  // check columns
  for (let j = 0; j < n; j++) {
    let col = [];
    for (let i = 0; i < n; i++) {
      col.push(board[i][j]);
    }
    if (
      col.every((cell) => cell === "X") ||
      col.every((cell) => cell === "O")
    ) {
      return true;
    }
  }

  // check left-to-right diagonal
  let diag1 = [];
  for (let i = 0; i < n; i++) {
    diag1.push(board[i][i]);
  }
  if (
    diag1.every((cell) => cell === "X") ||
    diag1.every((cell) => cell === "O")
  ) {
    return true;
  }

  // check right-to-left diagonal
  let diag2 = [];
  for (let i = 0; i < n; i++) {
    diag2.push(board[i][n - i - 1]);
  }
  if (
    diag2.every((cell) => cell === "X") ||
    diag2.every((cell) => cell === "O")
  ) {
    return true;
  }

  return false;
}

export function printBoard(board: string[][]) {
  const size = board.length;
  const line = "+---".repeat(size) + "+";

  for (let i = 0; i < size; i++) {
    console.log(line);
    console.log("|" + board[i].map((c) => ` ${c || " "} `).join("|") + "|");
  }
  console.log(line);
}
