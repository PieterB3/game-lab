/* Cayden's Dog Clash tutorial. Snake Clash: eat, grow, clash the king. */
(function (global) {
  "use strict";

  var DOGS = [
    {
      day: 1,
      title: "Dog Clash",
      lesson: "Eat bones and grow. The king waits. When time hits 0, clash him if you are bigger.",
      coach: "Tap PLAY. The purple dog with the crown is the king.",
      starter: "# Dog Clash\ndog golden\nspeed 3\n\ngo right\ngo left\ngo up\ngo down\n\nbones 10\nget bone = grow\n\ntime 40\nking 2\n",
      unlock: "",
      helpers: [
        { label: "More bones", line: "bones 12" },
        { label: "Easier king", line: "king 2" },
        { label: "More time", line: "time 40" }
      ],
      missions: [
        {
          id: "pickdog",
          title: "Pick a dog",
          why: "Tap Golden, Husky, Pug, Corgi, or Spots. Then PLAY.",
          hint: "Tap a dog button, then PLAY.",
          showMe: "dog pug",
          check: function (code, snap) {
            var d = String(snap.player.dog || "").toLowerCase();
            return ["golden", "husky", "pug", "corgi", "dalmatian"].indexOf(d) !== -1;
          }
        },
        {
          id: "grow",
          title: "Eat 3 bones",
          why: "Click the park and skate over bones. You get bigger, like Snake Clash.",
          hint: "PLAY, click the park, eat 3 bones.",
          showMe: null,
          check: function (code, snap) {
            return snap.flags.collected >= 3;
          }
        },
        {
          id: "bigger",
          title: "Get bigger than the king",
          why: "The HUD shows BONES vs KING. You need more bones than he has.",
          hint: "Keep eating until your BONES number is higher than KING.",
          showMe: null,
          check: function (code, snap) {
            return Number(snap.game.score) > Number(snap.game.kingBones);
          }
        },
        {
          id: "king",
          title: "Beat the king",
          why: "When the clock hits 0 he wakes. Boost with SPACE, bump him, then mash arrows to push.",
          hint: "Wait for THE KING. Bump him. Hold arrows to win the clash.",
          showMe: null,
          check: function (code, snap) {
            return snap.flags.won === true;
          }
        }
      ]
    }
  ];

  global.GAME_LAB_DOG_DAYS = DOGS;
})(window);
