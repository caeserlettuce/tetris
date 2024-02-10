var pieces = {
  "lblue": [ // list of rotations for shape
    [ // list of points in the shape block tm
      [0,0], [1,0], [2,0], [3,0]
    ],
    [
      [0,0], [0,1], [0,2], [0,3]
    ]
  ],
  "yellow": [
    [
      [0,0], [1,0], [0,1], [1,1]
    ]
  ],
  "orange": [
    [
      [0,0], [0,1], [0,2], [1,2]
    ],
    [
      [0,1], [0,0], [1,0], [2,0]
    ],
    [
      [0,0], [1,0], [1,1], [1,2]
    ],
    [
      [0,1], [1,1], [2,1], [2,0]
    ]
  ],
  "blue": [
    [
      [1,0], [1,1], [1,2], [0,2]
    ],
    [
      [0,0], [0,1], [1,1], [2,1]
    ],
    [
      [1,0], [0,0], [0,1], [0,2]
    ],
    [
      [0,0], [1,0], [2,0], [2,1]
    ]
  ],
  "green": [
    [
      [0,0], [0,1], [1,1], [1,2]
    ],
    [
      [0,1], [1,1], [1,0], [2,0]
    ]
  ],
  "red": [
    [
      [1,0], [1,1], [0,1], [0,2]
    ],
    [
      [0,0], [1,0], [1,1], [2,1]
    ]
  ],
  "purple": [
    [
      [1,0], [0,1], [1,1], [2,1]
    ],
    [
      [1,0], [1,1], [1,2], [2,1]
    ],
    [
      [0,0], [1,0], [2,0], [1,1]
    ],
    [
      [1,0], [1,1], [1,2], [0,1]
    ]
  ]

}

var piece_types = ["lblue", "yellow", "orange", "blue", "green", "red", "purple"];

var settings = [
  {
    "label": "debug mode",
    "id": "bdg",
    "default": false,
    "enable": () => {
      show_debug = true;
      document.body.classList.add("debugmode");
    },
    "disable": () => {
      show_debug = false;
      document.body.classList.remove("debugmode");
    }
  },
  {
    "label": "show ghost blocks",
    "id": "gb",
    "default": true,
    "enable": () => {
      show_ghost = true;
    },
    "disable": () => {
      show_ghost = false;
    }
  },
  {
    "label": "enable piece holding",
    "id": "ph",
    "default": true,
    "enable": () => {
      show_hold = true;
      document.querySelector(".hold-board").style.opacity = 1;
    },
    "disable": () => {
      show_hold = false;
      document.querySelector(".hold-board").style.opacity = 0;
    }
  },
  {
    "label": "show next pieces",
    "id": "np",
    "default": true,
    "enable": () => {
      show_next = true;
      document.querySelector(".next-board").style.opacity = 1;
    },
    "disable": () => {
      show_next = false;
      document.querySelector(".next-board").style.opacity = 0;
    }
  },
  {
    "label": "record game for replaying",
    "id": "rec",
    "default": true,
    "enable": () => {
      show_replay = true;
      document.querySelector(".funny-css2").innerHTML = `.replay-stuff {display: unset;}`;
    },
    "disable": () => {
      show_replay = false;
      document.querySelector(".funny-css2").innerHTML = `.replay-stuff {display: none;}`;
    }
  }
]

var funny_keys = [37, 38, 39, 40]

