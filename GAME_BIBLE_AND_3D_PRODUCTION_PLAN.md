# Philly Badlandz — Original Game Bible & Character Production Plan

## The game

Original adult 3D urban 1v1 arcade fighting game set in fictionalized Philadelphia-inspired street arenas. Real-time local practice and internet-friendly server-authoritative room multiplayer. Best of three rounds, 90 seconds each, first to two wins. Power meters charge with contact, 50-meter Supers, 100-meter Ultras, individual cooldown abilities. Visual identity: cinematic dark city, neon red/black menus, gritty clothing, character-focused silhouettes, energetic arcade hit effects and original synthesized impacts.

### Rules locked in V6

- 100 health, 0–100 Super/Ultra meter, server-issued hit and round results.
- Standing combos, alternate punches and kicks, sweeps, guarded hits, dodges, short jump attacks.
- Buffers accept one next normal attack during animation; no arbitrary client-predicted damage.
- Online mode: two real Socket.IO players on one shared reachable server. Training mode: CPU opponent.
- No persistent ranked results, automated public hosting, rollback netcode, or paid matchmaking claims.

## Roster and movement direction

All fighters are **original fictional character representations**: approved reference artwork may be used for concept and production, but name and clothing descriptions don't magically supply 3D assets. Preserve the correct names and genders.

| Fighter | Presentation | Stance / animation direction | Ultra style |
|---|---|---|---|
| Piro | Male, red tracksuit, cropped hairstyle | Forward boxing pressure, tight guard, jab-cross | Fire-colored cinematic strike |
| Speedy | Male, blue varsity, cap | Light feet, evasive bounce, fast combination | Blink-speed afterimages |
| HTB Druski | Male, broad heavy build, charcoal clothing | Heavy planted hooks, shoulder checks, slower steps | Ground impact |
| BFA Strange | Male, purple hoodie, curls | Off-tempo feints, unexpected kicks | Sky lightning |
| GCG Doughboy | Male, stocky, purple colors | Power forward stance and short heavy strikes | Heavy impact with thrown prop motif |
| Verge | Male, army green, braids | Disciplined kickboxing and deliberate heavy counters | Brick city motif |
| The Crackhead | Male, distressed clothing, messy hair | Unorthodox high-energy sways and wild motion | Chaotic flurry |
| Lucy aka Chucky | Female, red jacket, pigtails | Quick counters, spinning kicks, compact guard | Scarlet cyclone |
| Lexa aka Birdface | Female, pink accents, ponytail | Fast aerial kicks, extended range | Feather/wind burst |

## Asset production steps — future work (NOT included in V6)

1. **Design/turnarounds.** Create original front, back, left, and right orthographic poses per fighter. Approve one identity and color palette before producing the real mesh. Keep reference permissions documented.
2. **Model and rig.** Author/licence low-/mid-poly game-ready GLB/GLTF full-body 3D models with a consistent human skeleton, scale, neutral bind pose, deforming skin weights, materials, hair and clothing. Aim for plausible 1.6–2m proportions and a shared set of foot/hand bones.
3. **Animate.** One shared set for idle, forward, retreat, jump start/loop/land, crouch, standing guard, crouch guard, evade left/right, hit low/high, fall/KO, win, jab, cross, hook, uppercut, front kick, roundhouse, sweep, spinning kick, air jab, air kick, ability, super, Ultra. Later add custom motion clips for all nine fighters.
4. **Implement.** Extend the renderer to load external GLB animations and blend action states with server events; retain collision/range rules and server authority. Use animation hit frames aligned to the server move's windup/duration.
5. **Audio.** Create or license original announcer calls, individual voice barks, full stage music and short synthesized SFX; avoid unlicensed film/game recordings or music.
6. **Stages.** Gradually replace the procedural locations with properly scaled static/animated 3D assets, stable walkable planes and stage previews.
7. **Networking.** Build rollback only after input prediction, deterministic game simulation, correction/reconciliation and two-machine latency tests. Current V6 is authoritative snapshot networking; calling it rollback would be inaccurate.
8. **Launch.** Add production hosting, HTTPS/WSS, rate-limiting, telemetry, ranking persistence and abuse controls, then test accessibility and real two-player internet matches before marketing it as ready for a public launch.

## Suggested GLB asset names

```
assets/models/piro.glb
assets/models/speedy.glb
assets/models/htb-druski.glb
assets/models/bfa-strange.glb
assets/models/gcg-doughboy.glb
assets/models/verge.glb
assets/models/the-crackhead.glb
assets/models/lucy-chucky.glb
assets/models/lexa-birdface.glb
```

These are reserved names only. **No fake or empty model files are packaged**, and adding a GLB does not automatically display it until a skeletal renderer/loader is implemented.

## Legal/art notes

This project uses original game-specific art and names supplied by the user. It is not an official Rockstar, Street Fighter, or film-licensed product. Do not extract FiveM/GTA models or third-party movie audio for redistribution without appropriate rights.
