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
