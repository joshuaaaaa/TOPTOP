(() => {
"use strict";
// ---- 01-core.js ----
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

// ---- 02-styles.js ----
/* ------------------------------------------------------------------ */
/*  styles                                                             */
/* ------------------------------------------------------------------ */
const BASE_CSS = `
:host {
  --tt-off: var(--state-inactive-color, var(--disabled-text-color, #9e9e9e));
  --tt-text: var(--primary-text-color, #1c1c1e);
  --tt-text2: var(--secondary-text-color, #6e6e73);
  --tt-surface: color-mix(in srgb, var(--tt-text) 6%, transparent);
  --tt-radius: var(--ha-card-border-radius, 18px);
  -webkit-tap-highlight-color: transparent;
}
* { box-sizing: border-box; }
ha-icon, ha-state-icon { display: flex; }

/* ---------- icon shape ---------- */
.shape {
  position: relative; flex: none;
  width: var(--tt-icon, 42px); height: var(--tt-icon, 42px);
  display: flex; align-items: center; justify-content: center;
  border-radius: 50%; color: var(--tt-c);
  background: color-mix(in srgb, var(--tt-c) 18%, transparent);
  --mdc-icon-size: calc(var(--tt-icon, 42px) * 0.56);
  transition: background .35s, color .35s, transform .2s, box-shadow .35s, border-radius .35s;
}
.shape.sh-squircle { border-radius: 32%; }
.shape.sh-square { border-radius: 22%; }
.shape.sh-hexagon { border-radius: 0; clip-path: polygon(25% 4%, 75% 4%, 100% 50%, 75% 96%, 25% 96%, 0 50%); }
.shape.sh-none { background: none !important; box-shadow: none !important; }
.shape.sh-blob { border-radius: 42% 58% 63% 37% / 41% 44% 56% 59%; }
.on .shape.sh-blob, .shape.sh-blob.on { animation: tt-blob 7s ease-in-out infinite; }
.shape .icon { display: flex; transform-origin: 50% 50%; }
.shape img.pic { width: 100%; height: 100%; object-fit: cover; border-radius: inherit; }
.shape .ring { position: absolute; inset: -5px; width: calc(100% + 10px); height: calc(100% + 10px); transform: rotate(-90deg); pointer-events: none; overflow: visible; }
.shape .ring circle { fill: none; stroke-width: 2.6; stroke-linecap: round; transition: stroke-dasharray .6s ease; }
.shape .ring .rb { stroke: color-mix(in srgb, var(--tt-c) 18%, transparent); }
.shape .ring .rf { stroke: var(--tt-c); }
.shape.sh-hexagon .ring, .shape.sh-none .ring { display: none; }
.badge {
  position: absolute; top: -4px; right: -6px; min-width: 18px; height: 18px; padding: 0 4px;
  border-radius: 9px; background: var(--tt-b, var(--error-color, #f44336)); color: #fff;
  font-size: 10px; font-weight: 700; line-height: 18px; text-align: center;
  display: flex; align-items: center; justify-content: center; --mdc-icon-size: 12px;
  box-shadow: 0 0 0 2px var(--ha-card-background, var(--card-background-color, #fff));
  z-index: 2; white-space: nowrap;
}

/* ---------- icon animations ---------- */
.a-spin .icon { animation: tt-spin var(--tt-spin, 1.6s) linear infinite; }
.a-pulse .icon { animation: tt-pulse 1.6s ease-in-out infinite; }
.a-breathe .icon { animation: tt-breathe 3.2s ease-in-out infinite; }
.a-bounce .icon { animation: tt-bounce 1.1s cubic-bezier(.3,0,.3,1) infinite; }
.a-shake .icon { animation: tt-shake .7s ease-in-out infinite; }
.a-wiggle .icon { animation: tt-wiggle 1.4s ease-in-out infinite; }
.a-swing .icon { transform-origin: 50% 0; animation: tt-swing 1.6s ease-in-out infinite; }
.a-glow .icon { animation: tt-glow 2.6s ease-in-out infinite; }
.a-flicker .icon { transform-origin: 50% 100%; animation: tt-flicker 1.8s ease-in-out infinite; }
.a-heartbeat .icon { animation: tt-heart 1.3s ease-in-out infinite; }
.a-float .icon { animation: tt-float 2.6s ease-in-out infinite; }
.a-rise .icon { animation: tt-rise 1.3s ease-in-out infinite; }
.a-sink .icon { animation: tt-sink 1.3s ease-in-out infinite; }
.a-blink .icon { animation: tt-blink 1s steps(2, jump-none) infinite; }
.a-tada .icon { animation: tt-tada 2s ease-in-out infinite; }
.a-flip .icon { animation: tt-flip 2.4s ease-in-out infinite; }
.a-rainbow .icon { animation: tt-rainbow 4s linear infinite; }
.a-jello .icon { animation: tt-jello 2s ease-in-out infinite; }
.a-ping::before, .a-ping::after {
  content: ""; position: absolute; inset: 0; border-radius: inherit;
  border: 2px solid var(--tt-c); animation: tt-ping 2s cubic-bezier(0,0,.2,1) infinite; pointer-events: none;
}
.a-ping::after { animation-delay: 1s; }
.a-orbit::after {
  content: ""; position: absolute; width: 7px; height: 7px; top: 50%; left: 50%; margin: -3.5px;
  border-radius: 50%; background: var(--tt-c); box-shadow: 0 0 8px var(--tt-c);
  animation: tt-orbit 1.8s linear infinite; pointer-events: none;
}
.a-glow { box-shadow: 0 0 18px -2px color-mix(in srgb, var(--tt-c) 70%, transparent); }

@keyframes tt-spin { to { transform: rotate(360deg); } }
@keyframes tt-pulse { 0%,100% { transform: scale(1); opacity: 1; } 50% { transform: scale(.82); opacity: .55; } }
@keyframes tt-breathe { 0%,100% { transform: scale(.92); } 50% { transform: scale(1.08); } }
@keyframes tt-bounce { 0%,100% { transform: translateY(0); } 30% { transform: translateY(-22%); } 50% { transform: translateY(0); } 65% { transform: translateY(-8%); } 80% { transform: translateY(0); } }
@keyframes tt-shake { 0%,100% { transform: rotate(0); } 15% { transform: rotate(-14deg); } 30% { transform: rotate(12deg); } 45% { transform: rotate(-10deg); } 60% { transform: rotate(8deg); } 75% { transform: rotate(-4deg); } }
@keyframes tt-wiggle { 0%,60%,100% { transform: rotate(0); } 10% { transform: rotate(-9deg); } 20% { transform: rotate(9deg); } 30% { transform: rotate(-6deg); } 40% { transform: rotate(4deg); } }
@keyframes tt-swing { 0%,100% { transform: rotate(14deg); } 50% { transform: rotate(-14deg); } }
@keyframes tt-glow { 0%,100% { filter: drop-shadow(0 0 2px var(--tt-c)); } 50% { filter: drop-shadow(0 0 9px var(--tt-c)) brightness(1.15); } }
@keyframes tt-flicker { 0%,100% { transform: scale(1,1) skewX(0); } 20% { transform: scale(1.04,.94) skewX(2deg); } 40% { transform: scale(.96,1.08) skewX(-3deg); } 60% { transform: scale(1.03,.97) skewX(1deg); } 80% { transform: scale(.98,1.05) skewX(-1deg); } }
@keyframes tt-heart { 0%,40%,100% { transform: scale(1); } 10% { transform: scale(1.2); } 20% { transform: scale(.95); } 30% { transform: scale(1.12); } }
@keyframes tt-float { 0%,100% { transform: translateY(6%); } 50% { transform: translateY(-10%); } }
@keyframes tt-rise { 0% { transform: translateY(25%); opacity: 0; } 30%,70% { opacity: 1; } 100% { transform: translateY(-25%); opacity: 0; } }
@keyframes tt-sink { 0% { transform: translateY(-25%); opacity: 0; } 30%,70% { opacity: 1; } 100% { transform: translateY(25%); opacity: 0; } }
@keyframes tt-blink { 0% { opacity: 1; } 100% { opacity: .2; } }
@keyframes tt-tada { 0%,60%,100% { transform: scale(1) rotate(0); } 10%,20% { transform: scale(.9) rotate(-6deg); } 30%,50% { transform: scale(1.12) rotate(6deg); } 40% { transform: scale(1.12) rotate(-6deg); } }
@keyframes tt-flip { 0%,40% { transform: perspective(200px) rotateY(0); } 60%,100% { transform: perspective(200px) rotateY(360deg); } }
@keyframes tt-rainbow { to { filter: hue-rotate(360deg); } }
@keyframes tt-jello { 0%,50%,100% { transform: scale(1,1); } 10% { transform: scale(1.18,.82); } 20% { transform: scale(.86,1.14); } 30% { transform: scale(1.08,.92); } 40% { transform: scale(.97,1.03); } }
@keyframes tt-ping { 0% { transform: scale(1); opacity: .8; } 100% { transform: scale(1.9); opacity: 0; } }
@keyframes tt-orbit { from { transform: rotate(0) translateX(calc(var(--tt-icon, 42px) / 2 + 3px)); } to { transform: rotate(360deg) translateX(calc(var(--tt-icon, 42px) / 2 + 3px)); } }
@keyframes tt-blob { 0%,100% { border-radius: 42% 58% 63% 37% / 41% 44% 56% 59%; } 33% { border-radius: 63% 37% 44% 56% / 55% 62% 38% 45%; } 66% { border-radius: 37% 63% 51% 49% / 37% 35% 65% 63%; } }

/* ---------- buttons / switch / chips ---------- */
.btn {
  flex: none; width: 38px; height: 38px; border-radius: 13px; cursor: pointer;
  display: flex; align-items: center; justify-content: center; --mdc-icon-size: 20px;
  background: var(--tt-surface); color: var(--tt-text);
  transition: transform .15s, background .25s, color .25s;
}
.btn:hover { background: color-mix(in srgb, var(--tt-text) 11%, transparent); }
.btn:active { transform: scale(.9); }
.btn.on { background: color-mix(in srgb, var(--tt-color) 22%, transparent); color: var(--tt-color); }
.btn.txt { width: auto; padding: 0 10px; font-size: 13px; font-weight: 600; font-variant-numeric: tabular-nums; cursor: default; background: none; }
.switch {
  flex: none; position: relative; width: 50px; height: 30px; border-radius: 15px; cursor: pointer;
  background: color-mix(in srgb, var(--tt-text) 16%, transparent); transition: background .3s;
}
.switch::after {
  content: ""; position: absolute; top: 3px; left: 3px; width: 24px; height: 24px; border-radius: 50%;
  background: #fff; box-shadow: 0 2px 6px rgba(0,0,0,.25);
  transition: transform .35s cubic-bezier(.4,1.6,.55,1);
}
.switch.on { background: var(--tt-color); }
.switch.on::after { transform: translateX(20px); }
.chip {
  display: inline-flex; align-items: center; gap: 5px; height: 30px; padding: 0 11px 0 8px;
  border-radius: 15px; background: var(--tt-surface); color: var(--tt-text);
  font-size: 12px; font-weight: 600; white-space: nowrap; cursor: pointer; --mdc-icon-size: 16px;
  transition: background .3s, transform .15s; flex: none;
}
.chip .ci { color: var(--tt-c); display: flex; }
.chip.on { background: color-mix(in srgb, var(--tt-c) 16%, transparent); }
.chip:active { transform: scale(.94); }
.chip.noicon { padding-left: 11px; }

/* ---------- sliders ---------- */
.tt-slider {
  position: relative; height: var(--tt-sh, 40px); border-radius: 14px; overflow: hidden;
  background: color-mix(in srgb, var(--tt-color) 16%, transparent);
  touch-action: none; cursor: ew-resize; flex: none;
}
.tt-slider-bar {
  position: absolute; left: 0; top: 0; bottom: 0; width: calc(var(--v, 0) * 100%);
  background: var(--tt-color); transition: width .35s cubic-bezier(.2,.8,.2,1), height .35s cubic-bezier(.2,.8,.2,1);
}
.tt-slider-bar::after {
  content: ""; position: absolute; right: 7px; top: 28%; bottom: 28%; width: 3px; border-radius: 2px;
  background: rgba(255,255,255,.85);
}
.tt-slider.drag .tt-slider-bar { transition: none; }
.tt-slider-lab {
  position: absolute; inset: 0; display: flex; align-items: center; gap: 6px; padding: 0 14px;
  font-size: 12px; font-weight: 600; color: var(--tt-text); pointer-events: none; --mdc-icon-size: 16px;
}
.tt-slider-lab .tt-slider-val { font-variant-numeric: tabular-nums; opacity: .75; }
.tt-slider-lab span + .tt-slider-val::before { content: "· "; }
.tt-slider.grad { background: var(--grad); }
.tt-slider.grad .tt-slider-bar { background: transparent; }
.tt-slider.grad .tt-slider-bar::after { right: -2px; top: 4px; bottom: 4px; width: 6px; border-radius: 3px; background: #fff; box-shadow: 0 0 0 1px rgba(0,0,0,.2), 0 2px 6px rgba(0,0,0,.3); }
.tt-slider.v { width: var(--tt-sw, 96px); height: var(--tt-sh, 290px); border-radius: 30px; cursor: ns-resize; }
.tt-slider.v .tt-slider-bar { top: auto; right: 0; width: auto; height: calc(var(--v, 0) * 100%); }
.tt-slider.v .tt-slider-bar::after { left: 32%; right: 32%; top: 10px; bottom: auto; width: auto; height: 4px; }
.tt-slider.v .tt-slider-lab { flex-direction: column; justify-content: flex-end; padding: 16px 6px; font-size: 20px; --mdc-icon-size: 26px; }
.tt-slider.v .tt-slider-lab .tt-slider-val { margin: 0; }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none !important; transition: none !important; }
}
`;

const CARD_CSS = `
:host { display: block; height: 100%; }
#root { height: 100%; }
ha-card {
  position: relative; overflow: hidden; height: 100%; min-height: 100%;
  display: flex; flex-direction: column; justify-content: center; gap: var(--tt-gap, 10px);
  padding: var(--tt-pad, 12px); isolation: isolate; cursor: pointer; outline: none;
  user-select: none; -webkit-user-select: none; color: var(--tt-text);
  transform: perspective(800px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg)) scale(var(--ts, 1));
  transition: background .4s, box-shadow .4s, border-color .4s, color .4s, transform .25s ease;
}
ha-card:focus-visible { box-shadow: 0 0 0 2px var(--tt-color); }
ha-card.slider-card { touch-action: pan-y; }
ha-card.dragging { cursor: ew-resize; }
.layer { position: absolute; inset: 0; pointer-events: none; border-radius: inherit; z-index: 0; overflow: hidden; }
.content, .chips, .bar-row, .gbot, .drag-val { position: relative; z-index: 1; }

/* sizes */
.s-s { --tt-icon: 34px; --tt-pad: 9px; --tt-fs1: 13px; --tt-fs2: 11px; --tt-big: 26px; }
.s-m { --tt-icon: 42px; --tt-pad: 12px; --tt-fs1: 14px; --tt-fs2: 12px; --tt-big: 34px; }
.s-l { --tt-icon: 54px; --tt-pad: 16px; --tt-fs1: 16px; --tt-fs2: 13px; --tt-big: 44px; }
.s-xl { --tt-icon: 68px; --tt-pad: 20px; --tt-fs1: 18px; --tt-fs2: 14px; --tt-big: 56px; }

/* content */
.content { display: flex; align-items: center; gap: 12px; min-width: 0; }
.info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }
.primary { font-size: var(--tt-fs1); font-weight: 650; line-height: 1.3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; letter-spacing: .1px; }
.secondary { font-size: var(--tt-fs2); color: var(--tt-text2); line-height: 1.35; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-variant-numeric: tabular-nums; }
.tertiary { font-size: calc(var(--tt-fs2) - 1px); color: var(--tt-text2); opacity: .8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ctrls { display: flex; gap: 6px; align-items: center; flex: none; }
.chips { display: flex; gap: 6px; overflow-x: auto; scrollbar-width: none; margin: 0 -2px; padding: 2px; }
.chips::-webkit-scrollbar { display: none; }

/* layouts */
.l-vertical .content { flex-direction: column; text-align: center; gap: 8px; }
.l-vertical .info { align-items: center; width: 100%; }
.l-vertical .ctrls { justify-content: center; }
.l-vertical .chips { justify-content: center; }
.l-compact { --tt-icon: 32px; --tt-pad: 7px; --tt-gap: 6px; }
.l-compact .content { gap: 9px; }
.l-compact .info { flex-direction: row; align-items: baseline; gap: 8px; }
.l-compact .secondary { margin-left: auto; flex: none; }
.l-compact .btn { width: 32px; height: 32px; border-radius: 10px; }
.l-compact .switch { transform: scale(.85); }
.l-hero .content { flex-direction: column; align-items: stretch; gap: 6px; }
.l-hero .row { display: flex; align-items: center; gap: 10px; min-width: 0; }
.l-hero .big { font-size: var(--tt-big); font-weight: 700; line-height: 1.05; letter-spacing: -1px; font-variant-numeric: tabular-nums; margin-top: 4px; }
.l-hero .big .unit { font-size: .45em; font-weight: 600; color: var(--tt-text2); letter-spacing: 0; margin-left: 3px; }
.l-hero { justify-content: flex-start; min-height: 130px; }
.l-square { aspect-ratio: 1 / 1; justify-content: space-between; }
.l-square .content { flex-direction: column; align-items: stretch; height: 100%; gap: 6px; }
.l-square .sq-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 6px; }
.l-square .info { flex: none; margin-top: auto; }
.l-square .primary { white-space: normal; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }

/* fill */
.fill { position: absolute; left: 0; top: 0; bottom: 0; width: calc(var(--p, 0) * 100%); background: color-mix(in srgb, var(--tt-color) 24%, transparent); transition: width .55s cubic-bezier(.2,.8,.2,1); }
.fill.f-liquid { width: auto; right: 0; top: auto; height: calc(var(--p, 0) * 100%); transition: height .7s cubic-bezier(.2,.8,.2,1); }
.fill .wave { position: absolute; left: 0; bottom: 100%; width: 200%; height: 10px; animation: tt-wave 3.5s linear infinite; fill: color-mix(in srgb, var(--tt-color) 24%, transparent); }
.fill .wave.w2 { animation-duration: 6s; animation-direction: reverse; opacity: .6; }
.dragging .fill { transition: none; }
.off .fill { background: color-mix(in srgb, var(--tt-off) 10%, transparent); }
@keyframes tt-wave { to { transform: translateX(-50%); } }

/* graphs */
.gbot { height: var(--tt-gh, 44px); margin: 0 calc(-1 * var(--tt-pad)) calc(-1 * var(--tt-pad)); }
.gbot svg, .gbg svg { width: 100%; height: 100%; display: block; }
.gbg { top: auto; height: 62%; opacity: .55; }
svg .ln { fill: none; stroke-width: 2.2; stroke-linejoin: round; stroke-linecap: round; }
.gbot svg.tl, .gbg svg.tl { border-radius: 6px; opacity: .8; }
.gbot.timeline { height: 10px; margin: 0; border-radius: 5px; overflow: hidden; }

/* slider row */
.bar-row { --tt-sh: 38px; }
.l-compact .bar-row { --tt-sh: 28px; }
.drag-val {
  position: absolute; top: 8px; left: 50%; transform: translate(-50%, -6px) scale(.9); opacity: 0;
  padding: 4px 12px; border-radius: 12px; background: var(--tt-color); color: #fff; font-weight: 700; font-size: 13px;
  pointer-events: none; transition: opacity .2s, transform .2s; z-index: 3; font-variant-numeric: tabular-nums;
}
.dragging .drag-val { opacity: 1; transform: translate(-50%, 0) scale(1); }

/* image background */
.bgimg { background-size: cover; background-position: center; }
.bgimg::after { content: ""; position: absolute; inset: 0; background: linear-gradient(180deg, rgba(0,0,0,.05), rgba(0,0,0,.6)); }
.has-img { --tt-text: #fff; --tt-text2: rgba(255,255,255,.82); }
.has-img .shape { background: rgba(255,255,255,.2); backdrop-filter: blur(6px); }

/* ---------- styles ---------- */
.st-glass {
  background: color-mix(in srgb, var(--ha-card-background, var(--card-background-color, #fff)) 52%, transparent);
  backdrop-filter: blur(20px) saturate(1.7); -webkit-backdrop-filter: blur(20px) saturate(1.7);
  border: 1px solid rgba(255,255,255,.22); box-shadow: 0 8px 32px rgba(0,0,0,.12), inset 0 1px 0 rgba(255,255,255,.25);
}
.st-glass.on { background: linear-gradient(135deg, color-mix(in srgb, var(--tt-color) 26%, transparent), color-mix(in srgb, var(--ha-card-background, var(--card-background-color, #fff)) 42%, transparent) 70%); }
.st-neon {
  --tt-text: #eef1ff; --tt-text2: rgba(225,232,255,.62); --tt-off: rgba(225,232,255,.35);
  background: radial-gradient(120% 120% at 0% 0%, color-mix(in srgb, var(--tt-c) 14%, #0b0d14), #07080c);
  border: 1px solid color-mix(in srgb, var(--tt-c) 45%, transparent);
}
.st-neon.on { box-shadow: 0 0 6px color-mix(in srgb, var(--tt-color) 70%, transparent), 0 0 26px color-mix(in srgb, var(--tt-color) 38%, transparent), inset 0 0 22px color-mix(in srgb, var(--tt-color) 16%, transparent); }
.st-neon.on .shape { box-shadow: 0 0 16px color-mix(in srgb, var(--tt-color) 80%, transparent), inset 0 0 8px color-mix(in srgb, var(--tt-color) 50%, transparent); }
.st-neon.on .primary { text-shadow: 0 0 10px color-mix(in srgb, var(--tt-color) 85%, transparent); }
.st-neon .shape .icon { filter: drop-shadow(0 0 4px var(--tt-c)); }
.st-gradient.on {
  --tt-text: #fff; --tt-text2: rgba(255,255,255,.85);
  background: linear-gradient(135deg, var(--tt-color), color-mix(in srgb, var(--tt-color) 52%, #000));
  box-shadow: 0 12px 28px -12px var(--tt-color); border-color: transparent;
}
.st-gradient.on .shape { background: rgba(255,255,255,.22); color: #fff; --tt-c: #fff; }
.st-gradient.on .chip, .st-gradient.on .btn { background: rgba(255,255,255,.18); color: #fff; }
.st-gradient.on .chip .ci, .st-gradient.on .btn.on { color: #fff; }
.st-gradient.on .tt-slider, .st-gradient.on .fill { background: rgba(255,255,255,.18); }
.st-gradient.on .tt-slider-bar { background: rgba(255,255,255,.88); }
.st-gradient.on .tt-slider-lab { color: color-mix(in srgb, var(--tt-color) 55%, #000); }
.st-gradient.on .switch.on { background: rgba(255,255,255,.4); }
.st-gradient.on .gbot, .st-gradient.on .gbg { --tt-color: #fff; }
.st-aurora { background: var(--ha-card-background, var(--card-background-color, #fff)); }
.aurora { filter: blur(26px) saturate(1.4); opacity: .25; transition: opacity .6s; }
.on .aurora { opacity: .85; }
.aurora i { position: absolute; width: 75%; aspect-ratio: 1; border-radius: 50%; background: var(--tt-c); animation: tt-aur 14s ease-in-out infinite alternate; }
.aurora i:nth-child(1) { left: -20%; top: -40%; }
.aurora i:nth-child(2) { right: -25%; top: 10%; background: color-mix(in srgb, var(--tt-c) 55%, #00e5ff); animation-duration: 17s; animation-delay: -4s; }
.aurora i:nth-child(3) { left: 20%; bottom: -60%; background: color-mix(in srgb, var(--tt-c) 50%, #ff4081); animation-duration: 21s; animation-delay: -9s; }
@keyframes tt-aur { 0% { transform: translate(0, 0) scale(1); } 50% { transform: translate(35%, 20%) scale(1.25); } 100% { transform: translate(-15%, 35%) scale(.85); } }
.st-soft {
  --tt-sl: rgba(255,255,255,.9); --tt-sd: rgba(163,177,198,.55);
  background: var(--tt-soft-bg, var(--primary-background-color, #e8ecf2)); border: none;
  box-shadow: 7px 7px 16px var(--tt-sd), -7px -7px 16px var(--tt-sl);
}
.st-soft.dark { --tt-sl: rgba(255,255,255,.045); --tt-sd: rgba(0,0,0,.6); }
.st-soft.on { box-shadow: inset 6px 6px 13px var(--tt-sd), inset -6px -6px 13px var(--tt-sl); }
.st-soft .shape { box-shadow: 4px 4px 9px var(--tt-sd), -4px -4px 9px var(--tt-sl); }
.st-soft.on .shape { box-shadow: inset 3px 3px 7px var(--tt-sd), inset -3px -3px 7px var(--tt-sl); }
.st-soft .btn, .st-soft .chip { box-shadow: 3px 3px 7px var(--tt-sd), -3px -3px 7px var(--tt-sl); background: transparent; }
.st-minimal { background: transparent; box-shadow: none; border: none; backdrop-filter: none; }
.st-outline { background: transparent; box-shadow: none; border: 2px solid color-mix(in srgb, var(--tt-c) 30%, transparent); }
.st-outline.on { border-color: var(--tt-color); }
.st-frosted { background: color-mix(in srgb, var(--tt-c) 14%, var(--ha-card-background, var(--card-background-color, #fff))); border: none; }
.st-frosted.on { background: color-mix(in srgb, var(--tt-color) 22%, var(--ha-card-background, var(--card-background-color, #fff))); }

/* ---------- card effects ---------- */
.fx-pulse { animation: tt-cardpulse 1.8s ease-out infinite; }
.fx-glow { box-shadow: 0 0 26px -4px color-mix(in srgb, var(--tt-color) 75%, transparent) !important; }
.fx-shake { animation: tt-cardshake 2.6s ease-in-out infinite; }
.fx-breathe { animation: tt-cardbreathe 4s ease-in-out infinite; }
.shimmer { background: linear-gradient(105deg, transparent 35%, rgba(255,255,255,.28) 50%, transparent 65%); background-size: 250% 100%; animation: tt-shimmer 3s linear infinite; z-index: 2; }
.bspin { padding: 2px; -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite: xor; mask: linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0); z-index: 2; }
.bspin i { position: absolute; inset: -60%; background: conic-gradient(from 0deg, transparent 0 62%, var(--tt-color) 82%, #fff 88%, transparent 92%); animation: tt-spin 3.2s linear infinite; }
@keyframes tt-cardpulse { 0% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--tt-color) 65%, transparent); } 100% { box-shadow: 0 0 0 16px transparent; } }
@keyframes tt-cardshake { 0%,86%,100% { translate: 0; } 88% { translate: -4px; } 90% { translate: 4px; } 92% { translate: -3px; } 94% { translate: 3px; } 96% { translate: -1px; } }
@keyframes tt-cardbreathe { 0%,100% { scale: 1; } 50% { scale: 1.025; } }
@keyframes tt-shimmer { from { background-position: 130% 0; } to { background-position: -130% 0; } }

/* tilt glare + ripple */
.glare { background: radial-gradient(circle at var(--mx, 50%) var(--my, 50%), rgba(255,255,255,.28), transparent 55%); opacity: var(--go, 0); transition: opacity .3s; z-index: 3; }
.ripples { z-index: 3; }
.rp { position: absolute; border-radius: 50%; background: currentColor; opacity: .18; transform: scale(0); animation: tt-ripple .65s ease-out forwards; pointer-events: none; }
@keyframes tt-ripple { to { transform: scale(1); opacity: 0; } }

/* states */
.unavail { opacity: .6; }
.unavail .shape { background: repeating-linear-gradient(45deg, var(--tt-surface) 0 5px, transparent 5px 10px); }
.warn { padding: 12px; color: var(--error-color, #db4437); font-size: 13px; }
`;

const POPUP_CSS = `
:host { position: fixed; inset: 0; z-index: 100; display: block; font-family: var(--ha-font-family-body, Roboto, system-ui, sans-serif); color: var(--tt-text); }
.backdrop { position: absolute; inset: 0; background: rgba(0,0,0,.42); backdrop-filter: blur(8px) saturate(1.2); -webkit-backdrop-filter: blur(8px) saturate(1.2); opacity: 0; transition: opacity .3s; }
:host(.open) .backdrop { opacity: 1; }
.sheet {
  position: absolute; left: 50%; bottom: 0; width: min(100%, 520px); max-height: 92vh; max-height: 92dvh;
  transform: translate(-50%, 104%); transition: transform .42s cubic-bezier(.2,.9,.25,1), opacity .3s;
  background: var(--ha-card-background, var(--card-background-color, #fff));
  border-radius: 30px 30px 0 0; overflow: hidden auto; overscroll-behavior: contain;
  box-shadow: 0 -12px 50px rgba(0,0,0,.3);
  padding: 6px 20px calc(24px + env(safe-area-inset-bottom));
  scrollbar-width: thin;
}
.sheet::before {
  content: ""; position: absolute; left: 0; right: 0; top: 0; height: 220px; pointer-events: none;
  background: radial-gradient(120% 100% at 50% -20%, color-mix(in srgb, var(--tt-c) 30%, transparent), transparent 70%);
}
:host(.open) .sheet { transform: translate(-50%, 0); }
:host(.dragging) .sheet { transition: none; }
@media (min-width: 700px) {
  .sheet { top: 50%; bottom: auto; border-radius: 30px; transform: translate(-50%, -46%) scale(.94); opacity: 0; padding-bottom: 24px; box-shadow: 0 30px 80px rgba(0,0,0,.35); }
  :host(.open) .sheet { transform: translate(-50%, -50%) scale(1); opacity: 1; }
  .grab { visibility: hidden; }
}
.inner { position: relative; }
.grab { width: 42px; height: 5px; border-radius: 3px; background: color-mix(in srgb, var(--tt-text) 22%, transparent); margin: 6px auto 10px; }
.head { display: flex; align-items: center; gap: 14px; padding: 4px 0 6px; touch-action: none; }
.head .shape { --tt-icon: 56px; }
.ht { flex: 1; min-width: 0; }
.title { font-size: 20px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sub { font-size: 13px; color: var(--tt-text2); margin-top: 2px; }
.hbtns { display: flex; gap: 6px; }
.sec { margin-top: 22px; }
.sec-t { display: flex; align-items: center; justify-content: space-between; font-size: 12px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--tt-text2); margin-bottom: 10px; gap: 8px; }
.hero { display: flex; justify-content: center; align-items: center; gap: 22px; margin-top: 18px; }
.side { display: flex; flex-direction: column; gap: 12px; align-items: center; }
.bigbtn {
  width: 64px; height: 64px; border-radius: 22px; display: flex; align-items: center; justify-content: center;
  background: var(--tt-surface); cursor: pointer; --mdc-icon-size: 28px; transition: transform .15s, background .3s, color .3s;
}
.bigbtn.on { background: var(--tt-color); color: #fff; box-shadow: 0 10px 24px -10px var(--tt-color); }
.bigbtn:active { transform: scale(.92); }
.bigval { font-size: 56px; font-weight: 750; text-align: center; letter-spacing: -2px; font-variant-numeric: tabular-nums; line-height: 1; margin-top: 18px; }
.bigval.txt { font-size: 30px; letter-spacing: -.5px; line-height: 1.15; }
.bigval .unit { font-size: 22px; font-weight: 600; letter-spacing: 0; color: var(--tt-text2); margin-left: 4px; }
.opts { display: flex; flex-wrap: wrap; gap: 8px; }
.opt { padding: 9px 15px; border-radius: 999px; background: var(--tt-surface); font-size: 13px; font-weight: 600; cursor: pointer; transition: background .25s, color .25s, transform .15s; }
.opt:active { transform: scale(.94); }
.opt.sel { background: var(--tt-color); color: #fff; }
.swatches { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
.sw { width: 34px; height: 34px; border-radius: 50%; cursor: pointer; box-shadow: inset 0 0 0 1px rgba(0,0,0,.12); transition: transform .15s; }
.sw:active { transform: scale(.88); }
.sw.custom { position: relative; overflow: hidden; background: conic-gradient(red, yellow, lime, cyan, blue, magenta, red); }
.sw.custom input { position: absolute; inset: -10px; width: 60px; height: 60px; opacity: 0; cursor: pointer; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(92px, 1fr)); gap: 10px; }
.pbtn { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 7px; padding: 14px 6px; border-radius: 20px; background: var(--tt-surface); font-size: 12px; font-weight: 600; text-align: center; cursor: pointer; --mdc-icon-size: 24px; transition: transform .15s, background .25s; color: var(--tt-text); }
.pbtn ha-icon { color: var(--pc, var(--tt-color)); }
.pbtn:active { transform: scale(.94); }
.pbtn.sel { background: color-mix(in srgb, var(--pc, var(--tt-color)) 20%, transparent); }
.graph { position: relative; height: 150px; border-radius: 18px; background: var(--tt-surface); overflow: hidden; }
.graph svg { width: 100%; height: 100%; display: block; }
.graph.tl { height: 34px; }
.graph .ax { position: absolute; font-size: 10px; color: var(--tt-text2); padding: 6px 10px; }
.stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 10px; }
.stat { padding: 10px 12px; border-radius: 16px; background: var(--tt-surface); }
.stat b { display: block; font-size: 17px; font-variant-numeric: tabular-nums; }
.stat span { font-size: 11px; color: var(--tt-text2); text-transform: uppercase; letter-spacing: .06em; }
.tabs { display: flex; gap: 4px; padding: 3px; border-radius: 12px; background: var(--tt-surface); text-transform: none; letter-spacing: 0; }
.tab { padding: 4px 10px; border-radius: 9px; cursor: pointer; font-weight: 600; font-size: 12px; }
.tab.sel { background: var(--ha-card-background, var(--card-background-color, #fff)); color: var(--tt-text); box-shadow: 0 1px 4px rgba(0,0,0,.12); }
.changes { display: flex; flex-direction: column; gap: 2px; margin-top: 10px; }
.chg { display: flex; align-items: center; gap: 10px; font-size: 13px; padding: 6px 2px; }
.chg i { width: 9px; height: 9px; border-radius: 50%; flex: none; }
.chg span:last-child { margin-left: auto; color: var(--tt-text2); font-size: 12px; }
.attrs { display: grid; grid-template-columns: auto 1fr; gap: 6px 14px; font-size: 13px; }
.attrs .k { color: var(--tt-text2); }
.attrs .v { text-align: right; word-break: break-word; }
.dial { position: relative; width: 240px; height: 220px; margin: 6px auto 0; }
.dial svg { width: 100%; height: 100%; overflow: visible; }
.dial .center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; padding-bottom: 14px; }
.dial .tv { font-size: 50px; font-weight: 750; letter-spacing: -2px; font-variant-numeric: tabular-nums; line-height: 1; }
.dial .tv small { font-size: 20px; letter-spacing: 0; }
.dial .cur { font-size: 13px; color: var(--tt-text2); margin-top: 6px; }
.dial .act { font-size: 12px; font-weight: 700; color: var(--tt-color); text-transform: uppercase; letter-spacing: .08em; margin-bottom: 6px; }
.dialbtns { display: flex; justify-content: center; gap: 40px; margin-top: -26px; position: relative; }
.media-art { width: 100%; aspect-ratio: 1.6; border-radius: 22px; background-size: cover; background-position: center; margin-top: 14px; box-shadow: 0 18px 40px -18px rgba(0,0,0,.5); background-color: var(--tt-surface); display: flex; align-items: center; justify-content: center; --mdc-icon-size: 64px; color: var(--tt-c); }
.media-t { text-align: center; margin-top: 14px; }
.media-t b { display: block; font-size: 17px; }
.media-t span { font-size: 13px; color: var(--tt-text2); }
.mctrl { display: flex; justify-content: center; align-items: center; gap: 18px; margin-top: 14px; }
.keypad { display: grid; grid-template-columns: repeat(3, 64px); gap: 12px; justify-content: center; margin-top: 14px; }
.keypad .bigbtn { font-size: 22px; font-weight: 600; }
.codeview { text-align: center; font-size: 24px; letter-spacing: 8px; min-height: 32px; margin-top: 12px; }
.cards { display: flex; flex-direction: column; gap: 12px; }
.cards:empty { display: none; }
.camimg { width: 100%; border-radius: 20px; display: block; margin-top: 14px; }
.wx { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.slider-row { display: flex; flex-direction: column; gap: 10px; }
`;

// ---- 03-card.js ----
/* ------------------------------------------------------------------ */
/*  shared base: rendering, gestures, sliders, commands                */
/* ------------------------------------------------------------------ */
class TTBase extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._cmd = {};
    this._actDefs = {};
    this._sliderDefs = {};
    this._opt = {};
    this._uid = Math.random().toString(36).slice(2, 8);
    const sr = this.shadowRoot;
    sr.addEventListener("pointerdown", (e) => this._onDown(e));
    sr.addEventListener("click", (e) => this._onClick(e));
    sr.addEventListener("change", (e) => this._onChange(e));
    sr.addEventListener("keydown", (e) => this._onKey(e));
    sr.addEventListener("contextmenu", (e) => {
      if (e.target.closest && e.target.closest("[data-act]")) e.preventDefault();
    });
  }

  /* registration (called during _render, keys are deterministic) */
  _resetRegs() { this._cmd = {}; this._ci = 0; this._actDefs = {}; this._sliderDefs = {}; this._si = 0; }
  _reg(fn) { const k = "c" + this._ci++; this._cmd[k] = fn; return k; }
  _regSlider(def, key) { const k = key || "s" + this._si++; this._sliderDefs[k] = def; return k; }

  _scheduleRender() {
    if (this._raf) return;
    this._raf = requestAnimationFrame(() => { this._raf = null; this._flush(); });
  }
  _flush() {
    if (this._dragging) { this._dirty = true; return; }
    const html = this._render();
    if (html == null) return;
    const root = this._mount();
    patchHTML(root, html);
    this._afterRender();
  }
  _afterRender() {
    const hass = this._hass;
    this.shadowRoot.querySelectorAll("ha-state-icon[data-entity]").forEach((el) => {
      el.hass = hass;
      el.stateObj = hass.states[el.dataset.entity];
      el.icon = el.dataset.icon || undefined;
    });
  }

  _haptic(type = "light") {
    if (this._cfgHaptic === false) return;
    fire(window, "haptic", type);
    try { if (navigator.vibrate) navigator.vibrate(type === "light" ? 8 : 18); } catch (e) { /* ignore */ }
  }

  _sliderHtml(key, ctrl, opts = {}) {
    const range = ctrl.max - ctrl.min || 1;
    const v = clamp((ctrl.value - ctrl.min) / range, 0, 1);
    const val = this._fmtCtrl(ctrl, ctrl.value);
    const grad = opts.grad ? ` grad" style="--v:${v};--grad:${opts.grad}` : `" style="--v:${v}`;
    return `<div class="tt-slider ${opts.vertical ? "v" : ""}${grad}" data-slider="${key}">
      <div class="tt-slider-bar"></div>
      <div class="tt-slider-lab">${opts.icon ? `<ha-icon icon="${esc(opts.icon)}"></ha-icon>` : ""}${opts.label ? `<span>${esc(opts.label)}</span>` : ""}<span class="tt-slider-val">${esc(val)}</span></div>
    </div>`;
  }
  _fmtCtrl(ctrl, v) {
    if (ctrl.format) return ctrl.format(v);
    const dec = (String(ctrl.step).split(".")[1] || "").length;
    let s;
    try { s = new Intl.NumberFormat(langOf(this._hass), { minimumFractionDigits: dec, maximumFractionDigits: dec }).format(v); }
    catch (e) { s = Number(v).toFixed(dec); }
    return ctrl.unit === "%" ? `${s} %` : ctrl.unit ? `${s} ${ctrl.unit}` : s;
  }

  _applyOpt(key, ctrl) {
    const o = this._opt[key];
    if (!o || !ctrl) return ctrl;
    if (Date.now() - o.t > 4000 || Math.abs(o.v - ctrl.value) < (ctrl.step || 1) / 2) {
      delete this._opt[key];
      return ctrl;
    }
    return { ...ctrl, value: o.v };
  }
  _commitSlider(key, def, v) {
    this._opt[key] = { v, t: Date.now() };
    this._haptic("light");
    try { def.set(v); } catch (e) { console.error(e); }
    clearTimeout(this._optTimer);
    this._optTimer = setTimeout(() => this._scheduleRender(), 4200);
    this._scheduleRender();
  }

  /* -------- event plumbing -------- */
  _onClick(e) {
    const el = e.target.closest && e.target.closest("[data-cmd]");
    if (!el) return;
    e.stopPropagation();
    const fn = this._cmd[el.dataset.cmd];
    if (fn) { this._haptic("light"); fn(el, e); }
  }
  _onChange(e) {
    const el = e.target.closest && e.target.closest("[data-change]");
    if (!el) return;
    const fn = this._cmd[el.dataset.change];
    if (fn) fn(el, e);
  }
  _onKey(e) {
    if (e.key !== "Enter" && e.key !== " ") return;
    const cmd = e.target.closest && e.target.closest("[data-cmd]");
    if (cmd) { e.preventDefault(); const fn = this._cmd[cmd.dataset.cmd]; if (fn) fn(cmd, e); return; }
    const a = e.target.closest && e.target.closest("[data-act]");
    if (a && this._actDefs[a.dataset.act]) { e.preventDefault(); this._run(this._actDefs[a.dataset.act], "tap"); }
  }

  _onDown(e) {
    if (e.button !== undefined && e.button !== 0) return;
    const t = e.target;
    if (!t.closest) return;
    const sl = t.closest("[data-slider]");
    if (sl) { this._startSlider(sl, e); return; }
    if (t.closest("[data-cmd],[data-change],input,select,textarea,[data-noact]")) return;
    const a = t.closest("[data-act]");
    if (!a) return;
    const def = this._actDefs[a.dataset.act];
    if (!def) return;
    this._gesture(a, def, e);
  }

  _startSlider(el, e) {
    const def = this._sliderDefs[el.dataset.slider];
    if (!def) return;
    e.preventDefault();
    e.stopPropagation();
    const rect = el.getBoundingClientRect();
    const vertical = el.classList.contains("v");
    const range = def.max - def.min || 1;
    const calc = (ev) => {
      const f = vertical ? 1 - (ev.clientY - rect.top) / rect.height : (ev.clientX - rect.left) / rect.width;
      return clamp(snap(def.min + clamp(f, 0, 1) * range, def.min, def.step || 1), def.min, def.max);
    };
    const lab = el.querySelector(".tt-slider-val");
    const show = (val) => {
      el.style.setProperty("--v", (val - def.min) / range);
      if (lab) lab.textContent = this._fmtCtrl(def, val);
    };
    let v = calc(e);
    this._dragging = true;
    el.classList.add("drag");
    show(v);
    try { el.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    const move = (ev) => { v = calc(ev); show(v); };
    const up = () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      el.classList.remove("drag");
      this._dragging = false;
      this._commitSlider(el.dataset.slider, def, v);
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
  }

  _gesture(el, def, e) {
    const g = { x: e.clientX, y: e.clientY, held: false, moved: false, dragging: false };
    const cardSlider = def.cardSlider ? this._sliderDefs[def.cardSlider] : null;
    this._pressStart && this._pressStart(e);
    const hasHold = def.hold_action && def.hold_action.action !== "none";
    g.timer = setTimeout(() => {
      if (g.moved) return;
      g.held = true;
      if (hasHold) { this._ripple && this._ripple(e, true); this._run(def, "hold"); }
    }, 480);
    let rect, startV, v;
    const move = (ev) => {
      const dx = ev.clientX - g.x, dy = ev.clientY - g.y;
      if (!g.moved && Math.hypot(dx, dy) > 9) {
        g.moved = true;
        clearTimeout(g.timer);
        if (cardSlider && Math.abs(dx) > Math.abs(dy) * 1.2) {
          g.dragging = true;
          this._dragging = true;
          rect = el.getBoundingClientRect();
          startV = cardSlider.value;
          v = startV;
          try { el.setPointerCapture(ev.pointerId); } catch (err) { /* ignore */ }
          el.classList.add("dragging");
          this._haptic("light");
        }
      }
      if (g.dragging) {
        ev.preventDefault();
        const range = cardSlider.max - cardSlider.min || 1;
        v = clamp(snap(startV + (dx / rect.width) * range * 1.15, cardSlider.min, cardSlider.step || 1), cardSlider.min, cardSlider.max);
        const p = (v - cardSlider.min) / range;
        el.style.setProperty("--p", p);
        const lab = el.querySelector(".drag-val");
        if (lab) lab.textContent = this._fmtCtrl(cardSlider, v);
      }
    };
    const up = (ev) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", cancel);
      clearTimeout(g.timer);
      this._pressEnd && this._pressEnd();
      if (g.dragging) {
        el.classList.remove("dragging");
        this._dragging = false;
        this._commitSlider(def.cardSlider, cardSlider, v);
        return;
      }
      if (!g.moved && !g.held && ev) this._tap(def, ev);
    };
    const cancel = () => {
      if (g.dragging) { el.classList.remove("dragging"); this._dragging = false; this._scheduleRender(); }
      g.dragging = false; g.moved = true;
      up(null);
    };
    window.addEventListener("pointermove", move, { passive: false });
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", cancel);
  }

  _tap(def, ev) {
    this._ripple && this._ripple(ev);
    const dbl = def.double_tap_action && def.double_tap_action.action !== "none";
    if (!dbl) { this._run(def, "tap"); return; }
    const lt = this._lastTap;
    if (lt && lt.def === def && Date.now() - lt.t < 260) {
      clearTimeout(lt.timer);
      this._lastTap = null;
      this._run(def, "double_tap");
      return;
    }
    this._lastTap = { def, t: Date.now(), timer: setTimeout(() => { this._lastTap = null; this._run(def, "tap"); }, 260) };
  }

  /** run an action; returns true if something happened */
  _run(def, kind) {
    const a = def[kind + "_action"];
    if (!a || a.action === "none") return false;
    this._haptic(kind === "hold" ? "medium" : "light");
    if (a.action === "toptop-popup" || a.action === "popup") {
      this._openPopup(def);
      return true;
    }
    if (a.action === "toggle" && def.entity && !a.confirmation) {
      toggleEntity(this._hass, (a.entity || a.target && a.target.entity_id) || def.entity);
      return true;
    }
    this._dispatchAction(def, kind, a);
    return true;
  }
  _dispatchAction(def, kind, a) {
    fire(this, "hass-action", { config: { entity: def.entity, [kind + "_action"]: a }, action: kind });
  }
  _openPopup() { /* overridden */ }
}

