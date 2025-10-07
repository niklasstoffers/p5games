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

const SKETCH_BOUNDARIES_OFFSET_SCALE_Y = 0.02;
const SKETCH_BOUNDARIES_OFFSET_SCALE_X = 0.02;
const SKETCH_BOUNDARIES_HEIGHT_SCALE = 0.02;
const SKETCH_BOUNDARIES_OFFSET_Y = SKETCH_SIZE * SKETCH_BOUNDARIES_OFFSET_SCALE_Y;
const SKETCH_BOUNDARIES_OFFSET_X = SKETCH_SIZE * SKETCH_BOUNDARIES_OFFSET_SCALE_X;
const SKETCH_BOUNDARIES_HEIGHT = SKETCH_SIZE * SKETCH_BOUNDARIES_HEIGHT_SCALE;
const SKETCH_BOUNDARIES_WIDTH = SKETCH_WIDTH - 2 * SKETCH_BOUNDARIES_OFFSET_X;

const SKETCH_CENTER_LINE_THICKNESS_SCALE = 0.01;
const SKETCH_CENTER_LINE_NUM_SEGMENTS = 8;
const SKETCH_CENTER_LINE_THICKNESS = SKETCH_SIZE * SKETCH_CENTER_LINE_THICKNESS_SCALE;
const SKETCH_CENTER_LINE_OFFSET_Y = SKETCH_BOUNDARIES_OFFSET_Y + 2 * SKETCH_BOUNDARIES_HEIGHT;
const SKETCH_CENTER_LINE_HEIGHT = SKETCH_HEIGHT - 2 * SKETCH_CENTER_LINE_OFFSET_Y;
const SKETCH_CENTER_LINE_SEGMENT_SIZE = SKETCH_CENTER_LINE_HEIGHT / (2 * SKETCH_CENTER_LINE_NUM_SEGMENTS);

const SKETCH_COLLISION_BOUNDARY_Y_MIN = SKETCH_BOUNDARIES_OFFSET_Y + SKETCH_BOUNDARIES_HEIGHT;
const SKETCH_COLLISION_BOUNDARY_Y_MAX = SKETCH_HEIGHT - SKETCH_COLLISION_BOUNDARY_Y_MIN;
const SKETCH_COLLISION_BOUNDARY_HEIGHT = SKETCH_COLLISION_BOUNDARY_Y_MAX - SKETCH_COLLISION_BOUNDARY_Y_MIN;

const SCORE_TEXT_SIZE_FACTOR = 0.1;
const SCORE_TEXT_OFFSET_CENTER_X_FACTOR = 0.1;
const SCORE_TEXT_OFFSET_Y_FACTOR = 0.2;
const SCORE_TEXT_SIZE = SKETCH_SIZE * SCORE_TEXT_SIZE_FACTOR;
const SCORE_TEXT_OFFSET_CENTER_X = SKETCH_SIZE * SCORE_TEXT_OFFSET_CENTER_X_FACTOR;
const SCORE_TEXT_OFFSET_Y = SKETCH_SIZE * SCORE_TEXT_OFFSET_Y_FACTOR;

const BACKGROUND_COLOR = '#000';
const FOREGROUND_COLOR = '#FFF';
const SECONDARY_FOREGROUND_COLOR = '#CCC';

const START_KEY = ' ';
const KEY_UP = 'w';
const KEY_DOWN = 's';

const SIMULATION_REFERENCE_HEIGHT = 500;
const SIMULATION_FACTOR = SKETCH_HEIGHT / SIMULATION_REFERENCE_HEIGHT;
const PADDLE_SPEED = 0.45 * SIMULATION_FACTOR;
const BALL_SPEED = 0.55 * SIMULATION_FACTOR;

const MAX_BOUNCE_ANGLE = Math.PI / 3;
const BALL_START_ANGLE_MIN = -Math.PI / 4;
const BALL_START_ANGLE_MAX = Math.PI / 4;

const STICKY_COLLISION_EPSILON = 1;
const PADDLE_VELOCITY_COLLISION_INFLUENCE = 0.2;

const COM_PADDLE_CENTER_DELTA = 5;

const MAX_SCORE = 9;

const FONT = 'Press Start 2P';
const LOSS_TEXT = 'LOSS';
const WIN_TEXT = 'WIN';

interface Rect {
    x: number;
    y: number;
    w: number;
    h: number;
}

interface ComConfig {
    reactionTime: { min: number, max: number };
    paddleSpeed: number;
    errorMargin: number;
}

