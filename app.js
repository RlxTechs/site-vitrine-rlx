const menuBtn = document.getElementById("menuBtn");
const navMenu = document.getElementById("navMenu");

if (menuBtn && navMenu) {
  menuBtn.addEventListener("click", () => {
    navMenu.classList.toggle("open");
  });
}

document.querySelectorAll("#navMenu a").forEach((link) => {
  link.addEventListener("click", () => {
    navMenu.classList.remove("open");
  });
});

const filterButtons = document.querySelectorAll(".chip");
const projectCards = document.querySelectorAll(".project-card");

filterButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    filterButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    const filter = btn.dataset.filter;

    projectCards.forEach((card) => {
      const categories = card.dataset.category || "";
      const show = filter === "all" || categories.includes(filter);
      card.style.display = show ? "block" : "none";
    });
  });
});

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const W = canvas.width;
const H = canvas.height;

const gameTitle = document.getElementById("gameTitle");
const gameHelp = document.getElementById("gameHelp");
const gameScore = document.getElementById("gameScore");
const restartBtn = document.getElementById("restartGame");
const tabs = document.querySelectorAll(".game-tab");

const keys = new Set();
const mouse = { x: W / 2, y: H / 2, down: false, clicked: false };

window.addEventListener("keydown", (e) => {
  keys.add(e.key.toLowerCase());
  if ([" ", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(e.key.toLowerCase())) {
    e.preventDefault();
  }
});

window.addEventListener("keyup", (e) => {
  keys.delete(e.key.toLowerCase());
});

function getMousePos(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = W / rect.width;
  const scaleY = H / rect.height;
  mouse.x = (e.clientX - rect.left) * scaleX;
  mouse.y = (e.clientY - rect.top) * scaleY;
}

canvas.addEventListener("mousemove", getMousePos);
canvas.addEventListener("mousedown", (e) => {
  getMousePos(e);
  mouse.down = true;
  mouse.clicked = true;
});
window.addEventListener("mouseup", () => {
  mouse.down = false;
});

canvas.addEventListener("touchstart", (e) => {
  const touch = e.touches[0];
  getMousePos(touch);
  mouse.down = true;
  mouse.clicked = true;
  e.preventDefault();
}, { passive: false });

canvas.addEventListener("touchmove", (e) => {
  const touch = e.touches[0];
  getMousePos(touch);
  e.preventDefault();
}, { passive: false });

canvas.addEventListener("touchend", () => {
  mouse.down = false;
});

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function rects(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function dist(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function drawText(text, x, y, size = 18, color = "#ffffff", align = "left") {
  ctx.fillStyle = color;
  ctx.font = `800 ${size}px Arial`;
  ctx.textAlign = align;
  ctx.fillText(text, x, y);
  ctx.textAlign = "left";
}

function clearBg() {
  ctx.clearRect(0, 0, W, H);
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#0d1736");
  g.addColorStop(1, "#050713");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = "rgba(255,255,255,0.05)";
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let y = 0; y < H; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
}

class NeonRunner {
  constructor() {
    this.title = "Neon Runner";
    this.help = "Espace / Flèche haut pour sauter. Évite les obstacles et récupère les pièces.";
    this.reset();
  }

  reset() {
    this.player = { x: 90, y: 390, w: 38, h: 58, vy: 0, grounded: false };
    this.obstacles = [];
    this.coins = [];
    this.spawn = 0;
    this.coinSpawn = 0;
    this.speed = 260;
    this.score = 0;
    this.alive = true;
  }

  update(dt) {
    if (!this.alive) return;

    if ((keys.has(" ") || keys.has("arrowup") || mouse.down) && this.player.grounded) {
      this.player.vy = -620;
      this.player.grounded = false;
    }

    this.player.vy += 1500 * dt;
    this.player.y += this.player.vy * dt;

    const ground = 430;
    if (this.player.y + this.player.h >= ground) {
      this.player.y = ground - this.player.h;
      this.player.vy = 0;
      this.player.grounded = true;
    }

    this.spawn -= dt;
    if (this.spawn <= 0) {
      this.obstacles.push({ x: W + 20, y: ground - rand(40, 90), w: rand(28, 50), h: rand(40, 90) });
      this.spawn = rand(0.8, 1.4);
    }

    this.coinSpawn -= dt;
    if (this.coinSpawn <= 0) {
      this.coins.push({ x: W + 20, y: rand(210, 360), r: 10, got: false });
      this.coinSpawn = rand(0.45, 0.9);
    }

    this.speed += 6 * dt;
    this.score += dt * 10;

    this.obstacles.forEach((o) => o.x -= this.speed * dt);
    this.coins.forEach((c) => c.x -= this.speed * dt);

    this.obstacles = this.obstacles.filter((o) => o.x + o.w > -20);
    this.coins = this.coins.filter((c) => c.x + c.r > -20 && !c.got);

    for (const o of this.obstacles) {
      if (rects(this.player, o)) {
        this.alive = false;
      }
    }

    for (const c of this.coins) {
      if (dist({ x: this.player.x + 20, y: this.player.y + 25 }, c) < 28) {
        c.got = true;
        this.score += 25;
      }
    }
  }

  draw() {
    clearBg();
    ctx.fillStyle = "rgba(0,229,255,0.18)";
    ctx.fillRect(0, 430, W, 8);

    ctx.fillStyle = "#00e5ff";
    ctx.fillRect(this.player.x, this.player.y, this.player.w, this.player.h);
    ctx.fillStyle = "#06111f";
    ctx.fillRect(this.player.x + 10, this.player.y + 12, 8, 8);

    ctx.fillStyle = "#ff4d6d";
    this.obstacles.forEach((o) => ctx.fillRect(o.x, o.y, o.w, o.h));

    ctx.fillStyle = "#ffd166";
    this.coins.forEach((c) => {
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.fill();
    });

    drawText(`Score ${Math.floor(this.score)}`, 24, 36, 20, "#00e5ff");

    if (!this.alive) {
      drawText("Game Over - clique sur Rejouer", W / 2, H / 2, 28, "#ffffff", "center");
    }
  }
}

class CellArena {
  constructor() {
    this.title = "Cell Arena";
    this.help = "ZQSD / WASD ou flèches pour bouger. Mange les petites cellules, évite les plus grosses.";
    this.reset();
  }

  reset() {
    this.player = { x: W / 2, y: H / 2, r: 18 };
    this.food = Array.from({ length: 70 }, () => ({ x: rand(20, W - 20), y: rand(20, H - 20), r: rand(4, 8) }));
    this.enemies = Array.from({ length: 8 }, () => ({
      x: rand(40, W - 40),
      y: rand(40, H - 40),
      r: rand(10, 32),
      vx: rand(-70, 70),
      vy: rand(-70, 70)
    }));
    this.score = 0;
    this.alive = true;
  }

  update(dt) {
    if (!this.alive) return;

    let dx = 0;
    let dy = 0;
    if (keys.has("arrowleft") || keys.has("a") || keys.has("q")) dx -= 1;
    if (keys.has("arrowright") || keys.has("d")) dx += 1;
    if (keys.has("arrowup") || keys.has("w") || keys.has("z")) dy -= 1;
    if (keys.has("arrowdown") || keys.has("s")) dy += 1;

    if (mouse.down) {
      dx = mouse.x - this.player.x;
      dy = mouse.y - this.player.y;
    }

    const len = Math.hypot(dx, dy) || 1;
    const speed = clamp(180 - this.player.r * 1.2, 70, 180);
    this.player.x = clamp(this.player.x + (dx / len) * speed * dt, this.player.r, W - this.player.r);
    this.player.y = clamp(this.player.y + (dy / len) * speed * dt, this.player.r, H - this.player.r);

    this.food.forEach((f) => {
      if (dist(this.player, f) < this.player.r + f.r) {
        f.x = rand(20, W - 20);
        f.y = rand(20, H - 20);
        this.player.r += 0.35;
        this.score += 5;
      }
    });

    this.enemies.forEach((e) => {
      e.x += e.vx * dt;
      e.y += e.vy * dt;
      if (e.x < e.r || e.x > W - e.r) e.vx *= -1;
      if (e.y < e.r || e.y > H - e.r) e.vy *= -1;

      if (dist(this.player, e) < this.player.r + e.r) {
        if (this.player.r > e.r + 4) {
          this.player.r += e.r * 0.1;
          this.score += Math.floor(e.r * 3);
          e.x = rand(40, W - 40);
          e.y = rand(40, H - 40);
          e.r = rand(10, 34);
        } else {
          this.alive = false;
        }
      }
    });
  }

  draw() {
    clearBg();

    ctx.fillStyle = "#56f39a";
    this.food.forEach((f) => {
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fill();
    });

    this.enemies.forEach((e) => {
      ctx.fillStyle = e.r < this.player.r ? "#ffd166" : "#ff4d6d";
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.fillStyle = "#00e5ff";
    ctx.beginPath();
    ctx.arc(this.player.x, this.player.y, this.player.r, 0, Math.PI * 2);
    ctx.fill();

    drawText(`Masse ${Math.floor(this.player.r)} • Score ${this.score}`, 24, 36, 20, "#00e5ff");

    if (!this.alive) drawText("Absorbé ! Rejoue pour grossir plus vite.", W / 2, H / 2, 27, "#ffffff", "center");
  }
}

class BlockWorld {
  constructor() {
    this.title = "Block World";
    this.help = "Plateforme sandbox 2D : flèches/QD pour bouger, espace pour sauter. Récupère tous les cristaux.";
    this.reset();
  }

  reset() {
    this.player = { x: 60, y: 380, w: 32, h: 46, vx: 0, vy: 0, grounded: false };
    this.blocks = [
      { x: 0, y: 470, w: W, h: 50 },
      { x: 160, y: 390, w: 130, h: 25 },
      { x: 360, y: 330, w: 130, h: 25 },
      { x: 580, y: 270, w: 130, h: 25 },
      { x: 700, y: 405, w: 120, h: 25 }
    ];
    this.crystals = [
      { x: 210, y: 355, got: false },
      { x: 420, y: 295, got: false },
      { x: 640, y: 235, got: false },
      { x: 750, y: 370, got: false },
      { x: 850, y: 430, got: false }
    ];
    this.score = 0;
    this.win = false;
  }

  update(dt) {
    let move = 0;
    if (keys.has("arrowleft") || keys.has("a") || keys.has("q")) move -= 1;
    if (keys.has("arrowright") || keys.has("d")) move += 1;

    this.player.vx = move * 230;

    if ((keys.has(" ") || keys.has("arrowup") || keys.has("w") || keys.has("z")) && this.player.grounded) {
      this.player.vy = -560;
      this.player.grounded = false;
    }

    this.player.vy += 1300 * dt;
    this.player.x += this.player.vx * dt;
    this.player.y += this.player.vy * dt;
    this.player.x = clamp(this.player.x, 0, W - this.player.w);

    this.player.grounded = false;
    for (const b of this.blocks) {
      if (rects(this.player, b)) {
        if (this.player.vy >= 0 && this.player.y + this.player.h - this.player.vy * dt <= b.y + 8) {
          this.player.y = b.y - this.player.h;
          this.player.vy = 0;
          this.player.grounded = true;
        }
      }
    }

    if (this.player.y > H) this.reset();

    this.crystals.forEach((c) => {
      if (!c.got && dist({ x: this.player.x + 16, y: this.player.y + 22 }, c) < 32) {
        c.got = true;
        this.score += 20;
      }
    });

    this.win = this.crystals.every((c) => c.got);
  }

  draw() {
    clearBg();

    this.blocks.forEach((b) => {
      ctx.fillStyle = "#27345f";
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.fillStyle = "rgba(0,229,255,0.4)";
      ctx.fillRect(b.x, b.y, b.w, 4);
    });

    this.crystals.forEach((c) => {
      if (c.got) return;
      ctx.fillStyle = "#8b5cf6";
      ctx.beginPath();
      ctx.moveTo(c.x, c.y - 15);
      ctx.lineTo(c.x + 13, c.y);
      ctx.lineTo(c.x, c.y + 15);
      ctx.lineTo(c.x - 13, c.y);
      ctx.closePath();
      ctx.fill();
    });

    ctx.fillStyle = "#00e5ff";
    ctx.fillRect(this.player.x, this.player.y, this.player.w, this.player.h);

    drawText(`Cristaux ${this.crystals.filter((c) => c.got).length}/5 • Score ${this.score}`, 24, 36, 20, "#00e5ff");

    if (this.win) {
      drawText("Niveau terminé ! Tu as tout récupéré.", W / 2, H / 2, 27, "#ffffff", "center");
    }
  }
}

class StormBattle {
  constructor() {
    this.title = "Storm Battle";
    this.help = "ZQSD / WASD pour bouger, souris pour viser, clic pour tirer. Reste dans la zone et élimine les bots.";
    this.reset();
  }

  reset() {
    this.player = { x: W / 2, y: H / 2, r: 16, hp: 100 };
    this.bullets = [];
    this.enemies = Array.from({ length: 9 }, () => ({
      x: rand(60, W - 60),
      y: rand(60, H - 60),
      r: 15,
      hp: 2
    }));
    this.zone = { x: W / 2, y: H / 2, r: 250 };
    this.cooldown = 0;
    this.score = 0;
    this.alive = true;
  }

  update(dt) {
    if (!this.alive) return;

    let dx = 0;
    let dy = 0;
    if (keys.has("arrowleft") || keys.has("a") || keys.has("q")) dx -= 1;
    if (keys.has("arrowright") || keys.has("d")) dx += 1;
    if (keys.has("arrowup") || keys.has("w") || keys.has("z")) dy -= 1;
    if (keys.has("arrowdown") || keys.has("s")) dy += 1;

    const len = Math.hypot(dx, dy) || 1;
    this.player.x = clamp(this.player.x + (dx / len) * 210 * dt, this.player.r, W - this.player.r);
    this.player.y = clamp(this.player.y + (dy / len) * 210 * dt, this.player.r, H - this.player.r);

    this.cooldown -= dt;
    if ((mouse.down || keys.has(" ")) && this.cooldown <= 0) {
      const ax = mouse.x - this.player.x;
      const ay = mouse.y - this.player.y;
      const al = Math.hypot(ax, ay) || 1;
      this.bullets.push({
        x: this.player.x,
        y: this.player.y,
        vx: (ax / al) * 560,
        vy: (ay / al) * 560,
        life: 0.9
      });
      this.cooldown = 0.18;
    }

    this.bullets.forEach((b) => {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;
    });
    this.bullets = this.bullets.filter((b) => b.life > 0 && b.x > -20 && b.x < W + 20 && b.y > -20 && b.y < H + 20);

    this.enemies.forEach((e) => {
      const ax = this.player.x - e.x;
      const ay = this.player.y - e.y;
      const al = Math.hypot(ax, ay) || 1;
      e.x += (ax / al) * 70 * dt;
      e.y += (ay / al) * 70 * dt;

      if (dist(this.player, e) < this.player.r + e.r) {
        this.player.hp -= 24 * dt;
      }

      for (const b of this.bullets) {
        if (dist(b, e) < e.r + 5) {
          e.hp -= 1;
          b.life = 0;
        }
      }
    });

    const before = this.enemies.length;
    this.enemies = this.enemies.filter((e) => e.hp > 0);
    this.score += (before - this.enemies.length) * 50;

    this.zone.r = Math.max(95, this.zone.r - 7 * dt);
    if (dist(this.player, this.zone) > this.zone.r) {
      this.player.hp -= 18 * dt;
    }

    if (this.player.hp <= 0) this.alive = false;
  }

  draw() {
    clearBg();

    ctx.strokeStyle = "rgba(0,229,255,0.55)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(this.zone.x, this.zone.y, this.zone.r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = "#ff4d6d";
    this.enemies.forEach((e) => {
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.fillStyle = "#ffd166";
    this.bullets.forEach((b) => {
      ctx.beginPath();
      ctx.arc(b.x, b.y, 5, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.fillStyle = "#00e5ff";
    ctx.beginPath();
    ctx.arc(this.player.x, this.player.y, this.player.r, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#ffffff";
    ctx.beginPath();
    ctx.moveTo(this.player.x, this.player.y);
    ctx.lineTo(mouse.x, mouse.y);
    ctx.stroke();

    drawText(`HP ${Math.max(0, Math.floor(this.player.hp))} • Bots ${this.enemies.length} • Score ${this.score}`, 24, 36, 20, "#00e5ff");

    if (!this.alive) drawText("Éliminé dans la zone !", W / 2, H / 2, 28, "#ffffff", "center");
    if (this.enemies.length === 0) drawText("Victoire ! Tous les bots sont éliminés.", W / 2, H / 2, 28, "#ffffff", "center");
  }
}

class OpsTarget {
  constructor() {
    this.title = "Ops Target";
    this.help = "Clique sur les cibles avant qu’elles disparaissent. Jeu de précision et réflexe.";
    this.reset();
  }

  reset() {
    this.targets = [];
    this.spawn = 0;
    this.time = 45;
    this.score = 0;
    this.misses = 0;
    this.finished = false;
  }

  update(dt) {
    if (this.finished) return;

    this.time -= dt;
    if (this.time <= 0) {
      this.finished = true;
      return;
    }

    this.spawn -= dt;
    if (this.spawn <= 0) {
      this.targets.push({
        x: rand(50, W - 50),
        y: rand(70, H - 50),
        r: rand(16, 32),
        life: rand(0.8, 1.8)
      });
      this.spawn = rand(0.35, 0.85);
    }

    this.targets.forEach((t) => t.life -= dt);
    const old = this.targets.length;
    this.targets = this.targets.filter((t) => t.life > 0);
    this.misses += old - this.targets.length;

    if (mouse.clicked) {
      let hit = false;
      for (const t of this.targets) {
        if (dist(mouse, t) < t.r) {
          t.life = 0;
          this.score += Math.floor(100 - t.r);
          hit = true;
          break;
        }
      }
      if (!hit) this.misses += 1;
    }
  }

  draw() {
    clearBg();

    this.targets.forEach((t) => {
      ctx.fillStyle = "#ff4d6d";
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.r * 0.45, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#00e5ff";
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.r * 0.18, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(mouse.x - 14, mouse.y);
    ctx.lineTo(mouse.x + 14, mouse.y);
    ctx.moveTo(mouse.x, mouse.y - 14);
    ctx.lineTo(mouse.x, mouse.y + 14);
    ctx.stroke();

    drawText(`Temps ${Math.ceil(this.time)}s • Score ${this.score} • Ratés ${this.misses}`, 24, 36, 20, "#00e5ff");

    if (this.finished) {
      drawText(`Fin ! Score final : ${this.score}`, W / 2, H / 2, 30, "#ffffff", "center");
    }
  }
}

class DriftDash {
  constructor() {
    this.title = "Drift Dash";
    this.help = "Flèches ou ZQSD pour piloter. Évite les drones rouges et récupère les boosts.";
    this.reset();
  }

  reset() {
    this.player = { x: W / 2, y: H - 80, r: 17, vx: 0, vy: 0 };
    this.enemies = [];
    this.boosts = [];
    this.spawn = 0;
    this.boostSpawn = 1;
    this.score = 0;
    this.alive = true;
  }

  update(dt) {
    if (!this.alive) return;

    let ax = 0;
    let ay = 0;
    if (keys.has("arrowleft") || keys.has("a") || keys.has("q")) ax -= 1;
    if (keys.has("arrowright") || keys.has("d")) ax += 1;
    if (keys.has("arrowup") || keys.has("w") || keys.has("z")) ay -= 1;
    if (keys.has("arrowdown") || keys.has("s")) ay += 1;

    this.player.vx += ax * 620 * dt;
    this.player.vy += ay * 620 * dt;
    this.player.vx *= 0.95;
    this.player.vy *= 0.95;
    this.player.x = clamp(this.player.x + this.player.vx * dt, this.player.r, W - this.player.r);
    this.player.y = clamp(this.player.y + this.player.vy * dt, this.player.r, H - this.player.r);

    this.spawn -= dt;
    if (this.spawn <= 0) {
      this.enemies.push({
        x: rand(30, W - 30),
        y: -30,
        r: rand(12, 26),
        vy: rand(120, 260)
      });
      this.spawn = rand(0.25, 0.75);
    }

    this.boostSpawn -= dt;
    if (this.boostSpawn <= 0) {
      this.boosts.push({ x: rand(30, W - 30), y: -30, r: 12, vy: 160 });
      this.boostSpawn = rand(1.5, 2.8);
    }

    this.enemies.forEach((e) => e.y += e.vy * dt);
    this.boosts.forEach((b) => b.y += b.vy * dt);

    this.enemies = this.enemies.filter((e) => e.y < H + 40);
    this.boosts = this.boosts.filter((b) => b.y < H + 40);

    for (const e of this.enemies) {
      if (dist(this.player, e) < this.player.r + e.r) {
        this.alive = false;
      }
    }

    for (const b of this.boosts) {
      if (dist(this.player, b) < this.player.r + b.r) {
        b.y = H + 100;
        this.score += 50;
      }
    }

    this.score += dt * 12;
  }

  draw() {
    clearBg();

    ctx.strokeStyle = "rgba(0,229,255,0.2)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(W * 0.25, 0);
    ctx.lineTo(W * 0.15, H);
    ctx.moveTo(W * 0.75, 0);
    ctx.lineTo(W * 0.85, H);
    ctx.stroke();

    ctx.fillStyle = "#ff4d6d";
    this.enemies.forEach((e) => {
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.fillStyle = "#56f39a";
    this.boosts.forEach((b) => {
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.fillStyle = "#00e5ff";
    ctx.beginPath();
    ctx.arc(this.player.x, this.player.y, this.player.r, 0, Math.PI * 2);
    ctx.fill();

    drawText(`Score ${Math.floor(this.score)}`, 24, 36, 20, "#00e5ff");

    if (!this.alive) drawText("Crash ! Rejoue pour battre ton score.", W / 2, H / 2, 28, "#ffffff", "center");
  }
}

const games = {
  runner: NeonRunner,
  cell: CellArena,
  blocks: BlockWorld,
  storm: StormBattle,
  ops: OpsTarget,
  drift: DriftDash
};

let currentGame = new NeonRunner();
let last = performance.now();

function setGame(name) {
  const GameClass = games[name] || NeonRunner;
  currentGame = new GameClass();

  gameTitle.textContent = currentGame.title;
  gameHelp.textContent = currentGame.help;

  tabs.forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.game === name);
  });
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => setGame(tab.dataset.game));
});

restartBtn.addEventListener("click", () => currentGame.reset());

function loop(now) {
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;

  currentGame.update(dt);
  currentGame.draw();

  const score = Math.floor(currentGame.score || 0);
  gameScore.textContent = `Score : ${score}`;

  mouse.clicked = false;
  requestAnimationFrame(loop);
}

setGame("runner");
requestAnimationFrame(loop);