/* ------------------------------------------------------------------ */
/*  the card                                                           */
/* ------------------------------------------------------------------ */
const DEFAULTS = {
  layout: "horizontal", style: "default", size: "m", icon_shape: "circle", color: "auto",
  icon_animation: "auto", card_effect: "auto", show_name: true, show_state: true, show_icon: true,
  secondary_info: "state", slider: "none", controls: false, fill: "auto", ring: "auto",
  graph: "auto", graph_hours: 24, graph_position: "auto", tilt: false, ripple: true, haptic: true,
  popup_history: true, popup_attributes: true, threshold_interpolate: true,
};
const cleanCfg = (c) => {
  const o = {};
  for (const [k, v] of Object.entries(c || {})) if (v !== "" && v !== null && v !== undefined) o[k] = v;
  return o;
};

class TopTopCard extends TTBase {
  static _sigSeq = 0;
  static getConfigElement() { return document.createElement("toptop-card-editor"); }
  static getStubConfig(hass) {
    const ids = Object.keys((hass && hass.states) || {});
    const pick = ids.find((i) => i.startsWith("light.")) || ids.find((i) => i.startsWith("switch.")) ||
      ids.find((i) => i.startsWith("sensor.")) || ids[0] || "sun.sun";
    const light = pick.startsWith("light.");
    return { entity: pick, style: "glass", controls: true, slider: light ? "card" : "none", tilt: true };
  }

