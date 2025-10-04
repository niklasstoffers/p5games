const SIZE = window.innerWidth;
const SKETCH_SCALE = 0.5;
const SKETCH_RATIO = 1.5;
const SKETCH_SIZE = SIZE * SKETCH_SCALE;
const SKETCH_WIDTH = SKETCH_SIZE * SKETCH_RATIO;
const SKETCH_HEIGHT = SKETCH_SIZE;

const PADDLE_SCALE_WIDTH = 0.025;
const PADDLE_SCALE_HEIGHT = 0.2;
const PADDLE_OFFSET_SCALE_X = 0.04;
const PADDLE_WIDTH = SKETCH_SIZE * PADDLE_SCALE_WIDTH;
const PADDLE_HEIGHT = SKETCH_SIZE * PADDLE_SCALE_HEIGHT;
const PADDLE_OFFSET_X = SKETCH_SIZE * PADDLE_OFFSET_SCALE_X;

const BALL_SCALE = 0.025;
const BALL_SIZE = SKETCH_SIZE * BALL_SCALE;

const BACKGROUND_COLOR = '#000';
const PADDLE_COLOR = '#FFF';

const START_KEY = ' ';
const KEY_UP = 'w';
const KEY_DOWN = 's';

const PADDLE_SPEED = 0.7;
const BALL_SPEED = 0.8;

const MAX_BOUNCE_ANGLE = Math.PI / 3;
const BALL_START_ANGLE_MIN = -Math.PI / 4;
const BALL_START_ANGLE_MAX = Math.PI / 4;

const STICKY_COLLISION_EPSILON = 1;
const PADDLE_VELOCITY_COLLISION_INFLUENCE = 0.2;

interface Rect {
    x: number;
    y: number;
    w: number;
    h: number;
}

// interface ComConfig {
//     reactionTimeMs: number;
//     paddleSpeed: number;
//     errorMargin: number;
//     paddleCenterHitRatio: number;
// }

// type ComDifficulty = 'easy' | 'medium' | 'hard';
// const COM_DIFFICULTY: ComDifficulty = 'medium';

// const COM_DIFFICULTY_SETTINGS: Map<ComDifficulty, ComConfig> = new Map([
//     ['easy', { reactionTimeMs: 500, paddleSpeed: 0.6, errorMargin: 50, paddleCenterHitRatio: 0.2 }],
//     ['medium', { reactionTimeMs: 1000, paddleSpeed: 0.8, errorMargin: 20, paddleCenterHitRatio: 0.5 }],
//     ['hard', { reactionTimeMs: 2000, paddleSpeed: 1.0, errorMargin: 5, paddleCenterHitRatio: 0.7 }]
// ]);

let isRunning = false;
let playerPaddle: Rect;
let comPaddle: Rect;
let ball: Rect;
let ballVector: p5.Vector;
// let comConfig = COM_DIFFICULTY_SETTINGS.get(COM_DIFFICULTY)!;

function setup() {
    createCanvas(SKETCH_WIDTH, SKETCH_HEIGHT);
    reset();
}

function draw() {
    if (isRunning)
        update();
    render();
}

function update() {
    let playerMovementVector = getNormalizedPlayerMovementVector();
    movePaddle(playerPaddle, playerMovementVector, PADDLE_SPEED);
    
    // let comMovementVector = getNormalizedComMovementVector();
    // movePaddle(comPaddle, comMovementVector, comConfig.paddleSpeed);

    moveBall();
    handleBallCollisions();
}

function render() {
    background(BACKGROUND_COLOR);

    fill(PADDLE_COLOR);
    stroke(PADDLE_COLOR);
    rect(playerPaddle.x, playerPaddle.y, playerPaddle.w, playerPaddle.h);
    rect(comPaddle.x, comPaddle.y, comPaddle.w, comPaddle.h);
    rect(ball.x, ball.y, ball.w, ball.h);
}

function keyPressed() {
    isRunning = isRunning || (key == ' ');
}

function reset() {
    isRunning = false;
    playerPaddle = getInitialPaddlePos('player');
    comPaddle = getInitialPaddlePos('com');
    ball = getInitialBallPos();
    ballVector = getRandomBallVector();
}

function getInitialPaddlePos(type: 'com' | 'player') : Rect {
    return {
        x: {'com': SKETCH_WIDTH - PADDLE_OFFSET_X - PADDLE_WIDTH, 'player': PADDLE_OFFSET_X}[type],
        y: SKETCH_HEIGHT / 2 - (PADDLE_HEIGHT / 2),
        w: PADDLE_WIDTH,
        h: PADDLE_HEIGHT
    }
}

function getInitialBallPos() : Rect {
    return { 
        x: SKETCH_WIDTH / 2 - (BALL_SIZE / 2),
        y: SKETCH_HEIGHT / 2 - (BALL_SIZE / 2),
        w: BALL_SIZE,
        h: BALL_SIZE
    };
}

function getRandomBallVector() : p5.Vector {
    let angle = random(BALL_START_ANGLE_MIN, BALL_START_ANGLE_MAX);
    let direction = random([1, -1]);
    return p5.Vector.fromAngle(angle, 1).mult(direction);
}

function movePaddle(paddle: Rect, vector: p5.Vector, speed: number) {
    let speedVector = new p5.Vector(0, speed * deltaTime);
    speedVector.mult(vector);
    paddle.y = clampVal(paddle.y + speedVector.y, 0, SKETCH_HEIGHT - PADDLE_HEIGHT);
}

