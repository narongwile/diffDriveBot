const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let snake = [{ x: 500, y: 500 }];
let speed = 5;
let target = null;
let trajectory = [];
let fadeEffect = null;
let direction = { x: 0, y: 0 }; // ทิศทางการเคลื่อนที่
let moving = false; // ตรวจสอบว่างูเคลื่อนที่หรือไม่

document.getElementById("openModal").addEventListener("click", () => {
    document.getElementById("paramModal").style.display = "block";
});

document.querySelector(".close").addEventListener("click", () => {
    document.getElementById("paramModal").style.display = "none";
});

window.addEventListener("click", (event) => {
    if (event.target === document.getElementById("paramModal")) {
        document.getElementById("paramModal").style.display = "none";
    }
});

// ฟังก์ชันควบคุมการล็อกช่อง input
function toggleInputs(type) {
    let inputsA = document.querySelectorAll("#setA input");
    let inputsB = document.querySelectorAll("#setB input");

    if (type === "A") {
        inputsA.forEach(input => input.disabled = false);
        inputsB.forEach(input => input.disabled = true);
    } else if (type === "B") {
        inputsA.forEach(input => input.disabled = true);
        inputsB.forEach(input => input.disabled = false);
    }
}



// ตรวจจับการเลือกชุด Parameter
document.querySelectorAll('input[name="paramType"]').forEach(radio => {
    radio.addEventListener("change", (event) => {
        toggleInputs(event.target.value);
    });
});

// Apply Parameters
document.getElementById("applyParams").addEventListener("click", () => {
    let selectedSet = document.querySelector('input[name="paramType"]:checked');
    if (!selectedSet) {
        alert("Please select Set A or Set B");
        return;
    }

    let params = {};
    if (selectedSet.value === "A") {
        params = {
            x: parseFloat(document.getElementById("xA").value),
            y: parseFloat(document.getElementById("yA").value),
            theta: parseFloat(document.getElementById("thetaA").value),
            time: parseFloat(document.getElementById("timeA").value)
        };
    } else {
        params = {
            x: parseFloat(document.getElementById("xB").value),
            y: parseFloat(document.getElementById("yB").value),
            theta: parseFloat(document.getElementById("thetaB").value)
        };
    }

    console.log("Applied Parameters:", params);
    document.getElementById("paramModal").style.display = "none";
});


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

// เคลื่อนที่ตามเป้าหมาย (จากการคลิก)
function updateSnakeToTarget() {
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
        } else {
            target = null;
        }
    }
}

// เคลื่อนที่ตามปุ่มควบคุม
function updateSnakeWithControls() {
    if (moving) {
        let head = snake[0];
        let newHead = { x: head.x + direction.x * speed, y: head.y + direction.y * speed };

        snake.unshift(newHead);
        snake.pop();
        trajectory.push(newHead);
        if (trajectory.length > 50) trajectory.shift();
    }
}

// ตั้งค่าการควบคุมการเคลื่อนที่
// function moveSnake(dx, dy) {
//     direction = { x: dx, y: dy };
//     moving = true;
// }

function stopSnake() {
    moving = false;
}

// คลิกบน canvas เพื่อเคลื่อนที่ไปยังจุดนั้น
canvas.addEventListener("click", (event) => {
    target = { x: event.clientX, y: event.clientY };
    fadeEffect = { x: event.clientX, y: event.clientY, alpha: 1 };
});

// ปุ่ม HTML ควบคุมการเคลื่อนที่
const moveAmount = 10;

document.getElementById("up").addEventListener("click", () => moveSnake(0, -moveAmount));
document.getElementById("down").addEventListener("click", () => moveSnake(0, moveAmount));
document.getElementById("left").addEventListener("click", () => moveSnake(-moveAmount, 0));
document.getElementById("right").addEventListener("click", () => moveSnake(moveAmount, 0));
document.addEventListener("mouseup", stopSnake);
function moveSnake(dx, dy) {
    let head = snake[0];
    let newHead = { x: head.x + dx, y: head.y + dy };
    snake.unshift(newHead);
    snake.pop();
    trajectory.push(newHead);
    if (trajectory.length > 50) trajectory.shift();
}



// คีย์บอร์ดควบคุม
document.addEventListener("keydown", (event) => {
    if (event.key === "ArrowUp") moveSnake(0, -1);
    if (event.key === "ArrowDown") moveSnake(0, 1);
    if (event.key === "ArrowLeft") moveSnake(-1, 0);
    if (event.key === "ArrowRight") moveSnake(1, 0);
});
document.addEventListener("keyup", stopSnake);

// ฟังก์ชันหลักของเกม
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawAxes();
    drawTrajectory();
    drawFadeEffect();
    drawSnake();
    updateSnakeToTarget();  // ใช้คลิกเพื่อเป้าหมาย
    updateSnakeWithControls();  // ใช้ปุ่มควบคุม
    requestAnimationFrame(gameLoop);
}

gameLoop();
