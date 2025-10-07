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

const TEXT_SIZE_SCALE = 0.07;
const TEXT_SIZE = SKETCH_SIZE * TEXT_SIZE_SCALE;

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

let board: number[];

class BoardIndexer {
    private direction: Direction;
    private gridIndex: number;

    constructor(direction: Direction, gridIndex: number) {
        this.direction = direction;
        this.gridIndex = gridIndex;
    }

    private calcIndex(index: number): number {
        if (this.direction == 'left') return this.gridIndex * GRID_SIZE + index;
        if (this.direction == 'right') return (this.gridIndex + 1) * GRID_SIZE - index - 1;
        if (this.direction == 'up') return index * GRID_SIZE + this.gridIndex;
        if (this.direction == 'down') return (GRID_SIZE - index - 1) * GRID_SIZE + this.gridIndex;
        return 0;
    }

    get(index: number): number {
        return board[this.calcIndex(index)];
    }

    set(index: number, val: number) {
        board[this.calcIndex(index)] = val;
    }
}

function setup() {
    createCanvas(SKETCH_SIZE, SKETCH_SIZE);
    textSize(TEXT_SIZE);
    textFont(FONT);
    reset();
}

function draw() {
    noStroke();
    fill(BACKGROUND_COLOR);
    rect(0, 0, SKETCH_SIZE, SKETCH_SIZE, CORNER_RADIUS);

    board.forEach((val, i) => {
        fill(TILE_COLORS[val] || TILE_COLORS[2048]);
        const row = Math.floor(i / 4);
        const col = i % 4;
        const offsetX = col * (TILE_SIZE + TILE_OFFSET) + TILE_OFFSET;
        const offsetY = row * (TILE_SIZE + TILE_OFFSET) + TILE_OFFSET;
        rect(offsetX, offsetY, TILE_SIZE, TILE_SIZE, CORNER_RADIUS);

        if (val != 0) {
            fill(TEXT_COLOR);
            textAlign(CENTER, CENTER);
            text(val.toString(), offsetX + TILE_SIZE / 2, offsetY + TILE_SIZE / 2);
        }
    });
}

function keyPressed() {
    if (DIRECTION_KEY_MAP[key]) {
        merge(DIRECTION_KEY_MAP[key]);
        fillRandomTile();
    }
}

function reset() {
    generateBoard();
}

function merge(direction: Direction) {
    for (let i = 0; i < GRID_SIZE; i++) {
        const indexer = new BoardIndexer(direction, i);
        shiftTogether(indexer);
        mergeSingle(indexer);
        shiftTogether(indexer);
    }
}

function mergeSingle(indexer: BoardIndexer) {
    for (let i = 0; i < GRID_SIZE - 1; i++) {
        if (indexer.get(i) == indexer.get(i + 1) && indexer.get(i) != 0) {
            indexer.set(i, indexer.get(i) * 2);
            indexer.set(i + 1, 0);
        }
    }
}

function shiftTogether(indexer: BoardIndexer) {
    let shiftIndex = 0;
    for (let i = 0; i < GRID_SIZE; i++) {
        if (indexer.get(i) == 0)
            continue;
        if (shiftIndex != i) {
            indexer.set(shiftIndex, indexer.get(i));
            indexer.set(i, 0);
        }        
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
    const tileValue = random() < PROBABILITY_FOUR_TILE ? 4 : 2;
    let boardIndex = 0;
    do {
        boardIndex = floor(random(0, GRID_SIZE * GRID_SIZE));
    } while(board[boardIndex] != 0);
    board[boardIndex] = tileValue;
}