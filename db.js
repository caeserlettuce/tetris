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
    },
    "disable": () => {
      show_debug = false;
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
  }
]

var funny_keys = [37, 39, 40]