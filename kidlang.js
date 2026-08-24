/* Tiny instruction language for 7 and 10. One idea per line. No braces. */
(function (global) {
  "use strict";

  function defaults() {
    return {
      color: "orange",
      speed: 4,
      title: "Our Game",
      names: "",
      shape: "skater",
      move: { left: false, right: false, up: false, down: false },
      pucks: 0,
      puckColor: "black",
      scoreOnGrab: false,
      cones: 0,
      coneSpeed: 1.6,
      lives: 3,
      hitLosesLife: false,
      winAt: 9999,
      winSays: "YOU WIN",
      loseSays: "GAME OVER",
      shoot: false,
      twoPlayers: false
    };
  }

  function rest(line, prefix) {
    return line.slice(prefix.length).trim();
  }

  function parse(src) {
    var rules = defaults();
    var lines = String(src || "").split(/\n/);
    var i;
    for (i = 0; i < lines.length; i++) {
      var raw = lines[i].replace(/#.*/g, "").replace(/\/\/.*/g, "").trim();
      if (!raw) continue;
      var line = raw.replace(/\s+/g, " ");
      var low = line.toLowerCase();

      if (low.indexOf("function") !== -1 || low.indexOf("player.") !== -1 || low.indexOf("{") !== -1) {
        return {
          ok: false,
          error: "This is the easy version now. Press Reset day to start with simple lines."
        };
      }

      if (/^color\s+/.test(low)) {
        rules.color = rest(low, "color");
        continue;
      }
      if (/^speed\s+\d+/.test(low)) {
        rules.speed = Number(low.replace(/[^\d]/g, ""));
        continue;
      }
      if (/^title\s+/.test(low)) {
        rules.title = rest(line, "title");
        continue;
      }
      if (/^names\s+/.test(low)) {
        rules.names = rest(line, "names");
        continue;
      }
      if (/^shape\s+/.test(low)) {
        rules.shape = rest(low, "shape");
        continue;
      }
      if (low === "go right" || low === "move right") {
        rules.move.right = true;
        continue;
      }
      if (low === "go left" || low === "move left") {
        rules.move.left = true;
        continue;
      }
      if (low === "go up" || low === "move up") {
        rules.move.up = true;
        continue;
      }
      if (low === "go down" || low === "move down") {
        rules.move.down = true;
        continue;
      }
      if (/^pucks\s+\d+/.test(low) || /^puck\s+\d+/.test(low)) {
        rules.pucks = Number(low.replace(/[^\d]/g, ""));
        continue;
      }
      if (/^puck color\s+/.test(low)) {
        rules.puckColor = rest(low, "puck color");
        continue;
      }
      if (low === "get puck = score" || low === "get puck" || low === "score pucks") {
        rules.scoreOnGrab = true;
        continue;
      }
      if (/^cones\s+\d+/.test(low)) {
        rules.cones = Number(low.replace(/[^\d]/g, ""));
        continue;
      }
      if (/^cone speed\s+/.test(low)) {
        rules.coneSpeed = Number(low.replace(/[^\d.]/g, "")) || 1.6;
        continue;
      }
      if (/^lives\s+\d+/.test(low)) {
        rules.lives = Number(low.replace(/[^\d]/g, ""));
        continue;
      }
      if (low === "hit = lose life" || low === "hit loses life") {
        rules.hitLosesLife = true;
        continue;
      }
      if (/^win at\s+\d+/.test(low)) {
        rules.winAt = Number(low.replace(/[^\d]/g, ""));
        continue;
      }
      if (/^win says\s+/.test(low)) {
        rules.winSays = rest(line, "win says");
        continue;
      }
      if (low === "space = shoot" || low === "shoot") {
        rules.shoot = true;
        continue;
      }
      if (low === "two players") {
        rules.twoPlayers = true;
        continue;
      }

      return {
        ok: false,
        error: "Line " + (i + 1) + " is not a real instruction. Try words like: color lime   or   go left"
      };
    }
    return { ok: true, rules: rules };
  }

  function hasLine(code, needle) {
    var n = String(needle).toLowerCase();
    return String(code || "")
      .split(/\n/)
      .some(function (line) {
        var t = line.replace(/#.*/g, "").trim().toLowerCase();
        return t === n || t.indexOf(n) !== -1;
      });
  }

  global.KidLang = { parse: parse, hasLine: hasLine, defaults: defaults };
})(window);
