const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let snake = [{ x: 200, y: 200 }];
let speed = 2; // ความเร็วของงู
let target = null; // จุดหมายที่งูต้องการไป

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

            // เพิ่มตำแหน่งใหม่ให้กับงู
            snake.unshift({ x: head.x + moveX, y: head.y + moveY });
            snake.pop();
        } else {
            target = null; // หยุดเมื่อถึงเป้าหมาย
        }
    }
}

// ฟังก์ชันจับการคลิกและตั้งเป้าหมาย
canvas.addEventListener("click", (event) => {
    target = { x: event.clientX, y: event.clientY };
});

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawSnake();
    updateSnake();
    requestAnimationFrame(gameLoop);
}

gameLoop();
