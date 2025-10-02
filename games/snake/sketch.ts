const NUM_TILES = 30;

const SIZE = window.innerWidth;
const SKETCH_SCALE = 0.5;
const SKETCH_SIZE = SIZE * SKETCH_SCALE;
const TILE_SIZE = SKETCH_SIZE / NUM_TILES;

const BACKGROUND_COLOR = '#000';
const SNAKE_COLOR = '#0F0';
const APPLE_COLOR = '#F00';

const STARTING_SNAKE_LENGTH = 3;
const MOVE_INTERVAL_MS = 100;

const START_KEY = ' ';
const UP_KEY = 'w';
const LEFT_KEY = 'a';
const RIGHT_KEY = 'd';
const DOWN_KEY = 's';

let isRunning = false;
let direction: p5.Vector;
let nextDirection: p5.Vector;
let snake: p5.Vector[];
let apple: p5.Vector;
let lastMoveTime = 0;

function setup() {
    createCanvas(SKETCH_SIZE, SKETCH_SIZE);
    reset();
}

function draw() {
    if (isRunning)
        update();
    render();
}

function update() {
    if (millis() - lastMoveTime > MOVE_INTERVAL_MS) {
        if (nextDirection && !isOpposite(direction, nextDirection))
            direction = nextDirection;

        if (willCollide()) {
            reset();
        }
        else {
            let willEat = willEatApple();
            moveSnake(!willEat);

            if (willEat)
                apple = generateApplePosition();
        }

        lastMoveTime = millis();
    }
}

function render() {
    background(BACKGROUND_COLOR);

    fill(APPLE_COLOR);
    let applePixelPos = getPixelPos(apple);
    square(applePixelPos.x, applePixelPos.y, TILE_SIZE);

    fill(SNAKE_COLOR);
    snake.forEach((segment) => {
        let segmentPixelPos = getPixelPos(segment);
        square(segmentPixelPos.x, segmentPixelPos.y, TILE_SIZE);
    });
}

function keyPressed() {
    isRunning = isRunning || (key == START_KEY);

    const DIRECTION_MAP = new Map([
        [UP_KEY, new p5.Vector(0, -1)],
        [LEFT_KEY, new p5.Vector(-1, 0)],
        [RIGHT_KEY, new p5.Vector(1, 0)],
        [DOWN_KEY, new p5.Vector(0, 1)]
    ]);

    if (isRunning)
        nextDirection = DIRECTION_MAP.get(key) ?? nextDirection;
}

function reset() {
    isRunning = false;
    direction = new p5.Vector(1, 0);
    initSnake();
    apple = generateApplePosition();
}

function initSnake() {
    snake = [];
    const startY = NUM_TILES / 2;
    const startX = NUM_TILES / 2;

    for (let i = 0; i < STARTING_SNAKE_LENGTH; i++) {
        const segmentPos = new p5.Vector(startX - i, startY);
        snake.push(segmentPos);
    }
}

function moveSnake(popTail: boolean) {
    if (popTail)
        snake.pop();

    let newHead = getNextSnakeHead();
    snake.unshift(newHead);
}

function getNextSnakeHead() : p5.Vector {
    let head = snake[0];
    let newHead = new p5.Vector();
    newHead.x = (head.x + direction.x + NUM_TILES) % NUM_TILES;
    newHead.y = (head.y + direction.y + NUM_TILES) % NUM_TILES;
    return newHead;
}

function willEatApple() : boolean {
    let nextHead = getNextSnakeHead();
    return p5.Vector.equals(nextHead, apple);
}

function willCollide() : boolean {
    let nextHead = getNextSnakeHead();
    return snake.slice(0, -1).some((segment) => p5.Vector.equals(segment, nextHead));
}

function generateApplePosition() : p5.Vector {
    let pos = new p5.Vector();
    do {
        pos.x = Math.floor(random(NUM_TILES));
        pos.y = Math.floor(random(NUM_TILES));
    } while(snake.some((segment) => p5.Vector.equals(segment, pos)));
    return pos;
}

function getPixelPos(tile: p5.Vector) : p5.Vector {
    return new p5.Vector(tile.x * TILE_SIZE, tile.y * TILE_SIZE);
}

function isOpposite(a: p5.Vector, b: p5.Vector) : boolean {
    return a.x == -b.x && a.y == -b.y;
}