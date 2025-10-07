const SIZE = window.innerHeight;
const SKETCH_SCALE = 0.5;
const SKETCH_SIZE = SIZE * SKETCH_SCALE;

const CORNER_RADIUS_FACTOR = 0.01;
const CORNER_RADIUS = SKETCH_SIZE * CORNER_RADIUS_FACTOR;

const GRID_SIZE = 4;
const NUM_STARTING_TILES = 2;
const PROBABILITY_FOUR_TILE = 0.1;

const TILE_OFFSET_FACTOR = 0.03;
const TILE_OFFSET = SKETCH_SIZE * TILE_OFFSET_FACTOR;
const TILE_SIZE = (SKETCH_SIZE - (GRID_SIZE + 1) * TILE_OFFSET) / GRID_SIZE;

const NUM_TEXT_SIZE_SCALE = 0.07;
const NUM_TEXT_SIZE = SKETCH_SIZE * NUM_TEXT_SIZE_SCALE;
const SCORE_TEXT_SIZE_SCALE = 0.1;
const SCORE_TEXT_SIZE = SKETCH_SIZE * SCORE_TEXT_SIZE_SCALE;

const GAMEOVER_BACKGROUND_COLOR = '#0007';
const BACKGROUND_COLOR = '#BBADA0';
const TEXT_COLOR = '#FFF';
const TILE_COLORS: { [key: number]: string } = {
    0: '#CCC0B4', 2: '#EEE4DA', 
    4: '#EDE0C8', 8: '#F2B179', 
    16: '#F59563', 32: '#F67C5F', 
    64: '#F65E3B', 128: '#EDCF72', 
    256: '#EDCC61', 512: '#EDC850', 
    1024: '#EDC53F', 2048: '#EDC22E'
};

const FONT = 'Open Sans';

type Direction = 'up' | 'down' | 'left' | 'right';
const DIRECTION_KEY_MAP: { [key: string]: Direction } = {
    'w': 'up',
    'a': 'left',
    's': 'down',
    'd': 'right' 
};

const RESTART_KEY = ' ';

type IndexTranslator = (index: number) => number;

let board: number[];
let score = 0;
let gameover = false;

function setup() {
    createCanvas(SKETCH_SIZE, SKETCH_SIZE);
    textFont(FONT);
    noStroke();
    reset();
}

function draw() {
    drawBackground();
    drawTiles();

    if (gameover)
        drawGameoverOverlay();
}

function drawBackground() {
    fill(BACKGROUND_COLOR);
    rect(0, 0, SKETCH_SIZE, SKETCH_SIZE, CORNER_RADIUS);
}

function drawTiles() {
    board.forEach((val, i) => {
        fill(TILE_COLORS[val] || TILE_COLORS[2048]);
        const row = Math.floor(i / GRID_SIZE);
        const col = i % GRID_SIZE;
        const offsetX = col * (TILE_SIZE + TILE_OFFSET) + TILE_OFFSET;
        const offsetY = row * (TILE_SIZE + TILE_OFFSET) + TILE_OFFSET;
        rect(offsetX, offsetY, TILE_SIZE, TILE_SIZE, CORNER_RADIUS);

        if (val != 0) {
            fill(TEXT_COLOR);
            textSize(NUM_TEXT_SIZE);
            textAlign(CENTER, CENTER);
            text(val.toString(), offsetX + TILE_SIZE / 2, offsetY + TILE_SIZE / 2);
        }
    });
}

function drawGameoverOverlay() {
    fill(GAMEOVER_BACKGROUND_COLOR);
    rect(0, 0, SKETCH_SIZE, SKETCH_SIZE, CORNER_RADIUS);

    fill(TEXT_COLOR);
    textSize(SCORE_TEXT_SIZE);
    textAlign(CENTER, CENTER);
    text(`Score: ${score}`, SKETCH_SIZE / 2, SKETCH_SIZE / 2);
}

function keyPressed() {
    if (gameover) {
        if (key == RESTART_KEY)
            reset();
        return;
    }

    if (DIRECTION_KEY_MAP[key]) {
        merge(DIRECTION_KEY_MAP[key]);
        gameover = !(hasFreeTiles() || canMerge());
        if (hasFreeTiles())
            fillRandomTile();
    }
}

function reset() {
    gameover = false;
    score = 0;
    generateBoard();
}

function merge(direction: Direction) {
    for (let i = 0; i < GRID_SIZE; i++) {
        const translator = getIndexTranslator(direction, i);
        shiftTogether(translator);
        mergeSingle(translator);
        shiftTogether(translator);
    }
}

function mergeSingle(translator: IndexTranslator) {
    for (let i = 0; i < GRID_SIZE - 1; i++) {
        if (board[translator(i)] == board[translator(i + 1)] && board[translator(i)] != 0) {
            score += board[translator(i)];
            board[translator(i)] = board[translator(i)] * 2;
            board[translator(i + 1)] = 0;
        }
    }
}

function shiftTogether(translator: IndexTranslator) {
    let shiftIndex = 0;
    for (let i = 0; i < GRID_SIZE; i++) {
        if (board[translator(i)] == 0)
            continue;
        [board[translator(shiftIndex)], board[translator(i)]] = [board[translator(i)], board[translator(shiftIndex)]];
        shiftIndex++;
    }
}

function generateBoard() {
    board = new Array(GRID_SIZE * GRID_SIZE).fill(0);
    for (let i = 0; i < NUM_STARTING_TILES; i++) {
        fillRandomTile();
    }
}

function fillRandomTile() {
    const freeTiles = board.map((v, i) => v == 0 ? i : -1).filter(i => i != -1);
    const tileValue = random() < PROBABILITY_FOUR_TILE ? 4 : 2;
    const index = random(freeTiles);
    board[index] = tileValue;
}

function hasFreeTiles(): boolean {
    return board.some(val => val == 0);
}

function canMerge(): boolean {
    for (let i = 0; i < GRID_SIZE; i++) {
        const rowTranslator = getIndexTranslator('left', i);
        const colTranslator = getIndexTranslator('up', i);
        for (let j = 0; j < GRID_SIZE - 1; j++) {
            if ((board[rowTranslator(j)] > 0 && board[rowTranslator(j)] == board[rowTranslator(j + 1)])
             || (board[colTranslator(j)] > 0 && board[colTranslator(j)] == board[colTranslator(j + 1)])) {
                return true;
            }
        }
    }
    return false;
}

function getIndexTranslator(direction: Direction, indexBase: number): IndexTranslator {
    return (index: number) => {
        if (direction == 'left') return indexBase * GRID_SIZE + index;
        if (direction == 'right') return (indexBase + 1) * GRID_SIZE - index - 1;
        if (direction == 'up') return index * GRID_SIZE + indexBase;
        if (direction == 'down') return (GRID_SIZE - index - 1) * GRID_SIZE + indexBase;
        return 0;
    };
}