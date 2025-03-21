const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const gridSize = 50; // 1 ช่อง = 50px = 0.5m
const snakeSize = (22 / 50) * gridSize; // ขนาดงู = 22cm แปลงเป็น pixel
const wheelDistance = 0.3 * gridSize; // ระยะห่างระหว่างล้อซ้าย-ขวา (30cm)

let snake = [{ x: 500, y: 500 }];
let speed = 5;
let target = null;
let trajectory = [];
let fadeEffect = null;
let direction = { x: 0, y: 0 };
let moving = false;
let currentParams = {}; // Store current parameters

const velocityDisplay = document.createElement("div");
velocityDisplay.style.position = "absolute";
velocityDisplay.style.top = "100px";
velocityDisplay.style.left = "100px";
velocityDisplay.style.background = "rgba(232, 161, 9, 0.9)";
velocityDisplay.style.color = "white";
velocityDisplay.style.padding = "10px";
velocityDisplay.style.borderRadius = "5px";
document.body.appendChild(velocityDisplay);

// ✅ ใช้ Bootstrap Modal API แทนการควบคุม `display`
const paramModal = new bootstrap.Modal(document.getElementById("paramModal"));

document.getElementById("openModal").addEventListener("click", () => {
    paramModal.show();
});

// ✅ Modal Form Validation
function validateModalForm() {
    let selectedSet = document.querySelector('input[name="paramType"]:checked');
    if (!selectedSet) return false;

    let inputs;
    if (selectedSet.value === "A") {
        inputs = document.querySelectorAll("#setA input");
    } else {
        inputs = document.querySelectorAll("#setB input");
    }

    for (let input of inputs) {
        if (input.value === "" || input.value === null) {
            return false;
        }
    }
    return true;
}

document.getElementById("applyParams").addEventListener("click", () => {
    if (!validateModalForm()) {
        alert("Please fill in all parameter fields.");
        return;
    }

    let selectedSet = document.querySelector('input[name="paramType"]:checked');

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
    currentParams = params; // Update current parameters
    sendParamsToESP32(params); // Send parameters to ESP32
    paramModal.hide();
});

// ✅ ปิดการใช้งานช่อง input ทั้งหมดเริ่มต้น
function disableAllInputs() {
    let inputsA = document.querySelectorAll("#setA input");
    let inputsB = document.querySelectorAll("#setB input");

    inputsA.forEach(input => input.disabled = true);
    inputsB.forEach(input => input.disabled = true);
}

// ✅ บังคับให้เลือก Set A หรือ B ก่อน
document.addEventListener("DOMContentLoaded", () => {
    disableAllInputs();
    document.getElementById("applyParams").disabled = true; // ปิดปุ่ม Apply
});

// ✅ เปิดช่องใส่ค่าตามเซตที่เลือก
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

    // ✅ Enable/disable Apply button based on form validity
    document.getElementById("applyParams").disabled = !validateModalForm();
}

// ✅ ตรวจจับการเลือกเซต
document.querySelectorAll('input[name="paramType"]').forEach(radio => {
    radio.addEventListener("change", (event) => {
        toggleInputs(event.target.value);
    });
});

