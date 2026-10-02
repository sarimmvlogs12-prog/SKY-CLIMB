# Game engine rules

- Lethal lasers are non-solid generated hazards layered over safe platforms so obstacle art never blocks the required climb route.
- The sky-portal chapter runs from immediately after checkpoint 8 through checkpoint 10, using narrow separated switchbacks, sparse solid props, and frequent tested double-jump spacing.
- Checkpoint 10 is a large final portal landing that triggers victory and permanently stops course generation above it.
- Platforms are solid with visible tops; portal towers land on roofs and regular portal landings show the full waterfall-island PNG.
- Sky-portal placement rejects any spot where drawn artwork (not just collision) overlaps recent props; why: every island stays fully visible.
- Final checkpoint separates lower approach and upper victory landings for a clear finish route.
- Course placement checks jump lanes and falls back to a regular slab when artwork would trap players.
