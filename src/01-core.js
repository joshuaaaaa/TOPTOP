/*!
 * TopTop Card – next‑gen tile card for Home Assistant
 * https://github.com/joshuaaaaa/TOPTOP
 * MIT License
 */
const TT_VERSION = "1.0.0";

console.info(
  `%c TOPTOP-CARD %c v${TT_VERSION} `,
  "color:#fff;background:linear-gradient(90deg,#7c4dff,#00bcd4);font-weight:700;border-radius:4px 0 0 4px;padding:2px 6px",
  "color:#7c4dff;background:#fff;border-radius:0 4px 4px 0;padding:2px 6px"
);

/* ------------------------------------------------------------------ */
/*  i18n                                                               */
/* ------------------------------------------------------------------ */
const I18N = {
  en: {
    brightness: "Brightness", color_temp: "Color temperature", color: "Color", effect: "Effect",
    position: "Position", tilt: "Tilt", speed: "Speed", volume: "Volume", target: "Target",
    current: "Currently", history: "History", changes: "Recent changes", attributes: "Attributes",
    details: "Details", close: "Close", open: "Open", stop: "Stop", close_cover: "Close",
    lock: "Lock", unlock: "Unlock", open_lock: "Open door", run: "Run", start: "Start",
    pause: "Pause", cancel: "Cancel", finish: "Finish", return_home: "Dock", locate: "Locate",
    min: "Min", max: "Max", avg: "Avg", no_data: "No data", not_found: "Entity not found",
    unavailable: "Unavailable", oscillate: "Oscillation", direction: "Direction", mode: "Mode",
    preset: "Preset", fan_mode: "Fan", install: "Install", installed: "Installed",
    latest: "Latest", disarm: "Disarm", arm_home: "Home", arm_away: "Away", arm_night: "Night",
    arm_vacation: "Vacation", code: "Code", humidity: "Humidity", pressure: "Pressure",
    wind: "Wind", on: "On", off: "Off", source: "Source", remaining: "Remaining",
    clear: "Clear", options: "Options", actions: "Actions", power: "Power", fan_speed: "Suction",
  },
  cs: {
    brightness: "Jas", color_temp: "Teplota barvy", color: "Barva", effect: "Efekt",
    position: "Pozice", tilt: "Náklon", speed: "Rychlost", volume: "Hlasitost", target: "Cíl",
    current: "Aktuálně", history: "Historie", changes: "Poslední změny", attributes: "Atributy",
    details: "Podrobnosti", close: "Zavřít", open: "Otevřít", stop: "Zastavit", close_cover: "Zavřít",
    lock: "Zamknout", unlock: "Odemknout", open_lock: "Otevřít dveře", run: "Spustit", start: "Start",
    pause: "Pauza", cancel: "Zrušit", finish: "Dokončit", return_home: "Domů", locate: "Najít",
    min: "Min", max: "Max", avg: "Průměr", no_data: "Žádná data", not_found: "Entita nenalezena",
    unavailable: "Nedostupné", oscillate: "Oscilace", direction: "Směr", mode: "Režim",
    preset: "Předvolba", fan_mode: "Ventilátor", install: "Instalovat", installed: "Nainstalováno",
    latest: "Nejnovější", disarm: "Odstřežit", arm_home: "Doma", arm_away: "Pryč", arm_night: "Noc",
    arm_vacation: "Dovolená", code: "Kód", humidity: "Vlhkost", pressure: "Tlak",
    wind: "Vítr", on: "Zapnuto", off: "Vypnuto", source: "Zdroj", remaining: "Zbývá",
    clear: "Smazat", options: "Možnosti", actions: "Akce", power: "Napájení", fan_speed: "Sání",
  },
};
const langOf = (hass) => (hass && ((hass.locale && hass.locale.language) || hass.language)) || "en";
const tr = (hass, key) => {
  const l = langOf(hass).split("-")[0];
  return (I18N[l] && I18N[l][key]) || I18N.en[key] || key;
};

/* ------------------------------------------------------------------ */
/*  small helpers                                                      */
/* ------------------------------------------------------------------ */
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const esc = (s) =>
  String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const domainOf = (id) => (id ? String(id).split(".")[0] : "");
const isNum = (v) => v !== null && v !== undefined && v !== "" && !isNaN(Number(v)) && isFinite(Number(v));
const fire = (node, type, detail) =>
  node.dispatchEvent(new CustomEvent(type, { bubbles: true, composed: true, detail }));
const snap = (v, min, step) => {
  const dec = (String(step).split(".")[1] || "").length;
  return Number((Math.round((v - min) / step) * step + min).toFixed(dec));
};