// ✅ ตรวจจับการเปลี่ยนแปลงในช่อง input
document.querySelectorAll("#setA input, #setB input").forEach(input => {
    input.addEventListener("input", () => {
        document.getElementById("applyParams").disabled = !validateModalForm();
    });
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
        ctx.fillRect(point.x, point.y, 3, 3);
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

function drawDirectionArrow(x, y) {
    if (direction.x === 0 && direction.y === 0) return; // ถ้างูหยุด ไม่ต้องแสดงลูกศร
    ctx.save();
    ctx.translate(x, y); // ย้ายจุดอ้างอิงไปที่จุดกลางงู

    let angle = Math.atan2(direction.y, direction.x); // คำนวณมุมจากทิศทาง
    ctx.rotate(angle); // หมุนลูกศรไปตามทิศทาง

    // วาดลูกศร
    ctx.fillStyle = "black";
    ctx.beginPath();
    ctx.moveTo(snakeSize / 2, 0);
    ctx.lineTo(-snakeSize / 3, -snakeSize / 4);
    ctx.lineTo(-snakeSize / 3, snakeSize / 4);
    ctx.closePath();
    ctx.fill();

    ctx.restore(); // คืนค่าหลังหมุน
}


function drawSnake() {
    ctx.fillStyle = "lime";
    let head = snake[0];

    ctx.beginPath();
    ctx.arc(head.x, head.y, snakeSize / 2, 0, Math.PI * 2);
    ctx.fill();

    drawDirectionArrow(head.x, head.y); // แสดงลูกศรที่หัวงู
}


// ✅ เคลื่อนที่ไปยังเป้าหมาย (คลิก)
// function updateSnakeToTarget() {
//     if (target) {
//         let head = snake[0];
//         let dx = target.x - head.x;
//         let dy = target.y - head.y;
//         let distance = Math.sqrt(dx * dx + dy * dy);

//         if (distance > speed) {
//             let moveX = (dx / distance) * speed;
//             let moveY = (dy / distance) * speed;

//             let newHead = { x: head.x + moveX, y: head.y + moveY };

//             // ✅ ตรวจจับทิศเฉียง
//             let normX = Math.sign(moveX);
//             let normY = Math.sign(moveY);
//             direction = { x: normX, y: normY };

//             snake.unshift(newHead);
//             snake.pop();
//             trajectory.push(newHead);
//             if (trajectory.length > 50) trajectory.shift();
//         } else {
//             target = null;
//         }
//     }
// }
function updateVelocityDisplay(v, omega, vL, vR) {
    velocityDisplay.innerHTML = `
        <b>Velocity Data</b><br>
        Linear Velocity (v): ${v.toFixed(2)} px/frame<br>
        Angular Velocity (ω): ${omega.toFixed(2)} rad/frame<br>
        Left Wheel Speed (vL): ${vL.toFixed(2)} px/frame<br>
        Right Wheel Speed (vR): ${vR.toFixed(2)} px/frame
    `;
}
function updateSnakeWithControls() {
    if (moving) {
        let head = snake[0];
        let newHead = { x: head.x + direction.x * speed, y: head.y + direction.y * speed };
        snake.unshift(newHead);
        snake.pop();
        trajectory.push(newHead);
        if (trajectory.length > 100) trajectory.shift(); // จำกัดความยาวของเส้นทาง

        let vL = speed - (direction.x * speed / 2);
        let vR = speed + (direction.x * speed / 2);
        let v = (vL + vR) / 2;
        let omega = (vR - vL) / wheelDistance;
        updateVelocityDisplay(v, omega, vL, vR);
        sendDirectionToESP32(direction, v, omega, vL, vR); // Send direction and velocity to ESP32
    }
}


// ✅ ฟังก์ชันเคลื่อนที่งูแบบ Smooth (กดปุ่มแล้วค้างไว้)
function moveSnake(dx, dy) {
    direction = { x: dx, y: dy };
    moving = true;
}

// ✅ หยุดเคลื่อนที่เมื่อปล่อยปุ่ม
function stopSnake() {
    moving = false;
    sendDirectionToESP32({x:0,y:0},0,0,0,0)
}

// ✅ คลิกที่ Canvas เพื่อเคลื่อนที่ไปยังตำแหน่งเป้าหมาย
// canvas.addEventListener("click", (event) => {
//     target = { x: event.clientX, y: event.clientY };
//     fadeEffect = { x: event.clientX, y: event.clientY, alpha: 1 };
// });

// ✅ ปุ่มควบคุมการเคลื่อนที่
const moveAmount = 1;

document.getElementById("up").addEventListener("mousedown", () => moveSnake(0, -moveAmount));
document.getElementById("down").addEventListener("mousedown", () => moveSnake(0, moveAmount));
document.getElementById("left").addEventListener("mousedown", () => moveSnake(-moveAmount, 0));
document.getElementById("right").addEventListener("mousedown", () => moveSnake(moveAmount, 0));
document.addEventListener("mouseup", stopSnake);

// ✅ คีย์บอร์ดควบคุมแบบ Smooth
document.addEventListener("keydown", (event) => {
    if (event.key === "ArrowUp") moveSnake(0, -1);
    if (event.key === "ArrowDown") moveSnake(0, 1);
    if (event.key === "ArrowLeft") moveSnake(-1, 0);
    if (event.key === "ArrowRight") moveSnake(1, 0);
});

document.addEventListener("keyup", stopSnake);

// ✅ ฟังก์ชันหลักของเกม
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawAxes();
    drawTrajectory();
    drawFadeEffect();
    drawSnake();
    // updateSnakeToTarget();  // ใช้คลิกเพื่อเป้าหมาย
    updateSnakeWithControls();  // ใช้ปุ่มควบคุม
    requestAnimationFrame(gameLoop);
}

gameLoop();

// --- WebSocket Communication ---
let websocket;

function initWebSocket() {
    websocket = new WebSocket('ws://' + window.location.hostname + ':81/');
    websocket.onopen = onOpen;
    websocket.onclose = onClose;
    websocket.onmessage = onMessage;
    websocket.onerror = onError;
}

function onOpen(event) {
    console.log('WebSocket connection opened');
}

function onClose(event) {
    console.log('WebSocket connection closed');
    setTimeout(initWebSocket, 2000);
}

function onMessage(event) {
    console.log('WebSocket message received:', event.data);
}

function onError(event) {
    console.error('WebSocket error:', event);
}

function sendDirectionToESP32(direction, v, omega, vL, vR) {
    if (websocket && websocket.readyState === WebSocket.OPEN) {
        let dirString;
        if (direction.x === 0 && direction.y === -1) {
            dirString = "Forward";
        } else if (direction.x === 0 && direction.y === 1) {
            dirString = "Backward";
        } else if (direction.x === -1 && direction.y === 0) {
            dirString = "Turn Left";
        } else if (direction.x === 1 && direction.y === 0) {
            dirString = "Turn Right";
        } else if (direction.x === 0 && direction.y === 0) {
            dirString = "Stop";
        } else if (direction.x === 1 && direction.y === -1) {
            dirString = "Forward Right";
        } else if (direction.x === -1 && direction.y === -1) {
            dirString = "Forward Left";
        } else if (direction.x === 1 && direction.y === 1) {
            dirString = "Backward Right";
        } else if (direction.x === -1 && direction.y === 1) {
            dirString = "Backward Left";
        }
        websocket.send(JSON.stringify({ type: "direction", data: dirString, v: v, omega: omega, vL: vL, vR: vR }));
    }
}

function sendParamsToESP32(params) {
    if (websocket && websocket.readyState === WebSocket.OPEN) {
        websocket.send(JSON.stringify({ type: "params", data: params }));
    }
}

initWebSocket();
