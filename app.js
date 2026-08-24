/* Game Lab UI: days, missions, editor, save, take-home download. */
(function () {
  "use strict";

  var HOCKEY_KEY = "dadcamp-gamelab-v2";
  var DOG_KEY = "dadcamp-dogclash-v1";
  var TRACK_KEY = "dadcamp-gamelab-track";
  var track = localStorage.getItem(TRACK_KEY) === "dogs" ? "dogs" : "hockey";
  var STORAGE = track === "dogs" ? DOG_KEY : HOCKEY_KEY;
  var canvas = document.getElementById("rink");
  var engine = new GameEngine(canvas);
  engine.theme = track;
  var state = loadState();
  var currentDay = state.day || 1;
  var activeMission = 0;
  var timerLeft = 50 * 60;
  var timerId = 0;

  var els = {
    code: document.getElementById("code"),
    gutter: document.getElementById("gutter"),
    run: document.getElementById("run"),
    error: document.getElementById("error"),
    missions: document.getElementById("missions"),
    coach: document.getElementById("coach"),
    lessonName: document.getElementById("lessonName"),
    lessonText: document.getElementById("lessonText"),
    dayTitle: document.getElementById("dayTitle"),
    progress: document.getElementById("progressLabel"),
    dayPips: document.getElementById("dayPips"),
    nameLabel: document.getElementById("nameLabel"),
    gate: document.getElementById("gate"),
    enter: document.getElementById("enter"),
    name1: document.getElementById("name1"),
    name2: document.getElementById("name2"),
    resetDay: document.getElementById("resetDay"),
    saveGame: document.getElementById("saveGame"),
    timer: document.getElementById("timer"),
    timerBtn: document.getElementById("timerBtn"),
    celebrate: document.getElementById("celebrate"),
    helpers: document.getElementById("helpers"),
    palette: document.getElementById("palette"),
    speedRow: document.getElementById("speedRow"),
    stageTitle: document.getElementById("stageTitle"),
    controlKeys: document.getElementById("controlKeys"),
    controlHint: document.getElementById("controlHint"),
    hockeyTrack: document.getElementById("hockeyTrack"),
    dogTrack: document.getElementById("dogTrack"),
    pickHockey: document.getElementById("pickHockey"),
    pickDogs: document.getElementById("pickDogs")
  };

  function storageKey() {
    return track === "dogs" ? DOG_KEY : HOCKEY_KEY;
  }

  function loadState() {
    try {
      return JSON.parse(localStorage.getItem(storageKey()) || "{}");
    } catch (e) {
      return {};
    }
  }

  function saveState() {
    state.day = currentDay;
    state.code = state.code || {};
    state.code[currentDay] = els.code.value;
    state.done = state.done || {};
    localStorage.setItem(storageKey(), JSON.stringify(state));
    localStorage.setItem(TRACK_KEY, track);
  }

  function allDays() {
    return track === "dogs" ? GAME_LAB_DOG_DAYS : GAME_LAB_DAYS;
  }

  function daySpec() {
    return allDays()[currentDay - 1];
  }

  function names() {
    return ((state.name1 || "Pieter") + " + " + (state.name2 || "Cayden"));
  }

  function applyChrome() {
    document.body.classList.toggle("dog-mode", track === "dogs");
    engine.theme = track;
    if (els.stageTitle) els.stageTitle.textContent = track === "dogs" ? "The park" : "The rink";
    if (els.controlKeys) {
      els.controlKeys.innerHTML = track === "dogs"
        ? "Click the park, then use <kbd>←</kbd> <kbd>↑</kbd> <kbd>↓</kbd> <kbd>→</kbd>"
        : "Click the rink, then use <kbd>←</kbd> <kbd>↑</kbd> <kbd>↓</kbd> <kbd>→</kbd>";
    }
    if (els.controlHint) {
      els.controlHint.textContent = track === "dogs"
        ? "Grow big. When the clock hits 0, clash the king."
        : "Space shoots · WASD is player 2";
    }
    if (els.hockeyTrack) els.hockeyTrack.classList.toggle("active", track === "hockey");
    if (els.dogTrack) els.dogTrack.classList.toggle("active", track === "dogs");
  }

  function setTrack(next) {
    if (next !== "hockey" && next !== "dogs") return;
    var n1 = (state && state.name1) || (els.name1 && els.name1.value) || "Pieter";
    var n2 = (state && state.name2) || (els.name2 && els.name2.value) || "Cayden";
    if (next === track) {
      applyChrome();
      return;
    }
    saveState();
    track = next;
    state = loadState();
    state.name1 = n1;
    state.name2 = n2;
    currentDay = state.day || 1;
    els.nameLabel.textContent = names();
    applyChrome();
    renderPalette();
    openDay(currentDay);
  }

  function renderPips() {
    var days = allDays();
    els.dayPips.innerHTML = "";
    els.dayPips.classList.toggle("hidden", track === "dogs");
    for (var i = 1; i <= days.length; i++) {
      var b = document.createElement("button");
      b.className = "day-pip";
      b.type = "button";
      b.textContent = String(i);
      if (i === currentDay) b.classList.add("active");
      var done = (state.done && state.done[i] && state.done[i].length === days[i - 1].missions.length);
      if (done) b.classList.add("done");
      b.addEventListener("click", (function (d) {
        return function () { openDay(d); };
      })(i));
      els.dayPips.appendChild(b);
    }
  }

  function renderMissions() {
    var spec = daySpec();
    var done = (state.done && state.done[currentDay]) || [];
    els.missions.innerHTML = "";
    spec.missions.forEach(function (m, idx) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "mission";
      if (idx === activeMission) btn.classList.add("active");
      if (done.indexOf(m.id) !== -1) btn.classList.add("done");
      btn.innerHTML = '<div class="tick"></div><div><strong></strong></div>';
      btn.querySelector("strong").textContent = m.title;
      btn.addEventListener("click", function () {
        activeMission = idx;
        renderMissions();
        setCoach();
        updateToolUnlock();
      });
      els.missions.appendChild(btn);
    });
    els.progress.textContent = done.length + " / " + spec.missions.length;
    setCoach();
    updateToolUnlock();
  }

  function setCoach() {
    var spec = daySpec();
    var m = spec.missions[activeMission];
    els.coach.textContent = m ? m.why : spec.coach;
  }

  function updateGutter() {
    var n = els.code.value.split("\n").length;
    var lines = [];
    for (var i = 1; i <= Math.max(n, 6); i++) lines.push(String(i));
    els.gutter.textContent = lines.join("\n");
  }

  function withNames(text) {
    return String(text || "").replace(
      /Pieter and Cayden/g,
      (state.name1 || "Pieter") + " and " + (state.name2 || "Cayden")
    );
  }

  function lastCodeBefore(d) {
    for (var i = d - 1; i >= 1; i--) {
      if (state.code && state.code[i]) return state.code[i];
    }
    return "";
  }

  function openDay(d, forceStarter) {
    saveState();
    currentDay = d;
    var spec = daySpec();
    if (track === "dogs") els.dayTitle.textContent = spec.title;
    else els.dayTitle.textContent = "Day " + d + " · " + spec.title;
    els.lessonName.textContent = spec.title;
    els.lessonText.textContent = spec.lesson;
    var saved = state.code && state.code[d];
    if (forceStarter) {
      els.code.value = withNames(spec.starter);
    } else if (saved) {
      els.code.value = saved;
    } else if (d > 1 && lastCodeBefore(d)) {
      els.code.value = lastCodeBefore(d).replace(/\s*$/, "") + "\n" + withNames(spec.unlock || "");
    } else {
      els.code.value = withNames(spec.starter);
    }
    activeMission = firstOpenMission();
    els.error.textContent = "";
    updateGutter();
    renderPips();
    renderMissions();
    applyChrome();
    engine.idleDraw();
    saveState();
  }

  function setLine(startsWith, fullLine) {
    var prefix = startsWith.toLowerCase();
    var lines = els.code.value.split("\n");
    var found = false;
    var next = lines.map(function (line) {
      var t = line.replace(/#.*/g, "").trim().toLowerCase();
      if (t.indexOf(prefix) === 0) {
        found = true;
        return fullLine;
      }
      return line;
    });
    if (!found) {
      next.push(fullLine);
    }
    els.code.value = next.join("\n").replace(/\n{3,}/g, "\n\n");
    updateGutter();
    saveState();
  }

  function addLine(line) {
    if (KidLang.hasLine(els.code.value, line)) return;
    els.code.value = els.code.value.replace(/\s*$/, "\n" + line + "\n");
    updateGutter();
    saveState();
  }

  function doneCount() {
    return ((state.done && state.done[currentDay]) || []).length;
  }

  function updateToolUnlock() {
    var n = doneCount();
    var showSpeed = n >= 1 && (track === "dogs" || currentDay === 1) || (track === "hockey" && currentDay > 1);
    els.speedRow.classList.toggle("hidden", !showSpeed);
    renderHelpers();
  }

  function renderHelpers() {
    var spec = daySpec();
    var n = doneCount();
    els.helpers.innerHTML = "";
    (spec.helpers || []).forEach(function (h) {
      var need = h.after || 0;
      if ((track === "dogs" || currentDay === 1) && n < need) return;
      var b = document.createElement("button");
      b.type = "button";
      b.className = "helper";
      b.textContent = h.label;
      b.addEventListener("click", function () {
        addLine(withNames(h.line));
      });
      els.helpers.appendChild(b);
    });
  }

  function renderPalette() {
    els.palette.innerHTML = "";
    if (track === "dogs") {
      var dogs = [
        ["golden", "Golden", "#e8b84a"],
        ["husky", "Husky", "#e8eef2"],
        ["pug", "Pug", "#d4a574"],
        ["corgi", "Corgi", "#e0893c"],
        ["dalmatian", "Spots", "#f6f3ea"]
      ];
      dogs.forEach(function (d) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "dog-swatch";
        b.textContent = d[1];
        b.style.background = d[2];
        b.addEventListener("click", function () {
          setLine("dog ", "dog " + d[0]);
        });
        els.palette.appendChild(b);
      });
      return;
    }
    var colors = [
      ["orange", "#ff6a1a"],
      ["lime", "#7CFF6B"],
      ["gold", "#f5d76e"],
      ["pink", "hotpink"],
      ["blue", "#5ad0ff"],
      ["red", "#ff5a5a"]
    ];
    els.palette.innerHTML = "";
    colors.forEach(function (pair) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "swatch";
      b.title = pair[0];
      b.setAttribute("aria-label", pair[0]);
      b.style.background = pair[1];
      b.addEventListener("click", function () {
        setLine("color ", "color " + pair[0]);
      });
      els.palette.appendChild(b);
    });
  }

  function bumpSpeed(delta) {
    var n = 4;
    els.code.value.split("\n").forEach(function (line) {
      var t = line.replace(/#.*/g, "").trim().toLowerCase();
      if (/^speed\s+\d+/.test(t)) n = Number(t.replace(/[^\d]/g, "")) || 4;
    });
    n = Math.max(1, Math.min(12, n + delta));
    setLine("speed ", "speed " + n);
  }

  function firstOpenMission() {
    var spec = daySpec();
    var done = (state.done && state.done[currentDay]) || [];
    for (var i = 0; i < spec.missions.length; i++) {
      if (done.indexOf(spec.missions[i].id) === -1) return i;
    }
    return 0;
  }

  function markDone(id) {
    state.done = state.done || {};
    state.done[currentDay] = state.done[currentDay] || [];
    if (state.done[currentDay].indexOf(id) === -1) {
      state.done[currentDay].push(id);
      saveState();
      confetti();
      engine.audio.play("ok");
      var spec = daySpec();
      if (state.done[currentDay].length === spec.missions.length) {
        els.coach.textContent = track === "dogs"
          ? "You beat the king! Play again, or Save game and take it home."
          : "Day " + currentDay + " complete. Free skate, or jump to day " + Math.min(5, currentDay + 1) + ".";
      }
    }
    var spec = daySpec();
    var idx = spec.missions.findIndex(function (m) { return m.id === id; });
    if (idx === activeMission && idx < spec.missions.length - 1) activeMission = idx + 1;
    renderPips();
    renderMissions();
  }

  function checkMissions() {
    var spec = daySpec();
    var snap = engine.snapshot();
    var code = els.code.value;
    spec.missions.forEach(function (m) {
      var done = (state.done && state.done[currentDay]) || [];
      if (done.indexOf(m.id) !== -1) return;
      try {
        if (m.check(code, snap)) markDone(m.id);
      } catch (e) {}
    });
  }

  function runCode() {
    saveState();
    els.error.textContent = "";
    var result;
    try {
      result = engine.run(els.code.value);
    } catch (err) {
      els.error.textContent = String((err && err.message) || err);
      return;
    }
    if (!result.ok) {
      els.error.textContent = result.error;
      return;
    }
    canvas.focus();
    els.coach.textContent = track === "dogs"
      ? "Playing. Click the park, then hold the arrows."
      : "Playing. Click the rink, then hold the arrows.";
    setTimeout(checkMissions, 80);
  }

  engine.on("error", function (msg) {
    els.error.textContent = msg;
  });
  engine.on("collect", function () { checkMissions(); });
  engine.on("hit", function () { checkMissions(); });
  engine.on("win", function () { checkMissions(); confetti(); });
  engine.on("shot", function () { checkMissions(); });
  engine.on("run", function () { checkMissions(); });
  engine.on("progress", function () { checkMissions(); });
  engine.on("king", function () { checkMissions(); });
  engine.on("clash", function () { checkMissions(); });

  els.code.addEventListener("input", function () {
    updateGutter();
    saveState();
  });
  els.code.addEventListener("scroll", function () {
    els.gutter.scrollTop = els.code.scrollTop;
  });
  els.code.addEventListener("keydown", function (e) {
    if (e.key === "Tab") {
      e.preventDefault();
      var start = els.code.selectionStart;
      var end = els.code.selectionEnd;
      els.code.value = els.code.value.slice(0, start) + "  " + els.code.value.slice(end);
      els.code.selectionStart = els.code.selectionEnd = start + 2;
      updateGutter();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      runCode();
    }
  });

  els.run.addEventListener("click", runCode);
  canvas.addEventListener("mousedown", function () {
    canvas.focus();
  });
  document.getElementById("faster").addEventListener("click", function () { bumpSpeed(1); });
  document.getElementById("slower").addEventListener("click", function () { bumpSpeed(-1); });
  renderPalette();
  applyChrome();

  var pickedGame = track;
  function markGatePick() {
    if (els.pickHockey) els.pickHockey.classList.toggle("active", pickedGame === "hockey");
    if (els.pickDogs) els.pickDogs.classList.toggle("active", pickedGame === "dogs");
  }
  if (els.pickHockey) {
    els.pickHockey.addEventListener("click", function () {
      pickedGame = "hockey";
      markGatePick();
    });
  }
  if (els.pickDogs) {
    els.pickDogs.addEventListener("click", function () {
      pickedGame = "dogs";
      markGatePick();
    });
  }
  markGatePick();
  if (els.hockeyTrack) els.hockeyTrack.addEventListener("click", function () { setTrack("hockey"); });
  if (els.dogTrack) els.dogTrack.addEventListener("click", function () { setTrack("dogs"); });
  els.resetDay.addEventListener("click", function () {
    if (!confirm("Erase today's instructions and start over?")) return;
    if (state.code) delete state.code[currentDay];
    if (state.done) delete state.done[currentDay];
    openDay(currentDay, true);
  });

  els.saveGame.addEventListener("click", downloadGame);

  els.enter.addEventListener("click", function () {
    state.name1 = els.name1.value.trim() || "Pieter";
    state.name2 = els.name2.value.trim() || "Cayden";
    state.seenGate = true;
    els.nameLabel.textContent = names();
    els.gate.classList.add("hidden");
    saveState();
    if (pickedGame !== track) setTrack(pickedGame);
    else openDay(currentDay);
  });

  els.timerBtn.addEventListener("click", function () {
    if (timerId) {
      clearInterval(timerId);
      timerId = 0;
      els.timerBtn.textContent = "Start hour";
      return;
    }
    timerLeft = 50 * 60;
    els.timerBtn.textContent = "Pause";
    tickTimer();
    timerId = setInterval(tickTimer, 1000);
  });

  function tickTimer() {
    timerLeft = Math.max(0, timerLeft - 1);
    var m = Math.floor(timerLeft / 60);
    var s = timerLeft % 60;
    els.timer.textContent = String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
    els.timer.classList.toggle("hot", timerLeft <= 5 * 60);
    if (timerLeft === 0) {
      clearInterval(timerId);
      timerId = 0;
      els.timerBtn.textContent = "Start hour";
      els.coach.textContent = "Hour is up. Save the game and pack the rink.";
    }
  }

  function confetti() {
    var c = els.celebrate;
    var ctx = c.getContext("2d");
    c.width = window.innerWidth;
    c.height = window.innerHeight;
    var bits = [];
    var colors = ["#ff6a1a", "#f5d76e", "#9ee6d4", "#e8f1ef"];
    for (var i = 0; i < 80; i++) {
      bits.push({
        x: Math.random() * c.width,
        y: -20 - Math.random() * 80,
        vy: 2 + Math.random() * 4,
        vx: -1 + Math.random() * 2,
        w: 6 + Math.random() * 6,
        color: colors[i % colors.length],
        rot: Math.random() * 6
      });
    }
    var frames = 0;
    function step() {
      ctx.clearRect(0, 0, c.width, c.height);
      bits.forEach(function (b) {
        b.x += b.vx;
        b.y += b.vy;
        b.rot += 0.1;
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(b.rot);
        ctx.fillStyle = b.color;
        ctx.fillRect(-b.w / 2, -3, b.w, 6);
        ctx.restore();
      });
      frames++;
      if (frames < 70) requestAnimationFrame(step);
      else ctx.clearRect(0, 0, c.width, c.height);
    }
    step();
  }

  function downloadGame() {
    saveState();
    Promise.all([
      fetch("kidlang.js").then(function (r) { return r.text(); }),
      fetch("engine.js").then(function (r) { return r.text(); })
    ])
      .then(function (parts) {
        var packed =
          "<!DOCTYPE html><html><head><meta charset='UTF-8'><title>" +
          escapeHtml(names()) +
          "</title><style>html,body{margin:0;height:100%;background:#07151c}body{display:grid;place-items:center}canvas{border-radius:12px;box-shadow:0 20px 50px #000}</style></head><body><canvas id='rink' width='560' height='380' tabindex='0'></canvas><script>\n" +
          parts[0] +
          "\n" +
          parts[1] +
          "\n;new GameEngine(document.getElementById('rink')).run(" +
          JSON.stringify(els.code.value) +
          ");\n</script></body></html>";
        var blob = new Blob([packed], { type: "text/html" });
        var a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "pieter-cayden-game.html";
        a.click();
        URL.revokeObjectURL(a.href);
      })
      .catch(function () {
        els.error.textContent = "Save needs the local server. Run start-lab.bat, then try Save game again.";
      });
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (ch) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch];
    });
  }

  if (state.name1) els.name1.value = state.name1;
  if (state.name2) els.name2.value = state.name2;
  els.nameLabel.textContent = names();
  applyChrome();
  engine.idleDraw();
  renderPips();

  if (state.seenGate) {
    els.gate.classList.add("hidden");
    openDay(currentDay);
  }

  window.addEventListener("beforeunload", saveState);
  window.GameLab = { engine: engine, run: runCode };
})();
