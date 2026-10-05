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
    this.shadowRoot.querySelector(".backdrop").addEventListener("click", () => this.close());
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
