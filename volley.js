/* Pieter's volleyball tutorial. Score, the ball shrinks, then hits get harder. */
(function (global) {
  "use strict";

  var VOLLEY = [
    {
      day: 1,
      title: "Volley",
      lesson: "Score a point, the ball gets smaller. After the tiniest ball, hits get harder. It does not shrink again.",
      coach: "Tap PLAY. Move under the ball. SPACE jumps and hits.",
      starter: "# Volley\nvolley\ncolor orange\nspeed 6\n\ngo left\ngo right\nspace = hit\n\npoint = smaller ball\nhard after small\nwin at 7\n",
      unlock: "",
      helpers: [
        { label: "Win at 5", line: "win at 5" },
        { label: "Win at 7", line: "win at 7" }
      ],
      missions: [
        {
          id: "jersey",
          title: "Pick a jersey",
          why: "Tap a color, then PLAY. That is your team.",
          hint: "Tap a color dot, then PLAY.",
          showMe: "color lime",
          check: function (code, snap) {
            var c = String((snap.player && snap.player.color) || "").toLowerCase();
            return c !== "" && c !== "orange";
          }
        },
        {
          id: "hit",
          title: "Hit the ball",
          why: "Move under it and press SPACE to bump it over the net.",
          hint: "Click the court. SPACE to jump and hit.",
          showMe: "space = hit",
          check: function (code, snap) {
            return snap.flags.volleyHits >= 1;
          }
        },
        {
          id: "point",
          title: "Score a point",
          why: "If it lands on their sand, you score. The ball gets smaller.",
          hint: "Bump it over. Let it drop on the other side.",
          showMe: null,
          check: function (code, snap) {
            return Number(snap.game.score) >= 1 || snap.flags.volleyPoints >= 1;
          }
        },
        {
          id: "tiny",
          title: "Get the smallest ball",
          why: "Each point shrinks it. Stop shrinking at the tiny one.",
          hint: "Keep scoring until the HUD says BALL 1, then HARD.",
          showMe: null,
          check: function (code, snap) {
            return snap.flags.smallest === true || Number(snap.flags.ballLevel) >= 4;
          }
        },
        {
          id: "hard",
          title: "Score a hard ball",
          why: "After the smallest, the next balls stay tiny and hits get harder.",
          hint: "Score one more point when it says HARD.",
          showMe: null,
          check: function (code, snap) {
            return snap.flags.scoredHard === true || Number(snap.flags.hardness) >= 1;
          }
        }
      ]
    }
  ];

  global.GAME_LAB_VOLLEY_DAYS = VOLLEY;
})(window);