type ComDifficulty = 'easy' | 'medium' | 'hard';
const COM_DIFFICULTY: ComDifficulty = 'medium';

const COM_DIFFICULTY_SETTINGS: Map<ComDifficulty, ComConfig> = new Map([
    ['easy', { reactionTime: { min: 50, max: 150 }, paddleSpeed: 0.25 * SIMULATION_FACTOR, errorMargin: 0.13 * SKETCH_SIZE }],
    ['medium', { reactionTime: { min: 150, max: 250 }, paddleSpeed: 0.4 * SIMULATION_FACTOR, errorMargin: 0.1 * SKETCH_SIZE }],
    ['hard', { reactionTime: { min: 200, max: 300 }, paddleSpeed: 0.45 * SIMULATION_FACTOR, errorMargin: 0.02 * SKETCH_SIZE }]
]);

let isRunning = false;
let playerPaddle: Rect;
let comPaddle: Rect;
let ball: Rect;
let ballVector: p5.Vector;
let playerScore = 0;
let comScore = 0;
let comConfig = COM_DIFFICULTY_SETTINGS.get(COM_DIFFICULTY)!;
let currentComReactionTime: number;
let currentComErrorMargin: number;

function setup() {
    createCanvas(SKETCH_WIDTH, SKETCH_HEIGHT);
    strokeCap(SQUARE);
    textFont(FONT);
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
    
    let comMovementVector = getNormalizedComMovementVector();
    movePaddle(comPaddle, comMovementVector, comConfig.paddleSpeed);

    moveBall();
    handleBallCollisions();
}

function render() {
    background(BACKGROUND_COLOR);

    stroke(SECONDARY_FOREGROUND_COLOR);
    fill(SECONDARY_FOREGROUND_COLOR);
    rect(SKETCH_BOUNDARIES_OFFSET_X, SKETCH_BOUNDARIES_OFFSET_Y, SKETCH_BOUNDARIES_WIDTH, SKETCH_BOUNDARIES_HEIGHT);
    rect(SKETCH_BOUNDARIES_OFFSET_X, SKETCH_HEIGHT - SKETCH_BOUNDARIES_OFFSET_Y - SKETCH_BOUNDARIES_HEIGHT, SKETCH_BOUNDARIES_WIDTH, SKETCH_BOUNDARIES_HEIGHT);

    let playerScoreText = playerScore.toString();
    let comScoreText = comScore.toString();
    if (Math.max(playerScore, comScore) == MAX_SCORE) {
        playerScoreText = playerScore == MAX_SCORE ? WIN_TEXT : LOSS_TEXT;
        comScoreText = comScore == MAX_SCORE ? WIN_TEXT : LOSS_TEXT;
    }

    textSize(SCORE_TEXT_SIZE);
    text(playerScoreText, SKETCH_WIDTH / 2 - SCORE_TEXT_OFFSET_CENTER_X - textWidth(playerScoreText), SCORE_TEXT_OFFSET_Y);
    text(comScoreText, SKETCH_WIDTH / 2 + SCORE_TEXT_OFFSET_CENTER_X, SCORE_TEXT_OFFSET_Y);

    drawingContext.setLineDash([SKETCH_CENTER_LINE_SEGMENT_SIZE, SKETCH_CENTER_LINE_SEGMENT_SIZE]);
    strokeWeight(SKETCH_CENTER_LINE_THICKNESS);
    line(SKETCH_WIDTH / 2, SKETCH_CENTER_LINE_OFFSET_Y + SKETCH_CENTER_LINE_SEGMENT_SIZE / 2, SKETCH_WIDTH / 2, SKETCH_HEIGHT - SKETCH_CENTER_LINE_OFFSET_Y + SKETCH_CENTER_LINE_SEGMENT_SIZE / 2);
    strokeWeight(1);
    drawingContext.setLineDash([]);

    fill(FOREGROUND_COLOR);
    stroke(FOREGROUND_COLOR);
    rect(playerPaddle.x, playerPaddle.y, playerPaddle.w, playerPaddle.h);
    rect(comPaddle.x, comPaddle.y, comPaddle.w, comPaddle.h);
    rect(ball.x, ball.y, ball.w, ball.h);
}

function keyPressed() {
    let wasRunning = isRunning;
    isRunning = isRunning || (key == ' ');

    if (!wasRunning && isRunning && Math.max(playerScore, comScore) == MAX_SCORE)
        resetScores();
}