function moveBall() {
    let speedVector = new p5.Vector(BALL_SPEED * deltaTime, BALL_SPEED * deltaTime);
    speedVector.mult(ballVector);
    ball.x = clampVal(ball.x + speedVector.x, 0, SKETCH_WIDTH - BALL_SIZE);
    ball.y = clampVal(ball.y + speedVector.y, 0, SKETCH_HEIGHT - BALL_SIZE);
}

function handleBallCollisions() {
    if (intersects(ball, playerPaddle))
        handlePaddleCollision(playerPaddle, getNormalizedPlayerMovementVector());
    else if (intersects(ball, comPaddle))
        handlePaddleCollision(comPaddle, getNormalizedComMovementVector());
    
    if (ballHitLine('horizontal'))
        ballVector.y *= -1;
    if (ballHitLine('vertical'))
        ballVector.x *= -1;
}

function handlePaddleCollision(paddle: Rect, paddleVelocity: p5.Vector) {
    let collisionSide = getCollisionSide(paddle, ball);
    if (collisionSide == 'side') {
        let bounceAngle = getBounceAngle(paddle);
        bounce(bounceAngle);

        if (ballVector.x < 0)
            ball.x = paddle.x - ball.w - STICKY_COLLISION_EPSILON;
        else
            ball.x = paddle.x + paddle.w + STICKY_COLLISION_EPSILON;
    } else {
        let prevBallY = ballVector.y;
        let relativeY = ballVector.y - paddleVelocity.y;
        let approaching = Math.abs(relativeY) > 0 &&
            ((ballVector.y > 0 && ball.y < paddle.y) || (ballVector.y < 0 && ball.y > paddle.y));

        if (approaching)
            ballVector.y *= -1;
        else {
            ballVector.y += paddleVelocity.y * PADDLE_VELOCITY_COLLISION_INFLUENCE;
            ballVector.normalize();
        }

        if (prevBallY < 0)
            ball.y = paddle.y + paddle.h + STICKY_COLLISION_EPSILON;
        else
            ball.y = paddle.y - ball.h - STICKY_COLLISION_EPSILON;
    }
}

function bounce(bounceAngle: number) {
    let direction = -Math.sign(ballVector.x);
    ballVector.x = direction * Math.cos(bounceAngle);
    ballVector.y = -Math.sin(bounceAngle);
}

function ballHitLine(type: 'horizontal' | 'vertical') : boolean {
    return (type == 'horizontal' && (ball.y <= 0 || ball.y + ball.h >= SKETCH_HEIGHT))
        || (type == 'vertical' && (ball.x <= 0 || ball.x + ball.w >= SKETCH_WIDTH));
}

function getCollisionSide(paddle: Rect, ball: Rect) : 'side' | 'topbottom' {
    let overlapX = Math.min(ball.x + ball.w - paddle.x, paddle.x + paddle.w - ball.x);
    let overlapY = Math.min(ball.y + ball.h - paddle.y, paddle.y + paddle.h - ball.y);
    return overlapX < overlapY ? 'side' : 'topbottom';
}

function getBounceAngle(paddle: Rect) : number {
    let relativeIntersectY = (paddle.y + paddle.h / 2) - (ball.y + ball.h / 2);
    let normalizedRelativeIntersectY = relativeIntersectY / (paddle.h / 2);
    return normalizedRelativeIntersectY * MAX_BOUNCE_ANGLE;
}

function getNormalizedPlayerMovementVector() : p5.Vector {
    if (keyIsDown(KEY_UP) && !keyIsDown(KEY_DOWN))
        return new p5.Vector(0, -1);
    if (keyIsDown(KEY_DOWN) && !keyIsDown(KEY_UP))
        return new p5.Vector(0, 1);
    return new p5.Vector(0, 0);
}

function getNormalizedComMovementVector(): p5.Vector {
    // let timeUntilHit = getTimeUntilComHitMs();
    // if (ballVector.x < 0 || timeUntilHit > comConfig.reactionTimeMs)
    //     return new p5.Vector(0, 0);

    // let predictedY = predictComImpactY();
    // let relativeIntersectY = predictedY - (comPaddle.y + comPaddle.h / 2);
    // let hitAreaCenterOffset = comConfig.paddleCenterHitRatio * comPaddle.h / 2;
    // if (relativeIntersectY < -hitAreaCenterOffset)
    //     return new p5.Vector(0, -1);
    // else if (relativeIntersectY > hitAreaCenterOffset)
    //     return new p5.Vector(0, 1);
    return new p5.Vector(0, 0);
}

// function getTimeUntilComHitMs() : number {
//     return Math.abs(comPaddle.x - (ball.x + ball.w)) / (Math.abs(ballVector.x) * BALL_SPEED);
// }

// function predictComImpactY() : number {
//     let timeUntilHit = getTimeUntilComHitMs();
//     let randomError = random(-comConfig.errorMargin, comConfig.errorMargin);
//     return ball.y + ballVector.y * BALL_SPEED * timeUntilHit + randomError;
// }

function intersects(first: Rect, second: Rect) : boolean {
    return !(first.x > second.x + second.w || first.x + first.w < second.x
          || first.y > second.y + second.h || first.y + first.h < second.y);
}

function clampVal(value: number, min: number, max: number) : number {
    return map(value, min, max, min, max, true);
}