const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const killsValue = document.getElementById("killsValue");
const timeValue = document.getElementById("timeValue");
const levelValue = document.getElementById("levelValue");
const heroValue = document.getElementById("heroValue");

const menuOverlay = document.getElementById("menuOverlay");
const menuKicker = document.getElementById("menuKicker");
const menuTitle = document.getElementById("menuTitle");
const menuDescription = document.getElementById("menuDescription");
const characterButtons = Array.from(document.querySelectorAll(".character-card"));
const startButton = document.getElementById("startButton");
const restartButton = document.getElementById("restartButton");
const gameShell = document.querySelector(".game-shell");
const gameHeader = document.querySelector(".game-header");
const gameSurface = document.querySelector(".game-surface");
const canvasWrap = document.querySelector(".canvas-wrap");
const touchButtons = Array.from(document.querySelectorAll(".touch-button"));

const BASE_CANVAS = {
  width: 960,
  height: 540
};

const CONFIG = {
  playerMaxHp: 10,
  gravity: 1800,
  jumpVelocity: 1080,
  moveSpeed: 280,
  backwardSpeed: 220,
  projectileSpeed: 640,
  projectileCooldown: 260,
  backgroundScrollSpeed: 180,
  mobSpawnInterval: 1400,
  flyerSpawnInterval: 5000,
  mobSpeedMin: 180,
  mobSpeedMax: 280
};

const SIDE_SCROLLER_CONFIG = {
  gravity: 2200,
  jumpVelocity: 1200,
  moveSpeed: CONFIG.moveSpeed * 1.5,
  backwardSpeed: CONFIG.moveSpeed * 1.5,
  maxJumpRise: 280,
  dropThroughTime: 0.2
};

const LEVEL_THREE_CONFIG = {
  moveSpeed: 400,
  mobSpeedScale: 0.7,
  mobWaveAmplitude: 60
};

const FLYER_CONFIG = {
  hp: 30,
  size: 64,
  sideWaveAmplitude: 96,
  topDownWaveAmplitude: 130,
  sideWaveSpeedMin: 1.3,
  sideWaveSpeedMax: 2.1,
  topDownWaveSpeedMin: 1,
  topDownWaveSpeedMax: 1.6,
  speedMultiplier: 0.55
};

const LEVEL_CONFIGS = {
  1: {
    label: "Level 1",
    mobKillsToBoss: 12,
    bossTriggerTime: 35,
    bossHp: 200,
    bossImage: "bomb",
    mobImage: "bomb"
  },
  2: {
    label: "Level 2",
    mobKillsToBoss: 16,
    bossTriggerTime: 42,
    bossHp: 250,
    bossImage: "boss",
    mobImage: "bomb"
  },
  3: {
    label: "Level 3",
    mobKillsToBoss: 20,
    bossTriggerTime: 48,
    bossHp: 300,
    bossImage: "boss2",
    mobImage: "bomb"
  }
};

const CHARACTERS = {
  fire: {
    name: "Fire",
    image: "fire",
    projectileType: "fire",
    projectileEmoji: "🔥"
  },
  leaf: {
    name: "Leaf",
    image: "leaf",
    projectileType: "leaf",
    projectileEmoji: "🍃"
  },
  lightning: {
    name: "Lightning",
    image: "lightning",
    projectileType: "lightning",
    projectileEmoji: "⚡"
  },
  fairy: {
    name: "Fairy",
    image: "fairy",
    projectileType: "fairy",
    projectileEmoji: "🎀"
  }
};

const world = {
  width: canvas.width,
  height: canvas.height,
  groundY: canvas.height - 86
};

const LEVEL_THREE_BOUNDS = {
  left: 180,
  right: canvas.width - 180,
  top: 18,
  bottom: canvas.height - 18
};

const keys = {};
const images = loadImages({
  fire: "fire.png",
  leaf: "leaf.png",
  lightning: "light.png",
  fairy: "char.png",
  flyer: "bullet.png",
  bomb: "bomb.png",
  boss: "boss.png",
  boss2: "boss2.png",
  rescue: "rescue.png"
});

const audio = {
  mobSpawn: createAudio("MobSound.m4a", { volume: 0.55 }),
  bossLoop: createAudio("Boss2sound.m4a", { loop: true, volume: 0.5 })
};

const platformLayout = [
  { x: 90, width: 130, height: 18, yRatio: 0.12 },
  { x: 260, width: 120, height: 18, yRatio: 0.32 },
  { x: 430, width: 140, height: 18, yRatio: 0.56 },
  { x: 610, width: 150, height: 18, yRatio: 0.18 },
  { x: 785, width: 120, height: 18, yRatio: 0.78 },
  { x: 940, width: 145, height: 18, yRatio: 0.42 },
  { x: 1120, width: 120, height: 18, yRatio: 0.92 },
  { x: 1280, width: 150, height: 18, yRatio: 0.24 },
  { x: 1470, width: 130, height: 18, yRatio: 0.48 },
  { x: 1640, width: 115, height: 18, yRatio: 0.7 },
  { x: 1790, width: 155, height: 18, yRatio: 0.3 },
  { x: 1980, width: 135, height: 18, yRatio: 0.84 }
];

let player;
let projectiles;
let mobs;
let boss;
let particles;
let combatTexts;
let beams;
let enemyProjectiles;
let platforms;
let gameTime;
let lastTimestamp = 0;
let lastShotTime;
let lastSpawnTime;
let lastFlyerSpawnTime;
let mobsKilled;
let currentLevel = 1;
let appState = "menu";
let damageFlashTime;
let damageInvulnTime;
let selectedCharacterKey = "fire";
let jumpPressedLastFrame = false;
let shootPressedLastFrame = false;
let menuStage = "start";
let nextMobId = 1;
let failTimer = 0;
let bossDeathTimer = 0;
let victoryTimer = 0;
let pendingMenuLevel = 1;

function loadImages(sourceMap) {
  const result = {};

  Object.entries(sourceMap).forEach(([key, src]) => {
    const image = new Image();
    image.src = src;
    result[key] = image;
  });

  return result;
}

function createAudio(src, options = {}) {
  const sound = new Audio(src);
  sound.preload = "auto";
  sound.loop = Boolean(options.loop);
  sound.volume = options.volume ?? 1;
  return sound;
}

function playMobSpawnSound() {
  const sound = audio.mobSpawn.cloneNode();
  sound.volume = audio.mobSpawn.volume;
  sound.play().catch(() => {});
}

function startBossLoop() {
  audio.bossLoop.currentTime = 0;
  audio.bossLoop.play().catch(() => {});
}

function stopBossLoop() {
  audio.bossLoop.pause();
  audio.bossLoop.currentTime = 0;
}

function currentCharacter() {
  return CHARACTERS[selectedCharacterKey];
}

function currentLevelConfig() {
  return LEVEL_CONFIGS[currentLevel];
}

function getBackgroundDirection() {
  if (currentLevel === 1) {
    return 1;
  }

  if (currentLevel === 2) {
    return -1;
  }

  return 0;
}

function updateWorldMetrics() {
  const heightScale = canvas.height / BASE_CANVAS.height;
  const widthScale = canvas.width / BASE_CANVAS.width;
  const playableBottomInset = Math.max(110 * heightScale, 100);
  world.width = canvas.width;
  world.height = canvas.height;
  world.groundY = canvas.height - playableBottomInset;
  LEVEL_THREE_BOUNDS.left = Math.round(180 * widthScale);
  LEVEL_THREE_BOUNDS.right = canvas.width - Math.round(180 * widthScale);
  LEVEL_THREE_BOUNDS.top = Math.round(18 * heightScale);
  LEVEL_THREE_BOUNDS.bottom = canvas.height;
}

function getSideScrollerVerticalRange() {
  const heightScale = canvas.height / BASE_CANVAS.height;
  const top = Math.round(120 * heightScale);
  const bottom = world.groundY - Math.round(58 * heightScale);
  return { top, bottom };
}

function getPlatformYFromRatio(yRatio) {
  const { top, bottom } = getSideScrollerVerticalRange();
  return Math.round(bottom - (bottom - top) * yRatio);
}

function buildPlatforms() {
  const widthScale = canvas.width / BASE_CANVAS.width;
  const heightScale = canvas.height / BASE_CANVAS.height;
  return platformLayout.map((platform) => ({
    ...platform,
    x: Math.round(platform.x * widthScale),
    width: Math.round(platform.width * widthScale),
    height: Math.max(14, Math.round(platform.height * heightScale)),
    y: getPlatformYFromRatio(platform.yRatio)
  }));
}