  setConfig(config) {
    if (!config || typeof config !== "object") throw new Error("Invalid configuration");
    if (config.chips && !Array.isArray(config.chips)) throw new Error("'chips' must be a list");
    this._config = config;
    this._cfg = { ...DEFAULTS, ...cleanCfg(config) };
    this._cfgHaptic = this._cfg.haptic;
    this._unsubTemplates();
    this._tplVals = {};
    this._hist = null;
    this._sig = null;
    if (this._hass) this._ensureTemplates();
    this._scheduleRender();
  }

  set hass(h) {
    const old = this._hass;
    this._hass = h;
    if (this._popup) this._popup.hass = h;
    if (!this._cfg) return;
    const sig = this._signature(h);
    if (!old || sig !== this._sig) {
      this._sig = sig;
      this._liveHistory();
      this._scheduleRender();
    }
    this._ensureTemplates();
    this._ensureHistory();
  }
  get hass() { return this._hass; }

  _watched() {
    const c = this._cfg, ids = [c.entity, c.badge_entity, c.graph_entity];
    (c.chips || []).forEach((ch) => ids.push(typeof ch === "string" ? ch : ch && ch.entity));
    return ids.filter(Boolean);
  }
  _signature(h) {
    // HA replaces a state object whenever it changes, so object identity is enough
    if (!this._sigCache) this._sigCache = new WeakMap();
    const parts = this._watched().map((id) => {
      const so = h.states[id];
      if (!so) return "x";
      let k = this._sigCache.get(so);
      if (!k) { k = ++TopTopCard._sigSeq; this._sigCache.set(so, k); }
      return k;
    });
    return parts.join(",") + (h.themes && h.themes.darkMode ? "D" : "L") + langOf(h);
  }

