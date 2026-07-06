# 2D Shooter Rules

## Project Goal

Create a beginner-friendly browser game using only:

- `index.html`
- `style.css`
- `game.js`
- local image and audio assets in the same folder

No build tools, npm packages, or external libraries are used. The game should run by opening `index.html` in a browser.

## Core Structure

- `index.html`
  - Main page layout
  - Title
  - Scoreboard
  - Canvas
  - Ready screen / menu overlay
  - Touch controls for tablet play
- `style.css`
  - Layout and arcade-style presentation
  - Centered game shell
  - Responsive tablet-friendly UI
  - Overlay touch controls
- `game.js`
  - Game loop
  - Physics
  - Level flow
  - Enemies and bosses
  - Weapons
  - Collision and damage
  - HUD and visual effects
- `Game_rules.md`
  - Full duplication spec for recreating the game in another project

## Required Assets

Keep these files in the same folder as `index.html`:

- `fire.png` - Fire hero
- `leaf.png` - Leaf hero
- `light.png` - Lightning hero
- `char.png` - Fairy hero
- `bomb.png` - all regular mobs, plus level 1 boss
- `boss.png` - level 2 boss
- `boss2.png` - level 3 boss
- `rescue.png` - enemy boss projectile image
- `MobSound.m4a` - mob spawn sound
- `Boss2sound.m4a` - looping boss sound for all bosses

## Game Flow

- Start on a ready screen for level 1.
- The ready screen includes:
  - a `Start` button
  - four hero choices
- The flow is:
  - level 1 ready screen
  - level 1
  - victory screen
  - level 2 ready screen
  - level 2
  - victory screen
  - level 3 ready screen
  - level 3
  - victory screen
  - back to level 1 ready screen
- If the player loses in any level:
  - show `You Failed`
  - hold for `3 seconds`
  - return to that level's ready screen
- If a boss is defeated:
  - boss shakes and fades out for about `3 seconds`
  - then show `Victory!` for `3 seconds`
  - then continue to the next ready screen

## HUD

- Title: `2D Shooter`
- Scoreboard shows:
  - `Mobs Killed`
  - `Time`
  - `Level`
  - `Hero`
- Player HP is not shown as a number in the scoreboard.
- Player HP appears as an in-game HP bar inside the canvas.
- The old instructions panel is removed.

## Controls

### Keyboard

- `ArrowLeft` or `A` - move left
- `ArrowRight` or `D` - move right
- `ArrowUp` - jump in levels 1 and 2
- `ArrowDown` - drop down through platforms in levels 1 and 2
- `Space` - attack

### Touch / iPad

- Transparent on-screen arrow buttons
- On-screen `Shoot` button
- Controls sit inside the game surface, not below the page
- The gameplay area is treated like an app surface:
  - touch gestures disabled only inside the game surface
  - pointer events used for virtual buttons
  - desktop keyboard controls still work

## Player Rules

- Player starts with `10 HP`.
- Taking damage reduces HP by `1`.
- On damage:
  - player flickers for `2 seconds`
  - red floating `-1` text appears
  - floating text rises upward for up to `3 seconds`
- If HP reaches `0`, the run fails.

## Hero Selection

Four selectable heroes:

- `Fire` using `fire.png`
- `Leaf` using `leaf.png`
- `Lightning` using `light.png`
- `Fairy` using `char.png`

Ready screen card layout:

- character image on the left
- name and short skill description on the right

## Level 1 Rules

- Side-scroller style
- Player always faces left
- Left is the forward direction
- World scroll makes the player appear to travel left even with no movement input
- Player can move backward without turning around
- Ground and platforms scroll with the level
- Boss stays away from the far right side

### Level 1 Player Movement

- Side-scroller movement speed:
  - forward speed: `420`
  - backward speed: `330`
- Gravity: `2200`
- Jump launch velocity: `1200`
- Jump rise capped to about `280px`
- Down arrow lets player drop through platforms

## Level 2 Rules