/* ------------------------------------------------------------------ */
/*  colors                                                             */
/* ------------------------------------------------------------------ */
const COLORS = {
  red: "#f44336", pink: "#e91e63", purple: "#926bc7", "deep-purple": "#6e41ab", indigo: "#3f51b5",
  blue: "#2196f3", "light-blue": "#03a9f4", cyan: "#00bcd4", teal: "#009688", green: "#4caf50",
  "light-green": "#8bc34a", lime: "#cddc39", yellow: "#ffeb3b", amber: "#ffc107", orange: "#ff9800",
  "deep-orange": "#ff6f22", brown: "#795548", grey: "#9e9e9e", "blue-grey": "#607d8b",
  black: "#000000", white: "#ffffff",
};
const COLOR_NAMES = Object.keys(COLORS);

function cssColor(c) {
  if (c === undefined || c === null || c === "") return null;
  if (Array.isArray(c)) return `rgb(${c.slice(0, 3).join(",")})`;
  c = String(c).trim();
  if (COLORS[c]) return `var(--${c}-color, ${COLORS[c]})`;
  if (c === "primary") return "var(--primary-color)";
  if (c === "accent") return "var(--accent-color)";
  if (c === "disabled") return "var(--disabled-text-color)";
  return c;
}
function toRgb(c) {
  if (Array.isArray(c)) return c.slice(0, 3).map(Number);
  if (c == null) return null;
  c = String(c).trim();
  if (COLORS[c]) c = COLORS[c];
  let m = c.match(/^#([0-9a-f]{3,8})$/i);
  if (m) {
    let h = m[1];
    if (h.length <= 4) h = h.split("").map((x) => x + x).join("");
    return [0, 2, 4].map((i) => parseInt(h.substr(i, 2), 16));
  }
  m = c.match(/^rgba?\(([^)]+)\)/i);
  if (m) return m[1].split(/[ ,/]+/).slice(0, 3).map(Number);
  return null;
}
const rgbStr = (a) => `rgb(${a.map((v) => Math.round(v)).join(",")})`;
const mixRgb = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);

function kelvinToRgb(k) {
  const t = k / 100;
  let r, g, b;
  if (t <= 66) {
    r = 255;
    g = 99.4708025861 * Math.log(t) - 161.1195681661;
    b = t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307;
  } else {
    r = 329.698727446 * Math.pow(t - 60, -0.1332047592);
    g = 288.1221695283 * Math.pow(t - 60, -0.0755148492);
    b = 255;
  }
  return [r, g, b].map((v) => Math.round(clamp(v, 0, 255)));
}

/** stops: [[value, color], ...] or [{value,color}] → css color for v */
function gradientColor(stops, v, interpolate = true) {
  const s = stops
    .map((x) => (Array.isArray(x) ? { value: x[0], color: x[1] } : x))
    .filter((x) => isNum(x.value) && x.color)
    .sort((a, b) => a.value - b.value);
  if (!s.length) return null;
  if (v <= s[0].value) return cssColor(s[0].color);
  for (let i = 0; i < s.length - 1; i++) {
    if (v < s[i + 1].value) {
      if (!interpolate) return cssColor(s[i].color);
      const a = toRgb(s[i].color), b = toRgb(s[i + 1].color);
      if (!a || !b) return cssColor(s[i].color);
      return rgbStr(mixRgb(a, b, (v - s[i].value) / (s[i + 1].value - s[i].value)));
    }
  }
  return cssColor(s[s.length - 1].color);
}

const PRESET_GRADIENTS = {
  temperature: [[-10, "#7c4dff"], [5, "#2196f3"], [17, "#00bcd4"], [21, "#4caf50"], [25, "#ff9800"], [30, "#f44336"]],
  humidity: [[0, "#ff9800"], [30, "#ffc107"], [45, "#4caf50"], [65, "#03a9f4"], [85, "#3f51b5"]],
  moisture: [[0, "#ff9800"], [30, "#ffc107"], [45, "#4caf50"], [65, "#03a9f4"], [85, "#3f51b5"]],
  battery: [[0, "#f44336"], [20, "#ff9800"], [50, "#8bc34a"], [100, "#4caf50"]],
  carbon_dioxide: [[400, "#4caf50"], [800, "#ffc107"], [1200, "#ff5722"], [2000, "#b71c1c"]],
  pm25: [[0, "#4caf50"], [12, "#cddc39"], [35, "#ff9800"], [55, "#f44336"], [150, "#9c27b0"]],
  pm10: [[0, "#4caf50"], [50, "#cddc39"], [100, "#ff9800"], [250, "#f44336"]],
  aqi: [[0, "#4caf50"], [50, "#ffeb3b"], [100, "#ff9800"], [150, "#f44336"], [200, "#9c27b0"]],
  volatile_organic_compounds: [[0, "#4caf50"], [250, "#ffc107"], [500, "#f44336"]],
};

