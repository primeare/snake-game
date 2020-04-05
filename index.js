import { emitKeypressEvents } from 'readline';
const { stdin, stdout } = process;

// ==================== CONSTANTS ====================

const TICK_TIMEOUT = 150;

const BOX = {
  TOP_LEFT_CORNER: '\u250C',
  TOP_RIGHT_CORNER: '\u2510',
  BOTTOM_LEFT_CORNER: '\u2514',
  BOTTOM_RIGHT_CORNER: '\u2518',
  HORIZONTAL_LINE: '\u2500',
  VERTICAL_LINE: '\u2502',
};

const SNAKE_CHARACTER = '*';

// ==================== CLI ====================

const { columns, rows } = stdout;

const cursorTo = (row = 1, column = 1) => stdout.cursorTo(column - 1, row - 1);
const moveCursor = (h, v) => stdout.moveCursor(h, v);
const clearScreen = () => stdout.write('\x1b[2J');
const showCursor = () => stdout.write('\x1b[?25h');
const hideCursor = () => stdout.write('\x1b[?25l');
const output = data => stdout.write(data);

const fillPoint = (row = 1, column = 1, char = SNAKE_CHARACTER) => {
  let c = column > 1 ? column : 2;
  c = c < columns ? c : columns - 1;
  let r = row > 1 ? row : 2;
  r = r < rows ? r : rows - 1;
  cursorTo(r, c);
  output(char);
};

const fillPoints = (points, char = SNAKE_CHARACTER) => {
  for (const point of points) fillPoint(point[0], point[1], char);
};

const clearPoints = points => fillPoints(points, ' ');

// ==================== BUSINESS LOGIC ====================

let mainTicks = null;
let dirVertical = 0;
let dirHorizontal = 2;
let foodRow = 1;
let foodColumn = 1;

const snakeBody = [
  [2, 6],
  [2, 4],
  [2, 2],
];

const isGameBoardCoordinate = (v, h) => {
  return h > 1 && h < columns && v > 1 && v < rows;
};

const isOppositeDirection = (newV, newH) => {
  if (dirVertical + newV === 0 && dirHorizontal + newH === 0) return true;
  return false;
};

const isSnakeBodyPart = (v, h) => {
  return snakeBody.some(([sV, sH]) => sV === v && sH === h);
};

const endGame = (message) => {
  showCursor();
  cursorTo(1, 1);
  clearScreen();
  console.log(message);
  return process.exit(0);
};

stdin.on('keypress', (str, key) => {
  if (key.ctrl && key.name === 'c') {
    return endGame('See you soon again :)');
  }

  let newVertical = dirVertical;
  let newHorizontal = dirHorizontal;

  switch (key.name) {
    case 'up':
      newVertical = -1;
      newHorizontal = 0;
      break;
    case 'right':
      newVertical = 0;
      newHorizontal = 2;
      break;
    case 'down':
      newVertical = 1;
      newHorizontal = 0;
      break;
    case 'left':
      newVertical = 0;
      newHorizontal = -2;
      break;
  }

  if (!isOppositeDirection(newVertical, newHorizontal)) {
    dirVertical = newVertical;
    dirHorizontal = newHorizontal;
  }
});

const randomInteger = (minimum, maximum) => {
  const min = Math.ceil(minimum);
  const max = Math.floor(maximum);
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const drawBoard = () => {
  let i = -1;

  clearScreen();
  cursorTo(1, 1);

  for (i = 0; i < columns; ++i) {
    if (i === 0) output(BOX.TOP_LEFT_CORNER);
    else if (i === columns - 1) output(BOX.TOP_RIGHT_CORNER);
    else output(BOX.HORIZONTAL_LINE);
  }

  cursorTo(2, columns);

  for (i = 0; i < rows; ++i) {
    if (i === rows - 1) output(BOX.BOTTOM_RIGHT_CORNER);
    else output(BOX.VERTICAL_LINE);
    moveCursor(0, 1);
  }

  cursorTo(rows, columns - 1);

  for (i = 0; i < columns - 1; ++i) {
    if (i === columns - 2) output(BOX.BOTTOM_LEFT_CORNER);
    else output(BOX.HORIZONTAL_LINE);
    moveCursor(-2, 0);
  }

  cursorTo(rows - 1, 1);

  for (i = 0; i < rows - 2; ++i) {
    output(BOX.VERTICAL_LINE);
    moveCursor(-1, -1);
  }
};

const moveSnake = (snake, dirH, dirV) => {
  const headVerticalChange = snake[0][0] + dirV;
  const headHorizontalChange = snake[0][1] + dirH;
  if (
    isGameBoardCoordinate(headVerticalChange, headHorizontalChange) &&
    !isSnakeBodyPart(headVerticalChange, headHorizontalChange)
  ) {
    snake.unshift([headVerticalChange, headHorizontalChange]);
    snake.pop();
  } else {
    clearInterval(mainTicks);
    endGame('You loose! Your score is: ' + (snakeBody.length - 3));
  }
};

const generateFood = () => {
  foodRow = 1;
  foodColumn = 1;
  while (foodRow % 2 !== 0) foodRow = randomInteger(2, rows - 1);
  while (foodColumn % 2 !== 0) foodColumn = randomInteger(2, columns - 1);
  fillPoint(foodRow, foodColumn, '$');
};

const shouldResizeSnake = () => {
  if (snakeBody[0][0] === foodRow && snakeBody[0][1] === foodColumn) {
    snakeBody.push(snakeBody[snakeBody.length - 1]); // double the tail
    generateFood();
  }
};

const setupGame = () => {
  fillPoints(snakeBody);
  generateFood();
};

const render = () => {
  clearPoints(snakeBody);
  moveSnake(snakeBody, dirHorizontal, dirVertical);
  shouldResizeSnake();
  fillPoints(snakeBody);
};

// ==================== MAIN THREAD ====================

emitKeypressEvents(stdin);
stdin.setRawMode(true);
stdin.setEncoding('utf8');
hideCursor();

drawBoard();
setupGame();

mainTicks = setInterval(render, TICK_TIMEOUT);
stdout.on('drain', () => {
  clearInterval(mainTicks);
  mainTicks = setInterval(render, TICK_TIMEOUT);
});
