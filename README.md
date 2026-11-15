# Stilltea

Source: [brandon-lai/stilltea](https://github.com/brandon-lai/stilltea).

A single web page where a visitor makes one cup of tea, slowly, step by step.

An illustrated dusk kitchen, four teas, tactile kettle/scoop/pot interactions, real-time steeping, procedural audio, optional breathing and rain, and a quiet ending. No account or backend.

## Run

Node 22 or later. No packages to install.

```sh
npm test
npm run build
npm run dev
# http://127.0.0.1:4173
```

The built `dist/index.html` also opens directly in a browser from disk. `node scripts/serve.mjs --dist` serves the production export. Device settings may not persist under file URLs in some browsers; use HTTP for dependable persistence.

## Decisions on every PRD open question

- **Virtual or real?** Both. Steeping uses wall-clock elapsed time, including time spent in a background tab. Heating is illustrative, with an explanatory note in settings. Start the pour when real water is ready. Green is about a three-minute ritual; chamomile takes more than five minutes because its real five-minute steep takes precedence over the aspirational three-to-five-minute session length.
- **2D or 3D?** Original layered SVG plus canvas steam. No 3D or downloaded images.
- **Four teas and source?** Green 80°C / 150 seconds, rolled oolong 90°C / 180 seconds, black 98°C / 180 seconds, chamomile 100°C / 300 seconds. These sit within the category ranges in [Art of Tea’s steeping guide](https://www.artoftea.com/blogs/tea-101/recommended-steep-times), checked November 14, 2026. Individual tea packet guidance takes precedence. The product does not link to shops.
- **Sound default?** On after the visitor's first gesture, unless a saved preference says off. One mute toggle affects every layer. Audio failure never blocks the ritual.
- **Breathing default?** Off. Optional ten-second glow, disabled as an animation under reduced motion.
- **Closing line?** “For now, this is enough.” Fixed each visit to keep the ending familiar.
- **Art and audio source?** Original SVG illustration and original Web Audio synthesis: room tone, kettle rumble, pour, steam, ceramic/chime, optional rain. No sound files or third-party asset licenses.
- **Name?** Stilltea: stillness and the small, familiar act of making tea.

## Implementation choices

The PRD suggests Vite/TypeScript but leaves the stack open. This version uses native JavaScript modules, plain CSS, SVG and Canvas, with a tiny Node export script. It has zero external dependencies and builds offline. The export combines three known local modules into a classic script so it also works from disk. No database, service credentials or environment variables are required.

Every step has a native keyboard-operable button equivalent. Heat can be held with pointer, Space, or Enter; “Heat gently” warms automatically to the selected temperature. Releasing early retains warmth; overshooting cools automatically. Dragging outside a target simply returns the object. Pointer cancellation, focus loss and hidden tabs release the kettle. The numeric countdown and breathing cue are off by default. Settings use guarded localStorage so private/restricted storage does not break the site.

The “one line of text” direction applies to the narrative. Tea labels, optional numeric settings and accessible controls remain available, as required by the MVP. Long narrative lines can wrap on narrow screens instead of becoming illegible.

No analytics are installed. The PRD lists success signals but defers targets; completion/return tracking is deferred to a separately chosen, privacy-reviewed analytics setup. No visitor events or history leave the device.

## Acceptance criteria from the PRD

The draft has no separate acceptance-criteria section. These are its verbatim MVP requirements, used as the verification checklist:

| Feature | Requirement |
| --- | --- |
| Step flow | Steps run in a fixed order; each waits for input; no fail states or penalties |
| Interactions | Press-and-hold and drag work the same with mouse and touch |
| Tea presets | Four teas, each with its own water temperature, steep time, and liquor color |
| Steep timer | Real-time countdown shown as color change; optional numeric timer |
| Breathing cue | Optional; a slow glow during steeping; off by default |
| Sound | Layered kettle, pour, steam, ceramic, and room tone; one mute toggle |
| Settings | Sound on or off, show timer numbers, °C or °F; remembered on the device |
| Accessibility | Keyboard control for every step; respects reduced-motion settings; text alternatives for each step |
| Responsive | Works in portrait on phones and landscape on desktop |

The automatic steep timer signals readiness but waits for the visitor to pour. The warm-up/cooling animation also ends without a speed test or penalty. These follow the explicit walkthrough where timer completion and cooling are automatic.

Non-goals preserved verbatim:

- Accounts, sign-in, or saved history
- Scores, streaks, badges, or any form of progress tracking
- Selling tea or linking to shops
- A full tea encyclopedia or many tea varieties
- Social sharing or multiplayer
- A 3D scene

## Verification

Run `npm test` for the pure ritual logic, then `npm run build` and
`node --check dist/src/bundle.js` for the production export. `npm audit`
reports zero vulnerabilities; this app has no package dependencies.

For real-browser checks, keep `npm run dev` running in another terminal and run:

```sh
npm run test:browser
# Or point the same checks at a running production export or live deployment:
npm run test:browser -- https://your-deployment.example
```

Passed locally on November 14, 2026: complete mouse, emulated touch, and
keyboard rituals on both the development app and built production export at
1200×900 and 360×760, settings persistence, cancelled and
missed drops, drag position assertions, reduced-motion keyboard flow, and no
uncaught browser errors. Screenshots were inspected for the arrival, selection,
heating, steeping, final cup, and settings states.

The browser check uses installed Google Chrome, Node's native WebSocket, and
Chrome DevTools Protocol. Set `CHROME_PATH` if Chrome is installed elsewhere.
It drives full rituals with mouse drag, emulated touch, and keyboard activation;
checks missed and cancelled drops, object movement, settings persistence, and
horizontal overflow; and saves state screenshots to the OS temporary directory.
The keyboard run enables reduced motion. Only the steeping clock is advanced
for the test; heating and input use real time. The test adds no runtime hooks
to the application and requires no extra packages.

The browser verification found and fixed an SVG transform bug: moving the scoop
replaced its original position. Its resting transform now lives in a nested
group, so pointer movement preserves its place in the scene.

Human listening on actual speakers and physical phone testing remain manual
checks. Headless touch emulation does not certify device-specific behavior.

## GitHub → Vercel publication

The repository is connected to the `stilltea` project in Vercel through GitHub.
Pushes to `main` trigger production builds:

```sh
git push origin main
vercel ls stilltea
```

The tracked `vercel.json` sets `npm run build` and `dist`. Never deploy an
uncommitted working tree. Inspect the resulting deployment, match its Git SHA
to `git rev-parse HEAD`, and run the browser checks against its URL before
sharing it as verified. No environment variables are needed.