  connectedCallback() {
    this._tick = 0;
    this._interval = setInterval(() => {
      this._tick++;
      if (this._needsSecondTick || this._tick % 30 === 0) this._scheduleRender();
      if (this._tick % 300 === 0) this._ensureHistory(true);
    }, 1000);
    if (this._hass && this._cfg) { this._ensureTemplates(); this._scheduleRender(); }
  }
  disconnectedCallback() {
    clearInterval(this._interval);
    this._unsubTemplates();
  }

  getCardSize() {
    const c = this._cfg || DEFAULTS;
    let s = c.layout === "hero" ? 3 : c.layout === "square" || c.layout === "vertical" ? 2 : 1;
    if (c.slider === "bar") s += 1;
    if (c.chips && c.chips.length) s += 1;
    if (this._graphOn && this._graphPos === "bottom") s += 1;
    return s;
  }
  getGridOptions() {
    const c = this._cfg || DEFAULTS;
    let rows = c.layout === "hero" ? 3 : c.layout === "square" ? 3 : c.layout === "vertical" ? 2 : 1;
    if (c.layout === "horizontal" || c.layout === "compact") {
      if (c.slider === "bar") rows++;
      if (c.chips && c.chips.length) rows++;
      if (this._graphOn && this._graphPos === "bottom") rows++;
    }
    return { columns: c.layout === "square" ? 4 : 6, rows, min_columns: c.layout === "square" ? 3 : 4, min_rows: 1 };
  }
  getLayoutOptions() {
    const g = this.getGridOptions();
    return { grid_columns: g.columns / 3, grid_rows: g.rows, grid_min_rows: 1 };
  }

  /* ---------------- templates ---------------- */
  _templateFields() {
    const c = this._cfg, f = {};
    ["primary", "secondary", "tertiary", "badge_text"].forEach((k) => { if (isJinja(c[k])) f[k] = c[k]; });
    (c.chips || []).forEach((ch, i) => { if (ch && isJinja(ch.content)) f["chip" + i] = ch.content; });
    return f;
  }
  _ensureTemplates() {
    if (!this.isConnected || !this._hass || !this._hass.connection) return;
    if (!this._tplSubs) this._tplSubs = {};
    const fields = this._templateFields();
    for (const [key, tpl] of Object.entries(fields)) {
      if (this._tplSubs[key] && this._tplSubs[key].tpl === tpl) continue;
      const entry = { tpl, unsub: null, dead: false };
      this._tplSubs[key] = entry;
      this._hass.connection.subscribeMessage(
        (msg) => {
          this._tplVals[key] = msg.error ? `⚠ ${msg.error}` : msg.result == null ? "" : String(msg.result);
          this._scheduleRender();
        },
        { type: "render_template", template: tpl, strict: false, report_errors: true,
          variables: { config: this._config, user: this._hass.user && this._hass.user.name, entity: this._cfg.entity } }
      ).then((unsub) => {
        if (entry.dead) unsub(); else entry.unsub = unsub;
      }).catch((err) => {
        this._tplVals[key] = `⚠ ${err && err.message ? err.message : "template"}`;
        this._scheduleRender();
      });
    }
  }
  _unsubTemplates() {
    if (!this._tplSubs) return;
    for (const e of Object.values(this._tplSubs)) {
      e.dead = true;
      if (e.unsub) { try { e.unsub(); } catch (err) { /* ignore */ } }
    }
    this._tplSubs = {};
  }
  _tpl(key, src, so) {
    if (src == null || src === "") return null;
    if (isJinja(src)) return this._tplVals[key] != null ? this._tplVals[key] : "…";
    return localTemplate(src, this._hass, so);
  }

  /* ---------------- history ---------------- */
  _graphEntityId() { return this._cfg.graph_entity || this._cfg.entity; }
  _graphType() {
    const c = this._cfg, id = this._graphEntityId();
    const so = id && this._hass.states[id];
    if (!so || c.graph === "none" || c.graph === false) return null;
    if (c.graph === "auto") {
      return domainOf(id) === "sensor" && isNum(so.state) && (so.attributes.state_class || so.attributes.unit_of_measurement) ? "line" : null;
    }
    if (c.graph === true) return isNum(so.state) ? "line" : "timeline";
    return c.graph;
  }
  _ensureHistory(force) {
    const type = this._graphType();
    if (!type || !this.isConnected || !this._hass.callWS) return;
    const id = this._graphEntityId(), hours = Number(this._cfg.graph_hours) || 24;
    const h = this._hist;
    if (!force && h && h.id === id && h.hours === hours && Date.now() - h.loaded < 10 * 60e3) return;
    if (this._histLoading) return;
    this._histLoading = true;
    fetchHistory(this._hass, id, hours).then((res) => {
      this._hist = res;
      this._scheduleRender();
    }).catch(() => { /* recorder excluded etc. */ }).finally(() => { this._histLoading = false; });
  }
  _liveHistory() {
    const h = this._hist;
    if (!h) return;
    const so = this._hass.states[h.id];
    if (!so) return;
    const t = new Date(so.last_updated).getTime();
    const last = h.points[h.points.length - 1];
    if (!last || t > last.t) h.points.push({ t, s: so.state });
    const cutoff = Date.now() - h.hours * 3600e3;
    while (h.points.length > 2 && h.points[1].t < cutoff) h.points.shift();
  }

  /* ---------------- popup ---------------- */
  _openPopup(def) {
    if (this._popup) this._popup.close(true);
    const entity = def && def.popupEntity !== undefined ? def.popupEntity : this._cfg.entity;
    const cfg = def && def.popupCfg ? def.popupCfg : this._cfg;
    const p = document.createElement("toptop-popup");
    this._popup = p;
    p.open(this, entity, cfg);
  }

