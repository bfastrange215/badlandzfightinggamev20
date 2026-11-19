# PHILLY BADLANDZ — ANATOMICAL MOTION V8

**V8 repairs the limb-stretching problem using fixed-length inverse kinematics.** This is a gameplay-renderer patch to V7, not a replacement of the V5 interface or V6 online game systems.

## V8 changes — anatomy and stances

- **No rubber limbs:** Upper arms, forearms, thighs, and shins use constant local lengths. Any requested attack position outside physical reach is clamped. Elbows and knees are computed using a stable two-bone IK solver. Limb geometry can no longer stretch across impossible distances when a strike reaches out.
- **Independent joints:** Shoulders and hips form the origins of articulated limbs, elbows and knees bend, and wrist and ankle pivots rotate gloves and shoes separately. The torso can lean and rotate for punches and kicks. Uniform body scaling avoids changes in bone length when a limb changes direction.
- **Natural crouch:** The fighter lowers into the crouch while the legs bend; the old global vertical body-squash has been removed.
- **Nine character-specific guards:** Every fighter has a unique stance profile (hand guard height, lead foot, rear foot, elbow pole/bend, bounce timing, body angle and foot turn):
  - Piro — **Philly Shell** (tight defensive lead shoulder)
  - Speedy — **Bounce Kickboxer** (light and mobile)
  - HTB Druski — **Heavy Peekaboo** (tight high guard, wide base)
  - BFA Strange — **Unorthodox Feint** (asymmetric hands)
  - GCG Doughboy — **Grappler Base** (low open guard and wide feet)
  - Verge — **Enforcer Guard** (balanced squared posture)
  - The Crackhead — **Wild Sway** (loose asymmetric rhythm)
  - Lucy aka Chucky — **Counter Guard** (high protective guard)
  - Lexa aka Birdface — **Side-On Taekwondo** (bladed stance, kick-ready feet)
- **Multiplayer preserved:** All changes are client renderer and character metadata only. The server still decides damage, knockouts, specials, wins, matchmaking and room chat.
- **Character select:** Fighting style and named stance now display together.

**Testing:** `npm test` checks 17 gameplay and renderer cases, including thousands of sampled limb positions across all 9 fighters and 20 animation states, their fixed segment lengths, nine different idle guards and a physically constrained IK solver. Live visual testing in the local browser was blocked in this environment; you should evaluate the feel in Training Mode on your PC.

**Still a prototype:** The fighter bodies are procedural 3D mesh parts. A full skeletal rig with deformation, detailed human faces and motion-captured animation would need actual rigged humanoid character assets. V8 does not claim PS5/mocap realism.

---

**Previous V7 arcade-fighting animation pass** on the existing Philly Badlandz browser game. Preserves the V5 cinematic UI and the V6 gameplay/multiplayer system.

## V7 changes

- New **joint-driven striking** instead of rotating entire arms and legs together. Each attack has its own chamber, strike and return path: jabs travel straight forward, crosses use the opposite arm and torso, hooks arc across, uppercuts rise from low guard, and front/roundhouse/spinning kicks chamber and whip forward independently.
- The fight animation advances smoothly between the server’s 30Hz update packets using local **visual-only motion prediction**. Server damage, timing, health and round wins are unchanged. Input buffering and combos remain active.
- Arena graphics have **textured asphalt, brick mortar patterns, reflections, stage-specific set dressing, parked cars, lamps, street markings, court and subway detail** and atmospheric image backdrops from the existing game assets.
- Crucial FPS optimization: **each stage is baked into a single static GPU draw call**, rather than re-drawing hundreds of separate objects every frame. Fighters still animate individually on top. GPU pixel ratio is capped to reduce lag on high-resolution displays.
- Live 1v1 rooms, matchmaking, CPU training, 9 character powers, best-of-three rounds, original sounds and UI all remain.

## Run on Windows

1. Extract ZIP **fully** before running (do not run the BAT from inside ZIP).
2. Open `philly_badlandz` and double-click `START_PHILLY_BADLANDZ.bat`.
3. The script needs Node.js installed. The ZIP includes the Node.js dependency folder. If it is missing, the BAT will try `npm install` (internet required for installation).
4. Open **http://localhost:3000** in Edge/Chrome, if it does not automatically open. Choose **Training Mode** to test first.
5. For online 1v1, both people must connect to the **same server**. Sharing a room code alone does not connect players on two different PCs when the game server runs only on `localhost`; host the Node server on an internet-accessible machine and configure network/firewall/HTTPS accordingly.

