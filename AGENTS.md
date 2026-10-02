<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Custom gameplay artwork is stored as Lovable asset pointers and rendered with alpha-cropped collision alignment so large binaries stay outside the repository.
- Player choices use four uploaded alpha-cropped character sprites (Normal, Medieval, Fire, Desert), while the unchanged 34px physics box controls gameplay.
- Sky Climb account profiles and fastest completed-run rankings persist in Lovable Cloud; keep local storage only as an offline fallback.
- Authentication uses a normalized unique username plus password; the internal synthetic email is never shown or collected, so email recovery is unavailable.
- Multiplayer rooms (host/join 6-char code, 10 max) use database RPCs for join/start/first-finish winner and Realtime broadcast for live racer positions; why: atomic winner + low-latency ghosts.
- Multiplayer racer rendering uses sequenced velocity prediction with time-based convergence; why: reduce cross-device perceived lag without raising network frequency or lowering phone graphics.
- Castle landing artwork backs the login, main menu and lobby screens only (never the gameplay canvas); why: signed-in players see the landing page too.
