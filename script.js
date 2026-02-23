const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 800;
canvas.height = 600;

// ======================
// MAP BESAR
// ======================
const mapWidth = 3000;
const mapHeight = 2000;

// ======================
// GAME STATE
// ======================
let gameOver = false;
let score = 0;

// ======================
// PLAYER
// ======================
let snake = [{ x: mapWidth/2, y: mapHeight/2 }];
let baseSpeed = 4;
let boostSpeed = 8;
let speed = baseSpeed;
let isBoosting = false;
let growAmount = 0;

let dx = baseSpeed;
let dy = 0;

// ======================
// CAMERA
// ======================
let camera = { x: 0, y: 0, width: canvas.width, height: canvas.height };

// ======================
// MAKANAN
// ======================
let foods = [];
const foodCount = 200;
function spawnFood() {
    foods = [];
    for (let i = 0; i < foodCount; i++) {
        foods.push({ x: Math.random() * mapWidth, y: Math.random() * mapHeight });
    }
}
spawnFood();

// ======================
// MUSUH AI
// ======================
let enemies = [];
const enemyCount = 10;
function spawnEnemies() {
    enemies = [];
    for (let i = 0; i < enemyCount; i++) {
        enemies.push({
            body: [{ x: Math.random() * mapWidth, y: Math.random() * mapHeight }],
            dx: (Math.random() - 0.5) * 4,
            dy: (Math.random() - 0.5) * 4,
            growAmount: 0,
            color: "red"
        });
    }
}
spawnEnemies();

// ======================
// MOUSE CONTROL
// ======================
canvas.addEventListener("mousemove", function(e) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left + camera.x;
    const mouseY = e.clientY - rect.top + camera.y;
    const angle = Math.atan2(mouseY - snake[0].y, mouseX - snake[0].x);
    dx = Math.cos(angle) * speed;
    dy = Math.sin(angle) * speed;
});

// ======================
// BOOST
// ======================
document.addEventListener("keydown", e => {
    if (e.code === "Space") { isBoosting = true; speed = boostSpeed; }
});
document.addEventListener("keyup", e => {
    if (e.code === "Space") { isBoosting = false; speed = baseSpeed; }
});

// ======================
// PARTIKEL BOOST
// ======================
let boostParticles = [];
function spawnBoostParticles(x, y) {
    for (let i = 0; i < 5; i++) {
        boostParticles.push({
            x: x,
            y: y,
            dx: (Math.random() - 0.5) * 4,
            dy: (Math.random() - 0.5) * 4,
            life: 20 + Math.random() * 10
        });
    }
}
function updateBoostParticles() {
    boostParticles.forEach((p, i) => {
        p.x += p.dx;
        p.y += p.dy;
        p.life--;
        if (p.life <= 0) boostParticles.splice(i, 1);
    });
}

// ======================
// MAP COLLISION
// ======================
function checkMapCollision(obj) {
    const padding = 8;
    return obj.x < padding || obj.x > mapWidth - padding || obj.y < padding || obj.y > mapHeight - padding;
}

// ======================
// UPDATE PLAYER
// ======================
function updatePlayer() {
    if (gameOver) return;

    const head = { x: snake[0].x + dx, y: snake[0].y + dy };
    snake.unshift(head);

    if (checkMapCollision(head)) {
        gameOver = true;
        alert("Game Over! Kamu menyentuh batas map!");
        return;
    }

    if (isBoosting) spawnBoostParticles(head.x, head.y);

    for (let i = foods.length - 1; i >= 0; i--) {
        const dist = Math.hypot(head.x - foods[i].x, head.y - foods[i].y);
        if (dist < 10) {
            foods.splice(i, 1);
            foods.push({ x: Math.random() * mapWidth, y: Math.random() * mapHeight });
            growAmount += 3;
            score += 1;
        }
    }

    if (growAmount > 0) growAmount--;
    else snake.pop();

    if (isBoosting && snake.length > 10) snake.pop();

    // update camera
    camera.x = head.x - canvas.width/2;
    camera.y = head.y - canvas.height/2;
    if (camera.x < 0) camera.x = 0;
    if (camera.y < 0) camera.y = 0;
    if (camera.x + canvas.width > mapWidth) camera.x = mapWidth - canvas.width;
    if (camera.y + canvas.height > mapHeight) camera.y = mapHeight - canvas.height;
}