## Controls

A/D or arrow keys: move; W: jump; J: punch; K: kick; H: heavy/roundhouse; O: uppercut; N: low sweep; L: block; C: crouch; E: evade; I: character power; U: super (50 meter); T: ultra (100 meter); F: toggle fullscreen.

Attack strings include J-J-K, J-K-J, K-K-J, J-J-J and K-K-K. The game automatically chooses follow-up strikes when the server accepts the buffered inputs.

## Art and realism limitations

V7 improves *how the existing procedural 3D fighters move*, but they are **not photorealistic motion-captured or rigged character models**. These new animated joint paths are still rendered with primitive mesh components; lifelike anatomical deformation will require replacement humanoid models, skeletal skinning and professionally animated or mocap motion clips.

The stages are **more detailed stylized 3D streets and interiors**, with textures and existing low-resolution atmosphere artwork. They are *not real photographs or physically based AAA environments*. High-resolution licensed photographs or original photogrammetry/3D environment assets are a separate future art pipeline.

## Engineering

- `public/three-d.js`: fighter animation / 3D rendering / stage batching
- `public/main.js`: client input and interpolated rendering; never computes damage
- `server.js`: server-authoritative combat / matchmaking / best-of-three
- `tests/*.test.js`: Node game/network tests and renderer pose+stage batch tests
- `GAME_BIBLE_AND_3D_PRODUCTION_PLAN.md`: existing character and 3D asset roadmap

Test with `npm test` in the `philly_badlandz` directory.

---

## Previous release notes (V6)

# PHILLY BADLANDZ — COMBAT EVOLUTION V6

A **playable browser-based 3D arcade fighting game**. This is a functional upgrade of V5, not a new game: the cinematic red/black start menu, character select categories, arena select, eight stages, nine playable fighters, live online 1v1 rooms, server-authoritative health, rematches, chat, CPU training, and best-of-three rounds are retained.

**Visual quality statement:** The match fighters are **original articulated procedural 3D meshes**, not photorealistic GTA/FiveM/PS5 human models or motion-captured animations. The character portraits are 2D concept art. V6 improves animation poses and gameplay, but custom licensed rigged models and animation clips remain a future production step. This ZIP **does not** provide rollback networking, online hosting, recorded voices, commercial music or a published website.

## Windows startup

