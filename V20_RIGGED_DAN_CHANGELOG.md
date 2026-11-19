# Philly Badlandz V20 — Rigged Dan Replacement

- Replaces Dan's original unrigged mesh with the user-provided `dan fighting 2.glb`.
- Uses the uploaded model's own 80-joint skin and 14 embedded glTF animation clips (not the old rubber-mesh deformation).
- Plays built-in walk, punch, kick, jump, dash, and damage reactions mapped to the existing combat input states.
- Keeps Dan's roster ID, his Iron Rush special, Dan Showdown Ultra, all 12 fighters, the multiplayer backend, arenas and other models.
- Software skinning at 24 animation samples per second updates the existing WebGL buffers. Older imported models are unchanged.
- Dan's punch and kick moves use the closest available native animation clip; the GLB does not provide every separate arcade move. His neutral/block use a held frame from the embedded combo clip.
- To try the animations outside a match, open http://localhost:3140/dan-3d-preview.html after starting the server.
- This does not add a new model rig to any of the other imported fighters.