// ======================
// UPDATE ENEMIES
// ======================
function updateEnemies() {
    if (gameOver) return;

    enemies.forEach((enemy, ei) => {
        const head = { x: enemy.body[0].x + enemy.dx, y: enemy.body[0].y + enemy.dy };
        enemy.body.unshift(head);

        if (checkMapCollision(head)) {
            enemy.body.forEach(part => foods.push({ x: part.x, y: part.y }));
            enemies.splice(ei, 1);
            spawnEnemies();
            return;
        }

        if (enemy.growAmount > 0) enemy.growAmount--;
        else enemy.body.pop();

        if (Math.random() < 0.02) {
            enemy.dx = (Math.random() - 0.5) * 4;
            enemy.dy = (Math.random() - 0.5) * 4;
        }

        // collision player
        snake.forEach(part => {
            const dist = Math.hypot(part.x - head.x, part.y - head.y);
            if (dist < 10) {
                if (snake.length > enemy.body.length) {
                    snake.push(...enemy.body.splice(0, enemy.body.length));
                    enemies.splice(ei, 1);
                    spawnEnemies();
                } else {
                    gameOver = true;
                    alert("Game Over! Dimakan musuh!");
                }
            }
        });
    });
}

// ======================
// DRAW SNAKE + REALISTIC EYES
// ======================
function drawSnakeAnimated(body, boosting=false, color="lime", showEyes=false) {
    for (let i = 0; i < body.length; i++) {
        const part = body[i];

        // gradasi badan
        let gradient = ctx.createRadialGradient(part.x - camera.x, part.y - camera.y, 2, part.x - camera.x, part.y - camera.y, 8);
        if (boosting) { gradient.addColorStop(0, "yellow"); gradient.addColorStop(1, "orange"); }
        else { gradient.addColorStop(0, color); gradient.addColorStop(1, "darkgreen"); }

        ctx.fillStyle = gradient;
        let offset = Math.sin(Date.now()/200 + i/2)*2;
        ctx.beginPath();
        ctx.arc(part.x - camera.x + offset, part.y - camera.y, 8, 0, Math.PI*2);
        ctx.fill();

        // mata realistis di kepala
        if (showEyes && i===0) {
            const head = body[0];
            const angle = Math.atan2(dy, dx); // arah gerakan
            const eyeDist = 6; // jarak dari pusat kepala
            const pupilRadius = 4;
            const whiteRadius = 2;

            // posisi mata kiri dan kanan
            const leftEyeX = head.x - camera.x + Math.cos(angle + Math.PI/2) * eyeDist + Math.cos(angle) * 4;
            const leftEyeY = head.y - camera.y + Math.sin(angle + Math.PI/2) * eyeDist + Math.sin(angle) * 4;
            const rightEyeX = head.x - camera.x + Math.cos(angle - Math.PI/2) * eyeDist + Math.cos(angle) * 4;
            const rightEyeY = head.y - camera.y + Math.sin(angle - Math.PI/2) * eyeDist + Math.sin(angle) * 4;

            // pupil hitam
            ctx.fillStyle = "black";
            ctx.beginPath();
            ctx.arc(leftEyeX, leftEyeY, pupilRadius, 0, Math.PI*2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(rightEyeX, rightEyeY, pupilRadius, 0, Math.PI*2);
            ctx.fill();

            // glare putih
            ctx.fillStyle = "white";
            ctx.beginPath();
            ctx.arc(leftEyeX - pupilRadius/2, leftEyeY - pupilRadius/2, whiteRadius, 0, Math.PI*2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(rightEyeX - pupilRadius/2, rightEyeY - pupilRadius/2, whiteRadius, 0, Math.PI*2);
            ctx.fill();
        }
    }
}

// ======================
// DRAW BOOST PARTICLES
// ======================
function drawBoostParticles() {
    ctx.fillStyle = "yellow";
    boostParticles.forEach(p => {
        ctx.globalAlpha = p.life/30;
        ctx.beginPath();
        ctx.arc(p.x - camera.x, p.y - camera.y, 3, 0, Math.PI*2);
        ctx.fill();
        ctx.globalAlpha = 1;
    });
}

// ======================
// DRAW
// ======================
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // map
    ctx.strokeStyle = "white";
    ctx.lineWidth = 4;
    ctx.strokeRect(-camera.x, -camera.y, mapWidth, mapHeight);

    // makanan
    ctx.fillStyle = "orange";
    foods.forEach(food => {
        const fx = food.x - camera.x;
        const fy = food.y - camera.y;
        if (fx > -10 && fx < canvas.width+10 && fy > -10 && fy < canvas.height+10) {
            ctx.beginPath();
            ctx.arc(fx, fy, 5, 0, Math.PI*2);
            ctx.fill();
        }
    });

    // player
    drawSnakeAnimated(snake, isBoosting, "lime", true);

    // musuh
    enemies.forEach(enemy => {
        const gradColor = `hsl(${(enemy.body.length*20)%360}, 80%, 50%)`;
        drawSnakeAnimated(enemy.body, false, gradColor, false);
    });

    drawBoostParticles();
    updateBoostParticles();

    // score
    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.fillText("Score: "+score, 10, 25);
}

// ======================
// GAME LOOP
// ======================
function gameLoop() {
    if (!gameOver) {
        updatePlayer();
        updateEnemies();
        draw();
        requestAnimationFrame(gameLoop);
    }
}


gameLoop();