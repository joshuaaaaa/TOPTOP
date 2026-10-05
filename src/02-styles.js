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