1. Extract this ZIP. Enter the `philly_badlandz` folder.
2. Double-click **START_PHILLY_BADLANDZ.bat**. Node.js LTS (https://nodejs.org/) is required.
3. The launcher runs `node server.js` and attempts to open Microsoft Edge fullscreen at **http://localhost:3000**. If the browser blocks automatic fullscreen, press **F** or the fullscreen button.
4. Try **Training Mode** to test the controls against the CPU. Or use **Online Multiplayer → Create Private Room** / **Quick Match** / **Join Room** with a friend.
5. Both players must reach **the same server address**. `localhost` on your PC cannot be reached by another computer. You must host it on a reachable machine/address and configure firewall/reverse proxy/WebSockets for internet play.

**Run manually:** `npm install` if dependencies are missing; then `npm start`. Run `npm test` to verify the server, combats, stages and renderer.

## V6 controls

| Keyboard | Move | Notes |
|---|---|---|
| A / D or ← / → | Move | Character movement speed varies by style |
| W / ↑ | Jump | J or K in midair performs a different aerial move |
| J | Punch chain | Alternating jab, cross, hook; buffer J–J–K or J–K–J |
| K | Kick chain | Front kick, spin kick, different follow-up moves |
| H | Heavy kick | Roundhouse |
| O | Uppercut | Heavy upward attack |
| N | Low sweep | Counters crouching |
| L (hold) | Block | Reduces damage; released to move/attack |
| C (hold) | Crouch / duck | Standing jabs, crosses and hooks miss a ducking fighter; sweep counters ducking |
| E | Evasive backstep | 0.24s dodge; 1.55s cooldown; can evade otherwise connecting hits |
| U | Super | Uses 50 meter |
| T | Ultra finisher | Uses **100** meter; 38 damage on a clean hit, 9 if guarded |
| I | Character power | Different effect/cooldown for each character |
| F | Fullscreen | Browser gesture/permission may be required |

Touch buttons are included. The original 90-second round and first-to-2 score system remain in place. Health, meter costs, invulnerability, rounds and all damage remain **server-controlled**. Pressing a button never locally forges health or damage.

### Combos and timing

- J → J → K: **Badlandz Rush** (jab, cross, roundhouse)
- J → K → J: **Street Mixup**
- K → K → J: **Spin Cycle**
- J → J → J: **Three Piece**
- K → K → K: **Kickstorm**
- W → J or W → K: **Aerial jab** / **aerial kick**
- Hold C to duck standing punches, but beware N low sweeps
- E to evade a short-distance strike; timed dodges do not work while stunned or in attack recovery
- Charge meter using successful attacks/defense, then use U or save up for T

Inputs for combos must be timed during your fighter's attack animation; only one follow-up input is buffered at a time. Not every move auto-hits: range, facing, jumping, guarding and dodging all matter.

## Three categories / nine fighter styles

| Category | Fighter | V6 fighting style | Power | 100-meter Ultra |
|---|---|---|---|---|
| Street Legends | Piro | Pressure Boxer | Hellfire Shot | Redline Inferno |
| Street Legends | Speedy | Speed Kickboxer | Flash Step | Blur City Blitz |
| Street Legends | HTB Druski | Heavy Brawler | Ground Breaker | Block Shaker |
| Badlandz Crew | BFA Strange | Trickster | Sky Thunder | Storm Warning |
| Badlandz Crew | GCG Doughboy | Power Grappler | Trash Can Toss | Heavy Bag Special |
| Badlandz Crew | Verge | Street Enforcer | Brick Launch | Brick City Breaker |
| Badlandz Crew | The Crackhead | Wild Scrapper | Bottle Barrage | Wild Night |
| Ladies of the Landz | Lucy aka Chucky | Counter Striker | Scarlet Cyclone | Scarlet Rampage |
| Ladies of the Landz | Lexa aka Birdface | Aerial Specialist | Bird Storm | Wings of Fury |

Every fighter retains individual clothing colors, head/hair configuration, silhouette and build. Styles now change procedural stance/bounce/pose and locomotion speed; Ultras have individual names and energy colors. This is **not yet nine independently motion-captured full-body animation sets**.

## Multiplayer

The online room browser displays actual waiting rooms only. The room host selects the arena. Quick Match joins an available room or creates one. A second person in another browser can choose a separate character, join using the code, and fight. Both players see the same server-approved hits, damage, stagger, ability usage, meter, round wins and match winner. No rewind/rollback netcode is implemented in V6; Socket.IO authoritative server snapshots are used.

## Graphic settings and hardware

The built-in WebGL renderer uses procedural articulated 3D geometry with animated arm and leg poses. It does not require a CDN, online shader package or extracted GTA assets. If WebGL is disabled, the simple Canvas compatibility renderer is used instead (which has fewer animation details). The character preview cycles sample attacks. A browser and GPU that support WebGL are recommended.

## Test status

Automated Node tests cover baseline matchmaking, hit validation, real chained combos, CPU, character powers/cooldowns, the 2-1 best-of-three flow, all eight stages, 3D rendering paths, meter cost of Ultras, crouch/low attacks, evasion cooldown and aerial strikes. They were run successfully for this package. **Automated tests are not a replacement for on-device visual and latency testing.** The cloud browser in this environment blocked local navigation, so full graphical playthrough was not confirmed here.

## Files

- `server.js` — authoritative multiplayer engine, rounds, attacks, powers, new Ultra/dodge/duck/air rules
- `public/three-d.js` — original animated procedural 3D fighters, enhanced stances and combat poses
- `public/roster.json` — all nine fighter identities, style metadata and Ultras
- `public/main.js` — keyboard/touch, synced HUD, special animations and VFX overlay
- `public/sound.js` — original synthesized impact/ability/Ultra sound effects
- `public/index.html`, `public/ui-v5.css`, `public/ui-v5.js` — V5 cinematic UI retained and extended for V6
- `public/fallback.js` — simpler Canvas compatibility mode
- `GAME_BIBLE_AND_3D_PRODUCTION_PLAN.md` — the next steps for licensed rigged characters, authored animations, sound and real online launch

**Next major art milestone:** Obtain/author and approve true 3D turnarounds, model/rig the nine fighters, and retarget professionally keyed or recorded animations. Replace the code-generated fighter meshes only after the separate assets have been created and licensed. This project is a good game-code foundation, not a finished AAA art asset pack.
