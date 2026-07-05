# Elemental Side Scroller Rules

## Game Objective

Clear level 1, level 2, and level 3 in sequence before your HP reaches zero.

## Game Flow

- The game opens on a centered ready screen.
- On each ready screen, the player chooses one of four heroes.
- Press `Start` to begin the current level.
- The original game that was already built is now treated as `Level 1`.
- After beating the level 1 boss, the game returns to a level 2 ready screen.
- After beating the level 2 boss, the game returns to a level 3 ready screen.
- After beating the level 3 boss, the game returns to the level 1 ready screen.
- The level flow is now: level 1 ready screen, level 1, level 2 ready screen, level 2, level 3 ready screen, level 3, level 1 ready screen.
- Level 2 uses `bomb.png` for normal mobs and `boss.png` for the final boss.
- Level 3 uses `bomb.png` for normal mobs and `boss2.png` for the final boss.
- `MobSound.m4a` plays when a mob spawns on screen in any level.
- `Boss2sound.m4a` loops while any boss is alive.
- When a boss dies, the boss shakes and fades out over about `3 seconds` before the next ready screen appears.
- If the player loses, the screen darkens and shows `You have failed` for `5 seconds`, then returns to that level's ready screen.

## Controls

- `ArrowLeft` or `A`: move left
- `ArrowRight` or `D`: move right
- `ArrowUp`: jump
- `Space`: shoot in the direction the player is facing
- On iPad or touch devices, use the on-screen arrow pad and the `Shoot` button.

## Level 3 Controls

- In level 3, the arrow keys move the player up, down, left, and right.
- In level 3, firing always shoots upward on the screen no matter which way the player is moving.

## Player Rules

- The player starts with `10 HP`.
- In level 1, the player faces left and keeps facing left while moving forward or backward.
- In level 2, the player faces right and keeps facing right while moving forward or backward.
- Character sprites are flipped horizontally when facing right.
- The player can run on the ground and jump onto platforms.
- Gravity pulls the player downward.
- From flat ground, the jump is tuned so the player's top stays around `50px` from the top of the gameplay area at peak height.
- The player can shoot projectiles from the side they are currently facing.
- Shooting has a cooldown, so bullets cannot be fired infinitely fast.
- If the player touches a mob, the player loses `1 HP` and that mob disappears.
- Player health is shown with an in-game HP bar instead of a scoreboard number.
- In level 3, the player switches to a top-down movement style while keeping the same sprite and collision box.
- In level 3, the player sprite always keeps its original facing and does not flip.
- In level 2, the player starts facing right.

## Character Rules

- `Fire` uses `fire.png`.
- Fire shoots a much larger single `🔥` fireball.
- Fireballs deal `20` damage.
- `Leaf` uses `leaf.png`.
- Leaf shoots three `🍃` projectiles at a spread of above, straight, and below.
- Each leaf projectile deals `5` damage.
- `Lightning` uses `light.png`.
- Lightning fires a bright `⚡` laser beam that reaches about half the screen width.
- Lightning beams deal `25` damage.
- In level 3, the lightning beam is `250px` long and `40px` wide.
- `Fairy` uses `char.png`.
- Fairy launches a non-interactive butterfly bow projectile forward for about `300px`.
- In level 3, Fairy's main projectile travels about `250px` upward.
- Fairy can keep up to `4` butterfly bow main projectiles active at once.
- When the butterfly bow reaches its endpoint, it explodes into `8` heart emoji projectiles in all directions.
- Each heart projectile travels about `200px`.
- Each heart projectile deals `4` damage during its first `100px` of travel.
- Each heart projectile deals `10` damage after it has traveled more than `100px`.

## Mob Rules

- Mobs use `bomb.png`.
- Mobs are flying enemies and do not shoot.
- Each mob has `10 HP`.
- Mobs spawn over time.
- Mobs move in a wave pattern by going up and down while traveling horizontally.
- If hit by a player projectile, the mob disappears and counts as a kill.
- If a mob leaves the screen, it is removed.
- In level 2, mobs enter from the right side of the screen.
- In level 3, mobs enter from the top of the screen and move downward.

## Boss Rules

- Each level boss appears after enough progress is made.
- Progress can be reaching the mob kill target or surviving long enough.
- The boss has more HP than a normal mob.
- The level 1 boss has `100 HP`.
- The level 2 boss has `200 HP`.
- The level 3 boss has `300 HP`.
- Player projectiles reduce the boss HP.
- Touching the boss damages the player.
- Beating the level 1 boss unlocks the level 2 ready screen.
- Beating the level 2 boss unlocks the level 3 ready screen.
- Beating the level 3 boss sends the game back to the level 1 ready screen.
- The level 2 boss uses `boss.png`.
- The level 3 boss uses `boss2.png`.
- In level 2, the boss enters from the right side of the screen and does not come too close to the left side.
- In level 1, the boss does not come too close to the right side.
- In level 3, the boss stays in the top area of the screen and never moves down into the playfield.
- In level 3, the boss has `5` size tiers and shrinks as its HP drops.
- Level 3 boss tier 1 is `3x` player size.
- Level 3 boss tier 2 is `2.5x` player size.
- Level 3 boss tier 3 is `2x` player size.
- Level 3 boss tier 4 is `1.5x` player size.
- Level 3 boss tier 5 is the same size as the player.
- In level 3, the boss fires `4` rescue projectiles downward in random downward directions.
- Level 3 boss projectiles use `rescue.png`.
- Player weapons can destroy level 3 boss projectiles.

## Scoring Rules

- The scoreboard updates live during play.
- `Mobs Killed` increases by `1` for each defeated mob.
- `Time Elapsed` shows the number of seconds since the run started.
- The scoreboard also shows the current level and selected hero.
- Remaining health is shown in the canvas as an HP bar during gameplay.
- The right-side instruction panel has been removed from the HUD.

## Level Direction Rules

- In level 1, the background and world move so the player appears to be traveling left even without pressing a movement key.
- In level 2, the player starts from the left side of the screen.
- In level 2, the background and world move so the player appears to be traveling right even without pressing a movement key.
- In level 3, the play style shifts toward a simple top-down arena with vertical enemy pressure from above.
- Level 3 uses side borders on the left and right to narrow the play area.
- Level 3 terrain is shown with sporadic dirt lines and simple doodads like grass, stones, and dirt rather than green perspective lines.
- In level 3, weapon projectiles are rendered with brighter, more vibrant visuals for readability.

## Win Condition

- Defeat the level 3 boss to complete the current three-level cycle.

## Lose Condition

- Player HP reaches `0`.

## File Structure

- `index.html`: page layout, scoreboard, ready screens, and canvas
- `style.css`: page styling, retro arcade presentation, and centered ready-screen layout
- `game.js`: level flow, rendering, controls, character weapons, spawning, collisions, and UI updates
- `Game_rules.md`: project rules and setup notes

## Asset Requirements

Place these image files in the same folder as `index.html`:

- `fire.png`: Fire hero
- `leaf.png`: Leaf hero
- `light.png`: Lightning hero
- `char.png`: Fairy hero
- `bomb.png`: level 1 boss and both levels' normal mobs
- `boss.png`: level 2 boss
- `boss2.png`: level 3 boss
- `rescue.png`: level 3 boss projectile
- `MobSound.m4a`: mob spawn sound
- `Boss2sound.m4a`: looping boss sound

## Easy Gameplay Tuning

These values are designed to be easy to change later inside `game.js`:

- `playerMaxHp`
- `mobSpawnInterval`
- `LEVEL_CONFIGS`
- `projectileSpeed`
- `backgroundScrollSpeed`
- `platformLayout`
