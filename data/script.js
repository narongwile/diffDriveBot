const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let snake = [{ x: 200, y: 200 }];
let speed = 2; // ความเร็วของงู
let target = null; // จุดหมายที่งูต้องการไป
let trajectory = []; // เก็บตำแหน่งที่เคลื่อนที่ผ่าน
let fadeEffect = null; // สำหรับจุดแสดงแสงสว่าง

// ฟังก์ชันวาดแกน X และ Y
function drawAxes() {
    ctx.strokeStyle = "gray";
    ctx.lineWidth = 1;

    // แกน X
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();

    // แกน Y
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
}

// ฟังก์ชันวาด trajectory
function drawTrajectory() {
    ctx.fillStyle = "red";
    for (let point of trajectory) {
        ctx.fillRect(point.x, point.y, 4, 4);
    }
}

// ฟังก์ชันวาดจุดเป้าหมายที่คลิก (Fade effect)
function drawFadeEffect() {
    if (fadeEffect) {
        let { x, y, alpha } = fadeEffect;
        ctx.fillStyle = `rgba(255, 255, 0, ${alpha})`; // สีเหลืองโปร่งแสง
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, Math.PI * 2);
        ctx.fill();

        fadeEffect.alpha -= 0.02;
        if (fadeEffect.alpha <= 0) fadeEffect = null; // ลบ effect เมื่อจางหมด
    }
}

// ฟังก์ชันวาดงู
function drawSnake() {
    ctx.fillStyle = "lime";
    for (let part of snake) {
        ctx.fillRect(part.x, part.y, 10, 10);
    }
}

// ฟังก์ชันอัปเดตการเคลื่อนที่ของงู
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

            // บันทึก trajectory
            trajectory.push(newHead);
            if (trajectory.length > 50) trajectory.shift(); // จำกัดขนาดของ trajectory
        } else {
            target = null; // หยุดเมื่อถึงเป้าหมาย
        }
    }
}

// ฟังก์ชันจับการคลิกและตั้งเป้าหมาย
canvas.addEventListener("click", (event) => {
    target = { x: event.clientX, y: event.clientY };
    fadeEffect = { x: event.clientX, y: event.clientY, alpha: 1 }; // เริ่ม fade effect
});

// ฟังก์ชันแสดงความเร็วที่มุมล่างซ้าย
function drawSpeedInfo() {
    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.fillText(`Speed: ${speed.toFixed(2)} px/frame`, 10, canvas.height - 20);
}

// Game loop
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