/* ------------------------------------------------------------------ */
/*  states                                                             */
/* ------------------------------------------------------------------ */
const OFF_STATES = new Set([
  "off", "closed", "locked", "not_home", "standby", "docked", "idle", "disarmed", "unavailable",
  "unknown", "below_horizon", "paused", "none", "false",
]);
const ALWAYS_ACTIVE = new Set([
  "sensor", "input_number", "number", "input_text", "text", "input_select", "select", "weather",
  "counter", "input_datetime", "event", "date", "time", "datetime", "zone", "button",
  "input_button", "scene", "lock", "alarm_control_panel", "image", "camera",
]);
const TOGGLE_DOMAINS = new Set([
  "light", "switch", "input_boolean", "fan", "automation", "siren", "humidifier", "remote",
  "group", "script", "media_player", "climate", "cover", "valve", "water_heater",
]);
/** domains where tapping the icon toggles by default */
const ICON_TOGGLE = new Set(["light", "switch", "input_boolean", "fan", "automation", "siren", "humidifier", "remote", "group", "valve", "cover", "lock"]);
const isUnavailable = (so) => !so || so.state === "unavailable" || so.state === "unknown";

function isActive(so) {
  if (!so) return true;
  const d = domainOf(so.entity_id), st = so.state;
  if (st === "unavailable" || st === "unknown") return false;
  if (ALWAYS_ACTIVE.has(d)) return true;
  if (d === "climate" || d === "water_heater") return st !== "off";
  if (d === "update") return st === "on";
  if (d === "person" || d === "device_tracker") return st !== "not_home";
  return !OFF_STATES.has(st);
}

function toggleEntity(hass, id) {
  const d = domainOf(id);
  if (d === "lock") return hass.callService("lock", hass.states[id].state === "locked" ? "unlock" : "lock", { entity_id: id });
  if (["button", "input_button"].includes(d)) return hass.callService(d, "press", { entity_id: id });
  if (d === "scene") return hass.callService("scene", "turn_on", { entity_id: id });
  const dom = ["light", "switch", "input_boolean", "fan", "automation", "siren", "humidifier", "remote", "script", "media_player", "climate", "cover", "valve"].includes(d)
    ? d : "homeassistant";
  return hass.callService(dom, "toggle", { entity_id: id });
}

function formatState(hass, so) {
  if (!so) return "";
  const d = domainOf(so.entity_id);
  if (d === "timer" && so.state !== "idle") {
    const r = timerRemaining(so);
    if (r != null) return fmtDuration(r);
  }
  try {
    if (hass.formatEntityState) return hass.formatEntityState(so);
  } catch (e) { /* ignore */ }
  const u = so.attributes.unit_of_measurement;
  return so.state + (u ? ` ${u}` : "");
}
function formatAttr(hass, so, attr) {
  try {
    if (hass.formatEntityAttributeValue) return hass.formatEntityAttributeValue(so, attr);
  } catch (e) { /* ignore */ }
  const v = so.attributes[attr];
  return Array.isArray(v) ? v.join(", ") : typeof v === "object" ? JSON.stringify(v) : String(v);
}
function formatAttrName(hass, so, attr) {
  try {
    if (hass.formatEntityAttributeName) return hass.formatEntityAttributeName(so, attr);
  } catch (e) { /* ignore */ }
  return attr.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
}
const splitValue = (str) => {
  const m = String(str).match(/^\s*([-−+]?[\d\s.,]*\d)\s*(.*)$/);
  return m ? [m[1], m[2]] : [String(str), ""];
};
const entityName = (hass, so, id) => (so && so.attributes.friendly_name) || id || "";

