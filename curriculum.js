/* Five easy days. One instruction per line. Ages 7 and 10. */
(function (global) {
  "use strict";

  var DAYS = [
    {
      day: 1,
      title: "Make it go",
      lesson: "Each line is one instruction. Press PLAY, then use the arrows.",
      coach: "Change a word, press PLAY, watch the rink.",
      starter: "# Day 1\ncolor orange\nspeed 4\n\ngo right\n",
      unlock: "",
      helpers: [
        { label: "Go left", line: "go left", after: 2 },
        { label: "Go up", line: "go up", after: 2 },
        { label: "Go down", line: "go down", after: 2 }
      ],
      missions: [
        {
          id: "color",
          title: "Pick a color",
          why: "Tap a color dot, or change the word after color.",
          hint: "Tap a color under the instructions, then PLAY.",
          showMe: "color lime",
          check: function (code, snap) {
            var c = String((snap.player && snap.player.color) || "").toLowerCase();
            return c !== "" && c !== "orange";
          }
        },
        {
          id: "speed",
          title: "Go faster",
          why: "Speed is a number. Bigger = faster.",
          hint: "Tap FASTER, or change speed 4 to speed 8. Then PLAY.",
          showMe: "speed 8",
          check: function (code, snap) {
            return Number(snap.player.speed) > 4;
          }
        },
        {
          id: "alldir",
          title: "Add directions to go",
          why: "Add go left, go up, and go down. Then skate.",
          hint: "Tap the big buttons: Go left, Go up, Go down. PLAY. Use all four arrows.",
          showMe: "go left\ngo up\ngo down",
          check: function (code, snap) {
            return (
              KidLang.hasLine(code, "go left") &&
              KidLang.hasLine(code, "go up") &&
              KidLang.hasLine(code, "go down") &&
              snap.flags.movedLeft &&
              snap.flags.movedUp &&
              snap.flags.movedDown
            );
          }
        }
      ]
    },
    {
      day: 2,
      title: "Get the pucks",
      lesson: "Pucks sit on the ice. Grab them to score.",
      coach: "Add pucks, then skate over them.",
      starter: "color orange\nspeed 5\n\ngo right\ngo left\ngo up\ngo down\n\npucks 5\nget puck = score\n",
      unlock: "\n# Day 2\npucks 5\nget puck = score\n",
      helpers: [
        { label: "Add pucks", line: "pucks 5" },
        { label: "Score when I grab one", line: "get puck = score" },
        { label: "Gold pucks", line: "puck color gold" }
      ],
      missions: [
        {
          id: "pucks",
          title: "Put pucks on the ice",
          why: "The line pucks 5 means five pucks.",
          hint: "Tap Add pucks, then PLAY.",
          showMe: "pucks 5",
          check: function (code, snap) {
            return Number(snap.game.coinCount) >= 3;
          }
        },
        {
          id: "grab",
          title: "Grab 3 pucks",
          why: "Skate over the pucks. Score should go up.",
          hint: "Click the rink, then skate onto 3 pucks.",
          showMe: null,
          check: function (code, snap) {
            return snap.flags.collected >= 3 && KidLang.hasLine(code, "get puck");
          }
        },
        {
          id: "puckcolor",
          title: "Paint the pucks",
          why: "puck color gold changes how they look.",
          hint: "Tap Gold pucks, then PLAY.",
          showMe: "puck color gold",
          check: function (code, snap) {
            var c = String(snap.game.puckColor || "").toLowerCase();
            return c !== "" && c !== "black" && c !== "#111111";
          }
        }
      ]
    },
    {
      day: 3,
      title: "Watch the cones",
      lesson: "Orange cones chase you. If they bump you, you lose a life.",
      coach: "Add cones, then try not to hit them. Or hit one on purpose to see lives drop.",
      starter: "color orange\nspeed 5\n\ngo right\ngo left\ngo up\ngo down\n\npucks 5\nget puck = score\n\ncones 2\nlives 3\nhit = lose life\n",
      unlock: "\n# Day 3\ncones 2\nlives 3\nhit = lose life\n",
      helpers: [
        { label: "Add cones", line: "cones 2" },
        { label: "Lose a life if hit", line: "hit = lose life" },
        { label: "Faster cones", line: "cone speed 2" }
      ],
      missions: [
        {
          id: "cones",
          title: "Add cones",
          why: "cones 2 puts two cones on the ice.",
          hint: "Tap Add cones, then PLAY.",
          showMe: "cones 2",
          check: function (code, snap) {
            return Number(snap.game.enemyCount) >= 1;
          }
        },
        {
          id: "hit",
          title: "Bump a cone",
          why: "hit = lose life makes the bump count.",
          hint: "PLAY, then run into a cone on purpose. Lives should go down.",
          showMe: "hit = lose life",
          check: function (code, snap) {
            return KidLang.hasLine(code, "hit = lose life") && snap.flags.hit >= 1;
          }
        },
        {
          id: "tune",
          title: "Make cones faster or slower",
          why: "cone speed 1 is easy. cone speed 3 is hard.",
          hint: "Tap Faster cones, or type cone speed 1, then PLAY.",
          showMe: "cone speed 2",
          check: function (code, snap) {
            return Number(snap.game.enemySpeed) !== 1.6;
          }
        }
      ]
    },
    {
      day: 4,
      title: "How to win",
      lesson: "win at 8 means first to 8 points wins.",
      coach: "Set the goal, then play until the big words pop up.",
      starter: "color orange\nspeed 5\n\ngo right\ngo left\ngo up\ngo down\n\npucks 6\nget puck = score\n\ncones 2\nlives 3\nhit = lose life\n\nwin at 8\nwin says YAY\n",
      unlock: "\n# Day 4\nwin at 8\nwin says YAY\n",
      helpers: [
        { label: "Win at 8", line: "win at 8" },
        { label: "Win says YAY", line: "win says YAY" }
      ],
      missions: [
        {
          id: "winat",
          title: "Set the winning number",
          why: "win at 8 is a short game. win at 15 is a long one.",
          hint: "Tap Win at 8, then PLAY.",
          showMe: "win at 8",
          check: function (code, snap) {
            var w = Number(snap.game.winScore);
            return w >= 3 && w < 50;
          }
        },
        {
          id: "winwords",
          title: "Write the win words",
          why: "win says YAY is the big banner.",
          hint: "Change YAY to anything: CHAMPS, WE WIN, NICE.",
          showMe: "win says CHAMPS",
          check: function (code, snap) {
            var t = String(snap.game.winText || "");
            return t.length > 0 && t !== "YOU WIN";
          }
        },
        {
          id: "winplay",
          title: "Win a game",
          why: "Grab pucks until the banner shows.",
          hint: "If it takes too long, set win at 5.",
          showMe: null,
          check: function (code, snap) {
            return snap.flags.won === true;
          }
        }
      ]
    },
    {
      day: 5,
      title: "Make it yours",
      lesson: "Put your names on it. Pick a look. Add a shoot button.",
      coach: "This is your game. Then press Save game and take it home.",
      starter: "color orange\nspeed 5\nshape skater\nnames \ntitle Our Game\n\ngo right\ngo left\ngo up\ngo down\n\npucks 6\nget puck = score\n\ncones 3\nlives 3\nhit = lose life\ncone speed 2\n\nwin at 10\nwin says CHAMPS\n",
      unlock: "\n# Day 5\nnames Pieter and Cayden\nshape robot\nspace = shoot\n",
      helpers: [
        { label: "Our names", line: "names Pieter and Cayden" },
        { label: "Look like a robot", line: "shape robot" },
        { label: "Shoot with space", line: "space = shoot" },
        { label: "Two players", line: "two players" }
      ],
      missions: [
        {
          id: "names",
          title: "Sign your game",
          why: "names Pieter and Cayden goes on the win screen.",
          hint: "Tap Our names, then PLAY.",
          showMe: "names Pieter and Cayden",
          check: function (code, snap) {
            return String(snap.game.names || "").length > 2;
          }
        },
        {
          id: "shape",
          title: "Change how you look",
          why: "shape robot, shape circle, or shape triangle.",
          hint: "Tap Look like a robot, then PLAY.",
          showMe: "shape robot",
          check: function (code, snap) {
            var s = String(snap.player.shape || "").toLowerCase();
            return s !== "" && s !== "skater";
          }
        },
        {
          id: "ship",
          title: "Win it as yourselves",
          why: "Optional: tap Shoot with space. Then play until you win.",
          hint: "Click the rink. Grab pucks. Space shoots cones. Win the round.",
          showMe: "space = shoot",
          check: function (code, snap) {
            return snap.flags.won === true && String(snap.game.names || "").length > 2;
          }
        }
      ]
    }
  ];

  global.GAME_LAB_DAYS = DAYS;
})(window);