  /* ---------------- visuals ---------------- */
  _mount() {
    if (!this._root) {
      this.shadowRoot.innerHTML = `<style>${BASE_CSS}${CARD_CSS}</style><div id="root"></div>`;
      this._root = this.shadowRoot.getElementById("root");
      this._bindTilt();
    }
    return this._root;
  }
  _bindTilt() {
    const host = this;
    this.shadowRoot.addEventListener("pointermove", (e) => {
      if (!this._cfg || !this._cfg.tilt || e.pointerType !== "mouse" || this._dragging) return;
      const card = this.shadowRoot.querySelector("ha-card");
      if (!card) return;
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      const k = Number(this._cfg.tilt_strength) || 8;
      host.style.setProperty("--rx", `${((0.5 - y) * k).toFixed(2)}deg`);
      host.style.setProperty("--ry", `${((x - 0.5) * k).toFixed(2)}deg`);
      host.style.setProperty("--mx", `${(x * 100).toFixed(1)}%`);
      host.style.setProperty("--my", `${(y * 100).toFixed(1)}%`);
      host.style.setProperty("--go", "1");
    });
    this.shadowRoot.addEventListener("pointerleave", () => {
      ["--rx", "--ry", "--go"].forEach((p) => host.style.removeProperty(p));
    }, true);
  }
  _pressStart() { this.style.setProperty("--ts", ".975"); }
  _pressEnd() { this.style.removeProperty("--ts"); }
  _ripple(e, strong) {
    if (!this._cfg.ripple || !e) return;
    const card = this.shadowRoot.querySelector("ha-card"), host = this.shadowRoot.querySelector(".ripples");
    if (!card || !host) return;
    const r = card.getBoundingClientRect();
    const size = Math.max(r.width, r.height) * 2.2;
    const s = document.createElement("span");
    s.className = "rp";
    s.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - r.left - size / 2}px;top:${e.clientY - r.top - size / 2}px;${strong ? "opacity:.3" : ""}`;
    host.appendChild(s);
    setTimeout(() => s.remove(), 700);
  }

  _iconHtml(so, icon) {
    if (so && customElements.get("ha-state-icon")) {
      return `<ha-state-icon data-entity="${esc(so.entity_id)}" data-icon="${esc(icon || "")}"></ha-state-icon>`;
    }
    return `<ha-icon icon="${esc(icon || fallbackIcon(so))}"></ha-icon>`;
  }

  _shapeHtml(so, look, c, prog, showRing, badge, act) {
    const pic = c.show_entity_picture && so && so.attributes.entity_picture;
    const anim = look.anim && look.anim !== "none" ? ` a-${look.anim}` : "";
    const spin = look.spin ? ` style="--tt-spin:${esc(look.spin)}"` : "";
    const ring = showRing && prog != null
      ? `<svg class="ring" viewBox="0 0 36 36"><circle class="rb" cx="18" cy="18" r="16.5" pathLength="100"/><circle class="rf" cx="18" cy="18" r="16.5" pathLength="100" stroke-dasharray="${(prog * 100).toFixed(1)} 100"/></svg>`
      : "";
    const inner = pic ? `<img class="pic" src="${esc(pic)}" alt="">` : `<div class="icon">${this._iconHtml(so, look.icon)}</div>`;
    return `<div class="shape sh-${esc(c.icon_shape)}${anim}${look.active ? " on" : ""}"${spin} data-act="${act}" role="button" tabindex="0">${ring}${inner}${badge}</div>`;
  }

  _badgeHtml(so, look) {
    const c = this._cfg, hass = this._hass;
    if (c.badge === false) return "";
    let text = null, icon = c.badge_icon || null, color = cssColor(c.badge_color);
    if (c.badge_entity) {
      const bso = hass.states[c.badge_entity];
      if (bso) {
        const bl = resolveLook(hass, bso, {});
        if (!color) color = bl.color;
        if (!c.badge_icon && !c.badge_text) {
          const [num, unit] = splitValue(formatState(hass, bso));
          text = unit === "%" || unit.length <= 2 ? num + (unit === "%" ? "%" : unit) : num;
        }
        if (!isActive(bso) && !c.badge_text && !c.badge_icon && !isNum(bso.state)) return "";
      }
    }
    if (c.badge_text) text = this._tpl("badge_text", c.badge_text, so);
    if (!text && !icon && so && look.unavailable) { icon = "mdi:exclamation-thick"; color = "var(--error-color, #f44336)"; }
    if (!text && !icon) return "";
    return `<span class="badge" style="--tt-b:${color || "var(--tt-color)"}">${icon ? `<ha-icon icon="${esc(icon)}"></ha-icon>` : esc(text)}</span>`;
  }

  _controlsHtml(so) {
    const hass = this._hass, id = so.entity_id, d = domainOf(id), st = so.state, a = so.attributes;
    const svc = (dom, s, data) => () => hass.callService(dom, s, { entity_id: id, ...(data || {}) });
    const btn = (icon, fn, on, title) => `<div class="btn${on ? " on" : ""}" data-cmd="${this._reg(fn)}" role="button" tabindex="0"${title ? ` title="${esc(title)}"` : ""}><ha-icon icon="${icon}"></ha-icon></div>`;
    const sw = () => `<div class="switch${isActive(so) ? " on" : ""}" data-cmd="${this._reg(() => toggleEntity(hass, id))}" role="switch" tabindex="0" aria-checked="${isActive(so)}"></div>`;
    const compact = this._cfg.layout === "compact" || this._cfg.layout === "square";
    switch (d) {
      case "cover": case "valve": {
        const o = d === "cover" ? "open_cover" : "open_valve", s = d === "cover" ? "stop_cover" : "stop_valve", cl = d === "cover" ? "close_cover" : "close_valve";
        if (compact) return btn(st === "closed" || st === "closing" ? "mdi:arrow-up" : "mdi:arrow-down", svc(d, st === "closed" || st === "closing" ? o : cl));
        return btn("mdi:arrow-up", svc(d, o)) + btn("mdi:stop", svc(d, s)) + btn("mdi:arrow-down", svc(d, cl));
      }
      case "media_player": {
        const playing = st === "playing";
        const pp = btn(playing ? "mdi:pause" : "mdi:play", svc(d, "media_play_pause"), playing);
        return compact ? pp : btn("mdi:skip-previous", svc(d, "media_previous_track")) + pp + btn("mdi:skip-next", svc(d, "media_next_track"));
      }
      case "climate": case "water_heater": {
        const ctrl = this._applyOpt("clim", getControl(hass, so));
        if (!ctrl) return sw();
        const step = (dir) => () => {
          const base = this._climPending != null ? this._climPending : ctrl.value;
          this._climPending = clamp(snap(base + dir * ctrl.step, ctrl.min, ctrl.step), ctrl.min, ctrl.max);
          this._opt.clim = { v: this._climPending, t: Date.now() };
          this._scheduleRender();
          clearTimeout(this._climTimer);
          this._climTimer = setTimeout(() => { const v = this._climPending; this._climPending = null; ctrl.set(v); }, 900);
        };
        return btn("mdi:minus", step(-1)) + `<div class="btn txt">${esc(this._fmtCtrl(ctrl, ctrl.value))}</div>` + btn("mdi:plus", step(1));
      }
      case "lock":
        return btn(st === "locked" ? "mdi:lock-open-variant" : "mdi:lock", svc("lock", st === "locked" ? "unlock" : "lock"), st !== "locked");
      case "vacuum": {
        const cl = st === "cleaning";
        return btn(cl ? "mdi:pause" : "mdi:play", svc("vacuum", cl ? "pause" : "start"), cl) + (compact ? "" : btn("mdi:home-import-outline", svc("vacuum", "return_to_base")));
      }
      case "lawn_mower": {
        const m = st === "mowing";
        return btn(m ? "mdi:pause" : "mdi:play", svc("lawn_mower", m ? "pause" : "start_mowing"), m) + (compact ? "" : btn("mdi:home-import-outline", svc("lawn_mower", "dock")));
      }
      case "button": case "input_button": return btn("mdi:gesture-tap", svc(d, "press"));
      case "scene": return btn("mdi:play", svc("scene", "turn_on"));
      case "script": return st === "on" ? btn("mdi:stop", svc("script", "turn_off"), true) : btn("mdi:play", svc("script", "turn_on"));
      case "timer": {
        const act = st === "active";
        return btn(act ? "mdi:pause" : "mdi:play", svc("timer", act ? "pause" : "start"), act) + (st !== "idle" && !compact ? btn("mdi:stop", svc("timer", "cancel")) : "");
      }
      case "update": return st === "on" ? btn("mdi:download", svc("update", "install"), true) : "";
      case "alarm_control_panel": return "";
      default:
        if (TOGGLE_DOMAINS.has(d)) return sw();
        return "";
    }
  }

  _chipsHtml() {
    const c = this._cfg, hass = this._hass;
    if (!Array.isArray(c.chips) || !c.chips.length) return "";
    const out = c.chips.map((raw, i) => {
      const ch = typeof raw === "string" ? { entity: raw } : raw || {};
      const so = ch.entity ? hass.states[ch.entity] : null;
      const lk = resolveLook(hass, so, ch);
      let text = ch.content != null ? this._chipTpl(i, ch.content, so) : ch.show_state === false || !so ? "" : formatState(hass, so);
      if (ch.name) text = text ? `${ch.name} · ${text}` : ch.name;
      const toggleable = so && TOGGLE_DOMAINS.has(domainOf(ch.entity));
      this._actDefs["chip" + i] = {
        entity: ch.entity,
        tap_action: ch.tap_action || (toggleable ? { action: "toggle" } : so ? { action: "more-info" } : { action: "none" }),
        hold_action: ch.hold_action || (so ? { action: "toptop-popup" } : { action: "none" }),
        double_tap_action: ch.double_tap_action,
        popupEntity: ch.entity, popupCfg: { ...ch, popup_history: true, popup_attributes: true },
      };
      const noIcon = ch.show_icon === false;
      const anim = lk.anim !== "none" ? ` a-${lk.anim}` : "";
      const icon = noIcon ? "" : `<span class="ci shape sh-none${anim}" style="--tt-icon:18px;width:18px;height:18px${lk.spin ? `;--tt-spin:${lk.spin}` : ""}"><span class="icon">${so ? this._iconHtml(so, lk.icon) : `<ha-icon icon="${esc(ch.icon || "mdi:gesture-tap")}"></ha-icon>`}</span></span>`;
      return `<div class="chip${lk.active && so ? " on" : ""}${noIcon ? " noicon" : ""}" data-act="chip${i}" role="button" tabindex="0" style="--tt-color:${lk.color};--tt-c:${lk.c}">${icon}${text ? `<span>${esc(text)}</span>` : ""}</div>`;
    });
    return `<div class="chips">${out.join("")}</div>`;
  }
  _chipTpl(i, src, so) {
    if (isJinja(src)) return this._tplVals["chip" + i] != null ? this._tplVals["chip" + i] : "…";
    return localTemplate(src, this._hass, so);
  }

  _render() {
    const c = this._cfg, hass = this._hass;
    if (!c || !hass) return null;
    this._resetRegs();
    const so = c.entity ? hass.states[c.entity] : null;
    if (c.entity && !so) {
      return `<ha-card class="tt"><div class="warn">⚠ ${esc(tr(hass, "not_found"))}: ${esc(c.entity)}</div></ha-card>`;
    }
    const d = domainOf(c.entity);
    const look = resolveLook(hass, so, c);
    const ctrl = this._applyOpt("card", so ? getControl(hass, so) : null);
    const prog = computeProgress(so, c, ctrl);
    this._needsSecondTick = d === "timer" && so && so.state === "active";

    // slider / fill / ring
    let sliderMode = c.slider === "auto" ? (c.layout === "square" || c.layout === "vertical" ? "card" : "bar") : c.slider;
    if (!ctrl) sliderMode = "none";
    let fill = c.fill;
    if (fill === "auto") fill = sliderMode === "card" ? "horizontal" : "none";
    if (sliderMode === "card" && fill === "none") fill = "horizontal";
    if (fill === true) fill = "horizontal";
    const dc = so && so.attributes.device_class;
    const showRing = c.ring === true || c.ring === "true" || (c.ring === "auto" && (d === "timer" || dc === "battery") && fill === "none");

    // graph
    const gType = so || c.graph_entity ? this._graphType() : null;
    this._graphOn = !!gType;
    let gPos = c.graph_position;
    if (gPos === "auto") gPos = c.layout === "hero" || c.layout === "square" || c.layout === "vertical" ? "background" : "bottom";
    this._graphPos = gPos;
    let graph = "";
    if (gType && this._hist) {
      const gso = hass.states[this._graphEntityId()];
      const fn = valueColorFn(c, gso);
      const stateColor = (s) => {
        if (!gso) return "var(--tt-color)";
        const lk = resolveLook(hass, { ...gso, state: s }, c);
        return lk.active || lk.forced ? lk.color : "color-mix(in srgb, var(--tt-off) 35%, transparent)";
      };
      graph = buildGraph({ hist: this._hist, type: gType, w: 300, h: gPos === "background" ? 80 : 44, uid: this._uid, colorFn: fn, stateColor, buckets: Number(c.graph_points) || 40 }).svg;
    }

    // texts
    const name = this._tpl("primary", c.primary, so) ?? (c.name != null ? localTemplate(String(c.name), hass, so) : so ? entityName(hass, so, c.entity) : "");
    const stateTxt = so ? (look.unavailable ? tr(hass, "unavailable") : formatState(hass, so)) : "";
    let secondary = this._tpl("secondary", c.secondary, so);
    const heroValue = c.layout === "hero" && so && !look.unavailable;
    if (secondary == null && c.show_state !== false && so) {
      const rel = relTime(so.last_changed, hass);
      const map = {
        state: heroValue ? rel : stateTxt,
        "last-changed": rel, "last-updated": relTime(so.last_updated, hass),
        "state-last-changed": heroValue ? rel : `${stateTxt} · ${rel}`,
        none: "",
      };
      secondary = c.secondary_info in map ? map[c.secondary_info]
        : c.secondary_info && c.secondary_info.startsWith("attr:") ? formatAttr(hass, so, c.secondary_info.slice(5)) : stateTxt;
      if (c.secondary_attribute && so.attributes[c.secondary_attribute] != null) secondary += ` · ${formatAttr(hass, so, c.secondary_attribute)}`;
    }
    const tertiary = this._tpl("tertiary", c.tertiary, so);

    // actions
    const toggleable = so && TOGGLE_DOMAINS.has(d);
    const defaultTap = c.entity || c.popup_cards || c.popup_buttons ? { action: "toptop-popup" } : { action: "none" };
    this._actDefs.main = {
      entity: c.entity, tap_action: c.tap_action || defaultTap,
      hold_action: c.hold_action || (c.entity ? { action: "more-info" } : { action: "none" }),
      double_tap_action: c.double_tap_action, cardSlider: sliderMode === "card" ? "card" : null,
    };
    this._actDefs.icon = {
      entity: c.entity,
      tap_action: c.icon_tap_action || (so && ICON_TOGGLE.has(d) ? { action: "toggle" } : c.tap_action || defaultTap),
      hold_action: c.icon_hold_action || this._actDefs.main.hold_action,
      double_tap_action: c.icon_double_tap_action,
    };
    if (sliderMode !== "none") this._regSlider({ ...ctrl }, "card");

    // pieces
    const badge = this._badgeHtml(so, look);
    const shape = c.show_icon !== false ? this._shapeHtml(so, look, c, prog, showRing, badge, "icon") : "";
    const info = `<div class="info">${c.show_name !== false && name ? `<div class="primary">${esc(name)}</div>` : ""}${secondary ? `<div class="secondary">${esc(secondary)}</div>` : ""}${tertiary ? `<div class="tertiary">${esc(tertiary)}</div>` : ""}</div>`;
    const ctrls = c.controls && so && !look.unavailable ? this._controlsHtml(so) : "";
    const ctrlsHtml = ctrls ? `<div class="ctrls">${ctrls}</div>` : "";

    let content;
    if (c.layout === "hero") {
      const [num, unit] = splitValue(stateTxt);
      const big = heroValue ? `<div class="big">${esc(num)}${unit ? `<span class="unit">${esc(unit)}</span>` : ""}</div>` : "";
      content = `<div class="row">${shape}${info}${ctrlsHtml}</div>${big}`;
    } else if (c.layout === "square") {
      content = `<div class="sq-top">${shape}${ctrlsHtml}</div>${info}`;
    } else {
      content = `${shape}${info}${ctrlsHtml}`;
    }

    const layers = [];
    const bgi = c.background_image === "entity_picture" ? so && so.attributes.entity_picture : c.background_image;
    if (bgi) layers.push(`<div class="layer bgimg" data-k="img" style="background-image:url('${esc(bgi)}')"></div>`);
    if (c.style === "aurora") layers.push(`<div class="layer aurora" data-k="aur"><i></i><i></i><i></i></div>`);
    if (fill !== "none" && fill !== false && prog != null) {
      const liquid = fill === "liquid";
      const waves = liquid ? `<svg class="wave" viewBox="0 0 200 10" preserveAspectRatio="none"><path d="M0 5 Q25 0 50 5 T100 5 T150 5 T200 5 V10 H0Z"/></svg><svg class="wave w2" viewBox="0 0 200 10" preserveAspectRatio="none"><path d="M0 5 Q25 10 50 5 T100 5 T150 5 T200 5 V10 H0Z"/></svg>` : "";
      layers.push(`<div class="layer" data-k="fill"><div class="fill${liquid ? " f-liquid" : ""}">${waves}</div></div>`);
    }
    if (graph && gPos === "background") layers.push(`<div class="layer gbg" data-k="gbg">${graph}</div>`);
    if (look.effect === "shimmer") layers.push(`<div class="layer shimmer" data-k="shim"></div>`);
    if (look.effect === "border") layers.push(`<div class="layer bspin" data-k="bspin"><i></i></div>`);
    if (c.tilt) layers.push(`<div class="layer glare" data-k="glare"></div>`);
    layers.push(`<div class="layer ripples" data-k="rp" data-keep></div>`);

    const dark = hass.themes && hass.themes.darkMode;
    const cls = [
      "tt", `l-${c.layout}`, `s-${c.size}`, `st-${c.style}`, look.active || look.forced ? "on" : "off",
      look.effect && look.effect !== "none" ? `fx-${look.effect}` : "", look.unavailable ? "unavail" : "",
      dark ? "dark" : "", sliderMode === "card" ? "slider-card" : "", bgi ? "has-img" : "",
    ].filter(Boolean).join(" ");

    const sliderRow = sliderMode === "bar"
      ? `<div class="bar-row">${this._sliderHtml("card", ctrl, { icon: ctrl.icon, label: c.layout === "compact" ? "" : tr(hass, ctrl.label) })}</div>`
      : "";
    const graphBottom = graph && gPos === "bottom" ? `<div class="gbot${gType === "timeline" ? " timeline" : ""}">${graph}</div>` : "";
    const dragVal = sliderMode === "card" ? `<div class="drag-val">${esc(this._fmtCtrl(ctrl, ctrl.value))}</div>` : "";
    const styles = c.styles ? `<style>${c.styles}</style>` : "";

    return `${styles}<ha-card class="${cls}" style="--tt-color:${look.color};--tt-c:${look.c};--p:${prog == null ? 0 : prog.toFixed(4)}" data-act="main" tabindex="0" role="button" aria-label="${esc(name)}">
${layers.join("")}
<div class="content">${content}</div>${sliderRow}${graphBottom}${this._chipsHtml()}${dragVal}
</ha-card>`;
  }
}

// ---- 04-popup.js ----
/* ------------------------------------------------------------------ */
/*  popup (bottom sheet on phones, dialog on desktop)                  */
/* ------------------------------------------------------------------ */
const SKIP_ATTRS = new Set([
  "friendly_name", "icon", "entity_picture", "supported_features", "supported_color_modes",
  "restored", "editable", "id", "context", "entity_picture_local", "media_content_id",
  "effect_list", "hvac_modes", "preset_modes", "fan_modes", "swing_modes", "source_list",
  "sound_mode_list", "options", "fan_speed_list", "available_tones",
]);
const SWATCHES = ["#ff3b30", "#ff9500", "#ffcc00", "#34c759", "#00c7be", "#32ade6", "#007aff", "#5856d6", "#af52de", "#ff2d55"];
const RANGES = [[6, "6h"], [24, "24h"], [72, "3d"], [168, "7d"]];

class TopTopPopup extends TTBase {
  open(card, entity, cfg) {
    this._card = card;
    this._entity = entity;
    this._cfg = { ...DEFAULTS, ...cleanCfg(cfg) };
    this._hass = card._hass;
    this._cfgHaptic = card._cfgHaptic;
    this._range = Number(this._cfg.popup_graph_hours) || 24;
    this._code = "";
    this.shadowRoot.innerHTML = `<style>${BASE_CSS}${POPUP_CSS}${this._cfg.popup_styles || ""}</style>
      <div class="backdrop"></div>
      <div class="sheet" role="dialog" aria-modal="true">
        <div class="grab"></div><div class="inner"></div><div class="sec cards"></div><div class="inner tail"></div>
      </div>`;
    this._sheet = this.shadowRoot.querySelector(".sheet");
    this._roots = this.shadowRoot.querySelectorAll(".inner");
    // Close only when a press both starts and ends on the backdrop. On touch devices the
    // browser fires a delayed "click" after the tap that opened the popup – it would land
    // on the freshly created backdrop and close the popup immediately.
    const backdrop = this.shadowRoot.querySelector(".backdrop");
    this._openedAt = Date.now();
    let downOnBackdrop = false;
    backdrop.addEventListener("pointerdown", () => { downOnBackdrop = Date.now() - this._openedAt > 300; });
    backdrop.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (downOnBackdrop) this.close();
      downOnBackdrop = false;
    });
    this._bindSwipe();
    document.body.appendChild(this);
    this._flush();
    requestAnimationFrame(() => requestAnimationFrame(() => this.classList.add("open")));
    this._onKeyEsc = (e) => { if (e.key === "Escape") this.close(); };
    window.addEventListener("keydown", this._onKeyEsc);
    this._tick = 0;
    this._interval = setInterval(() => {
      this._tick++;
      const so = this._so();
      if ((so && domainOf(so.entity_id) === "timer" && so.state === "active") || this._tick % 20 === 0) this._scheduleRender();
    }, 1000);
    this._loadHistory();
    this._buildCards();
  }

  close(immediate) {
    if (this._closing) return;
    this._closing = true;
    window.removeEventListener("keydown", this._onKeyEsc);
    clearInterval(this._interval);
    if (this._card && this._card._popup === this) this._card._popup = null;
    this.classList.remove("open");
    setTimeout(() => this.remove(), immediate ? 0 : 400);
  }

  set hass(h) {
    const old = this._hass;
    this._hass = h;
    (this._cardEls || []).forEach((el) => { el.hass = h; });
    const so = this._so();
    if (!old || !so || old.states[this._entity] !== so || this._watchChanged(old, h)) {
      if (so && this._ph) {
        const t = new Date(so.last_updated).getTime(), last = this._ph.points[this._ph.points.length - 1];
        if (!last || t > last.t) this._ph.points.push({ t, s: so.state });
      }
      this._scheduleRender();
    }
  }
  _watchChanged(old, h) {
    return (this._cfg.popup_buttons || []).some((b) => b && b.entity && old.states[b.entity] !== h.states[b.entity]);
  }
  _so() { return this._entity ? this._hass.states[this._entity] : null; }

  _mount() { return this._roots; }
  _flush() {
    if (this._dragging) return;
    const parts = this._render();
    if (!parts) return;
    patchHTML(this._roots[0], parts[0]);
    patchHTML(this._roots[1], parts[1]);
    this._afterRender();
  }

  _bindSwipe() {
    this._sheet.addEventListener("pointerdown", (e) => {
      if (!e.target.closest(".grab,.head") || e.target.closest("[data-cmd]") || window.innerWidth >= 700) return;
      const y0 = e.clientY;
      let dy = 0;
      this.classList.add("dragging");
      const move = (ev) => {
        dy = Math.max(0, ev.clientY - y0);
        this._sheet.style.transform = `translate(-50%, ${dy}px)`;
      };
      const up = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        window.removeEventListener("pointercancel", up);
        this.classList.remove("dragging");
        this._sheet.style.transform = "";
        if (dy > 110) this.close();
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
      window.addEventListener("pointercancel", up);
    });
  }

  async _buildCards() {
    const list = this._cfg.popup_cards;
    const host = this.shadowRoot.querySelector(".cards");
    if (!Array.isArray(list) || !list.length) return;
    let helpers = null;
    try { helpers = window.loadCardHelpers ? await window.loadCardHelpers() : null; } catch (e) { /* ignore */ }
    this._cardEls = list.map((conf) => {
      let el = null;
      try { if (helpers) el = helpers.createCardElement(conf); } catch (e) { /* ignore */ }
      if (!el) {
        el = document.createElement("div");
        el.style.cssText = "padding:12px;border-radius:14px;background:var(--tt-surface);font-size:12px";
        el.textContent = `${conf && conf.type}`;
      }
      el.hass = this._hass;
      host.appendChild(el);
      return el;
    });
  }

  async _loadHistory() {
    const so = this._so();
    if (!so || this._cfg.popup_history === false || !this._hass.callWS) return;
    const want = this._range;
    this._ph = null;
    this._scheduleRender();
    try {
      const res = await fetchHistory(this._hass, so.entity_id, want);
      if (want === this._range) { this._ph = res; this._scheduleRender(); }
    } catch (e) {
      this._ph = { points: [], hours: want, failed: true };
      this._scheduleRender();
    }
  }

  _onClick(e) {
    // swallow the ghost click of the tap that opened the popup
    if (Date.now() - (this._openedAt || 0) < 350) { e.stopPropagation(); return; }
    super._onClick(e);
  }

  _dispatchAction(def, kind, a) {
    if (["more-info", "navigate", "url", "assist"].includes(a.action)) this.close();
    fire(this._card || this, "hass-action", { config: { entity: def.entity, [kind + "_action"]: a }, action: kind });
  }
  _openPopup(def) {
    if (this._card) this._card._openPopup(def);
  }

  /* ---------------- helpers ---------------- */
  _svc(dom, s, data) {
    const id = this._entity;
    return () => this._hass.callService(dom, s, { entity_id: id, ...(data || {}) });
  }
  _bigbtn(icon, fn, on, label) {
    return `<div class="bigbtn${on ? " on" : ""}" data-cmd="${this._reg(fn)}" role="button" tabindex="0" ${label ? `title="${esc(label)}" aria-label="${esc(label)}"` : ""}><ha-icon icon="${icon}"></ha-icon></div>`;
  }
  _pbtn(icon, label, fn, sel, color) {
    return `<div class="pbtn${sel ? " sel" : ""}" data-cmd="${this._reg(fn)}" role="button" tabindex="0"${color ? ` style="--pc:${color}"` : ""}><ha-icon icon="${icon}"></ha-icon><span>${esc(label)}</span></div>`;
  }
  _opts(list, current, fn, fmt) {
    if (!Array.isArray(list) || !list.length) return "";
    return `<div class="opts">${list.slice(0, 40).map((o) => `<div class="opt${o === current ? " sel" : ""}" data-cmd="${this._reg(() => fn(o))}" role="button" tabindex="0">${esc(fmt ? fmt(o) : o)}</div>`).join("")}</div>`;
  }
  _sec(title, body, extra = "") {
    if (!body) return "";
    return `<div class="sec">${title ? `<div class="sec-t"><span>${esc(title)}</span>${extra}</div>` : ""}${body}</div>`;
  }
  _fmtStateOf(so, state) {
    try { if (this._hass.formatEntityState) return this._hass.formatEntityState(so, state); } catch (e) { /* ignore */ }
    return state;
  }
  _fmtAttrVal(so, attr, val) {
    try { if (this._hass.formatEntityAttributeValue) return this._hass.formatEntityAttributeValue(so, attr, val); } catch (e) { /* ignore */ }
    return String(val).replace(/_/g, " ");
  }
  _bigValue(so) {
    const [num, unit] = splitValue(formatState(this._hass, so));
    if (!/\d/.test(num)) return `<div class="bigval txt">${esc(num)}</div>`;
    return `<div class="bigval">${esc(num)}${unit ? `<span class="unit">${esc(unit)}</span>` : ""}</div>`;
  }
  _tallToggle(so, look) {
    const on = isActive(so);
    return `<div class="tt-slider v" style="--v:${on ? 1 : 0};cursor:pointer" data-cmd="${this._reg(() => toggleEntity(this._hass, so.entity_id))}" role="switch" aria-checked="${on}" tabindex="0">
      <div class="tt-slider-bar"></div><div class="tt-slider-lab" style="color:${on ? "#fff" : "var(--tt-text)"}"><ha-icon icon="mdi:power"></ha-icon><span class="tt-slider-val">${esc(on ? tr(this._hass, "on") : tr(this._hass, "off"))}</span></div></div>`;
  }

  /* ---------------- domain controls ---------------- */
  _controls(so, look) {
    const hass = this._hass, d = domainOf(so.entity_id), a = so.attributes, st = so.state, T = (k) => tr(hass, k);
    if (look.unavailable) return `<div class="bigval" style="font-size:28px;letter-spacing:0">${esc(T("unavailable"))}</div>`;
    switch (d) {
      case "light": {
        const ctrl = this._applyOpt("bri", getControl(hass, so));
        const on = st === "on";
        let h = `<div class="hero">${ctrl ? this._sliderHtml(this._regSlider({ ...ctrl }, "bri"), ctrl, { vertical: true, icon: "mdi:brightness-6" }) : this._tallToggle(so, look)}
          ${ctrl ? `<div class="side">${this._bigbtn("mdi:power", () => toggleEntity(hass, so.entity_id), on, T("power"))}</div>` : ""}</div>`;
        const modes = a.supported_color_modes || [];
        if (modes.includes("color_temp") && a.min_color_temp_kelvin && a.max_color_temp_kelvin) {
          const min = a.min_color_temp_kelvin, max = a.max_color_temp_kelvin;
          const ct = this._applyOpt("ct", {
            min, max, step: 50, unit: "K", value: a.color_temp_kelvin || Math.round((min + max) / 2),
            set: (v) => hass.callService("light", "turn_on", { entity_id: so.entity_id, color_temp_kelvin: v }),
          });
          const grad = `linear-gradient(90deg, ${rgbStr(kelvinToRgb(min))}, ${rgbStr(kelvinToRgb((min + max) / 2))}, ${rgbStr(kelvinToRgb(max))})`;
          h += this._sec(T("color_temp"), this._sliderHtml(this._regSlider({ ...ct }, "ct"), ct, { grad, icon: "mdi:thermometer" }));
        }
        if (modes.some((m) => ["hs", "rgb", "rgbw", "rgbww", "xy"].includes(m))) {
          const set = (hex) => hass.callService("light", "turn_on", { entity_id: so.entity_id, rgb_color: toRgb(hex) });
          const cur = Array.isArray(a.rgb_color) ? "#" + a.rgb_color.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("") : "#ffffff";
          h += this._sec(T("color"), `<div class="swatches">${SWATCHES.map((s) => `<div class="sw" style="background:${s}" data-cmd="${this._reg(() => set(s))}" role="button" tabindex="0" aria-label="${s}"></div>`).join("")}
            <label class="sw custom"><input type="color" value="${cur}" data-change="${this._reg((el) => set(el.value))}"></label></div>`);
        }
        if (Array.isArray(a.effect_list) && a.effect_list.length) {
          h += this._sec(T("effect"), this._opts(a.effect_list, a.effect, (o) => hass.callService("light", "turn_on", { entity_id: so.entity_id, effect: o })));
        }
        return h;
      }
      case "cover": case "valve": {
        const ctrl = this._applyOpt("pos", getControl(hass, so));
        const pre = d === "cover" ? "_cover" : "_valve";
        let h = `<div class="hero">${ctrl ? this._sliderHtml(this._regSlider({ ...ctrl }, "pos"), ctrl, { vertical: true, icon: "mdi:arrow-up-down" }) : this._bigValue(so)}
          <div class="side">${this._bigbtn("mdi:arrow-up", this._svc(d, "open" + pre), st === "open" || st === "opening", T("open"))}
          ${this._bigbtn("mdi:stop", this._svc(d, "stop" + pre), false, T("stop"))}
          ${this._bigbtn("mdi:arrow-down", this._svc(d, "close" + pre), st === "closed" || st === "closing", T("close_cover"))}</div></div>`;
        const tilt = d === "cover" ? this._applyOpt("tilt", getControl(hass, so, "tilt")) : null;
        if (tilt) h += this._sec(T("tilt"), this._sliderHtml(this._regSlider({ ...tilt }, "tilt"), tilt, { icon: "mdi:angle-acute" }));
        return h;
      }
      case "fan": {
        const ctrl = this._applyOpt("fan", getControl(hass, so));
        const on = st === "on";
        let side = this._bigbtn("mdi:power", () => toggleEntity(hass, so.entity_id), on, T("power"));
        if (a.oscillating !== undefined) side += this._bigbtn("mdi:arrow-oscillating", this._svc("fan", "oscillate", { oscillating: !a.oscillating }), a.oscillating, T("oscillate"));
        if (a.direction) side += this._bigbtn(a.direction === "forward" ? "mdi:rotate-right" : "mdi:rotate-left", this._svc("fan", "set_direction", { direction: a.direction === "forward" ? "reverse" : "forward" }), false, T("direction"));
        let h = `<div class="hero">${ctrl ? this._sliderHtml(this._regSlider({ ...ctrl }, "fan"), ctrl, { vertical: true, icon: "mdi:fan" }) : this._tallToggle(so, look)}<div class="side">${side}</div></div>`;
        h += this._sec(T("preset"), this._opts(a.preset_modes, a.preset_mode, (o) => hass.callService("fan", "set_preset_mode", { entity_id: so.entity_id, preset_mode: o }), (o) => this._fmtAttrVal(so, "preset_mode", o)));
        return h;
      }
      case "climate": case "water_heater": return this._climate(so, look);
      case "media_player": {
        const pic = a.entity_picture;
        const playing = st === "playing";
        let h = `<div class="media-art" style="${pic ? `background-image:url('${esc(pic)}')` : ""}">${pic ? "" : `<ha-icon icon="mdi:music-note"></ha-icon>`}</div>
          <div class="media-t"><b>${esc(a.media_title || this._fmtStateOf(so, st))}</b><span>${esc([a.media_artist, a.media_album_name].filter(Boolean).join(" · "))}</span></div>
          <div class="mctrl">${this._bigbtn("mdi:skip-previous", this._svc(d, "media_previous_track"))}
          ${this._bigbtn(playing ? "mdi:pause" : "mdi:play", this._svc(d, "media_play_pause"), playing)}
          ${this._bigbtn("mdi:skip-next", this._svc(d, "media_next_track"))}
          ${this._bigbtn("mdi:power", () => toggleEntity(hass, so.entity_id), st !== "off", T("power"))}</div>`;
        const vol = this._applyOpt("vol", getControl(hass, so));
        if (vol) h += this._sec(T("volume"), this._sliderHtml(this._regSlider({ ...vol }, "vol"), vol, { icon: a.is_volume_muted ? "mdi:volume-off" : "mdi:volume-high" }));
        h += this._sec(T("source"), this._opts(a.source_list, a.source, (o) => hass.callService("media_player", "select_source", { entity_id: so.entity_id, source: o })));
        return h;
      }
      case "lock": {
        const locked = st === "locked";
        let h = this._bigValue(so) + `<div class="mctrl">${this._bigbtn(locked ? "mdi:lock-open-variant" : "mdi:lock", this._svc("lock", locked ? "unlock" : "lock"), !locked, T(locked ? "unlock" : "lock"))}`;
        if ((a.supported_features || 0) & 1) h += this._bigbtn("mdi:door-open", this._svc("lock", "open"), false, T("open_lock"));
        return h + "</div>";
      }
      case "alarm_control_panel": return this._alarm(so);
      case "vacuum": case "lawn_mower": {
        const isV = d === "vacuum";
        let h = this._bigValue(so) + `<div class="grid" style="margin-top:16px">`;
        h += this._pbtn("mdi:play", T("start"), this._svc(d, isV ? "start" : "start_mowing"), st === "cleaning" || st === "mowing");
        h += this._pbtn("mdi:pause", T("pause"), this._svc(d, "pause"), st === "paused");
        if (isV) h += this._pbtn("mdi:stop", T("stop"), this._svc(d, "stop"));
        h += this._pbtn("mdi:home-import-outline", T("return_home"), this._svc(d, isV ? "return_to_base" : "dock"), st === "returning" || st === "docked");
        if (isV) h += this._pbtn("mdi:map-marker-question", T("locate"), this._svc(d, "locate"));
        h += "</div>";
        if (isV) h += this._sec(T("fan_speed"), this._opts(a.fan_speed_list, a.fan_speed, (o) => hass.callService("vacuum", "set_fan_speed", { entity_id: so.entity_id, fan_speed: o })));
        return h;
      }
      case "select": case "input_select":
        return this._bigValue(so) + this._sec(T("options"), this._opts(a.options, st, (o) => hass.callService(d, "select_option", { entity_id: so.entity_id, option: o })));
      case "input_number": case "number": {
        const ctrl = this._applyOpt("num", getControl(hass, so));
        return `<div class="hero">${this._sliderHtml(this._regSlider({ ...ctrl }, "num"), ctrl, { vertical: true })}</div>`;
      }
      case "humidifier": {
        const ctrl = this._applyOpt("hum", getControl(hass, so));
        return `<div class="hero">${ctrl ? this._sliderHtml(this._regSlider({ ...ctrl }, "hum"), ctrl, { vertical: true, icon: "mdi:water-percent" }) : ""}<div class="side">${this._bigbtn("mdi:power", () => toggleEntity(hass, so.entity_id), st === "on")}</div></div>` +
          this._sec(T("mode"), this._opts(a.available_modes, a.mode, (o) => hass.callService("humidifier", "set_mode", { entity_id: so.entity_id, mode: o })));
      }
      case "button": case "input_button": case "scene": case "script": {
        const fn = d === "scene" ? this._svc("scene", "turn_on") : d === "script" ? this._svc("script", st === "on" ? "turn_off" : "turn_on") : this._svc(d, "press");
        return `<div class="mctrl" style="margin-top:22px">${this._bigbtn(d === "script" && st === "on" ? "mdi:stop" : "mdi:play", fn, true, T("run"))}</div>`;
      }
      case "timer": {
        const act = st === "active";
        return this._bigValue(so) + `<div class="mctrl">${this._bigbtn(act ? "mdi:pause" : "mdi:play", this._svc("timer", act ? "pause" : "start"), act)}
          ${this._bigbtn("mdi:stop", this._svc("timer", "cancel"), false, T("cancel"))}${this._bigbtn("mdi:flag-checkered", this._svc("timer", "finish"), false, T("finish"))}</div>`;
      }
      case "update":
        return `<div class="stats"><div class="stat"><span>${esc(T("installed"))}</span><b>${esc(a.installed_version || "–")}</b></div><div class="stat"><span>${esc(T("latest"))}</span><b>${esc(a.latest_version || "–")}</b></div><div class="stat"><span>&nbsp;</span>${st === "on" ? `<div class="opt sel" data-cmd="${this._reg(this._svc("update", "install"))}">${esc(T("install"))}</div>` : "<b>✓</b>"}</div></div>`;
      case "camera":
        return a.entity_picture ? `<img class="camimg" src="${esc(a.entity_picture)}" alt="">` : this._bigValue(so);
      case "weather": {
        const u = (k) => a[k] != null ? `${a[k]} ${a[k + "_unit"] || ""}`.trim() : "–";
        return `<div class="bigval">${esc(a.temperature != null ? a.temperature : "–")}<span class="unit">${esc(a.temperature_unit || "")}</span></div>
          <div style="text-align:center;color:var(--tt-text2);margin-top:6px">${esc(this._fmtStateOf(so, st))}</div>
          <div class="wx sec">${[["humidity", a.humidity != null ? `${a.humidity} %` : "–"], ["pressure", u("pressure")], ["wind", u("wind_speed")]].map(([k, v]) => `<div class="stat"><span>${esc(T(k))}</span><b>${esc(v)}</b></div>`).join("")}</div>`;
      }
      default:
        if (TOGGLE_DOMAINS.has(d)) return `<div class="hero">${this._tallToggle(so, look)}</div>`;
        return this._bigValue(so);
    }
  }

  _climate(so, look) {
    const hass = this._hass, a = so.attributes, d = domainOf(so.entity_id), T = (k) => tr(hass, k);
    const base = getControl(hass, so);
    const ctrl = this._applyOpt("clim", base);
    let h = "";
    if (ctrl) {
      const f = clamp((ctrl.value - ctrl.min) / (ctrl.max - ctrl.min || 1), 0, 1);
      const arc = (a0, a1, r = 96) => {
        const p = (ang) => [120 + r * Math.cos((ang * Math.PI) / 180), 118 + r * Math.sin((ang * Math.PI) / 180)];
        const [x0, y0] = p(a0), [x1, y1] = p(a1);
        return `M${x0.toFixed(2)} ${y0.toFixed(2)} A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
      };
      const end = 135 + 270 * f;
      const tp = [120 + 96 * Math.cos((end * Math.PI) / 180), 118 + 96 * Math.sin((end * Math.PI) / 180)];
      let curMark = "";
      if (isNum(a.current_temperature)) {
        const cf = clamp((a.current_temperature - ctrl.min) / (ctrl.max - ctrl.min || 1), 0, 1), ca = ((135 + 270 * cf) * Math.PI) / 180;
        curMark = `<circle cx="${(120 + 96 * Math.cos(ca)).toFixed(2)}" cy="${(118 + 96 * Math.sin(ca)).toFixed(2)}" r="4" style="fill:var(--tt-text2)"/>`;
      }
      const step = (dir) => () => {
        const cur = this._climPending != null ? this._climPending : ctrl.value;
        this._climPending = clamp(snap(cur + dir * ctrl.step, ctrl.min, ctrl.step), ctrl.min, ctrl.max);
        this._opt.clim = { v: this._climPending, t: Date.now() };
        this._scheduleRender();
        clearTimeout(this._climTimer);
        this._climTimer = setTimeout(() => { const v = this._climPending; this._climPending = null; base.set(v); }, 900);
      };
      const act = a.hvac_action ? this._fmtAttrVal(so, "hvac_action", a.hvac_action) : this._fmtStateOf(so, so.state);
      const [num] = splitValue(this._fmtCtrl({ ...ctrl, unit: "" }, ctrl.value));
      h += `<div class="dial"><svg viewBox="0 0 240 220">
          <path d="${arc(135, 405)}" style="fill:none;stroke:color-mix(in srgb, var(--tt-c) 16%, transparent);stroke-width:16;stroke-linecap:round"/>
          ${f > 0.002 ? `<path d="${arc(135, end)}" style="fill:none;stroke:var(--tt-c);stroke-width:16;stroke-linecap:round;filter:drop-shadow(0 0 6px color-mix(in srgb, var(--tt-c) 60%, transparent))"/>` : ""}
          ${curMark}<circle cx="${tp[0].toFixed(2)}" cy="${tp[1].toFixed(2)}" r="11" style="fill:#fff;stroke:var(--tt-c);stroke-width:4"/>
        </svg><div class="center"><div class="act">${esc(act)}</div><div class="tv">${esc(num)}<small>${esc(ctrl.unit)}</small></div>
        ${isNum(a.current_temperature) ? `<div class="cur">${esc(T("current"))} ${esc(this._fmtCtrl({ ...ctrl, step: 0.1 }, a.current_temperature))}</div>` : ""}</div></div>
        <div class="dialbtns">${this._bigbtn("mdi:minus", step(-1))}${this._bigbtn("mdi:plus", step(1))}</div>`;
    } else {
      h += this._bigValue(so);
    }
    if (d === "climate") {
      const modeIcon = { off: "mdi:power", heat: "mdi:fire", cool: "mdi:snowflake", heat_cool: "mdi:sun-snowflake-variant", auto: "mdi:thermostat-auto", dry: "mdi:water-percent", fan_only: "mdi:fan" };
      const modeColor = { heat: "var(--deep-orange-color, #ff6f22)", cool: "var(--blue-color, #2196f3)", heat_cool: "var(--amber-color, #ffc107)", auto: "var(--green-color, #4caf50)", dry: "var(--amber-color, #ffc107)", fan_only: "var(--cyan-color, #00bcd4)", off: "var(--tt-off)" };
      if (Array.isArray(a.hvac_modes) && a.hvac_modes.length) {
        h += this._sec(T("mode"), `<div class="grid">${a.hvac_modes.map((m) => this._pbtn(modeIcon[m] || "mdi:thermostat", this._fmtStateOf(so, m), this._svc("climate", "set_hvac_mode", { hvac_mode: m }), m === so.state, modeColor[m])).join("")}</div>`);
      }
      h += this._sec(T("preset"), this._opts(a.preset_modes, a.preset_mode, (o) => hass.callService("climate", "set_preset_mode", { entity_id: so.entity_id, preset_mode: o }), (o) => this._fmtAttrVal(so, "preset_mode", o)));
      h += this._sec(T("fan_mode"), this._opts(a.fan_modes, a.fan_mode, (o) => hass.callService("climate", "set_fan_mode", { entity_id: so.entity_id, fan_mode: o }), (o) => this._fmtAttrVal(so, "fan_mode", o)));
    } else {
      h += this._sec(T("mode"), this._opts(a.operation_list, a.operation_mode, (o) => hass.callService("water_heater", "set_operation_mode", { entity_id: so.entity_id, operation_mode: o })));
    }
    return h;
  }

  _alarm(so) {
    const hass = this._hass, a = so.attributes, st = so.state, T = (k) => tr(hass, k), f = a.supported_features || 0;
    const call = (svc) => () => {
      const data = { entity_id: so.entity_id };
      if (this._code) data.code = this._code;
      hass.callService("alarm_control_panel", svc, data);
      this._code = "";
      this._scheduleRender();
    };
    let h = this._bigValue(so);
    if (a.code_format) {
      h += `<div class="codeview">${"•".repeat(this._code.length) || "&nbsp;"}</div><div class="keypad">`;
      for (const k of ["1", "2", "3", "4", "5", "6", "7", "8", "9", "C", "0", "⌫"]) {
        h += `<div class="bigbtn" data-cmd="${this._reg(() => {
          if (k === "C") this._code = "";
          else if (k === "⌫") this._code = this._code.slice(0, -1);
          else this._code += k;
          this._scheduleRender();
        })}" role="button" tabindex="0">${k}</div>`;
      }
      h += "</div>";
    }
    let b = "";
    if (st !== "disarmed") b += this._pbtn("mdi:shield-off-outline", T("disarm"), call("alarm_disarm"), false, "var(--green-color, #4caf50)");
    else {
      if (f & 1) b += this._pbtn("mdi:shield-home", T("arm_home"), call("alarm_arm_home"), false, "var(--amber-color, #ffc107)");
      if (f & 2) b += this._pbtn("mdi:shield-lock", T("arm_away"), call("alarm_arm_away"), false, "var(--red-color, #f44336)");
      if (f & 4) b += this._pbtn("mdi:shield-moon", T("arm_night"), call("alarm_arm_night"), false, "var(--indigo-color, #3f51b5)");
      if (f & 32) b += this._pbtn("mdi:shield-airplane", T("arm_vacation"), call("alarm_arm_vacation"), false, "var(--purple-color, #926bc7)");
    }
    return h + `<div class="grid sec">${b}</div>`;
  }

  _historySection(so) {
    const hass = this._hass, T = (k) => tr(hass, k);
    if (this._cfg.popup_history === false) return "";
    const tabs = `<div class="tabs">${RANGES.map(([hrs, lab]) => `<div class="tab${hrs === this._range ? " sel" : ""}" data-cmd="${this._reg(() => { this._range = hrs; this._loadHistory(); })}" role="button" tabindex="0">${lab}</div>`).join("")}</div>`;
    const ph = this._ph;
    if (!ph) return this._sec(T("history"), `<div class="graph"></div>`, tabs);
    if (!ph.points.length) return this._sec(T("history"), `<div class="stat" style="text-align:center">${esc(T("no_data"))}</div>`, tabs);
    const numeric = isNum(so.state) || ph.points.filter((p) => isNum(p.s)).length > ph.points.length / 2;
    const cfg = this._cfg;
    if (numeric) {
      const g = buildGraph({ hist: ph, type: cfg.graph === "bar" ? "bar" : "line", w: 320, h: 150, uid: "p" + this._uid, colorFn: valueColorFn(cfg, so), buckets: 72 });
      const unit = so.attributes.unit_of_measurement || "";
      const fmt = (v) => {
        let s;
        try { s = new Intl.NumberFormat(langOf(hass), { maximumFractionDigits: Math.abs(v) < 10 ? 2 : 1 }).format(v); } catch (e) { s = v.toFixed(1); }
        return unit ? `${s} ${unit}` : s;
      };
      const stats = g.stats ? `<div class="stats"><div class="stat"><span>${esc(T("min"))}</span><b>${esc(fmt(g.stats.min))}</b></div><div class="stat"><span>${esc(T("avg"))}</span><b>${esc(fmt(g.stats.avg))}</b></div><div class="stat"><span>${esc(T("max"))}</span><b>${esc(fmt(g.stats.max))}</b></div></div>` : "";
      const ax = g.stats ? `<div class="ax" style="top:0;left:0">${esc(fmt(g.hi))}</div><div class="ax" style="bottom:0;left:0">${esc(fmt(g.lo))}</div><div class="ax" style="bottom:0;right:0">${esc(RANGES.find((r) => r[0] === this._range)?.[1] || "")}</div>` : "";
      return this._sec(T("history"), `<div class="graph">${g.svg}${ax}</div>${stats}`, tabs);
    }
    const stateColor = (s) => {
      const lk = resolveLook(hass, { ...so, state: s }, cfg);
      return lk.active || lk.forced ? lk.color : "color-mix(in srgb, var(--tt-off) 35%, transparent)";
    };
    const g = buildGraph({ hist: ph, type: "timeline", w: 320, h: 34, stateColor });
    const changes = ph.points.slice(-6).reverse().map((p) => `<div class="chg"><i style="background:${stateColor(p.s)}"></i><span>${esc(this._fmtStateOf(so, p.s))}</span><span>${esc(fmtTime(p.t, hass))}</span></div>`).join("");
    return this._sec(T("history"), `<div class="graph tl">${g.svg}</div><div class="sec-t" style="margin:16px 0 0">${esc(T("changes"))}</div><div class="changes">${changes}</div>`, tabs);
  }

  _buttonsSection() {
    const list = this._cfg.popup_buttons;
    if (!Array.isArray(list) || !list.length) return "";
    const hass = this._hass;
    const items = list.map((b, i) => {
      if (!b) return "";
      const so = b.entity ? hass.states[b.entity] : null;
      const lk = resolveLook(hass, so, b);
      const toggleable = so && TOGGLE_DOMAINS.has(domainOf(b.entity));
      this._actDefs["pb" + i] = {
        entity: b.entity,
        tap_action: b.tap_action || (toggleable ? { action: "toggle" } : so ? { action: "more-info" } : { action: "none" }),
        hold_action: b.hold_action || (so ? { action: "more-info" } : { action: "none" }),
        double_tap_action: b.double_tap_action,
        popupEntity: b.entity, popupCfg: b,
      };
      const label = b.name || (so ? entityName(hass, so) : "");
      const icon = so && !b.icon ? this._card._iconHtml(so, lk.icon) : `<ha-icon icon="${esc(b.icon || lk.icon || "mdi:gesture-tap")}"></ha-icon>`;
      const anim = lk.anim !== "none" && so ? ` a-${lk.anim}` : "";
      return `<div class="pbtn${so && lk.active ? " sel" : ""}" data-act="pb${i}" role="button" tabindex="0" style="--pc:${so ? lk.c : lk.color}">
        <span class="shape sh-none${anim}" style="--tt-icon:30px;--tt-c:var(--pc);width:30px;height:30px;--mdc-icon-size:26px"><span class="icon">${icon}</span></span>
        <span>${esc(label)}</span>${so && b.show_state !== false ? `<span style="font-weight:500;color:var(--tt-text2);font-size:11px">${esc(formatState(hass, so))}</span>` : ""}</div>`;
    }).join("");
    return this._sec(this._cfg.popup_buttons_title || tr(hass, "actions"), `<div class="grid">${items}</div>`);
  }

  _attributesSection(so) {
    if (this._cfg.popup_attributes === false) return "";
    const keys = Object.keys(so.attributes).filter((k) => !SKIP_ATTRS.has(k));
    if (!keys.length) return "";
    const T = (k) => tr(this._hass, k);
    const toggle = `<div class="tab" data-cmd="${this._reg(() => { this._attrOpen = !this._attrOpen; this._scheduleRender(); })}" role="button" tabindex="0"><ha-icon icon="${this._attrOpen ? "mdi:chevron-up" : "mdi:chevron-down"}" style="--mdc-icon-size:18px"></ha-icon></div>`;
    const body = this._attrOpen
      ? `<div class="attrs">${keys.map((k) => `<div class="k">${esc(formatAttrName(this._hass, so, k))}</div><div class="v">${esc(formatAttr(this._hass, so, k))}</div>`).join("")}</div>`
      : "";
    return `<div class="sec"><div class="sec-t"><span>${esc(T("attributes"))} (${keys.length})</span>${toggle}</div>${body}</div>`;
  }

  _render() {
    const hass = this._hass, c = this._cfg;
    if (!hass) return null;
    this._resetRegs();
    const so = this._so();
    const look = resolveLook(hass, so, c);
    this._sheet.style.setProperty("--tt-color", look.color);
    this._sheet.style.setProperty("--tt-c", look.c);
    const name = c.popup_title || c.name || (so ? entityName(hass, so, this._entity) : "");
    const sub = so ? `${look.unavailable ? tr(hass, "unavailable") : formatState(hass, so)} · ${relTime(so.last_changed, hass)}` : "";
    const anim = look.anim && look.anim !== "none" ? ` a-${look.anim}` : "";
    const toggleable = so && TOGGLE_DOMAINS.has(domainOf(so.entity_id));
    const iconCmd = toggleable ? ` data-cmd="${this._reg(() => toggleEntity(hass, so.entity_id))}" role="button" tabindex="0" style="cursor:pointer${look.spin ? `;--tt-spin:${look.spin}` : ""}"` : look.spin ? ` style="--tt-spin:${look.spin}"` : "";
    const pic = so && (domainOf(so.entity_id) === "person" || c.show_entity_picture) && so.attributes.entity_picture;
    const icon = pic ? `<img class="pic" src="${esc(pic)}" alt="">` : `<div class="icon">${so ? this._card._iconHtml(so, look.icon) : `<ha-icon icon="${esc(c.icon || "mdi:dots-grid")}"></ha-icon>`}</div>`;
    const moreInfo = so ? `<div class="btn" data-cmd="${this._reg(() => { this.close(); fire(this._card, "hass-more-info", { entityId: so.entity_id }); })}" role="button" tabindex="0" title="${esc(tr(hass, "details"))}"><ha-icon icon="mdi:information-outline"></ha-icon></div>` : "";
    const head = `<div class="head">
        <div class="shape sh-${esc(c.icon_shape || "circle")}${anim}${look.active ? " on" : ""}"${iconCmd}>${icon}</div>
        <div class="ht"><div class="title">${esc(name)}</div>${sub ? `<div class="sub">${esc(sub)}</div>` : ""}</div>
        <div class="hbtns">${moreInfo}<div class="btn" data-cmd="${this._reg(() => this.close())}" role="button" tabindex="0" title="${esc(tr(hass, "close"))}"><ha-icon icon="mdi:close"></ha-icon></div></div>
      </div>`;
    const showControls = c.popup_controls !== false && so;
    const first = head + (showControls ? this._controls(so, look) : "") + this._buttonsSection();
    const tail = so ? this._historySection(so) + this._attributesSection(so) : "";
    return [first, tail];
  }
}

// ---- 05-editor.js ----
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

})();