function resizeGameCanvas() {
  const shellStyles = window.getComputedStyle(gameShell);
  const shellPaddingX =
    parseFloat(shellStyles.paddingLeft || "0") +
    parseFloat(shellStyles.paddingRight || "0");
  const shellPaddingY =
    parseFloat(shellStyles.paddingTop || "0") +
    parseFloat(shellStyles.paddingBottom || "0");

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const availableWidth = Math.max(
    320,
    Math.min(1400, viewportWidth - shellPaddingX - 40)
  );
  const headerHeight = gameHeader.getBoundingClientRect().height;
  const availableHeight = Math.max(
    240,
    viewportHeight - headerHeight - shellPaddingY - 54
  );
  const targetWidth = Math.round(availableWidth);
  const targetHeight = Math.round(availableHeight);

  if (!targetWidth || !targetHeight) {
    return;
  }

  const previousWidth = canvas.width;
  const previousHeight = canvas.height;
  canvasWrap.style.width = `${targetWidth}px`;
  canvasWrap.style.height = `${targetHeight}px`;
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  updateWorldMetrics();

  if (!previousWidth || !previousHeight || !player) {
    return;
  }

  const scaleX = canvas.width / previousWidth;
  const scaleY = canvas.height / previousHeight;

  player.x *= scaleX;
  player.y *= scaleY;
  player.jumpStartY *= scaleY;

  for (const platform of platforms || []) {
    platform.x *= scaleX;
    if ("yRatio" in platform) {
      platform.y = getPlatformYFromRatio(platform.yRatio);
    } else {
      platform.y *= scaleY;
    }
  }

  for (const mob of mobs || []) {
    mob.x *= scaleX;
    mob.y *= scaleY;
    if ("baseY" in mob) {
      mob.baseY *= scaleY;
    }
    if ("baseX" in mob) {
      mob.baseX *= scaleX;
    }
  }

  for (const projectile of projectiles || []) {
    projectile.x *= scaleX;
    projectile.y *= scaleY;
  }

  for (const enemyProjectile of enemyProjectiles || []) {
    enemyProjectile.x *= scaleX;
    enemyProjectile.y *= scaleY;
  }

  for (const particle of particles || []) {
    particle.x *= scaleX;
    particle.y *= scaleY;
  }

  for (const text of combatTexts || []) {
    text.x *= scaleX;
    text.y *= scaleY;
  }

  if (boss) {
    boss.x *= scaleX;
    boss.y *= scaleY;
  }

  player.x = clamp(player.x, 0, canvas.width - player.width);
  player.y = clamp(player.y, 0, canvas.height - player.height);
}

function buildPlayer() {
  const startX =
    currentLevel === 2 ? canvas.width * 0.18 :
    currentLevel === 3 ? canvas.width * 0.5 - 38 :
    canvas.width * 0.7;
  const startY = currentLevel === 3 ? canvas.height - 120 : world.groundY - 72;

  return {
    x: startX,
    y: startY,
    width: 76,
    height: 76,
    velocityX: 0,
    velocityY: 0,
    onGround: false,
    standingOnPlatform: false,
    dropThroughTimer: 0,
    jumpStartY: startY,
    hp: CONFIG.playerMaxHp,
    facing: currentLevel === 2 ? "right" : "left"
  };
}

function createTopDownMob(overrides = {}) {
  const size = overrides.size ?? 58;
  const lanePadding = 30;
  const baseX =
    LEVEL_THREE_BOUNDS.left +
    lanePadding +
    Math.random() * (LEVEL_THREE_BOUNDS.right - LEVEL_THREE_BOUNDS.left - lanePadding * 2);

  return {
    id: nextMobId++,
    kind: "mob",
    imageKey: "bomb",
    x: baseX,
    y: -90,
    width: size,
    height: size,
    hp: 10,
    speed:
      (CONFIG.mobSpeedMin * 0.9 + Math.random() * (CONFIG.mobSpeedMax - CONFIG.mobSpeedMin)) *
      LEVEL_THREE_CONFIG.mobSpeedScale,
    waveOffset: Math.random() * Math.PI * 2,
    waveSpeed: 2.2 + Math.random() * 1.4,
    waveAmplitude: LEVEL_THREE_CONFIG.mobWaveAmplitude,
    baseX,
    ...overrides
  };
}

function createSideScrollerMob(overrides = {}) {
  const spawnFromRight = currentLevel === 2;
  const sideRange = getSideScrollerVerticalRange();
  const baseY = sideRange.top + Math.random() * Math.max(40, sideRange.bottom - sideRange.top);
  const size = overrides.size ?? 58;

  return {
    id: nextMobId++,
    kind: "mob",
    imageKey: "bomb",
    x: spawnFromRight ? canvas.width + 90 : -90,
    y: baseY,
    width: size,
    height: size,
    hp: 10,
    speed:
      (spawnFromRight ? -1 : 1) *
      (CONFIG.mobSpeedMin + Math.random() * (CONFIG.mobSpeedMax - CONFIG.mobSpeedMin)),
    waveOffset: Math.random() * Math.PI * 2,
    waveSpeed: 3 + Math.random() * 2,
    waveAmplitude: 34,
    baseY,
    ...overrides
  };
}

function spawnNormalMob() {
  mobs.push(currentLevel === 3 ? createTopDownMob() : createSideScrollerMob());
}

function spawnFlyer() {
  if (currentLevel === 3) {
    const flyer = createTopDownMob({
      kind: "flyer",
      imageKey: "flyer",
      width: FLYER_CONFIG.size,
      height: FLYER_CONFIG.size,
      hp: FLYER_CONFIG.hp,
      speed:
        (CONFIG.mobSpeedMin * 0.9 + Math.random() * (CONFIG.mobSpeedMax - CONFIG.mobSpeedMin)) *
        LEVEL_THREE_CONFIG.mobSpeedScale *
        FLYER_CONFIG.speedMultiplier,
      waveSpeed:
        FLYER_CONFIG.topDownWaveSpeedMin +
        Math.random() * (FLYER_CONFIG.topDownWaveSpeedMax - FLYER_CONFIG.topDownWaveSpeedMin),
      waveAmplitude: FLYER_CONFIG.topDownWaveAmplitude
    });
    mobs.push(flyer);
  } else {
    const spawnFromRight = currentLevel === 2;
    const flyer = createSideScrollerMob({
      kind: "flyer",
      imageKey: "flyer",
      width: FLYER_CONFIG.size,
      height: FLYER_CONFIG.size,
      hp: FLYER_CONFIG.hp,
      speed:
        (spawnFromRight ? -1 : 1) *
        (CONFIG.mobSpeedMin + Math.random() * (CONFIG.mobSpeedMax - CONFIG.mobSpeedMin)) *
        FLYER_CONFIG.speedMultiplier,
      waveSpeed:
        FLYER_CONFIG.sideWaveSpeedMin +
        Math.random() * (FLYER_CONFIG.sideWaveSpeedMax - FLYER_CONFIG.sideWaveSpeedMin),
      waveAmplitude: FLYER_CONFIG.sideWaveAmplitude
    });
    mobs.push(flyer);
  }

  playMobSpawnSound();
}

function startLevel(levelNumber) {
  currentLevel = levelNumber;
  player = buildPlayer();
  projectiles = [];
  mobs = [];
  boss = null;
  particles = [];
  combatTexts = [];
  beams = [];
  enemyProjectiles = [];
  platforms = buildPlatforms();
  gameTime = 0;
  lastShotTime = -CONFIG.projectileCooldown;
  lastSpawnTime = 0;
  lastFlyerSpawnTime = 0;
  mobsKilled = 0;
  damageFlashTime = 0;
  damageInvulnTime = 0;
  appState = "playing";
  menuStage = levelNumber === 1 ? "start" : levelNumber === 2 ? "level2" : "level3";
  failTimer = 0;
  bossDeathTimer = 0;
  victoryTimer = 0;
  pendingMenuLevel = levelNumber;
  stopBossLoop();
  updateMenuOverlay();
  updateScoreboard();
}

function returnToMenu(levelNumber) {
  currentLevel = levelNumber;
  appState = "menu";
  menuStage = levelNumber === 1 ? "start" : levelNumber === 2 ? "level2" : "level3";
  player = buildPlayer();
  projectiles = [];
  mobs = [];
  boss = null;
  particles = [];
  combatTexts = [];
  beams = [];
  enemyProjectiles = [];
  platforms = buildPlatforms();
  gameTime = 0;
  lastSpawnTime = 0;
  lastFlyerSpawnTime = 0;
  mobsKilled = 0;
  damageFlashTime = 0;
  damageInvulnTime = 0;
  failTimer = 0;
  bossDeathTimer = 0;
  victoryTimer = 0;
  pendingMenuLevel = levelNumber;
  stopBossLoop();
  updateMenuOverlay();
  updateScoreboard();
}

function updateScoreboard() {
  killsValue.textContent = String(mobsKilled || 0);
  timeValue.textContent = `${Math.floor(gameTime || 0)}s`;
  levelValue.textContent = appState === "menu" ? "Menu" : currentLevelConfig().label;
  heroValue.textContent = currentCharacter().name;
}

