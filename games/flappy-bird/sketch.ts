const SIZE = window.innerHeight;
const SKETCH_SCALE_HEIGHT = 0.7;
const SKETCH_RATIO_WIDTH = 0.5625;
const SKETCH_HEIGHT = SIZE * SKETCH_SCALE_HEIGHT;
const SKETCH_WIDTH = SKETCH_HEIGHT * SKETCH_RATIO_WIDTH;

const BIRD_SIZE_SCALE = 0.15;
const BIRD_RATIO = 0.7;
const BIRD_WIDTH = SKETCH_WIDTH * BIRD_SIZE_SCALE;
const BIRD_HEIGHT = BIRD_WIDTH * BIRD_RATIO;

const BACKGROUND_IMAGE_PATH = '/assets/background.png';
const BIRD_IMAGE_DOWNFLAP_PATH = '/assets/bird-downflap.png';
const BIRD_IAMGE_MIDFLAP_PATH = '/assets/bird-midflap.png';
const BIRD_IMAGE_UPFLAP_PATH = '/assets/bird-upflap.png';

const BIRD_ANIMATION_FRAME_DURATION = 100;

const SIMULATION_REFERENCE_HEIGHT = 500;
const SIMULATION_FACTOR = SKETCH_HEIGHT / SIMULATION_REFERENCE_HEIGHT;
const GRAVITY = 3 * SIMULATION_FACTOR;
const JUMP_VELOCITY = -0.8 * SIMULATION_FACTOR;
const TERMINAL_VELOCITY = 1.2 * SIMULATION_FACTOR;

const BIRD_MAX_ROTATION_ANGLE = Math.PI / 4;

const JUMP_TIME_DELTA = 100;

const JUMP_KEY = ' ';

interface Rect {
    x: number,
    y: number,
    w: number,
    h: number
}

let backgroundImg: p5.Image;
let birdFrames: p5.Image[] = [];
let bird: Rect;
let currentBirdAnimationFrame = 0;
let lastBirdAnimationFrameChange = 0;
let fallDuration = 0;
let jumpVelocity = 0;
let lastJump = 0;
let birdAngle = 0;

async function loadAssets() {
    backgroundImg = await loadImage(BACKGROUND_IMAGE_PATH);
    birdFrames[0] = await loadImage(BIRD_IMAGE_DOWNFLAP_PATH);
    birdFrames[1] = await loadImage(BIRD_IAMGE_MIDFLAP_PATH);
    birdFrames[2] = await loadImage(BIRD_IMAGE_UPFLAP_PATH);
    birdFrames[3] = await loadImage(BIRD_IAMGE_MIDFLAP_PATH);
}

async function setup() {
    createCanvas(SKETCH_WIDTH, SKETCH_HEIGHT);
    await loadAssets();
    bird = { 
        x: SKETCH_WIDTH / 2 - BIRD_WIDTH / 2, 
        y: SKETCH_HEIGHT / 2 - BIRD_HEIGHT / 2,
        w: BIRD_WIDTH,
        h: BIRD_HEIGHT
    };
}

function draw() {
    update();
    updateBirdAnimation();
    render();
}

function update() {
    fallDuration += deltaTime;
    bird.y += getCurrentBirdVelocity() * deltaTime;
}

function getCurrentBirdVelocity() {
    const gVelocity = GRAVITY * (fallDuration / 1000);
    return Math.min(TERMINAL_VELOCITY, jumpVelocity + gVelocity);
}

function getBirdRotationAngle() {
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
    image(backgroundImg, 0, 0, SKETCH_WIDTH, SKETCH_HEIGHT);

    push();
    translate(bird.x + bird.w / 2, bird.y + bird.h / 2);
    rotate(birdAngle);
    imageMode(CENTER);
    image(birdFrames[currentBirdAnimationFrame], 0, 0, bird.w, bird.h);
    pop();
}

function keyPressed() {
    if (key == JUMP_KEY && millis() - lastJump > JUMP_TIME_DELTA) {
        jumpVelocity = JUMP_VELOCITY;
        fallDuration = 0;
        lastJump = millis();
    }
}