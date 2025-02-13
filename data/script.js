const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let snake = [{ x: 500, y: 500 }];
let speed = 2;
let target = null;
let trajectory = [];
let fadeEffect = null;

let lastPosition = { x: snake[0].x, y: snake[0].y };
let lastUpdateTime = performance.now();
let realTimeSpeed = 0;

function drawAxes() {
    ctx.strokeStyle = "gray";
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
}

function drawTrajectory() {
    ctx.fillStyle = "red";
    for (let point of trajectory) {
        ctx.fillRect(point.x, point.y, 4, 4);
    }
}

function drawFadeEffect() {
    if (fadeEffect) {
        let { x, y, alpha } = fadeEffect;
        ctx.fillStyle = `rgba(255, 255, 0, ${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, Math.PI * 2);
        ctx.fill();
        fadeEffect.alpha -= 0.02;
        if (fadeEffect.alpha <= 0) fadeEffect = null;
    }
}

function drawSnake() {
    ctx.fillStyle = "lime";
    for (let part of snake) {
        ctx.fillRect(part.x, part.y, 10, 10);
    }
}


function updateSnake() {
    if (target) {
        let head = snake[0];
        let dx = target.x - head.x;
        let dy = target.y - head.y;
        let distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > speed) {
            let moveX = (dx / distance) * speed;
            let moveY = (dy / distance) * speed;

            let newHead = { x: head.x + moveX, y: head.y + moveY };
            snake.unshift(newHead);
            snake.pop();

            trajectory.push(newHead);
            if (trajectory.length > 50) trajectory.shift();

            let now = performance.now();
            let timeDiff = (now - lastUpdateTime) / 1000; 
            let traveledDistance = Math.sqrt((newHead.x - lastPosition.x) ** 2 + (newHead.y - lastPosition.y) ** 2);

            if (timeDiff > 0) {
                realTimeSpeed = traveledDistance / timeDiff;
            }

            lastPosition = { x: newHead.x, y: newHead.y };
            lastUpdateTime = now;

            // ส่งข้อมูลไป ESP32 ทุกครั้งที่งูเคลื่อนที่
            sendSpeedToESP();
        } else {
            target = null;
        }
    }
}


canvas.addEventListener("click", (event) => {
    target = { x: event.clientX, y: event.clientY };
    fadeEffect = { x: event.clientX, y: event.clientY, alpha: 1 };
});

function sendSpeedToESP() {
    let x = snake[0].x.toFixed(2);
    let y = snake[0].y.toFixed(2);
    let speed = realTimeSpeed.toFixed(2);

    fetch(`/updateSpeed?speed=${speed}&x=${x}&y=${y}`)
        .then(response => response.text())
        .then(data => console.log(data));
}

function drawSpeedInfo() {
    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.fillText(`Speed: ${realTimeSpeed.toFixed(2)} px/s`, 10, canvas.height - 40);
    ctx.fillText(`X: ${snake[0].x.toFixed(2)} Y: ${snake[0].y.toFixed(2)}`, 10, canvas.height - 20);
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawAxes();
    drawTrajectory();
    drawFadeEffect();
    drawSnake();
    drawSpeedInfo();
    updateSnake();
    requestAnimationFrame(gameLoop);
}

gameLoop();
