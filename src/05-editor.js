/* ------------------------------------------------------------------ */
/*  visual editor (ha-form based – everything also works in YAML)      */
/* ------------------------------------------------------------------ */
const ED_LABELS = {
  cs: {
    entity: "Entita", name: "Název", icon: "Ikona", look: "Vzhled", layout: "Rozložení", style: "Styl karty",
    size: "Velikost", icon_shape: "Tvar ikony", color: "Barva (auto = podle stavu)", color_off: "Barva ve vypnutém stavu",
    icon_animation: "Animace ikony", card_effect: "Efekt karty", fill: "Výplň pozadí podle hodnoty", ring: "Prstenec průběhu kolem ikony",
    tilt: "3D náklon při najetí myší", ripple: "Vlnka při kliknutí", haptic: "Haptická odezva", background_image: "Obrázek pozadí (URL nebo entity_picture)",
    content: "Obsah", show_name: "Zobrazit název", show_state: "Zobrazit stav", show_icon: "Zobrazit ikonu",
    show_entity_picture: "Použít obrázek entity", secondary_info: "Druhý řádek", primary: "Vlastní název (šablona)",
    secondary: "Vlastní druhý řádek (šablona)", tertiary: "Třetí řádek (šablona)", controls_sec: "Ovládání a graf",
    slider: "Posuvník", controls: "Tlačítka přímo na kartě", graph: "Graf historie", graph_hours: "Graf – počet hodin",
    graph_position: "Pozice grafu", graph_entity: "Entita pro graf (jiná než hlavní)", badge_sec: "Odznak", badge_entity: "Entita odznaku",
    badge_icon: "Ikona odznaku", badge_text: "Text odznaku (šablona)", badge_color: "Barva odznaku", chips_sec: "Čipy (další entity v kartě)",
    chips: "Seznam čipů (YAML)", rules: "Pravidla a prahy", state_styles: "Styly podle stavu (YAML)", thresholds: "Prahové hodnoty (YAML)",
    threshold_interpolate: "Plynulý barevný přechod mezi prahy", min: "Minimum (pro průběh)", max: "Maximum (pro průběh)",
    actions: "Akce", tap_action: "Klepnutí", hold_action: "Podržení", double_tap_action: "Dvojklik", icon_tap_action: "Klepnutí na ikonu",
    popup: "Vyskakovací okno", popup_title: "Titulek okna", popup_history: "Zobrazit historii", popup_attributes: "Zobrazit atributy",
    popup_controls: "Zobrazit ovládání", popup_graph_hours: "Výchozí rozsah historie (h)", popup_buttons: "Tlačítka v okně (YAML)",
    popup_cards: "Vložené karty v okně (YAML)", advanced: "Pokročilé", styles: "Vlastní CSS", spin_speed: "Rychlost rotace (např. 2s)",
  },
  en: {
    entity: "Entity", name: "Name", icon: "Icon", look: "Appearance", layout: "Layout", style: "Card style",
    size: "Size", icon_shape: "Icon shape", color: "Color (auto = by state)", color_off: "Color when off",
    icon_animation: "Icon animation", card_effect: "Card effect", fill: "Background fill by value", ring: "Progress ring around icon",
    tilt: "3D tilt on hover", ripple: "Ripple on tap", haptic: "Haptic feedback", background_image: "Background image (URL or entity_picture)",
    content: "Content", show_name: "Show name", show_state: "Show state", show_icon: "Show icon",
    show_entity_picture: "Use entity picture", secondary_info: "Secondary line", primary: "Custom name (template)",
    secondary: "Custom secondary line (template)", tertiary: "Third line (template)", controls_sec: "Controls & graph",
    slider: "Slider", controls: "Buttons on the card", graph: "History graph", graph_hours: "Graph hours",
    graph_position: "Graph position", graph_entity: "Graph entity (if different)", badge_sec: "Badge", badge_entity: "Badge entity",
    badge_icon: "Badge icon", badge_text: "Badge text (template)", badge_color: "Badge color", chips_sec: "Chips (extra entities inside the card)",
    chips: "Chip list (YAML)", rules: "Rules & thresholds", state_styles: "Per‑state styles (YAML)", thresholds: "Thresholds (YAML)",
    threshold_interpolate: "Smooth color blend between thresholds", min: "Minimum (for progress)", max: "Maximum (for progress)",
    actions: "Actions", tap_action: "Tap", hold_action: "Hold", double_tap_action: "Double tap", icon_tap_action: "Icon tap",
    popup: "Popup", popup_title: "Popup title", popup_history: "Show history", popup_attributes: "Show attributes",
    popup_controls: "Show controls", popup_graph_hours: "Default history range (h)", popup_buttons: "Popup buttons (YAML)",
    popup_cards: "Embedded cards in popup (YAML)", advanced: "Advanced", styles: "Custom CSS", spin_speed: "Spin speed (e.g. 2s)",
  },
};
const ED_HELP = {
  cs: {
    tap_action: "Výchozí: otevře vyskakovací okno TopTop (v YAML: action: toptop-popup)",
    primary: "Jednoduché: {{ name }}, {{ state }}, {{ value }}, {{ attr.brightness }}, {{ relative }} — nebo plná Jinja: {{ states('sensor.x') }}",
    chips: "- entity: sensor.teplota\n- entity: light.lampa\n  tap_action: { action: toggle }",
    thresholds: "- value: 0\n  color: blue\n- value: 25\n  color: red\n  icon_animation: pulse",
    state_styles: "on: { color: amber, icon_animation: glow }\noff: { icon: mdi:lightbulb-off }",
    popup_cards: "- type: entities\n  entities: [ ... ]",
  },
  en: {
    tap_action: "Default: opens the TopTop popup (YAML: action: toptop-popup)",
    primary: "Simple: {{ name }}, {{ state }}, {{ value }}, {{ attr.brightness }}, {{ relative }} — or full Jinja: {{ states('sensor.x') }}",
    chips: "- entity: sensor.temperature\n- entity: light.lamp\n  tap_action: { action: toggle }",
    thresholds: "- value: 0\n  color: blue\n- value: 25\n  color: red\n  icon_animation: pulse",
    state_styles: "on: { color: amber, icon_animation: glow }\noff: { icon: mdi:lightbulb-off }",
    popup_cards: "- type: entities\n  entities: [ ... ]",
  },
};
const ANIMS = ["auto", "none", "spin", "pulse", "breathe", "bounce", "shake", "wiggle", "swing", "glow", "flicker", "heartbeat", "float", "rise", "sink", "blink", "tada", "flip", "jello", "rainbow", "ping", "orbit"];
const EFFECTS = ["auto", "none", "pulse", "glow", "border", "shimmer", "shake", "breathe"];

