/* Cayden's Dog Clash tutorial. Pick a dog, grab bones, clash the king. */
(function (global) {
  "use strict";

  var DOGS = [
    {
      day: 1,
      title: "Dog Clash",
      lesson: "Pick a dog. Grab bones. When the clock hits 0, clash the king.",
      coach: "Tap a dog, then PLAY.",
      starter: "# Dog Clash\nspeed 5\n\ngo right\ngo left\ngo up\ngo down\n",
      unlock: "",
      helpers: [
        { label: "Add bones", line: "bones 8", after: 1 },
        { label: "Grow when I grab one", line: "get bone = grow", after: 2 },
        { label: "Add a timer", line: "time 25", after: 3 },
        { label: "Add the king", line: "king 3", after: 4 }
      ],
      missions: [
        {
          id: "pickdog",
          title: "Pick a dog",
          why: "Tap Golden, Husky, Pug, Corgi, or Spots.",
          hint: "Tap a dog button, then PLAY.",
          showMe: "dog pug",
          check: function (code, snap) {
            var d = String(snap.player.dog || "").toLowerCase();
            return ["golden", "husky", "pug", "corgi", "dalmatian"].indexOf(d) !== -1;
          }
        },
        {
          id: "bones",
          title: "Put bones in the park",
          why: "bones 8 drops eight bones to chase.",
          hint: "Tap Add bones, then PLAY.",
          showMe: "bones 8",
          check: function (code, snap) {
            return Number(snap.game.coinCount) >= 4 || /bones\s+\d+/i.test(code);
          }
        },
        {
          id: "grow",
          title: "Grow by grabbing bones",
          why: "get bone = grow makes you bigger, like Snake Clash.",
          hint: "Tap Grow when I grab one. PLAY. Click the park and eat 3 bones.",
          showMe: "get bone = grow",
          check: function (code, snap) {
            return /get bone/i.test(code) && snap.flags.collected >= 3;
          }
        },
        {
          id: "timer",
          title: "Add a timer",
          why: "time 25 means twenty five seconds to hunt. Then the king comes.",
          hint: "Tap Add a timer, then PLAY.",
          showMe: "time 25",
          check: function (code, snap) {
            var t = Number(snap.game.roundTime);
            return t >= 8 && t <= 60;
          }
        },
        {
          id: "king",
          title: "Beat the king",
          why: "king 3 means the king has 3 bones. Get more than him, then run into him.",
          hint: "Tap Add the king. Grab bones until you have more than 3. When it says CLASH, run into the king.",
          showMe: "king 3",
          check: function (code, snap) {
            return /king\s+\d+/i.test(code) && snap.flags.won === true;
          }
        }
      ]
    }
  ];

  global.GAME_LAB_DOG_DAYS = DOGS;
})(window);