function updateMenuOverlay() {
  menuOverlay.hidden = appState === "playing";

  startButton.hidden = appState !== "menu";
  restartButton.hidden = true;
  document.getElementById("characterGrid").hidden = appState !== "menu";

  if (appState === "menu") {
    if (menuStage === "level3") {
      menuKicker.textContent = "Level 3 Ready";
      menuTitle.textContent = "Choose Your Hero";
      menuDescription.textContent = "Level 2 is clear. Pick a character, then press Start to begin level 3.";
      startButton.textContent = "Start Level 3";
    } else if (menuStage === "level2") {
      menuKicker.textContent = "Level 2 Ready";
      menuTitle.textContent = "Choose Your Hero";
      menuDescription.textContent = "Level 1 is clear. Pick a character, then press Start to begin level 2.";
      startButton.textContent = "Start Level 2";
    } else {
      menuKicker.textContent = "Level 1 Ready";
      menuTitle.textContent = "Choose Your Hero";
      menuDescription.textContent = "Pick a character, then press Start to begin level 1.";
      startButton.textContent = "Start Level 1";
    }
  }
}

function selectCharacter(characterKey) {
  selectedCharacterKey = characterKey;

  for (const button of characterButtons) {
    button.classList.toggle("is-selected", button.dataset.character === characterKey);
  }

  updateScoreboard();
}

characterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    selectCharacter(button.dataset.character);
  });
});

startButton.addEventListener("click", () => {
  startLevel(currentLevel);
});