const sel = (options, custom) => ({ select: { mode: "dropdown", custom_value: !!custom, options } });
const opt = (list, labels = {}) => list.map((v) => ({ value: v, label: labels[v] || v }));

function editorSchema(lang) {
  const cs = lang === "cs";
  const L = (cz, en) => (cs ? cz : en);
  return [
    { name: "entity", selector: { entity: {} } },
    { type: "grid", name: "", schema: [
      { name: "name", selector: { text: {} } },
      { name: "icon", selector: { icon: {} }, context: { icon_entity: "entity" } },
    ] },
    { type: "expandable", name: "", flatten: true, title: L("Vzhled", "Appearance"), icon: "mdi:palette", schema: [
      { type: "grid", name: "", schema: [
        { name: "layout", selector: sel(opt(["horizontal", "vertical", "compact", "hero", "square"], cs ? { horizontal: "Vodorovné", vertical: "Svislé", compact: "Kompaktní", hero: "Hero (velká hodnota)", square: "Čtverec (dlaždice)" } : { hero: "Hero (big value)", square: "Square tile" })) },
        { name: "style", selector: sel(opt(["default", "glass", "neon", "gradient", "aurora", "soft", "frosted", "outline", "minimal"], cs ? { default: "Výchozí", glass: "Sklo (glassmorphism)", neon: "Neon", gradient: "Přechod", aurora: "Polární záře (animovaná)", soft: "Neumorfismus", frosted: "Tónovaná", outline: "Obrys", minimal: "Minimální" } : { glass: "Glass", aurora: "Aurora (animated)", soft: "Neumorphism", frosted: "Tinted" })) },
        { name: "size", selector: sel(opt(["s", "m", "l", "xl"])) },
        { name: "icon_shape", selector: sel(opt(["circle", "squircle", "square", "hexagon", "blob", "none"], cs ? { circle: "Kruh", squircle: "Zaoblený čtverec", square: "Čtverec", hexagon: "Šestiúhelník", blob: "Živý blob", none: "Bez pozadí" } : { blob: "Living blob" })) },
      ] },
      { type: "grid", name: "", schema: [
        { name: "color", selector: sel(opt(["auto", ...COLOR_NAMES, "primary", "accent"]), true) },
        { name: "color_off", selector: sel(opt(COLOR_NAMES), true) },
        { name: "icon_animation", selector: sel(opt(ANIMS)) },
        { name: "card_effect", selector: sel(opt(EFFECTS)) },
        { name: "fill", selector: sel(opt(["auto", "none", "horizontal", "liquid"], cs ? { liquid: "Kapalina (vlny)", horizontal: "Vodorovná" } : { liquid: "Liquid (waves)" })) },
        { name: "ring", selector: sel([{ value: "auto", label: "auto" }, { value: "true", label: L("Ano", "Yes") }, { value: "false", label: L("Ne", "No") }]) },
      ] },
      { type: "grid", name: "", schema: [
        { name: "tilt", selector: { boolean: {} } },
        { name: "ripple", selector: { boolean: {} } },
        { name: "haptic", selector: { boolean: {} } },
      ] },
      { name: "background_image", selector: { text: {} } },
    ] },
    { type: "expandable", name: "", flatten: true, title: L("Obsah", "Content"), icon: "mdi:text-short", schema: [
      { type: "grid", name: "", schema: [
        { name: "show_name", selector: { boolean: {} } },
        { name: "show_state", selector: { boolean: {} } },
        { name: "show_icon", selector: { boolean: {} } },
        { name: "show_entity_picture", selector: { boolean: {} } },
      ] },
      { name: "secondary_info", selector: sel(opt(["state", "last-changed", "last-updated", "state-last-changed", "none"], cs ? { state: "Stav", "last-changed": "Poslední změna", "last-updated": "Poslední aktualizace", "state-last-changed": "Stav + poslední změna", none: "Nic" } : {}), true) },
      { name: "primary", selector: { template: {} } },
      { name: "secondary", selector: { template: {} } },
      { name: "tertiary", selector: { template: {} } },
    ] },
    { type: "expandable", name: "", flatten: true, title: L("Ovládání a graf", "Controls & graph"), icon: "mdi:tune-variant", schema: [
      { type: "grid", name: "", schema: [
        { name: "slider", selector: sel(opt(["none", "auto", "bar", "card"], cs ? { none: "Žádný", bar: "Lišta pod obsahem", card: "Tažení po celé kartě", auto: "Automaticky" } : { bar: "Bar below content", card: "Drag the whole card" })) },
        { name: "controls", selector: { boolean: {} } },
      ] },
      { type: "grid", name: "", schema: [
        { name: "graph", selector: sel(opt(["auto", "none", "line", "bar", "timeline"], cs ? { auto: "Automaticky", none: "Žádný", line: "Křivka", bar: "Sloupce", timeline: "Časová osa stavů" } : {})) },
        { name: "graph_position", selector: sel(opt(["auto", "bottom", "background"], cs ? { bottom: "Dole", background: "Na pozadí" } : {})) },
        { name: "graph_hours", selector: { number: { min: 1, max: 168, mode: "box", unit_of_measurement: "h" } } },
      ] },
      { name: "graph_entity", selector: { entity: {} } },
    ] },
    { type: "expandable", name: "", flatten: true, title: L("Odznak", "Badge"), icon: "mdi:numeric-1-circle", schema: [
      { name: "badge_entity", selector: { entity: {} } },
      { type: "grid", name: "", schema: [
        { name: "badge_icon", selector: { icon: {} } },
        { name: "badge_color", selector: sel(opt(COLOR_NAMES), true) },
      ] },
      { name: "badge_text", selector: { template: {} } },
    ] },
    { type: "expandable", name: "", flatten: true, title: L("Čipy", "Chips"), icon: "mdi:dots-horizontal-circle-outline", schema: [
      { name: "chips", selector: { object: {} } },
    ] },
    { type: "expandable", name: "", flatten: true, title: L("Pravidla a prahy", "Rules & thresholds"), icon: "mdi:format-color-fill", schema: [
      { name: "thresholds", selector: { object: {} } },
      { name: "threshold_interpolate", selector: { boolean: {} } },
      { name: "state_styles", selector: { object: {} } },
      { type: "grid", name: "", schema: [
        { name: "min", selector: { number: { mode: "box" } } },
        { name: "max", selector: { number: { mode: "box" } } },
      ] },
    ] },
    { type: "expandable", name: "", flatten: true, title: L("Akce", "Actions"), icon: "mdi:gesture-tap", schema: [
      { name: "tap_action", selector: { ui_action: {} } },
      { name: "hold_action", selector: { ui_action: { default_action: "more-info" } } },
      { name: "double_tap_action", selector: { ui_action: { default_action: "none" } } },
      { name: "icon_tap_action", selector: { ui_action: { default_action: "toggle" } } },
    ] },
    { type: "expandable", name: "", flatten: true, title: L("Vyskakovací okno", "Popup"), icon: "mdi:card-bulleted-outline", schema: [
      { name: "popup_title", selector: { text: {} } },
      { type: "grid", name: "", schema: [
        { name: "popup_controls", selector: { boolean: {} } },
        { name: "popup_history", selector: { boolean: {} } },
        { name: "popup_attributes", selector: { boolean: {} } },
        { name: "popup_graph_hours", selector: sel([{ value: "6", label: "6 h" }, { value: "24", label: "24 h" }, { value: "72", label: "3 d" }, { value: "168", label: "7 d" }]) },
      ] },
      { name: "popup_buttons", selector: { object: {} } },
      { name: "popup_cards", selector: { object: {} } },
    ] },
    { type: "expandable", name: "", flatten: true, title: L("Pokročilé", "Advanced"), icon: "mdi:code-braces", schema: [
      { name: "spin_speed", selector: { text: {} } },
      { name: "styles", selector: { text: { multiline: true } } },
    ] },
  ];
}

