/* Game Lab engine. Tiny sandbox + rink renderer. No network. */
(function (global) {
  "use strict";

  var WIDTH = 560;
  var HEIGHT = 380;
  var PLAYER_R = 18;
  var DOG_COLORS = {
    golden: "#e8b84a",
    husky: "#e8eef2",
    pug: "#d4a574",
    corgi: "#e0893c",
    dalmatian: "#f6f3ea"
  };

  function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
  }

  function dist(a, b) {
    var dx = a.x - b.x;
    var dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function hexOrName(color) {
    if (!color) return "#ff6a1a";
    return String(color);
  }

  function AudioBus() {
    this.ctx = null;
  }

  AudioBus.prototype.ensure = function () {
    if (!this.ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (AC) this.ctx = new AC();
    }
    if (this.ctx && this.ctx.state === "suspended") this.ctx.resume();
    return this.ctx;
  };

  AudioBus.prototype.play = function (kind) {
    var ctx = this.ensure();
    if (!ctx) return;
    var now = ctx.currentTime;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    var type = "square";
    var freq = 440;
    var freq2 = 660;
    var dur = 0.12;
    if (kind === "coin") {
      type = "square";
      freq = 880;
      freq2 = 1320;
      dur = 0.14;
    } else if (kind === "hit") {
      type = "sawtooth";
      freq = 180;
      freq2 = 90;
      dur = 0.22;
    } else if (kind === "win") {
      type = "triangle";
      freq = 523;
      freq2 = 784;
      dur = 0.35;
    } else if (kind === "lose") {
      type = "sawtooth";
      freq = 220;
      freq2 = 110;
      dur = 0.4;
    } else if (kind === "shoot") {
      type = "square";
      freq = 320;
      freq2 = 520;
      dur = 0.08;
    } else if (kind === "ok") {
      type = "triangle";
      freq = 600;
      freq2 = 900;
      dur = 0.1;
    }
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq2), now + dur);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
    osc.start(now);
    osc.stop(now + dur);
  };

  function Engine(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    this.audio = new AudioBus();
    this.raf = 0;
    this.playing = false;
    this.user = null;
    this.keys = { left: false, right: false, up: false, down: false, space: false, a: false, d: false, w: false, s: false };
    this.flags = {};
    this.listeners = {};
    this.shake = 0;
    this.flash = 0;
    this.time = 0;
    this.boundKey = this.onKey.bind(this);
    this.boundFrame = this.frame.bind(this);
    this.resetWorld();
    window.addEventListener("keydown", this.boundKey, true);
    window.addEventListener("keyup", this.boundKey, true);
  }

  Engine.prototype.on = function (name, fn) {
    this.listeners[name] = this.listeners[name] || [];
    this.listeners[name].push(fn);
  };

  Engine.prototype.emit = function (name, payload) {
    var list = this.listeners[name] || [];
    for (var i = 0; i < list.length; i++) list[i](payload);
  };

  Engine.prototype.onKey = function (e) {
    var down = e.type === "keydown";
    var t = e.target;
    if (t && (t.tagName === "TEXTAREA" || t.tagName === "INPUT" || t.isContentEditable)) return;
    var map = {
      ArrowLeft: "left",
      ArrowRight: "right",
      ArrowUp: "up",
      ArrowDown: "down",
      " ": "space",
      Spacebar: "space",
      Space: "space",
      a: "a",
      A: "a",
      d: "d",
      D: "d",
      w: "w",
      W: "w",
      s: "s",
      S: "s"
    };
    var k = map[e.key] || map[e.code];
    if (!k) return;
    this.keys[k] = down;
    if (down) e.preventDefault();
  };

  Engine.prototype.resetWorld = function () {
    this.time = 0;
    this.shake = 0;
    this.flash = 0;
    this.pucks = [];
    this.enemies = [];
    this.shots = [];
    this.particles = [];
    this.invuln = 0;
    this.shootCool = 0;
    this.ended = false;
    this.flags = {
      movedRight: false,
      movedLeft: false,
      movedUp: false,
      movedDown: false,
      collected: 0,
      hit: 0,
      won: false,
      lost: false,
      shot: false,
      kingOut: false,
      clashed: false
    };
    this.king = null;
    this.player = {
      x: WIDTH * 0.3,
      y: HEIGHT * 0.55,
      speed: 4,
      color: "orange",
      shape: "skater",
      dog: "",
      r: PLAYER_R
    };
    this.player2 = {
      x: WIDTH * 0.7,
      y: HEIGHT * 0.55,
      speed: 4,
      color: "#5ad0ff",
      shape: "skater",
      r: PLAYER_R,
      active: false
    };
    this.game = {
      title: "Our Game",
      names: "",
      score: 0,
      lives: 3,
      winScore: 9999,
      coinCount: 0,
      enemyCount: 0,
      enemySpeed: 1.6,
      puckColor: "#111111",
      bg: "#0b3a32",
      twoPlayer: false,
      winText: "YOU WIN",
      loseText: "GAME OVER",
      world: "hockey",
      roundTime: 0,
      timeLeft: 0,
      kingOn: false,
      kingBones: 0,
      phase: "hunt"
    };
    var self = this;
    this.player.shoot = function () {
      self.tryShoot(self.player, 1);
    };
    this.player2.shoot = function () {
      self.tryShoot(self.player2, -1);
    };
  };

  Engine.prototype.tryShoot = function (who, dir) {
    if (!this.playing || this.ended) return;
    if (this.shootCool > 0) return;
    this.shootCool = 0.28;
    this.shots.push({
      x: who.x + dir * (who.r + 8),
      y: who.y,
      vx: dir * 7.5,
      r: 6
    });
    this.flags.shot = true;
    this.audio.play("shoot");
    this.emit("shot");
  };

  Engine.prototype.friendlyError = function (err) {
    var msg = String((err && err.message) || err);
    if (/Unexpected token|Unexpected end|missing/.test(msg)) {
      return "Something looks unfinished. Check for a missing ) or } or quote mark.";
    }
    if (/is not defined/.test(msg)) {
      var m = msg.match(/(\S+) is not defined/);
      return "I do not know the word " + (m ? m[1] : "that") + ". Check the spelling.";
    }
    if (/Unexpected identifier/.test(msg)) {
      return "Two words got stuck together. Did you forget quotes or a plus sign?";
    }
    if (/Illegal/.test(msg)) {
      return "That line is not valid code yet. Compare it to the example.";
    }
    return "Hmm: " + msg;
  };

  Engine.prototype.applyRules = function (r) {
    this.rules = r;
    this.player.color = r.color;
    this.player.speed = r.speed;
    this.player.shape = r.shape;
    this.game.title = r.title;
    this.game.names = r.names;
    this.game.coinCount = r.pucks;
    this.game.puckColor = r.puckColor;
    this.game.enemyCount = r.cones;
    this.game.enemySpeed = r.coneSpeed;
    this.game.lives = r.lives;
    this.game.winScore = r.winAt;
    this.game.winText = r.winSays;
    this.game.loseText = r.loseSays;
    this.game.twoPlayer = r.twoPlayers;
    this.game.world = r.world === "dogs" ? "dogs" : "hockey";
    this.game.roundTime = Number(r.roundTime) || 0;
    this.game.timeLeft = this.game.roundTime;
    this.game.kingOn = !!r.kingOn;
    this.game.kingBones = Number(r.kingBones) || 0;
    this.game.phase = "hunt";
    this.king = null;
    this.player.dog = r.dog || "";
    if (this.game.world === "dogs") {
      this.game.bg = "#3d7a45";
      this.game.puckColor = r.puckColor && r.puckColor !== "black" ? r.puckColor : "#f3e6c0";
      this.game.winText = r.winSays && r.winSays !== "YOU WIN" ? r.winSays : "YOU WIN";
      this.player.shape = "dog";
      if (this.player.dog && (!r.color || r.color === "orange")) {
        this.player.color = DOG_COLORS[this.player.dog] || "#e8b84a";
      }
      this.game.loseText = "KING WINS";
      this.game.title = r.title && r.title !== "Our Game" ? r.title : "Dog Clash";
      if (!this.game.coinCount) this.game.coinCount = 10;
      if (!r.growOnGrab && !r.scoreOnGrab) {
        r.growOnGrab = true;
        r.scoreOnGrab = true;
      }
      if (!this.game.kingOn) {
        this.game.kingOn = true;
        this.game.kingBones = 3;
      }
      if (this.game.roundTime < 5) {
        this.game.roundTime = 20;
        this.game.timeLeft = 20;
      }
    }
  };

  Engine.prototype.userFromRules = function (r) {
    var self = this;
    return {
      loop: function () {
        var s = Number(self.player.speed) || 4;
        if (r.move.right && self.keys.right) self.player.x += s;
        if (r.move.left && self.keys.left) self.player.x -= s;
        if (r.move.up && self.keys.up) self.player.y -= s;
        if (r.move.down && self.keys.down) self.player.y += s;
        if (r.shoot && self.keys.space) self.player.shoot();
      },
      onCollect: function () {
        if (r.scoreOnGrab || r.growOnGrab) self.game.score = (Number(self.game.score) || 0) + 1;
        if (r.growOnGrab) {
          self.player.r = Math.min(42, PLAYER_R + self.game.score * 1.3);
        }
      },
      onHit: function () {
        if (r.hitLosesLife) self.game.lives = (Number(self.game.lives) || 0) - 1;
      },
      onWin: function () {},
      onLose: function () {}
    };
  };

  Engine.prototype.run = function (src) {
    this.stop();
    this.resetWorld();
    if (typeof KidLang === "undefined") {
      return { ok: false, error: "Game Lab failed to load. Refresh the page." };
    }
    var parsed = KidLang.parse(src);
    if (!parsed.ok) return { ok: false, error: parsed.error };
    this.applyRules(parsed.rules);
    this.user = this.userFromRules(parsed.rules);
    this.player2.active = !!this.game.twoPlayer;
    this.spawnPucks();
    this.spawnEnemies();
    if (this.game.world === "dogs") this.spawnKing();
    this.playing = true;
    this.ended = false;
    this.flash = 0.45;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.boundFrame);
    this.emit("run");
    return { ok: true };
  };

  Engine.prototype.spawnPucks = function () {
    this.pucks = [];
    var n = Math.max(0, Math.min(20, Number(this.game.coinCount) || 0));
    for (var i = 0; i < n; i++) this.pucks.push(this.randomPuck());
  };

  Engine.prototype.randomPuck = function () {
    var spot = {
      x: rand(50, WIDTH - 50),
      y: rand(50, HEIGHT - 50),
      r: 11,
      pop: 0
    };
    if (this.king && dist(spot, this.king) < this.king.r + 36) {
      spot.x = rand(40, WIDTH * 0.55);
      spot.y = rand(80, HEIGHT - 40);
    }
    return spot;
  };

  Engine.prototype.spawnEnemies = function () {
    this.enemies = [];
    var n = Math.max(0, Math.min(8, Number(this.game.enemyCount) || 0));
    for (var i = 0; i < n; i++) {
      var ang = rand(0, Math.PI * 2);
      var spd = Number(this.game.enemySpeed) || 1.6;
      this.enemies.push({
        x: rand(80, WIDTH - 80),
        y: rand(60, HEIGHT - 60),
        r: 16,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd
      });
    }
  };

  Engine.prototype.stop = function () {
    this.playing = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
  };

  Engine.prototype.frame = function (now) {
    if (!this.playing) return;
    var dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    this.step(dt);
    this.draw();
    this.raf = requestAnimationFrame(this.boundFrame);
  };

  Engine.prototype.step = function (dt) {
    this.time += dt;
    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 8);
    if (this.flash > 0) this.flash = Math.max(0, this.flash - dt * 4);
    if (this.invuln > 0) this.invuln -= dt;
    if (this.shootCool > 0) this.shootCool -= dt;

    if (this.ended) {
      this.stepParticles(dt);
      return;
    }

    var prev = { x: this.player.x, y: this.player.y };
    try {
      if (this.user && typeof this.user.loop === "function") this.user.loop();
    } catch (err) {
      this.stop();
      this.emit("error", this.friendlyError(err));
      return;
    }

    this.player.x = clamp(Number(this.player.x) || 0, this.player.r, WIDTH - this.player.r);
    this.player.y = clamp(Number(this.player.y) || 0, this.player.r + 8, HEIGHT - this.player.r);
    var moved = false;
    if (this.player.x > prev.x + 0.2) {
      if (!this.flags.movedRight) moved = true;
      this.flags.movedRight = true;
    }
    if (this.player.x < prev.x - 0.2) {
      if (!this.flags.movedLeft) moved = true;
      this.flags.movedLeft = true;
    }
    if (this.player.y < prev.y - 0.2) {
      if (!this.flags.movedUp) moved = true;
      this.flags.movedUp = true;
    }
    if (this.player.y > prev.y + 0.2) {
      if (!this.flags.movedDown) moved = true;
      this.flags.movedDown = true;
    }
    if (moved) this.emit("progress");

    if (this.player2.active) {
      var s = Number(this.player2.speed) || 4;
      if (this.keys.a) this.player2.x -= s;
      if (this.keys.d) this.player2.x += s;
      if (this.keys.w) this.player2.y -= s;
      if (this.keys.s) this.player2.y += s;
      this.player2.x = clamp(this.player2.x, this.player2.r, WIDTH - this.player2.r);
      this.player2.y = clamp(this.player2.y, this.player2.r + 8, HEIGHT - this.player2.r);
    }

    this.stepPucks();
    if (this.game.world === "dogs") {
      this.stepDogRound(dt);
      this.stepKing(dt);
    } else {
      this.stepEnemies();
      this.stepShots();
    }
    this.stepParticles(dt);
    this.checkEnd();
  };

  Engine.prototype.stepDogRound = function (dt) {
    if (this.ended || this.game.phase !== "hunt") return;
    if (!(this.game.roundTime > 0)) return;
    this.game.timeLeft = Math.max(0, this.game.timeLeft - dt);
    if (this.game.timeLeft <= 0) {
      this.game.timeLeft = 0;
      this.startClash();
    }
  };

  Engine.prototype.spawnKing = function () {
    var kr = Math.min(48, 30 + (Number(this.game.kingBones) || 3) * 1.6);
    this.king = {
      x: WIDTH * 0.8,
      y: HEIGHT * 0.36,
      r: kr,
      dog: "king",
      color: "#7a3bb0",
      awake: false
    };
  };

  Engine.prototype.startClash = function () {
    if (this.game.phase === "clash" || this.ended) return;
    this.game.phase = "clash";
    this.flags.kingOut = true;
    if (!this.king) this.spawnKing();
    this.king.awake = true;
    this.shake = 10;
    this.flash = 1;
    this.audio.play("ok");
    this.emit("king");
  };

  Engine.prototype.stepKing = function (dt) {
    if (!this.king || this.ended) return;
    if (this.game.phase !== "clash") {
      this.king.y = HEIGHT * 0.36 + Math.sin(this.time * 2.2) * 5;
      return;
    }
    var dx = this.player.x - this.king.x;
    var dy = this.player.y - this.king.y;
    var mag = Math.sqrt(dx * dx + dy * dy) || 1;
    this.king.x += (dx / mag) * 1.35;
    this.king.y += (dy / mag) * 1.35;
    this.king.x = clamp(this.king.x, this.king.r, WIDTH - this.king.r);
    this.king.y = clamp(this.king.y, this.king.r + 8, HEIGHT - this.king.r);
    if (dist(this.player, this.king) < this.player.r + this.king.r - 6) {
      this.flags.clashed = true;
      if (Number(this.game.score) > Number(this.game.kingBones)) this.win();
      else this.lose();
      this.emit("clash");
    }
  };

  Engine.prototype.stepPucks = function () {
    for (var i = this.pucks.length - 1; i >= 0; i--) {
      var p = this.pucks[i];
      var hit =
        dist(this.player, p) < this.player.r + p.r - 2 ||
        (this.player2.active && dist(this.player2, p) < this.player2.r + p.r - 2);
      if (hit) {
        try {
          if (this.user && this.user.onCollect) this.user.onCollect(p);
        } catch (err) {
          this.stop();
          this.emit("error", this.friendlyError(err));
          return;
        }
        this.flags.collected += 1;
        this.burst(p.x, p.y, hexOrName(this.game.puckColor));
        this.audio.play("coin");
        this.pucks.splice(i, 1);
        this.pucks.push(this.randomPuck());
        this.emit("collect", this.game.score);
      }
    }
  };

  Engine.prototype.stepEnemies = function () {
    var spdScale = Number(this.game.enemySpeed) || 1.6;
    for (var i = 0; i < this.enemies.length; i++) {
      var e = this.enemies[i];
      var mag = Math.sqrt(e.vx * e.vx + e.vy * e.vy) || 1;
      e.vx = (e.vx / mag) * spdScale;
      e.vy = (e.vy / mag) * spdScale;
      e.x += e.vx;
      e.y += e.vy;
      if (e.x < e.r || e.x > WIDTH - e.r) e.vx *= -1;
      if (e.y < e.r + 10 || e.y > HEIGHT - e.r) e.vy *= -1;
      e.x = clamp(e.x, e.r, WIDTH - e.r);
      e.y = clamp(e.y, e.r + 10, HEIGHT - e.r);
      this.maybeHit(this.player, e);
      if (this.player2.active) this.maybeHit(this.player2, e);
    }
  };

  Engine.prototype.maybeHit = function (who, e) {
    if (this.invuln > 0 || this.ended) return;
    if (dist(who, e) < who.r + e.r - 4) {
      this.invuln = 1.1;
      this.shake = 6;
      this.flash = 1;
      try {
        if (this.user && this.user.onHit) this.user.onHit();
      } catch (err) {
        this.stop();
        this.emit("error", this.friendlyError(err));
        return;
      }
      this.flags.hit += 1;
      this.audio.play("hit");
      this.emit("hit", this.game.lives);
    }
  };

  Engine.prototype.stepShots = function () {
    for (var i = this.shots.length - 1; i >= 0; i--) {
      var s = this.shots[i];
      s.x += s.vx;
      if (s.x < -20 || s.x > WIDTH + 20) {
        this.shots.splice(i, 1);
        continue;
      }
      var killed = false;
      for (var j = this.enemies.length - 1; j >= 0; j--) {
        if (dist(s, this.enemies[j]) < s.r + this.enemies[j].r) {
          this.burst(this.enemies[j].x, this.enemies[j].y, "#ff6a1a");
          this.enemies.splice(j, 1);
          this.shots.splice(i, 1);
          this.game.score = (Number(this.game.score) || 0) + 2;
          killed = true;
          break;
        }
      }
      if (killed) continue;
    }
  };

  Engine.prototype.burst = function (x, y, color) {
    for (var i = 0; i < 10; i++) {
      var a = rand(0, Math.PI * 2);
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(a) * rand(1, 4),
        vy: Math.sin(a) * rand(1, 4),
        life: rand(0.25, 0.55),
        color: color || "#fff"
      });
    }
  };

  Engine.prototype.stepParticles = function (dt) {
    for (var i = this.particles.length - 1; i >= 0; i--) {
      var p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  };

  Engine.prototype.checkEnd = function () {
    var winScore = Number(this.game.winScore);
    if (!this.ended && winScore < 9000 && this.game.score >= winScore) {
      this.win();
    }
    if (!this.ended && Number(this.game.lives) <= 0 && this.game.enemyCount > 0) {
      this.lose();
    }
  };

  Engine.prototype.win = function () {
    if (this.ended) return;
    this.ended = true;
    this.flags.won = true;
    try {
      if (this.user && this.user.onWin) this.user.onWin();
    } catch (err) {
      this.emit("error", this.friendlyError(err));
    }
    this.audio.play("win");
    this.emit("win");
  };

  Engine.prototype.lose = function () {
    if (this.ended) return;
    this.ended = true;
    this.flags.lost = true;
    try {
      if (this.user && this.user.onLose) this.user.onLose();
    } catch (err) {
      this.emit("error", this.friendlyError(err));
    }
    this.audio.play("lose");
    this.emit("lose");
  };

  Engine.prototype.draw = function () {
    var ctx = this.ctx;
    var ox = this.shake ? (Math.random() - 0.5) * this.shake : 0;
    var oy = this.shake ? (Math.random() - 0.5) * this.shake : 0;
    ctx.save();
    ctx.translate(ox, oy);
    this.drawRink(ctx);
    var i;
    for (i = 0; i < this.pucks.length; i++) {
      if (this.game.world === "dogs") this.drawBone(ctx, this.pucks[i]);
      else this.drawPuck(ctx, this.pucks[i]);
    }
    for (i = 0; i < this.enemies.length; i++) this.drawEnemy(ctx, this.enemies[i]);
    for (i = 0; i < this.shots.length; i++) this.drawShot(ctx, this.shots[i]);
    if (this.king) this.drawDog(ctx, this.king, true);
    if (this.game.world === "dogs") this.drawDog(ctx, this.player, false);
    else this.drawActor(ctx, this.player, this.invuln > 0 && Math.floor(this.time * 12) % 2 === 0);
    if (this.player2.active) this.drawActor(ctx, this.player2, false);
    for (i = 0; i < this.particles.length; i++) this.drawParticle(ctx, this.particles[i]);
    this.drawHud(ctx);
    if (this.ended) this.drawBanner(ctx);
    ctx.restore();
    if (this.flash > 0) {
      ctx.fillStyle = "rgba(255,80,40," + this.flash * 0.25 + ")";
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
    }
  };

  Engine.prototype.drawRink = function (ctx) {
    if (this.game.world === "dogs") {
      this.drawPark(ctx);
      return;
    }
    ctx.fillStyle = hexOrName(this.game.bg) || "#0b3a32";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth = 6;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(14, 14, WIDTH - 28, HEIGHT - 28, 40);
    else ctx.rect(14, 14, WIDTH - 28, HEIGHT - 28);
    ctx.stroke();
    ctx.strokeStyle = "rgba(220,40,40,0.55)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(WIDTH / 2, 18);
    ctx.lineTo(WIDTH / 2, HEIGHT - 18);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(WIDTH / 2, HEIGHT / 2, 42, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = "rgba(80,140,255,0.35)";
    ctx.beginPath();
    ctx.arc(90, HEIGHT / 2, 28, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(WIDTH - 90, HEIGHT / 2, 28, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    ctx.fillRect(14, HEIGHT - 22, WIDTH - 28, 8);
  };

  Engine.prototype.drawPark = function (ctx) {
    ctx.fillStyle = hexOrName(this.game.bg) || "#3d7a45";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = "rgba(255,255,255,0.05)";
    var y;
    for (y = 0; y < HEIGHT; y += 18) ctx.fillRect(0, y, WIDTH, 8);
    ctx.fillStyle = "rgba(140, 96, 48, 0.28)";
    ctx.beginPath();
    ctx.ellipse(WIDTH / 2, HEIGHT / 2 + 10, 190, 110, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.16)";
    ctx.lineWidth = 5;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(12, 12, WIDTH - 24, HEIGHT - 24, 28);
    else ctx.rect(12, 12, WIDTH - 24, HEIGHT - 24);
    ctx.stroke();
  };

  Engine.prototype.drawBone = function (ctx, p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(0.45);
    ctx.fillStyle = hexOrName(this.game.puckColor);
    ctx.fillRect(-9, -3.5, 18, 7);
    ctx.beginPath();
    ctx.arc(-9, -3.5, 4.5, 0, Math.PI * 2);
    ctx.arc(-9, 3.5, 4.5, 0, Math.PI * 2);
    ctx.arc(9, -3.5, 4.5, 0, Math.PI * 2);
    ctx.arc(9, 3.5, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  Engine.prototype.drawDog = function (ctx, who, isKing) {
    var r = Math.max(12, Number(who.r) || PLAYER_R);
    var dog = String(who.dog || "golden").toLowerCase();
    var body = hexOrName(who.color || DOG_COLORS.golden);
    var floppy = dog !== "husky";
    ctx.save();
    ctx.translate(who.x, who.y);
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.ellipse(0, r * 0.18, r * 0.78, r * 0.52, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(-r * 0.5, r * 0.35, r * 0.28, r * 0.42);
    ctx.fillRect(r * 0.18, r * 0.35, r * 0.28, r * 0.42);
    ctx.beginPath();
    ctx.arc(r * 0.15, -r * 0.38, r * 0.42, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.translate(r * 0.15, -r * 0.55);
    ctx.fillStyle = dog === "husky" ? "#4a5560" : body;
    if (floppy) {
      ctx.beginPath();
      ctx.ellipse(-r * 0.38, r * 0.12, r * 0.22, r * 0.32, -0.5, 0, Math.PI * 2);
      ctx.ellipse(r * 0.38, r * 0.12, r * 0.22, r * 0.32, 0.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.moveTo(-r * 0.28, 0);
      ctx.lineTo(-r * 0.38, -r * 0.48);
      ctx.lineTo(-r * 0.08, 0);
      ctx.moveTo(r * 0.28, 0);
      ctx.lineTo(r * 0.38, -r * 0.48);
      ctx.lineTo(r * 0.08, 0);
      ctx.fill();
    }
    ctx.restore();
    ctx.fillStyle = "#f2d3b0";
    ctx.beginPath();
    ctx.ellipse(r * 0.42, -r * 0.28, r * 0.22, r * 0.16, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#1a1208";
    ctx.beginPath();
    ctx.arc(r * 0.08, -r * 0.48, r * 0.07, 0, Math.PI * 2);
    ctx.arc(r * 0.32, -r * 0.48, r * 0.07, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(r * 0.52, -r * 0.26, r * 0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = body;
    ctx.lineWidth = Math.max(3, r * 0.16);
    ctx.beginPath();
    ctx.moveTo(-r * 0.7, 0);
    ctx.quadraticCurveTo(-r * 1.15, -r * 0.35, -r * 0.95, r * 0.2);
    ctx.stroke();
    if (dog === "dalmatian") {
      ctx.fillStyle = "#1a1208";
      ctx.beginPath();
      ctx.arc(-r * 0.2, r * 0.05, r * 0.1, 0, Math.PI * 2);
      ctx.arc(r * 0.25, r * 0.2, r * 0.08, 0, Math.PI * 2);
      ctx.arc(r * 0.05, -r * 0.15, r * 0.07, 0, Math.PI * 2);
      ctx.fill();
    }
    if (isKing) {
      ctx.fillStyle = "#f5d76e";
      ctx.beginPath();
      ctx.moveTo(-r * 0.42, -r * 0.7);
      ctx.lineTo(-r * 0.38, -r * 1.2);
      ctx.lineTo(-r * 0.08, -r * 0.82);
      ctx.lineTo(r * 0.18, -r * 1.28);
      ctx.lineTo(r * 0.42, -r * 0.82);
      ctx.lineTo(r * 0.62, -r * 1.18);
      ctx.lineTo(r * 0.7, -r * 0.68);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#b8860b";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = "#f5d76e";
      ctx.font = "800 12px Nunito, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("KING", r * 0.1, -r - 10);
      ctx.textAlign = "left";
    }
    ctx.restore();
  };

  Engine.prototype.drawPuck = function (ctx, p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.scale(1, 0.78);
    ctx.beginPath();
    ctx.arc(0, 0, p.r, 0, Math.PI * 2);
    ctx.fillStyle = hexOrName(this.game.puckColor);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.fill();
    ctx.restore();
  };

  Engine.prototype.drawEnemy = function (ctx, e) {
    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(14, 16);
    ctx.lineTo(-14, 16);
    ctx.closePath();
    ctx.fillStyle = "#ff6a1a";
    ctx.fill();
    ctx.strokeStyle = "#2a1408";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "#fff3";
    ctx.fillRect(-8, -2, 16, 3);
    ctx.restore();
  };

  Engine.prototype.drawShot = function (ctx, s) {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fillStyle = "#f5d76e";
    ctx.fill();
  };

  Engine.prototype.drawActor = function (ctx, who, hide) {
    if (hide) return;
    var shape = String(who.shape || "skater").toLowerCase();
    ctx.save();
    ctx.translate(who.x, who.y);
    ctx.fillStyle = hexOrName(who.color);
    if (shape === "square") {
      ctx.fillRect(-16, -16, 32, 32);
    } else if (shape === "triangle") {
      ctx.beginPath();
      ctx.moveTo(0, -18);
      ctx.lineTo(16, 16);
      ctx.lineTo(-16, 16);
      ctx.closePath();
      ctx.fill();
    } else if (shape === "robot") {
      ctx.fillRect(-14, -10, 28, 24);
      ctx.fillRect(-8, -18, 16, 10);
      ctx.fillStyle = "#111";
      ctx.fillRect(-6, -14, 4, 4);
      ctx.fillRect(2, -14, 4, 4);
    } else if (shape === "circle") {
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.ellipse(0, 8, 12, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, -6, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#1a1208";
      ctx.beginPath();
      ctx.ellipse(0, -10, 11, 5, 0, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = hexOrName(who.color);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(10, 4);
      ctx.lineTo(22, 16);
      ctx.stroke();
    }
    ctx.restore();
  };

  Engine.prototype.drawParticle = function (ctx, p) {
    ctx.globalAlpha = Math.max(0, p.life * 2);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, 3, 3);
    ctx.globalAlpha = 1;
  };

  Engine.prototype.drawHud = function (ctx) {
    if (this.game.world === "dogs") {
      this.drawDogHud(ctx);
      return;
    }
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(18, 16, 160, 36);
    ctx.fillRect(WIDTH - 178, 16, 160, 36);
    ctx.fillStyle = "#e8f1ef";
    ctx.font = "700 14px Nunito, sans-serif";
    ctx.fillText("SCORE  " + (this.game.score || 0), 28, 40);
    ctx.textAlign = "right";
    ctx.fillText("LIVES  " + (this.game.lives == null ? "-" : this.game.lives), WIDTH - 28, 40);
    ctx.textAlign = "left";
    if (this.game.title) {
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.font = "700 12px Nunito, sans-serif";
      ctx.fillText(String(this.game.title), WIDTH / 2, HEIGHT - 12);
      ctx.textAlign = "left";
    }
  };

  Engine.prototype.drawBanner = function (ctx) {
    ctx.fillStyle = "rgba(7,21,28,0.72)";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.textAlign = "center";
    ctx.fillStyle = this.flags.won ? "#f5d76e" : "#ff8a5b";
    ctx.font = "800 42px Bungee, sans-serif";
    ctx.fillText(this.flags.won ? String(this.game.winText || "YOU WIN") : String(this.game.loseText || "GAME OVER"), WIDTH / 2, HEIGHT / 2);
    if (this.game.names) {
      ctx.fillStyle = "#e8f1ef";
      ctx.font = "700 16px Nunito, sans-serif";
      ctx.fillText(String(this.game.names), WIDTH / 2, HEIGHT / 2 + 36);
    }
    ctx.textAlign = "left";
  };

  Engine.prototype.drawDogHud = function (ctx) {
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.fillRect(16, 12, 150, 36);
    ctx.fillRect(WIDTH - 166, 12, 150, 36);
    if (this.game.roundTime > 0) ctx.fillRect(WIDTH / 2 - 54, 12, 108, 36);
    ctx.fillStyle = "#e8f1ef";
    ctx.font = "700 14px Nunito, sans-serif";
    ctx.fillText("BONES  " + (this.game.score || 0), 26, 36);
    ctx.textAlign = "right";
    ctx.fillText("KING  " + (this.game.kingOn ? this.game.kingBones : "-"), WIDTH - 26, 36);
    ctx.textAlign = "center";
    if (this.game.roundTime > 0) {
      var t = Math.ceil(this.game.timeLeft);
      ctx.fillStyle = t <= 5 && this.game.phase === "hunt" ? "#ff6a1a" : "#f5d76e";
      ctx.fillText(this.game.phase === "clash" ? "CLASH" : "TIME  " + t, WIDTH / 2, 36);
    }
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.font = "700 12px Nunito, sans-serif";
    if (this.game.phase === "clash") ctx.fillText("CLASH! Run into the king if you are bigger!", WIDTH / 2, HEIGHT - 12);
    else ctx.fillText("Eat bones. Get bigger than the king. He wakes when time hits 0.", WIDTH / 2, HEIGHT - 12);
    ctx.textAlign = "left";
  };

  Engine.prototype.snapshot = function () {
    return {
      flags: Object.assign({}, this.flags),
      player: {
        color: this.player.color,
        speed: this.player.speed,
        shape: this.player.shape,
        dog: this.player.dog,
        x: this.player.x,
        y: this.player.y,
        r: this.player.r
      },
      game: {
        title: this.game.title,
        names: this.game.names,
        score: this.game.score,
        lives: this.game.lives,
        winScore: this.game.winScore,
        coinCount: this.game.coinCount,
        puckColor: this.game.puckColor,
        enemyCount: this.game.enemyCount,
        enemySpeed: this.game.enemySpeed,
        twoPlayer: this.game.twoPlayer,
        winText: this.game.winText,
        world: this.game.world,
        roundTime: this.game.roundTime,
        timeLeft: this.game.timeLeft,
        kingBones: this.game.kingBones,
        kingOn: this.game.kingOn,
        phase: this.game.phase
      },
      playing: this.playing,
      ended: this.ended
    };
  };

  Engine.prototype.idleDraw = function () {
    this.resetWorld();
    if (this.theme === "dogs") {
      this.game.world = "dogs";
      this.game.bg = "#3d7a45";
      this.player.shape = "dog";
      this.player.dog = "golden";
      this.player.color = DOG_COLORS.golden;
      this.game.kingOn = true;
      this.game.kingBones = 3;
      this.spawnKing();
    }
    this.draw();
  };

  global.GameEngine = Engine;
  global.GAME_LAB_SIZE = { width: WIDTH, height: HEIGHT };
})(window);
