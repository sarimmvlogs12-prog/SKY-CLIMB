import landingBackground from "@/assets/sky-climb-login-background.webp.asset.json";

/**
 * Landing artwork shared by the login page, main menu and lobby.
 * Gameplay uses its own canvas backgrounds and never renders this.
 */
export function SkyBackdrop() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-sky-mid">
      <img
        src={landingBackground.url}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover object-[64%_center] sm:object-center"
      />
      <div className="absolute inset-0 bg-ink/20" />
    </div>
  );
}
