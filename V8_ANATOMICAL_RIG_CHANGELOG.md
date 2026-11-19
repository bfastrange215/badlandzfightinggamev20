# Philly Badlandz V8 — Fixed-Length Rig & Nine Stances

The V7 player renderer placed hands, elbows, knees and ankles directly on fixed animation target points, then dynamically resized cylinder meshes between those points. These targets could be impossible for a human limb to reach, causing visible limb stretching.

The V8 renderer in `public/three-d.js` includes `solveTwoBone`:
1. Project the desired wrist or ankle position into the reachable radius of the two limb segments.
2. Use the law of cosines to locate the elbow or knee so both segment lengths are fixed exactly.
3. Use a style- and move-specific pole vector to aim elbow/knee bending in a plausible direction.
4. Place shoulders, hips, elbows, knees, wrists and ankles independently; the wrist/ankle pivot rotates glove/shoe geometry.
5. Use uniform body scaling and a lowered-hip crouch instead of vertically squashing limb geometry.

Every fighter now has a dedicated `FIGHTER_STANCES` profile in `public/three-d.js`, plus a `stanceName` field in `public/roster.json`. Stances differ in hands, foot position, side-on angle, guard, idle bounce, and timing. These change presentation only; the original attack speed and damage remain server authoritative and unmodified.

To verify: `npm test` runs the full V7 regression suite plus new fixed-limb reach and unique-stance tests. To evaluate visual quality, run Training Mode on a WebGL-capable PC and compare idle, jab, hook, uppercut, front kick, roundhouse and crouch. These articulated primitive models remain a prototype rather than motion capture.