class TopTopCardEditor extends HTMLElement {
  setConfig(config) {
    this._config = { ...config };
    this._render();
  }
  set hass(h) {
    this._hass = h;
    if (this._form) this._form.hass = h;
    else this._render();
  }
  connectedCallback() {
    this._loadHaForm().then(() => this._render());
  }
  async _loadHaForm() {
    if (customElements.get("ha-form") && customElements.get("hui-action-editor")) return;
    try {
      const helpers = await window.loadCardHelpers();
      const c = await helpers.createCardElement({ type: "entities", entities: [] });
      if (c && c.constructor && c.constructor.getConfigElement) await c.constructor.getConfigElement();
      const t = await helpers.createCardElement({ type: "tile", entity: "sun.sun" });
      if (t && t.constructor && t.constructor.getConfigElement) await t.constructor.getConfigElement();
    } catch (e) { /* ignore */ }
  }
  _render() {
    if (!this._hass || !this._config) return;
    if (!customElements.get("ha-form")) {
      this.innerHTML = `<div style="padding:12px">Loading editor… (YAML mode always works)</div>`;
      customElements.whenDefined("ha-form").then(() => this._render());
      return;
    }
    const lang = langOf(this._hass).startsWith("cs") ? "cs" : "en";
    if (!this._form) {
      this.innerHTML = "";
      const head = document.createElement("div");
      head.style.cssText = "display:flex;align-items:center;gap:8px;margin-bottom:12px;padding:10px 12px;border-radius:12px;background:linear-gradient(90deg,rgba(124,77,255,.14),rgba(0,188,212,.14));font-size:13px";
      head.innerHTML = `<b style="background:linear-gradient(90deg,#7c4dff,#00bcd4);-webkit-background-clip:text;background-clip:text;color:transparent">TopTop Card</b><span style="opacity:.7">v${TT_VERSION} · ${lang === "cs" ? "vše lze nastavit i v YAML" : "everything is also configurable in YAML"}</span>`;
      this.appendChild(head);
      this._form = document.createElement("ha-form");
      this._form.computeLabel = (s) => ED_LABELS[lang][s.name] || s.title || s.name;
      this._form.computeHelper = (s) => ED_HELP[lang][s.name];
      this._form.addEventListener("value-changed", (ev) => {
        ev.stopPropagation();
        const v = cleanCfg(ev.detail.value);
        if (!v.type) v.type = "custom:toptop-card";
        this._config = v;
        fire(this, "config-changed", { config: v });
      });
      this.appendChild(this._form);
    }
    this._form.hass = this._hass;
    this._form.schema = editorSchema(lang);
    this._form.data = this._config;
  }
}

/* ------------------------------------------------------------------ */
/*  registration                                                       */
/* ------------------------------------------------------------------ */
if (!customElements.get("toptop-card")) customElements.define("toptop-card", TopTopCard);
if (!customElements.get("toptop-popup")) customElements.define("toptop-popup", TopTopPopup);
if (!customElements.get("toptop-card-editor")) customElements.define("toptop-card-editor", TopTopCardEditor);

window.customCards = window.customCards || [];
if (!window.customCards.some((c) => c.type === "toptop-card")) {
  window.customCards.push({
    type: "toptop-card",
    name: "TopTop Card",
    preview: true,
    description: "Animated next‑gen tile: popups, sparkline graphs, glass/neon/aurora styles, drag sliders, chips, badges, thresholds & templates.",
    documentationURL: "https://github.com/joshuaaaaa/TOPTOP",
  });
}
