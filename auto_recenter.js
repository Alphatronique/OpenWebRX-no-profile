// OpenWebRX+ local plugin: auto_recenter (Release V1.0)
//
// Automatically recenters the SDR LO when UI tuning is clamped.
// Works with OpenWebRX+ 1.2.x
//
// Strategy:
// - Detect UI clamp (setFrequency / setOffsetFrequency).
// - Force SDR center (LO) to the ACTUAL frequency accepted by the UI.
// - Never retune UI after forcing center (avoids UI/backend conflicts).
// - Allow manual frequency entry (Enter key) to move center as well.

(function () {
  "use strict";

  Plugins.auto_recenter = Plugins.auto_recenter || {};
  Plugins.auto_recenter.no_css = true;

  const COOLDOWN_MS  = 400;   // minimum delay between center changes
  const CLAMP_TOL_HZ = 5;     // clamp detection tolerance

  let lastCenterSetAt = 0;

  function now() { return Date.now(); }

  function wsReady() {
    return (typeof ws !== "undefined" && ws && ws.readyState === 1);
  }

  function uiReady() {
    return (typeof UI !== "undefined" && UI &&
      typeof UI.getFrequency === "function" &&
      UI.getDemodulatorPanel && UI.getDemodulatorPanel());
  }

  function cooldown() {
    return (now() - lastCenterSetAt) < COOLDOWN_MS;
  }

  function getKey() {
    try { return UI.getDemodulatorPanel().getMagicKey(); }
    catch (e) { return null; }
  }

  function setCenterHz(hz) {
    if (!wsReady() || !uiReady()) return false;

    const key = getKey();
    if (!key) return false;

    ws.send(JSON.stringify({
      type: "setfrequency",
      params: { frequency: Math.round(hz), key: key }
    }));

    lastCenterSetAt = now();
    return true;
  }

  // Parse frequency input (144.390 / 433.92M / 433920k / 1.2G)
  function parseFreqToHz(s) {
    if (!s) return null;
    s = String(s).trim().replace(",", ".");
    if (!s) return null;

    let mult = 1;
    const last = s.slice(-1).toLowerCase();
    if (last === "g") { mult = 1e9; s = s.slice(0, -1); }
    else if (last === "m") { mult = 1e6; s = s.slice(0, -1); }
    else if (last === "k") { mult = 1e3; s = s.slice(0, -1); }

    if (!/^[0-9.]+$/.test(s)) return null;

    const v = Number(s);
    if (!Number.isFinite(v)) return null;

    if (mult === 1 && v < 10000) mult = 1e6;

    return Math.round(v * mult);
  }

  function installHooks() {
    if (UI.__autoRecenterInstalled) return;

    // --- Absolute frequency clamp ---
    if (typeof UI.setFrequency === "function") {
      const origSetFrequency = UI.setFrequency.bind(UI);

      UI.setFrequency = function (hz) {
        const req = Number(hz);
        const ret = origSetFrequency(req);

        setTimeout(() => {
          if (!uiReady() || cooldown()) return;
          const after = UI.getFrequency();
          if (Number.isFinite(after) && Math.abs(after - req) > CLAMP_TOL_HZ) {
            setCenterHz(after);
          }
        }, 0);

        return ret;
      };
    }

    // --- Offset clamp ---
    if (typeof UI.setOffsetFrequency === "function" &&
        typeof UI.getOffsetFrequency === "function") {

      const origSetOffset = UI.setOffsetFrequency.bind(UI);

      UI.setOffsetFrequency = function (off) {
        const reqOff = Number(off);
        const curAbs = UI.getFrequency();
        const curOff = UI.getOffsetFrequency();

        const ret = origSetOffset(reqOff);

        setTimeout(() => {
          if (!uiReady() || cooldown()) return;
          const afterOff = UI.getOffsetFrequency();
          if (Number.isFinite(afterOff) && Math.abs(afterOff - reqOff) > CLAMP_TOL_HZ) {
            const absAfter = curAbs + (afterOff - curOff);
            setCenterHz(absAfter);
          }
        }, 0);

        return ret;
      };
    }

    UI.__autoRecenterInstalled = true;
    console.log("[auto_recenter] installed");
  }

  function installInputHook() {
    if (window.__autoRecenterInputHook) return;

    document.addEventListener("keydown", (ev) => {
      if (ev.key !== "Enter") return;

      const el = document.activeElement;
      if (!el || el.tagName !== "INPUT") return;

      const hz = parseFreqToHz(el.value);
      if (!hz) return;

      ev.preventDefault();
      ev.stopPropagation();

      if (!cooldown()) setCenterHz(hz);
    }, true);

    window.__autoRecenterInputHook = true;
  }

  Plugins.auto_recenter.init = function () {
    console.log("[auto_recenter] init");

    const t = setInterval(() => {
      if (wsReady() && uiReady()) {
        clearInterval(t);
        installHooks();
        installInputHook();
      }
    }, 200);

    return true;
  };

})();