function parseDur(s) {
  if (!s) return null;
  const p = String(s).split(":").map(Number);
  if (p.some(isNaN)) return null;
  while (p.length < 3) p.unshift(0);
  return p[0] * 3600 + p[1] * 60 + p[2];
}
function timerRemaining(so) {
  const a = so.attributes;
  if (so.state === "active" && a.finishes_at) return Math.max(0, (new Date(a.finishes_at).getTime() - Date.now()) / 1000);
  if (so.state === "paused" && a.remaining) return parseDur(a.remaining);
  return parseDur(a.remaining || a.duration);
}
function fmtDuration(sec) {
  sec = Math.max(0, Math.round(sec));
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}
function relTime(ts, hass) {
  const d = (new Date(ts).getTime() - Date.now()) / 1000, a = Math.abs(d);
  let rtf;
  try { rtf = new Intl.RelativeTimeFormat(langOf(hass), { numeric: "auto" }); }
  catch (e) { rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" }); }
  if (a < 10) return rtf.format(0, "second");
  if (a < 60) return rtf.format(Math.round(d), "second");
  if (a < 3600) return rtf.format(Math.round(d / 60), "minute");
  if (a < 86400) return rtf.format(Math.round(d / 3600), "hour");
  if (a < 86400 * 7) return rtf.format(Math.round(d / 86400), "day");
  return rtf.format(Math.round(d / 604800), "week");
}
function fmtTime(ts, hass) {
  try {
    return new Intl.DateTimeFormat(langOf(hass), { weekday: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(ts));
  } catch (e) { return new Date(ts).toLocaleString(); }
}

const DOMAIN_ICONS = {
  light: "mdi:lightbulb", switch: "mdi:toggle-switch-variant", fan: "mdi:fan", climate: "mdi:thermostat",
  cover: "mdi:window-shutter", lock: "mdi:lock", media_player: "mdi:speaker", sensor: "mdi:eye",
  binary_sensor: "mdi:radiobox-blank", person: "mdi:account", vacuum: "mdi:robot-vacuum",
  input_boolean: "mdi:toggle-switch", script: "mdi:script-text", scene: "mdi:palette",
  automation: "mdi:robot", timer: "mdi:timer-outline", alarm_control_panel: "mdi:shield-home",
  weather: "mdi:weather-partly-cloudy", sun: "mdi:white-balance-sunny", camera: "mdi:cctv",
  button: "mdi:gesture-tap-button", input_number: "mdi:ray-vertex", number: "mdi:ray-vertex",
  select: "mdi:format-list-bulleted", input_select: "mdi:format-list-bulleted", update: "mdi:package-up",
  siren: "mdi:bullhorn", humidifier: "mdi:air-humidifier", water_heater: "mdi:water-boiler",
  valve: "mdi:pipe-valve", device_tracker: "mdi:map-marker", lawn_mower: "mdi:robot-mower",
};
const fallbackIcon = (so) => (so && so.attributes.icon) || DOMAIN_ICONS[domainOf(so && so.entity_id)] || "mdi:bookmark";

/* ------------------------------------------------------------------ */
/*  look resolution – color, animation, effect per entity/state       */
/* ------------------------------------------------------------------ */
function domainLook(so) {
  const d = domainOf(so.entity_id), st = so.state, a = so.attributes, dc = a.device_class;
  const L = { color: "var(--state-active-color, var(--primary-color))", anim: "none", effect: "none" };
  const set = (color, anim = "none", effect = "none") => Object.assign(L, { color: cssColor(color), anim, effect });
  switch (d) {
    case "light": {
      let c = "amber";
      if (Array.isArray(a.rgb_color) && !a.rgb_color.every((v) => v > 225)) c = a.rgb_color;
      else if (a.color_temp_kelvin) c = rgbStr(mixRgb(kelvinToRgb(a.color_temp_kelvin), [255, 193, 7], 0.35));
      set(c, "glow");
      break;
    }
    case "switch": case "input_boolean": case "remote": set("blue"); break;
    case "fan": {
      set("cyan", "spin");
      const p = isNum(a.percentage) ? Number(a.percentage) : 60;
      L.spin = `${(2.4 - 1.9 * (p / 100)).toFixed(2)}s`;
      break;
    }
    case "climate": {
      const act = a.hvac_action;
      if (act === "heating" || act === "preheating") set("deep-orange", "flicker");
      else if (act === "cooling") set("blue", "spin"), (L.spin = "5s");
      else if (act === "drying") set("amber", "breathe");
      else if (act === "fan") set("cyan", "spin");
      else if (act === "idle") set(st === "cool" ? "blue" : st === "auto" ? "green" : "orange");
      else set({ heat: "deep-orange", cool: "blue", heat_cool: "amber", auto: "green", dry: "amber", fan_only: "cyan" }[st] || "orange");
      break;
    }
    case "water_heater": set("deep-orange", "flicker"); break;
    case "cover": case "valve":
      if (st === "opening") set("purple", "rise");
      else if (st === "closing") set("purple", "sink");
      else set("purple");
      break;
    case "lock":
      if (st === "locked") set("green");
      else if (st === "jammed") set("red", "shake", "pulse");
      else if (st === "locking" || st === "unlocking" || st === "opening") set("amber", "blink");
      else set("red");
      break;
    case "alarm_control_panel": {
      const m = { disarmed: "green", armed_away: "red", armed_home: "amber", armed_night: "indigo", armed_vacation: "purple", armed_custom_bypass: "deep-orange" };
      if (st === "triggered") set("red", "shake", "pulse");
      else if (st === "pending" || st === "arming" || st === "disarming") set("amber", "blink");
      else set(m[st] || "red");
      break;
    }
    case "binary_sensor": {
      if (["door", "garage_door", "window", "opening"].includes(dc)) set("orange", "wiggle");
      else if (["motion", "occupancy", "presence"].includes(dc)) set("light-blue", "ping");
      else if (dc === "moisture") set("blue", "shake", "pulse");
      else if (["smoke", "gas", "carbon_monoxide", "safety", "problem", "tamper", "heat"].includes(dc)) set("red", "shake", "pulse");
      else if (dc === "battery") set("red", "blink");
      else if (dc === "connectivity" || dc === "plug" || dc === "power") set("green");
      else if (dc === "running") set("green", "pulse");
      else if (dc === "sound" || dc === "vibration") set("purple", "wiggle");
      else if (dc === "lock") set("red");
      else if (dc === "cold") set("light-blue");
      else if (dc === "light") set("amber", "glow");
      else if (dc === "update") set("orange", "bounce");
      else set("amber");
      break;
    }
    case "person": case "device_tracker": set(st === "home" ? "green" : "blue"); break;
    case "media_player":
      if (st === "playing") set("deep-purple", "heartbeat");
      else if (st === "paused") set("amber");
      else set("indigo");
      break;
    case "vacuum": case "lawn_mower":
      if (st === "cleaning" || st === "mowing") set("green", "orbit");
      else if (st === "returning") set("amber", "float");
      else if (st === "error") set("red", "shake", "pulse");
      else set("teal");
      break;
    case "sensor": {
      const m = { power: "amber", energy: "amber", illuminance: "yellow", current: "orange", voltage: "orange", pressure: "indigo", wind_speed: "teal", precipitation: "light-blue", gas: "deep-orange", water: "light-blue", monetary: "green", signal_strength: "teal", speed: "teal", distance: "blue-grey", duration: "blue-grey" };
      set(m[dc] || "var(--state-sensor-color, var(--primary-color))");
      if (dc === "battery" && isNum(st) && Number(st) <= 15) L.anim = "blink";
      if (dc === "power" && isNum(st) && Number(st) > 0) L.anim = "pulse";
      break;
    }
    case "timer": set("amber", st === "active" ? "none" : "none"); break;
    case "sun": set(st === "above_horizon" ? "amber" : "indigo", st === "above_horizon" ? "spin" : "none"), (L.spin = "18s"); break;
    case "weather": set("light-blue", "float"); break;
    case "update": set("orange", "bounce"); break;
    case "automation": set("light-green"); break;
    case "script": set("cyan", st === "on" ? "pulse" : "none"); break;
    case "siren": set("red", "shake", "pulse"); break;
    case "humidifier": set("light-blue", "float"); break;
    case "input_number": case "number": set("blue"); break;
    case "select": case "input_select": set("teal"); break;
    case "counter": set("indigo"); break;
    case "camera": set("blue-grey", st === "recording" ? "blink" : "none"); break;
    case "scene": case "button": case "input_button": set("amber"); break;
    case "zone": set("green"); break;
    default: break;
  }
  return L;
}

function valueColorFn(cfg, so) {
  const interp = cfg.threshold_interpolate !== false;
  if (Array.isArray(cfg.thresholds) && cfg.thresholds.some((t) => t && t.color)) {
    const stops = cfg.thresholds.filter((t) => t && t.color);
    return (v) => gradientColor(stops, v, interp);
  }
  if (cfg.color && cfg.color !== "auto" && cfg.color !== "state") return null;
  if (!so) return null;
  let dc = so.attributes.device_class;
  if (!dc && /°[CF]$/.test(so.attributes.unit_of_measurement || "")) dc = "temperature";
  const preset = PRESET_GRADIENTS[dc];
  if (!preset) return null;
  if (dc === "temperature" && /F$/.test(so.attributes.unit_of_measurement || "")) {
    return (v) => gradientColor(preset, (v - 32) / 1.8);
  }
  return (v) => gradientColor(preset, v);
}

function matchThreshold(list, v) {
  const s = list.filter((t) => t && isNum(t.value)).sort((a, b) => a.value - b.value);
  let hit = null;
  for (const t of s) if (v >= t.value) hit = t;
  return hit;
}

/**
 * Resolve the full visual look of an entity.
 * @returns {{color, c, active, anim, effect, icon, spin, unavailable, forced}}
 */
function resolveLook(hass, so, cfg = {}) {
  const look = {
    color: cssColor(cfg.color && cfg.color !== "auto" && cfg.color !== "state" ? cfg.color : null) || "var(--primary-color)",
    active: true, anim: "none", effect: "none", icon: cfg.icon || null, spin: null,
    unavailable: false, forced: false,
  };
  if (so) {
    const dl = domainLook(so);
    look.active = isActive(so);
    look.unavailable = isUnavailable(so);
    if (!cfg.color || cfg.color === "auto" || cfg.color === "state") look.color = dl.color;
    look.anim = dl.anim;
    look.effect = dl.effect;
    look.spin = dl.spin || null;
    const num = isNum(so.state) ? Number(so.state) : null;
    const fn = num !== null ? valueColorFn(cfg, so) : null;
    if (fn) look.color = fn(num) || look.color;
    if (num !== null && Array.isArray(cfg.thresholds)) {
      const t = matchThreshold(cfg.thresholds, num);
      if (t) {
        if (t.icon) look.icon = t.icon;
        if (t.icon_animation) look.anim = t.icon_animation, (look.forcedAnim = true);
        if (t.card_effect) look.effect = t.card_effect, (look.forcedFx = true);
      }
    }
  }
  if (cfg.icon_animation && cfg.icon_animation !== "auto" && !look.forcedAnim) look.anim = cfg.icon_animation;
  if (cfg.card_effect && cfg.card_effect !== "auto" && !look.forcedFx) look.effect = cfg.card_effect;
  if (cfg.spin_speed) look.spin = cfg.spin_speed;
  const ss = so && cfg.state_styles && cfg.state_styles[so.state];
  if (ss && typeof ss === "object") {
    if (ss.color) look.color = cssColor(ss.color), (look.forced = true);
    if (ss.icon) look.icon = ss.icon;
    if (ss.icon_animation) look.anim = ss.icon_animation, (look.forcedAnim = true);
    if (ss.card_effect) look.effect = ss.card_effect, (look.forcedFx = true);
  }
  if (!look.active && !look.forcedAnim) look.anim = "none";
  if (!look.active && !look.forcedFx) look.effect = "none";
  if (look.unavailable) { look.anim = "none"; look.effect = "none"; }
  const off = cfg.color_off ? cssColor(cfg.color_off) : "var(--tt-off)";
  look.c = look.active || look.forced ? look.color : off;
  return look;
}

/* ------------------------------------------------------------------ */
/*  controllable value per domain (sliders)                            */
/* ------------------------------------------------------------------ */
function getControl(hass, so, which) {
  if (!so || isUnavailable(so)) return null;
  const id = so.entity_id, d = domainOf(id), a = so.attributes, on = so.state === "on";
  const svc = (dom, s, data) => hass.callService(dom, s, { entity_id: id, ...(data || {}) });
  const pct = { min: 0, max: 100, step: 1, unit: "%" };
  switch (d) {
    case "light": {
      const modes = a.supported_color_modes || [];
      if (!(a.brightness != null || modes.some((m) => m !== "onoff"))) return null;
      return { ...pct, label: "brightness", icon: "mdi:brightness-6", value: on ? Math.max(1, Math.round((a.brightness == null ? 255 : a.brightness) / 2.55)) : 0,
        set: (v) => (v <= 0 ? svc("light", "turn_off") : svc("light", "turn_on", { brightness_pct: v })) };
    }
    case "cover":
      if (which === "tilt") {
        if (a.current_tilt_position == null) return null;
        return { ...pct, label: "tilt", icon: "mdi:angle-acute", value: a.current_tilt_position, set: (v) => svc("cover", "set_cover_tilt_position", { tilt_position: v }) };
      }
      if (a.current_position == null) return null;
      return { ...pct, label: "position", icon: "mdi:arrow-up-down", value: a.current_position, set: (v) => svc("cover", "set_cover_position", { position: v }) };
    case "valve":
      if (a.current_position == null) return null;
      return { ...pct, label: "position", icon: "mdi:arrow-up-down", value: a.current_position, set: (v) => svc("valve", "set_valve_position", { position: v }) };
    case "fan":
      if (a.percentage === undefined) return null;
      return { ...pct, step: a.percentage_step || 1, label: "speed", icon: "mdi:speedometer", value: on ? Number(a.percentage) || 0 : 0,
        set: (v) => (v <= 0 ? svc("fan", "turn_off") : svc("fan", "set_percentage", { percentage: Math.round(v) })) };
    case "media_player":
      if (a.volume_level == null) return null;
      return { ...pct, label: "volume", icon: "mdi:volume-high", value: Math.round(a.volume_level * 100), set: (v) => svc("media_player", "volume_set", { volume_level: v / 100 }) };
    case "input_number": case "number":
      return { min: Number(a.min), max: Number(a.max), step: Number(a.step) || 1, unit: a.unit_of_measurement || "", label: "target", icon: "mdi:ray-vertex", value: Number(so.state),
        set: (v) => svc(d, "set_value", { value: v }) };
    case "climate": case "water_heater":
      if (!isNum(a.temperature)) return null;
      return { min: Number(a.min_temp ?? 7), max: Number(a.max_temp ?? 35), step: Number(a.target_temp_step) || (hass.config && hass.config.unit_system && hass.config.unit_system.temperature === "°F" ? 1 : 0.5),
        unit: (hass.config && hass.config.unit_system && hass.config.unit_system.temperature) || "°C", label: "target", icon: "mdi:thermometer", value: Number(a.temperature),
        set: (v) => svc(d, "set_temperature", { temperature: v }) };
    case "humidifier":
      if (!isNum(a.humidity)) return null;
      return { min: Number(a.min_humidity ?? 0), max: Number(a.max_humidity ?? 100), step: 1, unit: "%", label: "humidity", icon: "mdi:water-percent", value: Number(a.humidity),
        set: (v) => svc("humidifier", "set_humidity", { humidity: v }) };
    default:
      return null;
  }
}

function computeProgress(so, cfg, ctrl) {
  if (cfg.progress === false || cfg.progress === "none") return null;
  if (!so) return null;
  const a = so.attributes;
  if (cfg.progress_attribute && isNum(a[cfg.progress_attribute])) {
    const v = Number(a[cfg.progress_attribute]);
    const min = isNum(cfg.min) ? Number(cfg.min) : 0, max = isNum(cfg.max) ? Number(cfg.max) : 100;
    return clamp((v - min) / (max - min || 1), 0, 1);
  }
  if (ctrl) return clamp((ctrl.value - ctrl.min) / (ctrl.max - ctrl.min || 1), 0, 1);
  const d = domainOf(so.entity_id);
  if (d === "timer") {
    const dur = parseDur(a.duration), rem = timerRemaining(so);
    if (so.state === "idle" || !dur || rem == null) return null;
    return clamp(rem / dur, 0, 1);
  }
  if (!isNum(so.state)) return null;
  const v = Number(so.state);
  if (isNum(cfg.min) || isNum(cfg.max)) {
    const min = isNum(cfg.min) ? Number(cfg.min) : 0, max = isNum(cfg.max) ? Number(cfg.max) : 100;
    return clamp((v - min) / (max - min || 1), 0, 1);
  }
  if (a.unit_of_measurement === "%" || ["battery", "humidity", "moisture"].includes(a.device_class)) return clamp(v / 100, 0, 1);
  return null;
}

/* ------------------------------------------------------------------ */
/*  templates                                                          */
/* ------------------------------------------------------------------ */
const isJinja = (s) => typeof s === "string" && /\{%|\{#|\{\{[^}]*[(|][^}]*\}\}/.test(s);
function localTemplate(str, hass, so, extra = {}) {
  if (typeof str !== "string") return str == null ? "" : String(str);
  return str.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, k) => {
    if (k === "user") return (hass.user && hass.user.name) || "";
    if (k in extra) return extra[k];
    if (!so) return "";
    switch (k) {
      case "state": return so.state;
      case "value": case "formatted": return formatState(hass, so);
      case "name": return entityName(hass, so);
      case "unit": return so.attributes.unit_of_measurement || "";
      case "entity_id": return so.entity_id;
      case "last_changed": case "relative": return relTime(so.last_changed, hass);
      case "last_updated": return relTime(so.last_updated, hass);
      default: break;
    }
    if (/^(attr|attributes)\./.test(k)) {
      const v = so.attributes[k.split(".").slice(1).join(".")];
      return v == null ? "" : Array.isArray(v) ? v.join(", ") : String(v);
    }
    return "";
  });
}

/* ------------------------------------------------------------------ */
/*  history + graphs                                                   */
/* ------------------------------------------------------------------ */
async function fetchHistory(hass, id, hours) {
  const end = new Date(), start = new Date(end.getTime() - hours * 3600e3);
  const res = await hass.callWS({
    type: "history/history_during_period",
    start_time: start.toISOString(), end_time: end.toISOString(),
    entity_ids: [id], minimal_response: true, no_attributes: true, significant_changes_only: false,
  });
  const arr = (res && res[id]) || [];
  return {
    id, hours, loaded: Date.now(), start: start.getTime(),
    points: arr.map((p) => ({ t: (p.lu || p.lc || 0) * 1000 || start.getTime(), s: p.s })),
  };
}

function numericSeries(points, start, end, n) {
  const vals = points.filter((p) => isNum(p.s)).map((p) => ({ t: p.t, v: Number(p.s) }));
  if (!vals.length) return [];
  const step = (end - start) / n, out = [];
  let j = 0, last = vals[0].v;
  for (let i = 0; i < n; i++) {
    const b1 = start + (i + 1) * step;
    let sum = 0, cnt = 0;
    const carry = last;
    while (j < vals.length && vals[j].t < b1) {
      if (vals[j].t >= start + i * step) { sum += vals[j].v; cnt++; }
      last = vals[j].v;
      j++;
    }
    out.push({ t: start + i * step + step / 2, v: cnt ? (sum + carry) / (cnt + 1) : last });
  }
  return out;
}

function smoothPath(pts, h) {
  if (pts.length < 2) return "";
  let d = `M${pts[0][0].toFixed(2)},${pts[0][1].toFixed(2)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2, k = 0.18;
    const c1 = [p1[0] + (p2[0] - p0[0]) * k, clamp(p1[1] + (p2[1] - p0[1]) * k, 0, h)];
    const c2 = [p2[0] - (p3[0] - p1[0]) * k, clamp(p2[1] - (p3[1] - p1[1]) * k, 0, h)];
    d += ` C${c1[0].toFixed(2)},${c1[1].toFixed(2)} ${c2[0].toFixed(2)},${c2[1].toFixed(2)} ${p2[0].toFixed(2)},${p2[1].toFixed(2)}`;
  }
  return d;
}

/**
 * Build an SVG graph.
 * opts: {hist, type: line|bar|timeline, w, h, uid, colorFn, stateColor, buckets, end}
 * returns {svg, stats}
 */
function buildGraph(opts) {
  const { hist, w = 300, h = 60, uid = "g", colorFn, type = "line" } = opts;
  if (!hist || !hist.points.length) return { svg: "", stats: null };
  const end = opts.end || Date.now(), start = end - hist.hours * 3600e3;
  if (type === "timeline") {
    const pts = hist.points;
    let rects = "";
    for (let i = 0; i < pts.length; i++) {
      const t0 = Math.max(pts[i].t, start), t1 = i + 1 < pts.length ? pts[i + 1].t : end;
      if (t1 <= start) continue;
      const x = ((t0 - start) / (end - start)) * w, x1 = ((t1 - start) / (end - start)) * w;
      const col = opts.stateColor ? opts.stateColor(pts[i].s) : "var(--tt-color)";
      rects += `<rect x="${x.toFixed(2)}" y="0" width="${Math.max(0.5, x1 - x).toFixed(2)}" height="${h}" style="fill:${col}"/>`;
    }
    return { svg: `<svg class="tl" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">${rects}</svg>`, stats: null };
  }
  const series = numericSeries(hist.points, start, end, opts.buckets || 48);
  if (series.length < 2) return { svg: "", stats: null };
  const vals = series.map((p) => p.v);
  const raw = hist.points.filter((p) => isNum(p.s)).map((p) => Number(p.s));
  const stats = raw.length ? { min: Math.min(...raw), max: Math.max(...raw), avg: raw.reduce((a, b) => a + b, 0) / raw.length } : null;
  let lo = Math.min(...vals), hi = Math.max(...vals);
  if (hi - lo < 1e-9) { hi += 1; lo -= 1; }
  const pad = (hi - lo) * 0.15;
  lo -= pad; hi += pad;
  if (type === "bar") lo = Math.min(lo, 0) === lo && Math.min(...vals) >= 0 ? 0 : lo;
  const X = (i) => (i / (series.length - 1)) * w, Y = (v) => h - ((v - lo) / (hi - lo)) * (h - 2);
  let defs = "", strokeRef = "var(--tt-color)", fillRef;
  const gid = `tt-${uid}`;
  if (colorFn) {
    let stops = "";
    for (let k = 0; k <= 8; k++) stops += `<stop offset="${k / 8}" style="stop-color:${colorFn(lo + ((hi - lo) * k) / 8)}"/>`;
    defs += `<linearGradient id="${gid}-v" gradientUnits="userSpaceOnUse" x1="0" y1="${h}" x2="0" y2="0">${stops}</linearGradient>`;
    strokeRef = `url(#${gid}-v)`;
  }
  defs += `<linearGradient id="${gid}-f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--tt-color);stop-opacity:.45"/><stop offset="1" style="stop-color:var(--tt-color);stop-opacity:0"/></linearGradient>`;
  fillRef = colorFn ? `url(#${gid}-v)` : `url(#${gid}-f)`;
  let body;
  if (type === "bar") {
    const bw = w / series.length;
    body = series.map((p, i) => {
      const y = Y(p.v);
      const col = colorFn ? colorFn(p.v) : "var(--tt-color)";
      return `<rect x="${(i * bw + bw * 0.15).toFixed(2)}" y="${y.toFixed(2)}" width="${(bw * 0.7).toFixed(2)}" height="${Math.max(0.5, h - y).toFixed(2)}" rx="${Math.min(2, bw * 0.3).toFixed(2)}" style="fill:${col}"/>`;
    }).join("");
  } else {
    const pts = series.map((p, i) => [X(i), Y(p.v)]);
    const line = smoothPath(pts, h);
    body = `<path d="${line} L${w},${h} L0,${h} Z" style="fill:${fillRef};${colorFn ? "fill-opacity:.22" : ""}"/>` +
      `<path class="ln" d="${line}" style="stroke:${strokeRef}" vector-effect="non-scaling-stroke"/>`;
  }
  return { svg: `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><defs>${defs}</defs>${body}</svg>`, stats, lo, hi };
}

/* ------------------------------------------------------------------ */
/*  tiny DOM patcher – keeps running animations & focus intact         */
/* ------------------------------------------------------------------ */
function patchChildren(oldP, newP) {
  const oldC = Array.from(oldP.childNodes), newC = Array.from(newP.childNodes);
  for (let i = 0; i < newC.length; i++) {
    const n = newC[i], o = oldC[i];
    if (!o) oldP.appendChild(n);
    else patchNode(o, n);
  }
  for (let i = newC.length; i < oldC.length; i++) oldC[i].remove();
}
function patchNode(o, n) {
  if (o.nodeType !== n.nodeType || o.nodeName !== n.nodeName ||
    (o.nodeType === 1 && o.getAttribute("data-k") !== n.getAttribute("data-k"))) {
    o.replaceWith(n);
    return;
  }
  if (o.nodeType !== 1) {
    if (o.nodeValue !== n.nodeValue) o.nodeValue = n.nodeValue;
    return;
  }
  for (const a of Array.from(o.attributes)) if (!n.hasAttribute(a.name)) o.removeAttribute(a.name);
  for (const a of Array.from(n.attributes)) if (o.getAttribute(a.name) !== a.value) o.setAttribute(a.name, a.value);
  if (o.hasAttribute("data-keep")) return;
  patchChildren(o, n);
}
function patchHTML(el, html) {
  const tpl = document.createElement("template");
  tpl.innerHTML = html;
  patchChildren(el, tpl.content);
}

const reduceMotion = () => window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
