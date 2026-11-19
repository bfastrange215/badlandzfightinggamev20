# V7 Combat Feel + Stage Realism

## Why the old attacks felt stiff

V6 used two rotations per limb driven by a single sinusoidal `attackProgress`, causing every punch to swing from the same point and both kinds of kicks to share nearly the same silhouette. V7 replaces limb rotations with per-move 3D targets for wrists, elbows, knees and feet. The geometry is articulated with segments drawn between joint coordinates.

- **Jab**: lead arm straight punch, guarded opposite arm.
- **Cross**: rear arm reaches with torso twist and follow-through.
- **Hook**: fist follows a lateral semicircular path, elbow stays raised.
- **Uppercut**: drops to chamber before rising past the opponent's chin line.
- **Kicks**: right/left legs alternate by attack; legs chamber at the knee, extend through contact and retract. Spinning kick rotates the torso and leg through a full turn.
- **Animation curves**: smoothstep, custom chamber and strike envelopes, non-linear return. Rendering samples local elapsed time between authoritative server packets.

## Smoothness

The arena backdrop and set dressing no longer cost thousands of WebGL draw calls per frame. A generated vertex-color batch is cached on first render for each of the eight stages and reused on subsequent frames. Animation uses only separate moving-fighter meshes. DPI upper bound helps slower computers.

## Multiplayer integrity

All animation changes are client-side only. The server still controls move validity, hit boxes, combo order, KO determination, matchmaking, hit damage and round wins. Display interpolation does not alter the actual hit events.

## Limitations

No dedicated character GLB/FBX assets, skeletal skinning, inverse-kinematics solver or photoreal photography are supplied. This improves the current procedural prototype substantially but should not be described as a PS5-quality fighting game.
