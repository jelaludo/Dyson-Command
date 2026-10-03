# Dyson Command

A standalone, real-time browser strategy prototype following the first terraformed world in the A6 [landing-to-starlight story](https://jelaludo.github.io/SentryTowers_A6/terraforming-story/).

Play: https://jelaludo.github.io/Dyson-Command/

## How to play

- In **Frontier**, press a green planet, drag to another planet, and release to launch ships immediately. The **Ships per drag** slider defaults to 50% of the source garrison. Send more ships than the target has defenders. Fleets cross the map over seconds. Click a captured green foothold to terraform it for 40 stored power.
- Drag one of the four gold collectors near the star to a built green planet. When a reachable, unused receiver glows, release to snap the beam into place. Each receiver takes one beam. Keyboard users can select a collector in the Light panel, then select a planet.
- The clock runs automatically. Every two seconds, built worlds produce ships and linked collectors add their output to stored power. Rival garrisons grow every other cycle. Actions do not advance time. Win Frontier with four built worlds and at least 75 light output at once.
- In **Optics**, four receivers are already online. Connect all four collectors to different planets for 82 output; 80 wins. There are no fleets or lasers in this mode.
- The optional SOL laser is available after clicking a red rival planet. It costs 24 stored power, removes up to seven defenders, and does not capture the planet.

The **Rules** tab provides a beginner explanation and an expandable exact reference. It stays available while the simulation runs. Restart and mode switching begin a new scenario. There is no save file, account, network opponent, or physical orbit simulation.

`game-core.js` owns the deterministic rules; `game.js` handles the map and pointer controls. Use `node --test game-core.test.mjs` for fleet timing, automatic economy, receiver snapping, combat costs and both win conditions. Run `python3 -m http.server 8000` from this directory for local play at http://localhost:8000/. GitHub Pages serves the root of `main`.

The existing A6 GLB models remain in their separate Workshop viewers. Planet receivers and this star-orbit collector network are gameplay abstractions, not exported models or physical claims. Galcon's fleet-swarm concept was a mechanical reference:

https://www.galcon.com/classic/index.html
