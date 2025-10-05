const SIZE = window.innerHeight;
const SKETCH_SCALE_HEIGHT = 0.7;
const SKETCH_RATIO_WIDTH = 0.5625;
const SKETCH_HEIGHT = SIZE * SKETCH_SCALE_HEIGHT;
const SKETCH_WIDTH = SKETCH_HEIGHT * SKETCH_RATIO_WIDTH;

const BIRD_SIZE_SCALE = 0.13;
const BIRD_OFFSET_X_SCALE = 0.1;
const BIRD_RATIO = 0.7;
const BIRD_WIDTH = SKETCH_WIDTH * BIRD_SIZE_SCALE;
const BIRD_HEIGHT = BIRD_WIDTH * BIRD_RATIO;
const BIRD_OFFSET_X = SKETCH_WIDTH * BIRD_OFFSET_X_SCALE;

const BASE_RATIO = 1/3;
const BASE_WIDTH = SKETCH_WIDTH;
const BASE_HEIGHT = BASE_WIDTH * BASE_RATIO;

const BACKGROUND_IMAGE_PATH = '/assets/background.png';
const BASE_IMAGE_PATH = '/assets/base.png';
const BIRD_IMAGE_DOWNFLAP_PATH = '/assets/bird-downflap.png';
const BIRD_IAMGE_MIDFLAP_PATH = '/assets/bird-midflap.png';
const BIRD_IMAGE_UPFLAP_PATH = '/assets/bird-upflap.png';

const BIRD_ANIMATION_FRAME_DURATION = 100;

const SIMULATION_REFERENCE_HEIGHT = 500;
const SIMULATION_FACTOR = SKETCH_HEIGHT / SIMULATION_REFERENCE_HEIGHT;
const GRAVITY = 3 * SIMULATION_FACTOR;
const JUMP_VELOCITY = -0.8 * SIMULATION_FACTOR;
const TERMINAL_VELOCITY = 1.2 * SIMULATION_FACTOR;

const BASE_SPEED = 150;
const SPEED_INCREASE = 0.001;
const MAX_SPEED = 300;

const BIRD_MAX_ROTATION_ANGLE = Math.PI / 4;

const JUMP_TIME_DELTA = 100;

const START_KEY = ' ';
const JUMP_KEY = ' ';

interface Rect {
    x: number,
    y: number,
    w: number,
    h: number
}

let backgroundImg: p5.Image;
let baseImg: p5.Image;
let birdFrames: p5.Image[] = [];
let currentBirdAnimationFrame = 0;
let lastBirdAnimationFrameChange = 0;

let isRunning = false;
let bird: Rect;
let fallDuration = 0;
let jumpVelocity = 0;
let lastJump = 0;
let birdAngle = 0;
let totalSimulationTime = 0;
let backgroundOffsetX = 0;

async function loadAssets() {
    backgroundImg = await loadImage(BACKGROUND_IMAGE_PATH);
    baseImg = await loadImage(BASE_IMAGE_PATH);
    birdFrames[0] = await loadImage(BIRD_IMAGE_DOWNFLAP_PATH);
    birdFrames[1] = await loadImage(BIRD_IAMGE_MIDFLAP_PATH);
    birdFrames[2] = await loadImage(BIRD_IMAGE_UPFLAP_PATH);
    birdFrames[3] = await loadImage(BIRD_IAMGE_MIDFLAP_PATH);
}

async function setup() {
    createCanvas(SKETCH_WIDTH, SKETCH_HEIGHT);
    await loadAssets();
    reset();
}

function draw() {
    if (isRunning)
        update();
        
    backgroundOffsetX -= getCurrentSpeed() * (deltaTime / 1000);
    updateBirdAnimation();
    render();
}

function update() {
    totalSimulationTime += deltaTime;
    fallDuration += deltaTime;
    bird.y += getCurrentBirdVelocity() * deltaTime;

    if (hitWall('bottom'))
        reset();
    else if (hitWall('top'))
        bird.y = 0;
}

function getCurrentBirdVelocity() : number {
    const gVelocity = GRAVITY * (fallDuration / 1000);
    return Math.min(TERMINAL_VELOCITY, jumpVelocity + gVelocity);
}

function getBirdRotationAngle() : number {
    const normalizedBirdVelocity = getCurrentBirdVelocity() / TERMINAL_VELOCITY;
    const squaredNormalizedVelocity = Math.pow(normalizedBirdVelocity, 2);
    const sign = Math.sign(normalizedBirdVelocity);
    return sign * squaredNormalizedVelocity * BIRD_MAX_ROTATION_ANGLE;
}

function updateBirdAnimation() {
    birdAngle = lerp(birdAngle, getBirdRotationAngle(), 0.1);
    if (millis() - lastBirdAnimationFrameChange > BIRD_ANIMATION_FRAME_DURATION) {
        currentBirdAnimationFrame = (currentBirdAnimationFrame + 1) % birdFrames.length;
        lastBirdAnimationFrameChange = millis();
    }
}

function render() {
    push();
    translate(backgroundOffsetX % SKETCH_WIDTH, 0);
    image(backgroundImg, 0, 0, SKETCH_WIDTH, SKETCH_HEIGHT);
    image(backgroundImg, SKETCH_WIDTH, 0, SKETCH_WIDTH, SKETCH_HEIGHT);
    image(baseImg, 0, SKETCH_HEIGHT - BASE_HEIGHT, BASE_WIDTH, BASE_HEIGHT);
    image(baseImg, SKETCH_WIDTH, SKETCH_HEIGHT - BASE_HEIGHT, BASE_WIDTH, BASE_HEIGHT);
    pop();

    push();
    translate(bird.x + bird.w / 2, bird.y + bird.h / 2);
    rotate(birdAngle);
    imageMode(CENTER);
    image(birdFrames[currentBirdAnimationFrame], 0, 0, bird.w, bird.h);
    pop();
}

function keyPressed() {
    let wasRunning = isRunning;
    isRunning = isRunning || (key == START_KEY);
    if (!wasRunning && isRunning) {
        wasRunning = true;
        return;
    }

    if (key == JUMP_KEY && millis() - lastJump > JUMP_TIME_DELTA) {
        jumpVelocity = JUMP_VELOCITY;
        fallDuration = 0;
        lastJump = millis();
    }
}

function reset() {
    isRunning = false;
    fallDuration = 0;
    jumpVelocity = 0;
    lastJump = 0;
    birdAngle = 0;
    totalSimulationTime = 0;
    currentBirdAnimationFrame = 0;
    lastBirdAnimationFrameChange = 0;
    bird = getInitialBirdPosition();
}

function getInitialBirdPosition() : Rect {
    return { 
        x: BIRD_OFFSET_X, 
        y: (SKETCH_HEIGHT - BASE_HEIGHT) / 2 - BIRD_HEIGHT / 2,
        w: BIRD_WIDTH,
        h: BIRD_HEIGHT
    };
}

function hitWall(type: 'top' | 'bottom') : boolean {
    return (type == 'top' && bird.y < 0)
        || (type == 'bottom' && bird.y + bird.h + BASE_HEIGHT > SKETCH_HEIGHT);
}

function getCurrentSpeed() : number {
    return Math.min(MAX_SPEED, BASE_SPEED + totalSimulationTime * SPEED_INCREASE);
}