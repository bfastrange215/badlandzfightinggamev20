# Philly Badlandz V20 — Rigged Dan Replacement

**Full game, 12 fighters.** The old Dan model has been replaced by the user-supplied `dan fighting 2.glb`, which includes a real 80-joint skeleton and 14 clips. It uses skeletal animation (walking, punches, kicks, jumps and hit reactions) in the existing 3D fight renderer rather than the old deforming geometry shortcut. All other fighters, arenas, matchmaking and server-side combat are retained from V19.

**Launch:** run `START_PHILLY_BADLANDZ.bat`, then open `http://localhost:3140`. Test Dan's native animations at `http://localhost:3140/dan-3d-preview.html`. This is a local website; online players need access to a deployed game server.

The available embedded clips are mapped to the game's actions. Not every arcade move has its own distinct clip in the uploaded file (e.g., hook and uppercut share the closest native punch clip). A full live WebGL playthrough could not be verified in this environment.

---

# PHILLY BADLANDZ — 3D COMEBACK V18

This is the **full browser-based 3D arcade fighting game**, restored from V10 (pre-2D). It includes the nine original procedural 3D fighters plus **Dan** and **Strange**, using the real GLB models you supplied.

## Start on Windows

1. Extract this ZIP to a NEW folder. Do not overwrite V15 or older backups.
2. Open `philly_badlandz` and double-click `START_PHILLY_BADLANDZ.bat`.
3. It will run `node server.js` (requires Node.js LTS). The launcher opens Edge at **http://localhost:3138**.
4. Choose **Character Select → Badlandz Crew → Strange** (or Dan). Imported models are about 22–23 MB each; allow them to load before fighting.
5. Use **Training Mode** to try Strange or Dan or **Online Multiplayer** to create/join a match.
6. To view the actual model directly, open **http://localhost:3138/dan-3d-preview.html** and try the Stance/Punch/Kick/Walk buttons.

If Windows Firewall asks, allow Node.js to accept connections on your trusted network. If you get a port conflict, stop another Philly Badlandz server first; this edition uses port 3137 to avoid the previous versions.

## Dan's 3D model — important limitation

- The **actual 3D mesh and color texture** are imported and drawn in the 3D arena and character preview, not a flat portrait or a procedural stand-in.
- The optimized GLB keeps the **original 418,515 mesh vertices** but resizes the main texture to 2048×2048 for faster loading. Model: `public/assets/models/dan-fighting.glb`.
- The uploaded GLB has **no skeleton/skin and no animation clips**. Dan is playable (movement, health, hit detection, punches/kicks/blocks, server-side powers, best-of-three matches) but the mesh's attack motion is **limited procedural deformation**, not a fully animated human rig. Realistic articulated moves require rigging and new animations.
- Dan is assigned to **Badlandz Crew**, fighting style **Street Brawler**, ability **Iron Rush**, Ultra **Dan Showdown**.
- The original nine fighters retain V10's existing 3D procedural rig and animations.

## Existing game features

- **11 fighters**, three selection categories, eight Philadelphia stages
- Online 1v1 rooms and room codes; multiplayer combat with server-authoritative damage and synchronized health
- CPU practice, attack combos, blocking, dodges, specials/Ultras, and **best-of-three** rounds
- Red/black start menu, character selection, arena selection, in-game HUD and chat

## Controls

Movement A/D (or arrows); Jump W; Punch J; Kick K; Heavy Kick H; Uppercut O; Block L; Crouch C; Sweep N; Evade E; Super U; Ability I; Ultra T; Fullscreen F. Refer to the in-game controls for context.

## Multiplayer over the internet

`localhost:3138` works on **your own computer only**. To have players connect from the public internet, deploy the Node.js/Socket.IO project to a server with a public HTTPS address (or expose it safely through a managed hosting provider). The game already supports real online rooms but **this ZIP does not automatically publish a website**.

## Test status

Run `npm test` in the game folder. Automated combat, roster, model-format and renderer checks are provided. Full live GPU/WebGL playtesting could not be completed in the build environment. You should verify model display and game performance in Edge or Chrome on your Windows computer.

## Original implementation history

Previous V10 notes were preserved as `README_V10_ARCHIVE.md`. V10 assets and code are not replaced with the rejected V11 2D cutout approach.

## Strange — new imported 3D fighter (V17)
- Added **Strange** as a separate eleventh selectable fighter under **Badlandz Crew**, alongside BFA Strange (unchanged).
- Model: `public/assets/models/strange-fighting.glb`, optimized from the supplied `strange fighting.glb`, full original vertex geometry, optimized 2048px diffuse texture.
- Fighting style: Unpredictable Striker. Special: **Shadow Blitz**. Ultra: **Strange Dimension**.
- **No skeleton or embedded animation tracks** in Strange's source GLB; combat is registered by the server but visible 3D articulation is limited procedural deformation until the model is rigged.
- View model alone at `http://localhost:3138/strange-3d-preview.html`. Dan remains available at `/dan-3d-preview.html`.
- This game is local on port 3137 until deployed publicly.


## HTB Drewski — model replacement in V18

- The existing **HTB Druski** roster slot is now displayed as **HTB Drewski**. There is no duplicate and the roster still contains 11 fighters.
- Uses `/assets/models/htb-drewski.glb`, built from the supplied `drewski.glb` (same mesh, optimized base-color texture).
- Retains Ground Breaker, Block Shaker and Heavy Peekaboo stats and multiplayer identity.
- Open `http://localhost:3138/drewski-3d-preview.html` for a real 3D model preview.
- Drewski's original GLB has **no skeleton or embedded fighting animations**; his attacks register, but visual limbs use only limited procedural deformation.
- Keep this as an independent folder. This localhost address is not a hosted public website.

## Da Problem • 12th fighter, V19

- **Da Problem** is a new playable fighter in **Badlandz Crew**. Dan, Strange, BFA Strange, and HTB Drewski are retained.
- Model: `/assets/models/da-problem.glb`, optimized from your supplied `Da Problem.glb` while keeping original triangle geometry.
- Fighting style: Pressure Enforcer. Ability: Problem Solver (dash). Ultra: No Easy Answers.
- The source GLB has **no skeleton or animation clips**. Damage, health and timing are handled server-side, but animation is limited procedural mesh deformation.
- Start with `START_PHILLY_BADLANDZ.bat` then visit `http://localhost:3140`.
- Da Problem model inspector: `http://localhost:3140/da-problem-3d-preview.html`.
- This is a **local game address**, not a public web deployment.