function resetScores() {
    playerScore = 0;
    comScore = 0;
}

function reset() {
    isRunning = false;
    playerPaddle = getInitialPaddlePos('player');
    comPaddle = getInitialPaddlePos('com');
    ball = getInitialBallPos();
    ballVector = getRandomBallVector();
    comSetParameters();
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
    paddle.y = clampVal(paddle.y + speedVector.y, SKETCH_COLLISION_BOUNDARY_Y_MIN, SKETCH_COLLISION_BOUNDARY_Y_MAX - PADDLE_HEIGHT);
}

function moveBall() {
    let speedVector = new p5.Vector(BALL_SPEED * deltaTime, BALL_SPEED * deltaTime);
    speedVector.mult(ballVector);
    ball.x = clampVal(ball.x + speedVector.x, 0, SKETCH_WIDTH - BALL_SIZE);
    ball.y = clampVal(ball.y + speedVector.y, SKETCH_COLLISION_BOUNDARY_Y_MIN, SKETCH_COLLISION_BOUNDARY_Y_MAX - BALL_SIZE);
}

function handleBallCollisions() {
    if (intersects(ball, playerPaddle))
        handlePaddleCollision(playerPaddle, getNormalizedPlayerMovementVector());
    else if (intersects(ball, comPaddle)) {
        handlePaddleCollision(comPaddle, getNormalizedComMovementVector());
        comSetParameters();
    }
    
    if (ballHitLine('top') || ballHitLine('bottom'))
        ballVector.y *= -1;
    
    if (ballHitLine('left')) {
       comScore++;
       reset();
    } else if (ballHitLine('right')) {
        playerScore++;
        reset();
    }
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

function ballHitLine(type: 'top' | 'bottom' | 'left' | 'right') : boolean {
    return (type == 'top' && ball.y <= SKETCH_COLLISION_BOUNDARY_Y_MIN)
        || (type == 'bottom' && ball.y + ball.h >= SKETCH_COLLISION_BOUNDARY_Y_MAX)
        || (type == 'left' && ball.x <= 0)
        || (type == 'right' && ball.x + ball.w >= SKETCH_WIDTH);
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
    let timeUntilHit = getTimeUntilComHit();
    let predictedY = comPredictBallImpactY()!;
    let dy = predictedY - (comPaddle.y + comPaddle.h / 2) + currentComErrorMargin;

    if (isBallFlyingTowardsPaddle(comPaddle) && timeUntilHit < currentComReactionTime && Math.abs(dy) >= COM_PADDLE_CENTER_DELTA)
        return new p5.Vector(0, dy).normalize();
    
    return new p5.Vector(0, 0);
}

function getTimeUntilComHit() : number {
    return comPaddle.x - (ball.x + ball.w) / (ballVector.x * BALL_SPEED);
}

function comPredictBallImpactY() : number {
    let dx = comPaddle.x - ball.x - ball.w;
    let t = dx / (ballVector.x * BALL_SPEED);
    let relativeY = ball.y - SKETCH_COLLISION_BOUNDARY_Y_MIN;
    let rawY = relativeY + ballVector.y * t * BALL_SPEED;
    let bouncePeriodY = 2 * (SKETCH_COLLISION_BOUNDARY_HEIGHT - ball.h);
    let modY = ((rawY % bouncePeriodY) + bouncePeriodY) % bouncePeriodY;

    if (modY > SKETCH_COLLISION_BOUNDARY_HEIGHT - ball.h)
        return bouncePeriodY - modY + SKETCH_COLLISION_BOUNDARY_Y_MIN;
    return modY + SKETCH_COLLISION_BOUNDARY_Y_MIN;
}

function comSetParameters() {
    currentComReactionTime = random(comConfig.reactionTime.min, comConfig.reactionTime.max);
    currentComErrorMargin = random(-comConfig.errorMargin, comConfig.errorMargin);
}

function isBallFlyingTowardsPaddle(paddle: Rect) : boolean {
    return (ballVector.x < 0 && ball.x - paddle.x - paddle.w > 0)
        || (ballVector.x > 0 && paddle.x - ball.x - ball.w > 0);
}

function intersects(first: Rect, second: Rect) : boolean {
    return !(first.x > second.x + second.w || first.x + first.w < second.x
          || first.y > second.y + second.h || first.y + first.h < second.y);
}

function clampVal(value: number, min: number, max: number) : number {
    return map(value, min, max, min, max, true);
}