- Side-scroller style
- Player always faces right
- Right is the forward direction
- World scroll makes the player appear to travel right even with no movement input
- Player starts on the left side of the screen
- Player can move backward without turning around
- Mobs come from the right
- Boss stays away from the far left side

### Level 2 Player Movement

- Same side-scroller values as level 1:
  - forward speed: `420`
  - backward speed: `330`
  - gravity: `2200`
  - jump velocity: `1200`
  - jump rise cap: about `280px`
  - drop-through platforms enabled

## Level 3 Rules

- Top-down style instead of side-scroller
- Player still uses the same sprite and collision box
- Player does not visually turn when moving
- Player can move:
  - up
  - down
  - left
  - right
- Player attack always fires upward on the screen
- Level 3 uses bordered side lanes to narrow the arena
- Current visual play lane:
  - left border at `x = 180`
  - right border at `x = 780`
- Current player horizontal movement span is `500px`

### Level 3 Player Movement

- All 4 directions use speed `400`
- Diagonal movement is not normalized

## Platforms

- Platforms exist in levels 1 and 2 only
- Player can stand on them
- Player can jump to them
- Player can drop down through them with `ArrowDown`
- Platform density was increased from the original version
- Higher platforms were added
- Platforms recycle as the world scrolls

## Mob Rules

- Regular mobs use `bomb.png`
- Mob HP: `10`
- `MobSound.m4a` plays whenever a mob spawns

### Level 1 Mobs

- Spawn over time
- Move left-to-right
- Fly in a vertical sine-wave path
- Horizontal speed range: `180` to `280`

### Level 2 Mobs

- Spawn over time
- Move right-to-left
- Fly in a vertical sine-wave path
- Horizontal speed range: `180` to `280`

### Level 3 Mobs

- Spawn from the top
- Move downward
- Drift side-to-side in a horizontal sine-wave
- Downward speed reduced to `70%` of the earlier top-down value
- Horizontal wave amplitude enlarged for more sideways movement

## Boss Rules

- `Boss2sound.m4a` loops while any boss is alive
- Boss appears after:
  - enough mobs killed, or
  - enough time has passed
- Boss takes damage from player attacks
- Touching boss damages player

### Level 1 Boss

- Uses `bomb.png`
- HP: `200`
- Also shoots destroyable projectiles
- Shoots `2` projectiles at once
- Projectiles aim roughly toward the player

### Level 2 Boss

- Uses `boss.png`
- HP: `250`
- Also shoots destroyable projectiles
- Shoots `3` projectiles at once
- Projectiles aim roughly toward the player

### Level 3 Boss

- Uses `boss2.png`
- HP: `300`
- Stays in the top region
- Never moves down into the player field
- Shoots `4` downward projectiles
- Boss projectiles use `rescue.png`
- Player attacks can destroy those projectiles

### Level 3 Boss Size Tiers

- Boss shrinks as HP drops
- Tier 1: `3x` player size
- Tier 2: `2.5x`
- Tier 3: `2x`
- Tier 4: `1.5x`
- Tier 5: `1x`

## Weapon System Summary

All attacks are fired with `Space`.

### Fire

- Visual form: fireball emoji
- Base projectile type: direct projectile
- Damage is tied to projectile size stage
- Fireball starts at `1/4` size
- Every `100px` traveled, it grows by another `1/4`
- At `300px`, it reaches full size

Damage by stage:

- stage 1: `5`
- stage 2: `10`
- stage 3: `15`
- stage 4: `20`

Level 3 visibility:

- extra red glow/background accent added so it stands out against the dirt field

### Leaf

- Projectile type: direct projectile
- Each leaf deals `5`

Levels 1 and 2:

- Fires 3 leaves
- Angles: `-10`, `0`, `10`

Level 3:

- Fires upward spread
- Angles: `-105`, `-90`, `-75`

Level 3 visibility:

- extra green glow/background accent added for readability

### Lightning

