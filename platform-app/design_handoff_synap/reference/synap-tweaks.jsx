/* ============================================================
   SYNAP — Tweaks panel (accent, theme, density, radius, brand)
   ============================================================ */

const SYNAP_TWEAK_DEFAULTS = {
  accent: "violet",
  density: "regular",
  radius: "rounded",
  uiFont: "Hanken Grotesk",
  brand: "Synap",
  dark: false,
};

const ACCENTS = {
  violet: { h: 280, c: 0.17, label: "Violet" },
  indigo: { h: 265, c: 0.16, label: "Indigo" },
  blue: { h: 245, c: 0.15, label: "Blue" },
  teal: { h: 195, c: 0.12, label: "Teal" },
  green: { h: 155, c: 0.13, label: "Green" },
  magenta: { h: 330, c: 0.16, label: "Magenta" },
};
const RADII = {
  sharp: { xs: 3, sm: 4, md: 5, lg: 7, xl: 10 },
  rounded: { xs: 6, sm: 8, md: 11, lg: 16, xl: 22 },
  pill: { xs: 8, sm: 12, md: 16, lg: 22, xl: 28 },
};
const DENSITY = { compact: 13, regular: 14, comfy: 15 };

function SynapTweaks({ theme, setTheme }) {
  const [t, setTweak] = useTweaks(SYNAP_TWEAK_DEFAULTS);

  // keep dark tweak synced with app theme
  React.useEffect(() => { if ((t.dark ? "dark" : "light") !== theme) setTheme(t.dark ? "dark" : "light"); }, [t.dark]);
  React.useEffect(() => { if ((theme === "dark") !== t.dark) setTweak("dark", theme === "dark"); }, [theme]);

  React.useEffect(() => {
    const root = document.documentElement;
    const a = ACCENTS[t.accent] || ACCENTS.violet;
    root.style.setProperty("--accent-h", a.h);
    root.style.setProperty("--accent-c", a.c);
    const r = RADII[t.radius] || RADII.rounded;
    root.style.setProperty("--r-xs", r.xs + "px"); root.style.setProperty("--r-sm", r.sm + "px");
    root.style.setProperty("--r-md", r.md + "px"); root.style.setProperty("--r-lg", r.lg + "px"); root.style.setProperty("--r-xl", r.xl + "px");
    document.body.style.fontSize = (DENSITY[t.density] || 14) + "px";
    root.style.setProperty("--font-ui", `"${t.uiFont}", system-ui, sans-serif`);
  }, [t.accent, t.radius, t.density, t.uiFont]);

  React.useEffect(() => { window.HELIX_BRAND = t.brand || "Synap"; window.dispatchEvent(new Event("synap-brand")); }, [t.brand]);

  return (
    <TweaksPanel>
      <TweakSection label="Brand" />
      <TweakText label="Product name" value={t.brand} onChange={(v) => setTweak("brand", v)} />
      <TweakSection label="Accent" />
      <TweakRow label="Color">
        <div className="row gap-2 wrap" style={{ justifyContent: "flex-end" }}>
          {Object.entries(ACCENTS).map(([k, a]) => (
            <button key={k} title={a.label} onClick={() => setTweak("accent", k)} style={{
              width: 26, height: 26, borderRadius: "50%", cursor: "pointer",
              background: `oklch(0.58 ${a.c} ${a.h})`,
              border: t.accent === k ? "2px solid var(--ink)" : "2px solid transparent",
              boxShadow: t.accent === k ? "0 0 0 2px var(--surface), 0 0 0 4px var(--ink)" : "none",
            }} />
          ))}
        </div>
      </TweakRow>
      <TweakSection label="Appearance" />
      <TweakToggle label="Dark mode" value={t.dark} onChange={(v) => setTweak("dark", v)} />
      <TweakRadio label="Density" value={t.density} options={["compact", "regular", "comfy"]} onChange={(v) => setTweak("density", v)} />
      <TweakRadio label="Corners" value={t.radius} options={["sharp", "rounded", "pill"]} onChange={(v) => setTweak("radius", v)} />
      <TweakSelect label="UI font" value={t.uiFont} options={["Hanken Grotesk", "Space Grotesk", "system-ui"]} onChange={(v) => setTweak("uiFont", v)} />
    </TweaksPanel>
  );
}

window.SynapTweaks = SynapTweaks;