window.addEventListener("keydown", (event) => {
  keys[event.key.toLowerCase()] = true;

  if ([" ", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(event.key.toLowerCase())) {
    event.preventDefault();
  }
});

window.addEventListener("keyup", (event) => {
  keys[event.key.toLowerCase()] = false;
});

touchButtons.forEach((button) => {
  const key = button.dataset.key;

  const press = (event) => {
    event.preventDefault();
    button.setPointerCapture(event.pointerId);
    keys[key] = true;
    button.classList.add("is-pressed");
  };

  const release = (event) => {
    event.preventDefault();
    if (button.hasPointerCapture(event.pointerId)) {
      button.releasePointerCapture(event.pointerId);
    }
    keys[key] = false;
    button.classList.remove("is-pressed");
  };

  button.addEventListener("pointerdown", press);
  button.addEventListener("pointerup", release);
  button.addEventListener("pointercancel", release);
  button.addEventListener("pointerleave", release);
  button.addEventListener("lostpointercapture", release);
});

gameSurface.addEventListener("contextmenu", (event) => {
  event.preventDefault();
});

window.addEventListener("pointerup", () => {
  touchButtons.forEach((button) => {
    const key = button.dataset.key;
    keys[key] = false;
    button.classList.remove("is-pressed");
  });
});

function isJumpPressed() {
  return keys["arrowup"];
}

function isShootPressed() {
  return keys[" "];
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function rectanglesOverlap(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function circleHitsRect(circle, rect) {
  const closestX = clamp(circle.x, rect.x, rect.x + rect.width);
  const closestY = clamp(circle.y, rect.y, rect.y + rect.height);
  const distanceX = circle.x - closestX;
  const distanceY = circle.y - closestY;

  return distanceX * distanceX + distanceY * distanceY <= circle.radius * circle.radius;
}

function update(deltaTime) {
  if (appState === "menu") {
    updateParticles(deltaTime);
    updateBeams(deltaTime);
    updateEnemyProjectiles(deltaTime);
    return;
  }

  if (appState === "boss_defeat") {
    updateBossDefeat(deltaTime);
    updateParticles(deltaTime);
    updateEnemyProjectiles(deltaTime);
    updateScoreboard();
    return;
  }

  if (appState === "victory") {
    victoryTimer = Math.max(0, victoryTimer - deltaTime);
    if (victoryTimer === 0) {
      returnToMenu(pendingMenuLevel);
    }
    updateParticles(deltaTime);
    updateBeams(deltaTime);
    updateEnemyProjectiles(deltaTime);
    updateScoreboard();
    return;
  }

  if (appState === "failed") {
    failTimer = Math.max(0, failTimer - deltaTime);
    if (failTimer === 0) {
      returnToMenu(pendingMenuLevel);
    }
    updateParticles(deltaTime);
    updateBeams(deltaTime);
    updateEnemyProjectiles(deltaTime);
    updateScoreboard();
    return;
  }

  gameTime += deltaTime;
  damageFlashTime = Math.max(0, damageFlashTime - deltaTime);
  damageInvulnTime = Math.max(0, damageInvulnTime - deltaTime);

  updatePlatforms(deltaTime);
  updatePlayer(deltaTime);
  updateProjectiles(deltaTime);
  updateBeams(deltaTime);
  updateEnemyProjectiles(deltaTime);
  spawnMobs();
  updateMobs(deltaTime);
  updateBoss(deltaTime);
  updateParticles(deltaTime);
  updateCombatTexts(deltaTime);
  checkWinOrLose();
  updateScoreboard();
}

function updatePlatforms(deltaTime) {
  if (currentLevel === 3) {
    return;
  }

  const direction = getBackgroundDirection();

  for (const platform of platforms) {
    platform.x += CONFIG.backgroundScrollSpeed * deltaTime * direction;

    if (direction === -1 && platform.x + platform.width < -80) {
      const rightmostX = Math.max(...platforms.map((item) => item.x + item.width));
      platform.x = rightmostX + 95 + Math.random() * 90;
      platform.y = getPlatformYFromRatio(0.08 + Math.random() * 0.84);
    } else if (direction === 1 && platform.x > canvas.width + 80) {
      const leftmostX = Math.min(...platforms.map((item) => item.x));
      platform.x = leftmostX - platform.width - 95 - Math.random() * 90;
      platform.y = getPlatformYFromRatio(0.08 + Math.random() * 0.84);
    }
  }
}

function updatePlayer(deltaTime) {
  if (currentLevel === 3) {
    updateTopDownPlayer(deltaTime);
    return;
  }

  const moveLeft = keys["arrowleft"] || keys["a"];
  const moveRight = keys["arrowright"] || keys["d"];
  const moveDown = keys["arrowdown"];
  let movement = 0;

  if (moveLeft) {
    movement -= SIDE_SCROLLER_CONFIG.moveSpeed;
  }

  if (moveRight) {
    movement += SIDE_SCROLLER_CONFIG.backwardSpeed;
  }

  player.velocityX = movement;
  player.dropThroughTimer = Math.max(0, player.dropThroughTimer - deltaTime);

  if (moveDown && player.standingOnPlatform) {
    player.dropThroughTimer = SIDE_SCROLLER_CONFIG.dropThroughTime;
    player.onGround = false;
    player.standingOnPlatform = false;
    player.y += 6;
  }

  const jumpPressed = isJumpPressed();
  if (jumpPressed && !jumpPressedLastFrame && player.onGround) {
    player.velocityY = -SIDE_SCROLLER_CONFIG.jumpVelocity;
    player.onGround = false;
    player.standingOnPlatform = false;
    player.jumpStartY = player.y;
  }
  jumpPressedLastFrame = jumpPressed;

  player.velocityY += SIDE_SCROLLER_CONFIG.gravity * deltaTime;
  player.x += player.velocityX * deltaTime;
  player.y += player.velocityY * deltaTime;

  const maxJumpTop = player.jumpStartY - SIDE_SCROLLER_CONFIG.maxJumpRise;
  if (player.velocityY < 0 && player.y < maxJumpTop) {
    player.y = maxJumpTop;
    player.velocityY = 0;
  }

  player.x = clamp(player.x, 100, canvas.width - player.width - 80);

  let landedOnPlatform = false;

  for (const platform of platforms) {
    if (player.dropThroughTimer > 0) {
      continue;
    }

    const previousBottom = player.y - player.velocityY * deltaTime + player.height;
    const currentBottom = player.y + player.height;
    const isFalling = player.velocityY >= 0;
    const overlapsHorizontally =
      player.x + player.width > platform.x &&
      player.x < platform.x + platform.width;

    if (
      isFalling &&
      overlapsHorizontally &&
      previousBottom <= platform.y &&
      currentBottom >= platform.y
    ) {
      player.y = platform.y - player.height;
      player.velocityY = 0;
      player.onGround = true;
      player.standingOnPlatform = true;
      landedOnPlatform = true;
      break;
    }
  }

  if (!landedOnPlatform) {
    if (player.y + player.height >= world.groundY) {
      player.y = world.groundY - player.height;
      player.velocityY = 0;
      player.onGround = true;
      player.standingOnPlatform = false;
    } else {
      player.onGround = false;
      player.standingOnPlatform = false;
    }
  }

  const shootPressed = isShootPressed();
  const canFire = gameTime * 1000 - lastShotTime >= CONFIG.projectileCooldown;
  if (shootPressed && !shootPressedLastFrame && canFire) {
    fireWeapon();
    lastShotTime = gameTime * 1000;
  }
  shootPressedLastFrame = shootPressed;
}

function updateTopDownPlayer(deltaTime) {
  const moveLeft = keys["arrowleft"];
  const moveRight = keys["arrowright"];
  const moveUp = keys["arrowup"];
  const moveDown = keys["arrowdown"];
  let velocityX = 0;
  let velocityY = 0;

  if (moveLeft) {
    velocityX -= LEVEL_THREE_CONFIG.moveSpeed;
  }

  if (moveRight) {
    velocityX += LEVEL_THREE_CONFIG.moveSpeed;
  }

  if (moveUp) {
    velocityY -= LEVEL_THREE_CONFIG.moveSpeed;
  }

  if (moveDown) {
    velocityY += LEVEL_THREE_CONFIG.moveSpeed;
  }

  player.velocityX = velocityX;
  player.velocityY = velocityY;
  player.x += player.velocityX * deltaTime;
  player.y += player.velocityY * deltaTime;
  player.x = clamp(player.x, LEVEL_THREE_BOUNDS.left + 12, LEVEL_THREE_BOUNDS.right - player.width - 12);
  player.y = clamp(
    player.y,
    LEVEL_THREE_BOUNDS.top + 12,
    LEVEL_THREE_BOUNDS.bottom - player.height - 12
  );
  player.onGround = false;

  const shootPressed = isShootPressed();
  const canFire = gameTime * 1000 - lastShotTime >= CONFIG.projectileCooldown;
  if (shootPressed && !shootPressedLastFrame && canFire) {
    fireWeapon();
    lastShotTime = gameTime * 1000;
  }
  shootPressedLastFrame = shootPressed;
  jumpPressedLastFrame = moveUp;
}

function fireWeapon() {
  const hero = currentCharacter();
  const isLevelThree = currentLevel === 3;

  if (hero.projectileType === "fire") {
    createMovingProjectile(hero.projectileEmoji, isLevelThree ? -90 : 0, 20);
  } else if (hero.projectileType === "leaf") {
    if (isLevelThree) {
      createMovingProjectile(hero.projectileEmoji, -105, 5);
      createMovingProjectile(hero.projectileEmoji, -90, 5);
      createMovingProjectile(hero.projectileEmoji, -75, 5);
    } else {
      createMovingProjectile(hero.projectileEmoji, -10, 5);
      createMovingProjectile(hero.projectileEmoji, 0, 5);
      createMovingProjectile(hero.projectileEmoji, 10, 5);
    }
  } else if (hero.projectileType === "lightning") {
    createBeam();
  } else if (hero.projectileType === "fairy") {
    createFairyBurstProjectile();
  }
}

function createMovingProjectile(emoji, angleDegrees, damage) {
  const isLevelThree = currentLevel === 3;
  const direction = isLevelThree ? 1 : player.facing === "left" ? -1 : 1;
  const angleRadians = angleDegrees * Math.PI / 180;
  const x = isLevelThree ? player.x + player.width * 0.5 : player.facing === "left" ? player.x + 8 : player.x + player.width - 8;
  const y = isLevelThree ? player.y + 8 : player.y + player.height * 0.48;
  const isFireProjectile = emoji === CHARACTERS.fire.projectileEmoji;
  const fullProjectileSize = isFireProjectile ? 120 : 30;
  const projectileSize = isFireProjectile ? fullProjectileSize * 0.25 : fullProjectileSize;
  const projectileRadius = projectileSize / 2;

  projectiles.push({
    kind: "moving",
    emoji,
    x,
    y,
    width: projectileSize,
    height: projectileSize,
    radius: projectileRadius,
    velocityX: Math.cos(angleRadians) * CONFIG.projectileSpeed * direction,
    velocityY: Math.sin(angleRadians) * CONFIG.projectileSpeed,
    rotation: 0,
    damage,
    traveledDistance: 0,
    fullSize: fullProjectileSize,
    isFireProjectile
  });

  if (isFireProjectile) {
    updateFireProjectileScale(projectiles[projectiles.length - 1]);
  }
}

function createFairyBurstProjectile() {
  const activeFairyBursts = projectiles.filter((projectile) => projectile.kind === "fairy_main").length;
  if (activeFairyBursts >= 4) {
    return;
  }

  const isLevelThree = currentLevel === 3;
  const direction = isLevelThree ? 0 : player.facing === "left" ? -1 : 1;
  projectiles.push({
    kind: "fairy_main",
    x: player.x + player.width / 2,
    y: isLevelThree ? player.y + 8 : player.y + player.height * 0.45,
    width: 40,
    height: 40,
    radius: 20,
    velocityX: isLevelThree ? 0 : 460 * direction,
    velocityY: isLevelThree ? -460 : 0,
    rotation: 0,
    damage: 15,
    traveledDistance: 0,
    maxDistance: isLevelThree ? 250 : 300
  });
}

function createBeam() {
  const isLevelThree = currentLevel === 3;
  const direction = player.facing === "left" ? -1 : 1;
  const damageWidth = isLevelThree ? 50 : 480;
  const damageHeight = isLevelThree ? 280 : 40;
  const coreThickness = isLevelThree ? 12 : 8;
  const beamX = isLevelThree ? player.x + player.width * 0.5 - damageWidth / 2 : direction === -1 ? player.x - damageWidth : player.x + player.width;
  const beamY = isLevelThree ? player.y - damageHeight : player.y + player.height * 0.45 - damageHeight / 2;

  beams.push({
    x: beamX,
    y: beamY,
    width: damageWidth,
    height: damageHeight,
    life: 0.08,
    direction,
    damage: 25,
    hitMobIds: new Set(),
    hitBoss: false,
    vertical: isLevelThree,
    coreThickness,
    targetPoints: []
  });
}

function updateProjectiles(deltaTime) {
  const activeProjectiles = [];

  for (const projectile of projectiles) {
    if (projectile.kind === "fairy_main") {
      updateFairyMainProjectile(projectile, deltaTime);
    } else if (projectile.kind === "fairy_heart") {
      updateFairyHeartProjectile(projectile, deltaTime);
    } else {
      projectile.x += projectile.velocityX * deltaTime;
      projectile.y += projectile.velocityY * deltaTime;
      projectile.rotation += 8 * deltaTime;
      projectile.traveledDistance = (projectile.traveledDistance || 0) + Math.hypot(
        projectile.velocityX * deltaTime,
        projectile.velocityY * deltaTime
      );

      if (projectile.isFireProjectile) {
        updateFireProjectileScale(projectile);
      }
    }

    const stillVisible =
      projectile.x > -120 &&
      projectile.x < canvas.width + 120 &&
      projectile.y > -120 &&
      projectile.y < canvas.height + 120;

    if (stillVisible) {
      activeProjectiles.push(projectile);
    }
  }

  projectiles = activeProjectiles;
}

function updateFairyMainProjectile(projectile, deltaTime) {
  projectile.rotation += 7 * deltaTime;
  projectile.x += projectile.velocityX * deltaTime;
  projectile.y += projectile.velocityY * deltaTime;
  projectile.traveledDistance += Math.hypot(
    projectile.velocityX * deltaTime,
    projectile.velocityY * deltaTime
  );

  if (projectile.traveledDistance >= projectile.maxDistance) {
    explodeFairyProjectile(projectile);
    projectile.x = -999;
  }
}

function explodeFairyProjectile(projectile) {
  for (let index = 0; index < 8; index += 1) {
    const angle = (Math.PI * 2 * index) / 8;
    projectiles.push({
      kind: "fairy_heart",
      emoji: "💖",
      x: projectile.x,
      y: projectile.y,
      width: 22,
      height: 22,
      radius: 11,
      velocityX: Math.cos(angle) * 340,
      velocityY: Math.sin(angle) * 340,
      rotation: 0,
      damage: 4,
      traveledDistance: 0,
      maxDistance: 200
    });
  }

  createHitBurst(projectile.x, projectile.y, "#f9a8d4");
}

function updateFairyHeartProjectile(projectile, deltaTime) {
  projectile.x += projectile.velocityX * deltaTime;
  projectile.y += projectile.velocityY * deltaTime;
  projectile.rotation += 6 * deltaTime;
  projectile.traveledDistance += Math.hypot(
    projectile.velocityX * deltaTime,
    projectile.velocityY * deltaTime
  );

  projectile.damage = projectile.traveledDistance > 100 ? 10 : 6;

  if (projectile.traveledDistance >= projectile.maxDistance) {
    projectile.x = -999;
  }
}

function updateFireProjectileScale(projectile) {
  const traveled = projectile.traveledDistance || 0;
  const step = Math.min(3, Math.floor(traveled / 100));
  const scale = 0.25 + step * 0.25;
  projectile.width = projectile.fullSize * scale;
  projectile.height = projectile.fullSize * scale;
  projectile.radius = projectile.width / 2;
  projectile.damage = 5 + step * 5;
}

function updateBeams(deltaTime) {
  beams = beams.filter((beam) => {
    beam.life -= deltaTime;
    return beam.life > 0;
  });
}

function spawnMobs() {
  if (boss || appState !== "playing") {
    return;
  }

  const currentTimeMs = gameTime * 1000;
  if (currentTimeMs - lastSpawnTime >= CONFIG.mobSpawnInterval) {
    lastSpawnTime = currentTimeMs;
    spawnNormalMob();
  }

  if (currentTimeMs - lastFlyerSpawnTime >= CONFIG.flyerSpawnInterval) {
    lastFlyerSpawnTime = currentTimeMs;
    spawnFlyer();
  }
}

function updateMobs(deltaTime) {
  if (currentLevel === 3) {
    updateTopDownMobs(deltaTime);
    return;
  }

  for (const mob of mobs) {
    mob.x += mob.speed * deltaTime;
    mob.y = mob.baseY + Math.sin(gameTime * mob.waveSpeed + mob.waveOffset) * (mob.waveAmplitude ?? 34);
  }

  handleProjectileHits();
  handleBeamHits();
  handleMobTouches();

  mobs = mobs.filter((mob) => mob.x < canvas.width + 120 && mob.x + mob.width > -120);

  if (
    !boss &&
    (mobsKilled >= currentLevelConfig().mobKillsToBoss ||
      gameTime >= currentLevelConfig().bossTriggerTime)
  ) {
    spawnBoss();
  }
}

function updateTopDownMobs(deltaTime) {
  for (const mob of mobs) {
    mob.y += mob.speed * deltaTime;
    mob.x = mob.baseX + Math.sin(gameTime * mob.waveSpeed + mob.waveOffset) * (mob.waveAmplitude ?? LEVEL_THREE_CONFIG.mobWaveAmplitude);
    mob.x = clamp(mob.x, LEVEL_THREE_BOUNDS.left + 8, LEVEL_THREE_BOUNDS.right - mob.width - 8);
  }

  handleProjectileHits();
  handleBeamHits();
  handleEnemyProjectileHits();
  handleMobTouches();

  mobs = mobs.filter((mob) => mob.y < canvas.height + 120);

  if (
    !boss &&
    (mobsKilled >= currentLevelConfig().mobKillsToBoss ||
      gameTime >= currentLevelConfig().bossTriggerTime)
  ) {
    spawnBoss();
  }
}

function handleProjectileHits() {
  const remainingProjectiles = [];

  for (const projectile of projectiles) {
    let hitSomething = false;
    const projectileHitbox = {
      x: projectile.x - projectile.radius,
      y: projectile.y - projectile.radius,
      width: projectile.radius * 2,
      height: projectile.radius * 2
    };

    for (const mob of mobs) {
      if (!hitSomething && rectanglesOverlap(projectileHitbox, mob)) {
        if (projectile.damage > 0) {
          if (projectile.kind === "fairy_main") {
            applyFairySplashDamage(projectile.x, projectile.y, 20, 15);
            hitSomething = true;
          } else {
            hitSomething = true;
            mob.hp -= projectile.damage || 1;
            createHitBurst(mob.x + mob.width / 2, mob.y + mob.height / 2, "#fbbf24");
          }
        }

        if (mob.hp <= 0 && !mob.hit) {
          mob.hit = true;
          mobsKilled += 1;
        }
      }
    }

    if (boss && rectanglesOverlap(projectileHitbox, boss)) {
      if (!boss.isDying && projectile.damage > 0) {
        if (projectile.kind === "fairy_main") {
          applyFairySplashDamage(projectile.x, projectile.y, 20, 15);
          hitSomething = true;
        } else {
          hitSomething = true;
          boss.hp -= projectile.damage || 1;
          createHitBurst(projectile.x, projectile.y, "#f87171");
        }
      }
    }

    for (const enemyProjectile of enemyProjectiles) {
      if (!enemyProjectile.hit && projectile.damage > 0 && rectanglesOverlap(projectileHitbox, enemyProjectile)) {
        enemyProjectile.hit = true;
        hitSomething = projectile.kind !== "fairy_main";
        createHitBurst(enemyProjectile.x + enemyProjectile.width / 2, enemyProjectile.y + enemyProjectile.height / 2, "#93c5fd");
      }
    }

    if (!hitSomething) {
      remainingProjectiles.push(projectile);
    }
  }

  projectiles = remainingProjectiles.filter((projectile) => projectile.x > -500);
  mobs = mobs.filter((mob) => !mob.hit);
  enemyProjectiles = enemyProjectiles.filter((projectile) => !projectile.hit);
}

function applyFairySplashDamage(centerX, centerY, radius, damage) {
  const splashArea = {
    x: centerX - radius,
    y: centerY - radius,
    width: radius * 2,
    height: radius * 2
  };

  for (const mob of mobs) {
    if (rectanglesOverlap(splashArea, mob)) {
      mob.hp -= damage;
      createHitBurst(mob.x + mob.width / 2, mob.y + mob.height / 2, "#f9a8d4");

      if (mob.hp <= 0 && !mob.hit) {
        mob.hit = true;
        mobsKilled += 1;
      }
    }
  }

  if (boss && !boss.isDying && rectanglesOverlap(splashArea, boss)) {
    boss.hp -= damage;
    createHitBurst(centerX, centerY, "#f472b6");
  }
}

function handleBeamHits() {
  for (const beam of beams) {
    const beamBox = {
      x: beam.x,
      y: beam.y,
      width: beam.width,
      height: beam.height
    };

    for (const mob of mobs) {
      if (rectanglesOverlap(beamBox, mob) && !beam.hitMobIds.has(mob.id)) {
        beam.hitMobIds.add(mob.id);
        mob.hp -= beam.damage;
        beam.targetPoints.push({
          x: mob.x + mob.width / 2,
          y: mob.y + mob.height / 2
        });
        createHitBurst(mob.x + mob.width / 2, mob.y + mob.height / 2, "#fde047");

        if (mob.hp <= 0 && !mob.hit) {
          mob.hit = true;
          mobsKilled += 1;
        }
      }
    }

    if (boss && !boss.isDying && !beam.hitBoss && rectanglesOverlap(beamBox, boss)) {
      beam.hitBoss = true;
      boss.hp -= beam.damage || 2;
      beam.targetPoints.push({
        x: boss.x + boss.width / 2,
        y: boss.y + boss.height / 2
      });
      createHitBurst(beam.x + beam.width / 2, beam.y, "#fde047");
    }

    for (const enemyProjectile of enemyProjectiles) {
      if (!enemyProjectile.hit && rectanglesOverlap(beamBox, enemyProjectile)) {
        enemyProjectile.hit = true;
        createHitBurst(enemyProjectile.x + enemyProjectile.width / 2, enemyProjectile.y + enemyProjectile.height / 2, "#93c5fd");
      }
    }
  }

  mobs = mobs.filter((mob) => !mob.hit);
  enemyProjectiles = enemyProjectiles.filter((projectile) => !projectile.hit);
}

function handleEnemyProjectileHits() {
  for (const enemyProjectile of enemyProjectiles) {
    if (rectanglesOverlap(player, enemyProjectile)) {
      enemyProjectile.hit = true;
      damagePlayer(1);
      createHitBurst(player.x + player.width / 2, player.y + player.height / 2, "#e0f2fe");
    }
  }

  enemyProjectiles = enemyProjectiles.filter((projectile) => !projectile.hit);
}

function handleMobTouches() {
  for (const mob of mobs) {
    if (rectanglesOverlap(player, mob)) {
      mob.hit = true;
      damagePlayer(1);
      createHitBurst(player.x + player.width / 2, player.y + player.height / 2, "#ffffff");
    }
  }

  mobs = mobs.filter((mob) => !mob.hit);

  if (boss && rectanglesOverlap(player, boss)) {
    damagePlayer(1);
    boss.x += 25;
  }
}

function damagePlayer(amount) {
  if (damageInvulnTime > 0) {
    return;
  }

  player.hp -= amount;
  damageFlashTime = 2;
  damageInvulnTime = 0.35;
  combatTexts.push({
    text: `-${amount}`,
    x: player.x + player.width / 2,
    y: player.y + 10,
    life: 3,
    velocityY: -105,
    color: "#ef4444"
  });
}

function spawnBoss() {
  if (currentLevel === 3) {
    boss = {
      x: canvas.width * 0.5 - player.width * 1.5,
      y: 28,
      width: player.width * 3,
      height: player.height * 3,
      hp: currentLevelConfig().bossHp,
      maxHp: currentLevelConfig().bossHp,
      speed: 135,
      waveOffset: 0,
      imageKey: currentLevelConfig().bossImage,
      isDying: false,
      deathProgress: 0,
      shotTimer: 0
    };
    updateLevelThreeBossSize();
    startBossLoop();
    return;
  }

  const spawnFromRight = currentLevel === 2;
  const sideRange = getSideScrollerVerticalRange();
  const bossBaseY = sideRange.top + Math.max(18, (sideRange.bottom - sideRange.top) * 0.18);
  boss = {
    x: spawnFromRight ? canvas.width + 220 : -220,
    y: bossBaseY,
    width: currentLevel === 2 ? 210 : 180,
    height: currentLevel === 2 ? 210 : 180,
    hp: currentLevelConfig().bossHp,
    maxHp: currentLevelConfig().bossHp,
    speed: spawnFromRight ? -135 : 135,
    waveOffset: Math.PI / 2,
    imageKey: currentLevelConfig().bossImage,
    isDying: false,
    deathProgress: 0,
    shotTimer: 0
  };
  startBossLoop();
}

function updateBoss(deltaTime) {
  if (!boss) {
    return;
  }

  if (boss.isDying) {
    return;
  }

  if (currentLevel === 3) {
    updateLevelThreeBoss(deltaTime);
    if (boss.hp <= 0) {
      beginBossDeathSequence();
    }
    return;
  }

  const sideRange = getSideScrollerVerticalRange();
  const bossBaseY = sideRange.top + Math.max(18, (sideRange.bottom - sideRange.top) * 0.18);
  const bossWaveAmplitude = Math.max(36, (sideRange.bottom - sideRange.top) * 0.24);
  boss.x += boss.speed * deltaTime;
  boss.y = bossBaseY + Math.sin(gameTime * 1.8 + boss.waveOffset) * bossWaveAmplitude;
  boss.shotTimer += deltaTime;

  if (currentLevel === 2) {
    if (boss.x < 260) {
      boss.speed = 85;
    }

    if (boss.x > canvas.width - 260) {
      boss.speed = -85;
    }
  } else {
    if (boss.x > canvas.width - 360) {
      boss.speed = -85;
    }

    if (boss.x < canvas.width - 500) {
      boss.speed = 85;
    }
  }

  if (boss.shotTimer >= (currentLevel === 2 ? 1.5 : 1.8)) {
    fireSideBossProjectiles(currentLevel === 2 ? 3 : 2);
    boss.shotTimer = 0;
  }

  if (boss.hp <= 0) {
    beginBossDeathSequence();
  }
}

function updateLevelThreeBoss(deltaTime) {
  boss.x += boss.speed * deltaTime;
  boss.y = 28 + Math.sin(gameTime * 1.1) * 12;

  if (boss.x < LEVEL_THREE_BOUNDS.left + 12) {
    boss.speed = 110;
  }

  if (boss.x + boss.width > LEVEL_THREE_BOUNDS.right - 12) {
    boss.speed = -110;
  }

  boss.shotTimer += deltaTime;
  if (boss.shotTimer >= 1.6) {
    fireLevelThreeBossProjectiles();
    boss.shotTimer = 0;
  }

  updateLevelThreeBossSize();
}

function updateLevelThreeBossSize() {
  if (!boss || currentLevel !== 3) {
    return;
  }

  const previousCenterX = boss.x + boss.width / 2;
  const ratio = boss.hp / boss.maxHp;
  const sizeMultiplier =
    ratio > 0.8 ? 3 :
    ratio > 0.6 ? 2.5 :
    ratio > 0.4 ? 2 :
    ratio > 0.2 ? 1.5 :
    1;
  const newSize = player.width * sizeMultiplier;
  boss.width = newSize;
  boss.height = newSize;
  boss.x = clamp(previousCenterX - newSize / 2, LEVEL_THREE_BOUNDS.left + 12, LEVEL_THREE_BOUNDS.right - newSize - 12);
  boss.y = clamp(boss.y, 20, 90);
}

function fireLevelThreeBossProjectiles() {
  if (!boss || currentLevel !== 3) {
    return;
  }

  for (let index = 0; index < 4; index += 1) {
    const angle = (70 + Math.random() * 40) * Math.PI / 180;
    enemyProjectiles.push({
      x: boss.x + boss.width * (0.2 + 0.2 * index),
      y: boss.y + boss.height * 0.8,
      width: 28,
      height: 28,
      velocityX: Math.cos(angle) * 220,
      velocityY: Math.sin(angle) * 220,
      hit: false
    });
  }
}

function fireSideBossProjectiles(count) {
  if (!boss || currentLevel === 3) {
    return;
  }

  const targetX = player.x + player.width / 2;
  const targetY = player.y + player.height / 2;

  for (let index = 0; index < count; index += 1) {
    const originX = boss.x + boss.width * (0.2 + (0.6 * (count === 1 ? 0.5 : index / (count - 1))));
    const originY = boss.y + boss.height * (0.35 + (count === 1 ? 0.15 : 0.3 * (index / count)));
    const angle = Math.atan2(targetY - originY, targetX - originX) + ((Math.random() - 0.5) * 0.35);
    enemyProjectiles.push({
      x: originX,
      y: originY,
      width: 28,
      height: 28,
      velocityX: Math.cos(angle) * 230,
      velocityY: Math.sin(angle) * 230,
      hit: false
    });
  }
}

function updateEnemyProjectiles(deltaTime) {
  enemyProjectiles = enemyProjectiles.filter((projectile) => {
    projectile.x += projectile.velocityX * deltaTime;
    projectile.y += projectile.velocityY * deltaTime;
    return (
      !projectile.hit &&
      projectile.x + projectile.width > -40 &&
      projectile.x < canvas.width + 40 &&
      projectile.y + projectile.height > -40 &&
      projectile.y < canvas.height + 60
    );
  });
}

function checkWinOrLose() {
  if (player.hp <= 0) {
    player.hp = 0;
    stopBossLoop();
    appState = "failed";
    failTimer = 3;
    pendingMenuLevel = currentLevel;
  }
}

function beginBossDeathSequence() {
  if (!boss || boss.isDying) {
    return;
  }

  stopBossLoop();
  createHitBurst(boss.x + boss.width / 2, boss.y + boss.height / 2, "#fde68a");
  boss.isDying = true;
  boss.hp = 0;
  boss.speed = 0;
  boss.deathProgress = 0;
  appState = "boss_defeat";
  bossDeathTimer = 3;
  pendingMenuLevel = currentLevel === 1 ? 2 : currentLevel === 2 ? 3 : 1;
}

function updateBossDefeat(deltaTime) {
  if (!boss) {
    return;
  }

  bossDeathTimer = Math.max(0, bossDeathTimer - deltaTime);
  boss.deathProgress = 1 - bossDeathTimer / 3;

  if (bossDeathTimer === 0) {
    boss = null;
    appState = "victory";
    victoryTimer = 3;
  }
}

function createHitBurst(x, y, color) {
  for (let index = 0; index < 10; index += 1) {
    particles.push({
      x,
      y,
      radius: 2 + Math.random() * 4,
      color,
      life: 0.5 + Math.random() * 0.3,
      velocityX: -90 + Math.random() * 180,
      velocityY: -90 + Math.random() * 180
    });
  }
}

function updateParticles(deltaTime) {
  particles = particles.filter((particle) => {
    particle.life -= deltaTime;
    particle.x += particle.velocityX * deltaTime;
    particle.y += particle.velocityY * deltaTime;
    return particle.life > 0;
  });
}

function updateCombatTexts(deltaTime) {
  combatTexts = combatTexts.filter((text) => {
    text.life -= deltaTime;
    text.y += text.velocityY * deltaTime;
    return text.life > 0 && text.y > -40;
  });
}

function draw() {
  drawBackground();
  drawPlatforms();
  drawGround();
  drawProjectiles();
  drawBeams();
  drawMobs();
  drawBoss();
  drawEnemyProjectiles();
  drawPlayer();
  drawParticles();
  drawCombatTexts();
  drawStatusText();
}

function drawBackground() {
  if (currentLevel === 3) {
    drawLevelThreeBackground();
    return;
  }

  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);

  if (currentLevel === 1) {
    gradient.addColorStop(0, "#6ee7f9");
    gradient.addColorStop(0.55, "#a5f3fc");
    gradient.addColorStop(1, "#d9f99d");
  } else {
    gradient.addColorStop(0, "#172554");
    gradient.addColorStop(0.55, "#312e81");
    gradient.addColorStop(1, "#1e1b4b");
  }

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawClouds();
  drawHills();
  drawRuins();
}

function drawLevelThreeBackground() {
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#6b4f2a");
  gradient.addColorStop(0.45, "#7c5b31");
  gradient.addColorStop(1, "#5b4224");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#2f2418";
  ctx.fillRect(0, 0, LEVEL_THREE_BOUNDS.left, canvas.height);
  ctx.fillRect(LEVEL_THREE_BOUNDS.right, 0, canvas.width - LEVEL_THREE_BOUNDS.right, canvas.height);

  const laneOffset = (gameTime * 150) % 140;
  for (let index = 0; index < 9; index += 1) {
    const x = LEVEL_THREE_BOUNDS.left + 26 + index * 72 + (index % 2 === 0 ? 18 : -10);
    ctx.strokeStyle = "rgba(75, 56, 33, 0.34)";
    ctx.lineWidth = 4 + (index % 3);
    ctx.beginPath();
    ctx.moveTo(x, -100 + laneOffset);
    ctx.lineTo(x + (index % 2 === 0 ? -22 : 18), canvas.height + 100);
    ctx.stroke();
  }

  for (let index = 0; index < 16; index += 1) {
    const y = ((index * 58) + laneOffset * 1.2) % (canvas.height + 120) - 60;
    const x = LEVEL_THREE_BOUNDS.left + 22 + (index % 4) * 120;
    ctx.fillStyle = index % 3 === 0 ? "rgba(34, 197, 94, 0.34)" : index % 3 === 1 ? "rgba(68, 64, 60, 0.42)" : "rgba(120, 113, 108, 0.34)";
    if (index % 3 === 0) {
      ctx.beginPath();
      ctx.moveTo(x, y + 16);
      ctx.lineTo(x + 8, y);
      ctx.lineTo(x + 16, y + 16);
      ctx.lineTo(x + 12, y + 11);
      ctx.lineTo(x + 6, y + 18);
      ctx.closePath();
      ctx.fill();
    } else if (index % 3 === 1) {
      ctx.fillRect(x, y, 24, 12);
      ctx.fillRect(x + 5, y - 6, 14, 8);
    } else {
      ctx.beginPath();
      ctx.arc(x + 10, y + 10, 9, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.strokeStyle = "rgba(250, 245, 235, 0.35)";
  ctx.lineWidth = 3;
  ctx.strokeRect(LEVEL_THREE_BOUNDS.left, 0, LEVEL_THREE_BOUNDS.right - LEVEL_THREE_BOUNDS.left, canvas.height);
}

function drawClouds() {
  const cloudSpeed = CONFIG.backgroundScrollSpeed * 0.12;
  const alpha = currentLevel === 1 ? 0.75 : 0.35;
  const direction = getBackgroundDirection();

  for (let index = 0; index < 7; index += 1) {
    const loopWidth = canvas.width + 220;
    const travel = (gameTime * cloudSpeed * direction + index * 180) % loopWidth;
    const normalizedTravel = travel < 0 ? travel + loopWidth : travel;
    const baseX = normalizedTravel - 120;
    const y = 55 + (index % 3) * 48;

    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.beginPath();
    ctx.arc(baseX, y, 26, 0, Math.PI * 2);
    ctx.arc(baseX + 28, y - 10, 22, 0, Math.PI * 2);
    ctx.arc(baseX + 54, y, 18, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawHills() {
  const layers = currentLevel === 1
    ? [
        { color: "#93c5fd", speed: 0.18, height: 120, y: 325 },
        { color: "#60a5fa", speed: 0.28, height: 150, y: 360 },
        { color: "#2563eb", speed: 0.4, height: 180, y: 410 }
      ]
    : [
        { color: "#312e81", speed: 0.16, height: 110, y: 330 },
        { color: "#4338ca", speed: 0.28, height: 145, y: 365 },
        { color: "#1d4ed8", speed: 0.38, height: 170, y: 415 }
      ];

  for (const layer of layers) {
    const rawOffset = (gameTime * CONFIG.backgroundScrollSpeed * layer.speed * getBackgroundDirection()) % 420;
    const offset = rawOffset < 0 ? rawOffset + 420 : rawOffset;

    ctx.fillStyle = layer.color;
    ctx.beginPath();
    ctx.moveTo(-420 + offset, canvas.height);

    for (let hill = -1; hill < 5; hill += 1) {
      const startX = hill * 280 - offset;
      ctx.quadraticCurveTo(startX + 140, layer.y - layer.height, startX + 280, layer.y);
    }

    ctx.lineTo(canvas.width + 320, canvas.height);
    ctx.closePath();
    ctx.fill();
  }
}

function drawRuins() {
  const speed = CONFIG.backgroundScrollSpeed * 0.55;
  const direction = getBackgroundDirection();

  for (let index = 0; index < 8; index += 1) {
    const loopWidth = canvas.width + 160;
    const travel = (gameTime * speed * direction + index * 140) % loopWidth;
    const normalizedTravel = travel < 0 ? travel + loopWidth : travel;
    const x = normalizedTravel - 80;
    const height = 40 + (index % 4) * 28;

    ctx.fillStyle = currentLevel === 1 ? "rgba(31, 41, 55, 0.36)" : "rgba(15, 23, 42, 0.62)";
    ctx.fillRect(x, world.groundY - height, 18, height);
    ctx.fillRect(x + 22, world.groundY - height * 0.75, 12, height * 0.75);
  }
}

function drawGround() {
  if (currentLevel === 3) {
    return;
  }

  ctx.fillStyle = currentLevel === 1 ? "#3f6212" : "#1f2937";
  ctx.fillRect(0, world.groundY, canvas.width, canvas.height - world.groundY);

  ctx.fillStyle = currentLevel === 1 ? "#65a30d" : "#64748b";
  for (let index = 0; index < 30; index += 1) {
    const x = ((index * 48) + (gameTime * CONFIG.backgroundScrollSpeed * getBackgroundDirection()) % 48);
    ctx.fillRect(x, world.groundY, 30, 16);
  }
}

function drawPlatforms() {
  if (currentLevel === 3) {
    return;
  }

  for (const platform of platforms) {
    ctx.fillStyle = currentLevel === 1 ? "#8b5cf6" : "#0f766e";
    ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
    ctx.fillStyle = currentLevel === 1 ? "#c4b5fd" : "#5eead4";
    ctx.fillRect(platform.x + 6, platform.y + 4, platform.width - 12, 5);
  }
}

function drawSprite(image, x, y, width, height) {
  if (image.complete && image.naturalWidth > 0) {
    ctx.drawImage(image, x, y, width, height);
    return;
  }

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(x, y, width, height);
}

function drawPlayer() {
  if (damageFlashTime > 0 && Math.floor(damageFlashTime * 12) % 2 === 0) {
    return;
  }

  ctx.save();
  ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
  if (currentLevel !== 3 && player.facing === "right") {
    ctx.scale(-1, 1);
  }
  drawSprite(images[currentCharacter().image], -player.width / 2, -player.height / 2, player.width, player.height);
  ctx.restore();

  if (damageFlashTime > 0) {
    ctx.strokeStyle = "rgba(248, 113, 113, 0.9)";
    ctx.lineWidth = 3;
    ctx.strokeRect(player.x - 4, player.y - 4, player.width + 8, player.height + 8);
  }
}

function drawProjectiles() {
  for (const projectile of projectiles) {
    if (projectile.kind === "fairy_main") {
      drawButterflyBowProjectile(projectile);
      continue;
    }

    if (projectile.kind === "fairy_heart") {
      drawFairyHeartProjectile(projectile);
      continue;
    }

    ctx.save();
    ctx.translate(projectile.x, projectile.y);
    ctx.rotate(projectile.rotation || 0);
    const projectileFontSize = Math.max(22, Math.round(projectile.width || projectile.radius * 2 || 30));
    let projectileFont = `${projectileFontSize}px Arial`;
    ctx.font = projectileFont;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    if (currentLevel === 3) {
      if (projectile.emoji === "🔥") {
        ctx.fillStyle = "rgba(239, 68, 68, 0.32)";
        ctx.beginPath();
        ctx.arc(0, 0, Math.max(18, projectile.radius * 0.9), 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowColor = "#ef4444";
        ctx.shadowBlur = 24;
      } else if (projectile.emoji === "🍃") {
        ctx.fillStyle = "rgba(34, 197, 94, 0.28)";
        ctx.beginPath();
        ctx.ellipse(0, 0, Math.max(16, projectile.radius * 0.95), Math.max(12, projectile.radius * 0.7), 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowColor = "#22c55e";
        ctx.shadowBlur = 22;
      } else {
        ctx.shadowColor = "#ffffff";
        ctx.shadowBlur = 18;
      }
    }
    ctx.fillStyle = "#ffffff";
    ctx.fillText(projectile.emoji, 0, 0);
    ctx.restore();
  }
}

function drawButterflyBowProjectile(projectile) {
  ctx.save();
  ctx.translate(projectile.x, projectile.y);
  ctx.rotate(projectile.rotation || 0);

  ctx.shadowColor = currentLevel === 3 ? "#f9a8d4" : "transparent";
  ctx.shadowBlur = currentLevel === 3 ? 18 : 0;
  ctx.fillStyle = currentLevel === 3 ? "#fbcfe8" : "#f9a8d4";
  ctx.beginPath();
  ctx.ellipse(-10, -6, 10, 7, -0.4, 0, Math.PI * 2);
  ctx.ellipse(10, -6, 10, 7, 0.4, 0, Math.PI * 2);
  ctx.ellipse(-10, 6, 10, 7, 0.4, 0, Math.PI * 2);
  ctx.ellipse(10, 6, 10, 7, -0.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = currentLevel === 3 ? "#ff4fa3" : "#ec4899";
  ctx.beginPath();
  ctx.ellipse(0, 0, 7, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = currentLevel === 3 ? "#fff08a" : "#fde68a";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-16, 0);
  ctx.quadraticCurveTo(0, -18, 16, 0);
  ctx.quadraticCurveTo(0, 18, -16, 0);
  ctx.stroke();

  ctx.restore();
}

function drawFairyHeartProjectile(projectile) {
  ctx.save();
  ctx.translate(projectile.x, projectile.y);
  ctx.rotate(projectile.rotation || 0);
  ctx.font = "22px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  if (currentLevel === 3) {
    ctx.shadowColor = "#fb7185";
    ctx.shadowBlur = 16;
  }
  ctx.fillText("💖", 0, 0);
  ctx.restore();
}

function drawBeams() {
  for (const beam of beams) {
    drawLightningBeam(beam);
  }
}

function drawLightningBeam(beam) {
  const startX = beam.vertical ? beam.x + beam.width / 2 : beam.direction === -1 ? beam.x + beam.width : beam.x;
  const startY = beam.vertical ? beam.y + beam.height : beam.y + beam.height / 2;
  const fallbackEndX = beam.vertical ? beam.x + beam.width / 2 : beam.direction === -1 ? beam.x : beam.x + beam.width;
  const fallbackEndY = beam.vertical ? beam.y : beam.y + beam.height / 2;
  const targetPoints = beam.targetPoints || [];
  let endX = fallbackEndX;
  let endY = fallbackEndY;

  if (targetPoints.length > 0) {
    let farthestTarget = targetPoints[0];
    let farthestDistance = Math.hypot(farthestTarget.x - startX, farthestTarget.y - startY);

    for (const targetPoint of targetPoints.slice(1)) {
      const distance = Math.hypot(targetPoint.x - startX, targetPoint.y - startY);
      if (distance > farthestDistance) {
        farthestTarget = targetPoint;
        farthestDistance = distance;
      }
    }

    endX = farthestTarget.x;
    endY = farthestTarget.y;
  }

  const segments = 7;
  const points = [{ x: startX, y: startY }];

  for (let index = 1; index < segments; index += 1) {
    const t = index / segments;
    const baseX = startX + (endX - startX) * t;
    const baseY = startY + (endY - startY) * t;
    const jitter = beam.vertical ? beam.width * 0.35 : beam.height * 0.9;
    points.push({
      x: beam.vertical ? baseX + (Math.random() - 0.5) * jitter : baseX,
      y: beam.vertical ? baseY : baseY + (Math.random() - 0.5) * jitter
    });
  }

  points.push({ x: endX, y: endY });

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.shadowColor = "#fde047";
  ctx.shadowBlur = 20;
  ctx.strokeStyle = "rgba(250, 204, 21, 0.92)";
  ctx.lineWidth = beam.coreThickness;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (const point of points.slice(1)) {
    ctx.lineTo(point.x, point.y);
  }
  ctx.stroke();

  for (const targetPoint of beam.targetPoints) {
    const targetIsMainEnd =
      Math.abs(targetPoint.x - endX) < 0.5 &&
      Math.abs(targetPoint.y - endY) < 0.5;

    if (!targetIsMainEnd) {
      drawLightningBranch(points, targetPoint, beam.coreThickness);
    }
    drawLightningHitSpark(targetPoint);
  }
  ctx.restore();
}

function drawLightningBranch(points, targetPoint, coreThickness) {
  const anchorIndex = Math.max(1, Math.min(points.length - 2, Math.floor(points.length * 0.7)));
  const anchor = points[anchorIndex];
  const deltaX = targetPoint.x - anchor.x;
  const deltaY = targetPoint.y - anchor.y;
  const distance = Math.hypot(deltaX, deltaY) || 1;
  const branchLength = Math.min(100, distance);
  const branchStart = {
    x: targetPoint.x - (deltaX / distance) * branchLength,
    y: targetPoint.y - (deltaY / distance) * branchLength
  };
  const branchPoints = [branchStart];
  const segments = 3;

  for (let index = 1; index < segments; index += 1) {
    const t = index / segments;
    branchPoints.push({
      x: branchStart.x + (targetPoint.x - branchStart.x) * t + (Math.random() - 0.5) * 10,
      y: branchStart.y + (targetPoint.y - branchStart.y) * t + (Math.random() - 0.5) * 10
    });
  }

  branchPoints.push(targetPoint);

  ctx.strokeStyle = "rgba(250, 204, 21, 0.82)";
  ctx.lineWidth = Math.max(1.5, coreThickness * 0.34);
  ctx.beginPath();
  ctx.moveTo(branchPoints[0].x, branchPoints[0].y);
  for (const point of branchPoints.slice(1)) {
    ctx.lineTo(point.x, point.y);
  }
  ctx.stroke();

  ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
  ctx.lineWidth = Math.max(1, coreThickness * 0.16);
  ctx.beginPath();
  ctx.moveTo(branchPoints[0].x, branchPoints[0].y);
  for (const point of branchPoints.slice(1)) {
    ctx.lineTo(point.x, point.y);
  }
  ctx.stroke();
}

function drawLightningHitSpark(targetPoint) {
  ctx.save();
  ctx.translate(targetPoint.x, targetPoint.y);
  ctx.shadowColor = "#fde047";
  ctx.shadowBlur = 16;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.95)";
  ctx.lineWidth = 2;

  for (let index = 0; index < 4; index += 1) {
    const angle = (Math.PI * 2 * index) / 4 + Math.random() * 0.25;
    const length = 10 + Math.random() * 6;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(angle) * length, Math.sin(angle) * length);
    ctx.stroke();
  }

  ctx.fillStyle = "#fef08a";
  ctx.beginPath();
  ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawMobs() {
  for (const mob of mobs) {
    drawSprite(images[mob.imageKey || currentLevelConfig().mobImage], mob.x, mob.y, mob.width, mob.height);
  }
}

function drawBoss() {
  if (!boss) {
    return;
  }

  ctx.save();
  const alpha = boss.isDying ? Math.max(0, 1 - boss.deathProgress) : 0.95;
  const shakeX = boss.isDying ? (Math.random() - 0.5) * 16 : 0;
  const shakeY = boss.isDying ? (Math.random() - 0.5) * 12 : 0;
  ctx.globalAlpha = alpha;
  ctx.fillStyle =
    currentLevel === 3 ? "rgba(20, 184, 166, 0.18)" :
    currentLevel === 2 ? "rgba(91, 33, 182, 0.18)" :
    "rgba(127, 29, 29, 0.18)";
  ctx.fillRect(boss.x - 12 + shakeX, boss.y - 14 + shakeY, boss.width + 24, boss.height + 28);
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = alpha;
  drawSprite(images[boss.imageKey], boss.x + shakeX, boss.y + shakeY, boss.width, boss.height);
  ctx.restore();

  ctx.fillStyle = "#111827";
  ctx.fillRect(canvas.width - 250, 20, 190, 18);
  ctx.fillStyle = currentLevel === 3 ? "#14b8a6" : currentLevel === 2 ? "#8b5cf6" : "#ef4444";
  ctx.fillRect(canvas.width - 250, 20, 190 * (boss.hp / boss.maxHp), 18);
  ctx.strokeStyle = "#fee2e2";
  ctx.strokeRect(canvas.width - 250, 20, 190, 18);
}

function drawEnemyProjectiles() {
  for (const projectile of enemyProjectiles) {
    drawSprite(images.rescue, projectile.x, projectile.y, projectile.width, projectile.height);
  }
}

function drawParticles() {
  for (const particle of particles) {
    ctx.globalAlpha = Math.max(0, particle.life * 1.8);
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 1;
}

function drawCombatTexts() {
  for (const text of combatTexts) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, text.life / 0.8);
    ctx.fillStyle = text.color;
    ctx.strokeStyle = "rgba(20, 10, 10, 0.45)";
    ctx.lineWidth = 3;
    ctx.font = "bold 28px Trebuchet MS";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.strokeText(text.text, text.x, text.y);
    ctx.fillText(text.text, text.x, text.y);
    ctx.restore();
  }
}

function drawStatusText() {
  if (!["playing", "boss_defeat", "victory", "failed"].includes(appState)) {
    return;
  }

  ctx.fillStyle = "rgba(15, 23, 42, 0.58)";
  ctx.fillRect(16, 16, 220, 70);
  ctx.fillStyle = "#f8fafc";
  ctx.font = "bold 18px Trebuchet MS";
  ctx.fillText(currentLevelConfig().label, 28, 38);
  ctx.font = "bold 14px Trebuchet MS";
  ctx.fillText("HP", 28, 63);

  const hpBarX = 58;
  const hpBarY = 52;
  const hpBarWidth = 150;
  const hpBarHeight = 14;
  const hpRatio = clamp(player.hp / CONFIG.playerMaxHp, 0, 1);
  ctx.fillStyle = "rgba(15, 23, 42, 0.92)";
  ctx.fillRect(hpBarX, hpBarY, hpBarWidth, hpBarHeight);
  ctx.fillStyle = hpRatio > 0.35 ? "#22c55e" : "#ef4444";
  ctx.fillRect(hpBarX, hpBarY, hpBarWidth * hpRatio, hpBarHeight);
  ctx.strokeStyle = "#f8fafc";
  ctx.lineWidth = 2;
  ctx.strokeRect(hpBarX, hpBarY, hpBarWidth, hpBarHeight);

  if (appState === "failed") {
    ctx.fillStyle = "rgba(0, 0, 0, 0.72)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#f8fafc";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 52px Trebuchet MS";
    ctx.fillText("You Failed", canvas.width / 2, canvas.height / 2 - 10);
    ctx.font = "22px Trebuchet MS";
    ctx.fillText(`Returning to ${currentLevelConfig().label} ready screen...`, canvas.width / 2, canvas.height / 2 + 40);
  } else if (appState === "victory") {
    ctx.fillStyle = "rgba(0, 0, 0, 0.62)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#fef08a";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 56px Trebuchet MS";
    ctx.fillText("Victory!", canvas.width / 2, canvas.height / 2 - 10);
  }
}

function gameLoop(timestamp) {
  const deltaTime = Math.min((timestamp - lastTimestamp) / 1000 || 0, 0.033);
  lastTimestamp = timestamp;

  update(deltaTime);
  draw();
  requestAnimationFrame(gameLoop);
}

window.addEventListener("resize", resizeGameCanvas);

resizeGameCanvas();
selectCharacter(selectedCharacterKey);
returnToMenu(1);
requestAnimationFrame(gameLoop);