- Projectile type: instant beam hit
- Damage: `25`
- Duration: about `0.08s`
- Can destroy enemy boss projectiles

Damage areas:

- Levels 1 and 2: `480 x 40`
- Level 3: `280 x 50`

Visual behavior:

- One visible main yellow lightning strike only
- No double-core look
- If no target is hit:
  - main strike spans full attack area
- If exactly one target is hit:
  - main strike goes from origin directly to that target
- If multiple targets are hit:
  - main strike goes from origin to the farthest target
  - other hit targets get short thin branch strikes
- Branch strike rule:
  - branch starts about `100px` before the target
  - branch ends at the hit point
- A hit spark is drawn at each target contact point

### Fairy

Main bow:

- Visual form: butterfly bow
- Up to `4` main bows can exist at once
- Levels 1 and 2:
  - travels forward about `300px`
- Level 3:
  - travels upward about `250px`

Main bow contact rule:

- If the main bow touches a mob or boss:
  - deal `15` splash damage
  - splash radius: `20px`
  - bow is consumed
  - bow does not explode into hearts

If the main bow reaches max distance without hitting:

- it bursts into `8` heart projectiles

Heart burst:

- Each heart travels up to `200px`
- Damage:
  - `6` while traveled distance is `0` to `100px`
  - `10` after traveled distance is greater than `100px`

## Collision Rules

- Player touching a mob:
  - player loses `1 HP`
  - mob is removed
- Player projectile touching mob:
  - mob takes damage
  - if HP reaches `0`, `Mobs Killed` increases by `1`
- Player projectile touching boss:
  - boss takes damage
- Lightning and player attacks can destroy enemy boss projectiles

## Background and World Direction

### Level 1

- Background scroll direction makes the player feel like traveling left

### Level 2

- Background scroll direction makes the player feel like traveling right

### Level 3

- Top-down dirt-themed field
- Sporadic dirt lines instead of green perspective lines
- Decorative doodads include grass, dirt, rocks, and small terrain marks

## Audio Rules

- Play `MobSound.m4a` whenever a mob spawns
- Loop `Boss2sound.m4a` while a boss is alive
- Stop boss loop when:
  - boss dies
  - player fails
  - level is reset
  - returning to menu

## Current Win / Lose Presentation

- On boss defeat:
  - boss death animation first
  - then `Victory!` only, no subtitle
  - hold `3 seconds`
  - then continue
- On failure:
  - dark overlay
  - `You Failed`
  - hold `3 seconds`
  - then return to current level ready screen

## Tuning Values To Change First

If duplicating or rebalancing the project later, these are the best values to expose first inside `game.js`:

- `CONFIG.playerMaxHp`
- `CONFIG.mobSpawnInterval`
- `CONFIG.projectileSpeed`
- `CONFIG.backgroundScrollSpeed`
- `CONFIG.mobSpeedMin`
- `CONFIG.mobSpeedMax`
- `SIDE_SCROLLER_CONFIG.gravity`
- `SIDE_SCROLLER_CONFIG.jumpVelocity`
- `SIDE_SCROLLER_CONFIG.moveSpeed`
- `SIDE_SCROLLER_CONFIG.backwardSpeed`
- `SIDE_SCROLLER_CONFIG.maxJumpRise`
- `LEVEL_THREE_CONFIG.moveSpeed`
- `LEVEL_THREE_CONFIG.mobSpeedScale`
- `LEVEL_THREE_CONFIG.mobWaveAmplitude`
- `LEVEL_CONFIGS[level].bossHp`
- `platformLayout`

## Duplication Notes

To recreate this game in another project:

- keep the 3-level flow exactly as defined above
- preserve each hero's weapon rules and level-specific behavior
- preserve boss HP, mob HP, and boss projectile counts
- keep level 1 and 2 as side-scrollers and level 3 as top-down
- keep the iPad overlay controls inside the canvas wrapper
- keep the ready screen as an overlay on top of the same game surface
- keep all assets local and referenced by filename only
