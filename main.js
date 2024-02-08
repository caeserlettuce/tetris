var windowWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
var windowHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
var mobile = false;
var active_board = document.querySelector(".active-board");
var static_bounds = [];
var active_bounds = [];
var setting_choices = {};
var show_debug = false;
var show_ghost = true;
var board_width = 10;
var board_height = 20;
var game_score = 0;
var game_paused = false;
var game_status = false;
var game_interval;
var slam_interval;
var timeouts = {
  "keypresses": {}
};
var key_delays = {};
var active_new;
var gamesave = {
  "static": [
    // example

  ],
  "active piece": {
    "type": "yellow",
    "loc": [0,0],
    "rot": 0
  }
}

if (windowWidth < windowHeight) {
  // MOBILE!!!
  mobile = true;
}


function inlist(list1, list2) {
  var end = false;
  for (i in list2) {
    if (`${list1}` == `${list2[i]}`) {
      end = true;
    }
  }
  return end
}

function rand(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function is_element(element) {
  return element instanceof Element || element instanceof HTMLDocument;  
}

function copy_json(json_tm) {
  return JSON.parse(JSON.stringify(json_tm))
}

function clear_active_board() {
  active_board.innerHTML = "";
}

function display_shape(shape) {
  shape_points = pieces[shape["type"]][shape["rot"]];
  
  for (i in shape_points) {
    var x = shape_points[i][0] + shape["loc"][0];
    var y = shape_points[i][1] + shape["loc"][1];
    var node = document.querySelector(".template .block").cloneNode(true);
    node.classList.add(shape["type"]);
    node.style = `transform: translate(${x}px, ${y}px);`;
    active_board.appendChild(node);
  }
}

function display_ghost_debug(points, light) {
  if (typeof points[0] == typeof 1) {
    points = [[...points]];
  }
  for (i in points) {
    var x = points[i][0];
    var y = points[i][1];
    var node = document.querySelector(".template .debug").cloneNode(true);
    for (i in node.querySelectorAll("rect")) {
      var shape = node.querySelectorAll("rect")[i]
      if (is_element(shape)) {
        //console.log(shape)
        if (light == true) {
          shape.classList.add("light");
        } else {
          shape.classList.add("dark");
        }
      }
      
    }
    
    
    node.style = `transform: translate(${x}px, ${y}px);`;
    active_board.appendChild(node);
  }
}

function display_ghost_block(data) {
  if (show_ghost == true) {
    var data_new = copy_json(data);
    var ghost_height = find_slam_height(data);
    data_new["loc"][1] = ghost_height
    var ghost_points = get_piece_points(data_new);
    
    for (i in ghost_points) {
      var node = document.querySelector(".template .ghost").cloneNode(true);
      node.style = `transform: translate(${ghost_points[i][0]}px, ${ghost_points[i][1]}px);`;
      active_board.appendChild(node);
    }

  }
}

function check_lines() {

  var lines = {};
  var lines_clear = [];
  
  for (i in gamesave["static"]) {
    var x = gamesave["static"][i]["loc"][0];
    var y = gamesave["static"][i]["loc"][1];

    if (!lines[y]) {
      lines[y] = [];
    }
    lines[y].push(x);
  }
  for (i in lines) {
    if (lines[i].length == 10) {
      lines_clear.push(parseInt(i));
    }
  }
  console.log(lines);
  console.log(lines_clear);

  var new_static = [];
  var lines_cleared = lines_clear.length;

  for (i in gamesave["static"]) {
    var y = gamesave["static"][i]["loc"][1];
    if (lines_clear.includes(y)) {
      console.log(y);
      game_score += 1;

      // do NOT add it because it is being removed

    } else {
      var new_piece_entry = copy_json(gamesave["static"][i]);
      if (y < lines_clear[0]) {
        new_piece_entry["loc"][1] += lines_cleared;
      }
      new_static.push(new_piece_entry);
    }
  }
  gamesave["static"] = copy_json(new_static);
}

function display_game(game) {
  // for (i in game["pieces"]) {
  //   display_shape(game["pieces"][i]);
  // }
  if (game_paused == false) {
    check_lines();
  }

  for (i in game["static"]) {
    var x = game["static"][i]["loc"][0];
    var y = game["static"][i]["loc"][1];
    var node = document.querySelector(".template .block").cloneNode(true);
    node.classList.add(game["static"][i]["type"]);
    node.style = `transform: translate(${x}px, ${y}px);`;
    active_board.appendChild(node);
  }

  display_ghost_block(game["active piece"]);
  display_shape(game["active piece"]);
}

function piece_move(piece_in, direction) {
  var piece_out = {...piece_in};
  piece_out["loc"] = [ piece_in["loc"][0] + direction[0], piece_in["loc"][1] + direction[1] ];
  return piece_out
}

function piece_rotate(piece_in) {
  var piece_out = {...piece_in};
  var max_rot = pieces[piece_in["type"]].length;
  if (piece_in["rot"] + 2 > max_rot) {
    piece_out["rot"] = 0;
  } else {
    piece_out["rot"] += 1;
  }
  return piece_out
}

function get_piece_points(data) {
  //console.log(data);
  var type = data["type"]
  var loc = data["loc"];
  var rot = data["rot"];
  var raw_points = [...pieces[type][rot]];
  var points_out = [];
  for (i in raw_points) {
    //console.log("for raw_points:", i);
    //console.log(raw_points[i][0], loc[0]);
    //console.log(raw_points[i][1], loc[1]);
    var the_set = [
      raw_points[i][0] + loc[0],  // transform x
      raw_points[i][1] + loc[1]   // transform y
    ]
    points_out.push(the_set);
  }
  //console.log(points_out);
  return points_out
}

function get_piece_max_bounds(data) {
  var type = data["type"]
  var loc = data["loc"];
  var rot = data["rot"];
  var raw_points = [...pieces[type][rot]];
  var points_out = [0, 0];
  for (i in raw_points) {
    if (raw_points[i][0] > points_out[0]) {
      points_out[0] = raw_points[i][0];
    }
    if (raw_points[i][1] > points_out[1]) {
      points_out[1] = raw_points[i][1];
    }
  }
  return points_out
}

function add_static(data) { // add piece to static points
  var piece_points = get_piece_points(data);
  console.log({...gamesave})
  console.log([...piece_points]);
  for (i in piece_points) {
    gamesave["static"].push({"type": `${data["type"]}`, "loc": [...piece_points[i]] });
  }
}


function check_bounds(piece) {
  var final = true;
  var vertical_final = true;
  static_bounds = [];
  active_bounds = [];

    
  var piece_points = get_piece_points(piece);
  for (e in piece_points) {
    active_bounds.push(piece_points[e])
  }

  for (i in gamesave["static"]) {
    static_bounds.push( [...gamesave["static"][i]["loc"]] );
  }


  for (i in active_bounds) {
    var loc_tm = active_bounds[i];

    if (inlist(loc_tm, static_bounds) == true) {
      final = false
    }
    if (loc_tm[0] < 0 || loc_tm[0] > 9) {
      final = false
    }
    if (loc_tm[1] < 0 || loc_tm[1] > 19) {
      final = false
    }

  }

  return final
}

function new_piece(first) {
  if (first != true) {
    add_static(gamesave["active piece"]);
  }
  var the_piece = rand(piece_types);
  gamesave["active piece"] = {"type": `${the_piece}`, "rot": 0, "loc": [0,0]}
  var piece_bounds = get_piece_max_bounds(gamesave["active piece"]);
  gamesave["active piece"]["loc"][0] = Math.floor(board_width / 2) - (Math.floor(piece_bounds[0] / 2) + 1 ); // put it at the center
}



function game_over() {
  clearInterval(game_interval);
  game_status = false;
}

function game_speed(speed) {
  clearInterval(game_interval);
  game_interval = setInterval( () => {
    if (game_paused == false) {
      try {
        active_new = piece_move(gamesave["active piece"], [0,1]);
  
        var bounds_check = check_bounds(active_new);
        //console.log(bounds_good, vertical_good);
        console.log(bounds_check);
        if (bounds_check == true) {         // good to move down
          //console.log("ye");      
          gamesave["active piece"] = {...active_new};
          console.log("moving down in the actual!")
        } else if (bounds_check == false) {  // stop_piece
          if (gamesave["active piece"]["loc"][1] == 0) {
            game_over();
          } else {
            new_piece();
          }
        }
  
        clear_active_board();
        display_game(gamesave);
        if (show_debug == true) {
          display_ghost_debug(active_bounds, true);
          display_ghost_debug(static_bounds, false);
        }
        
      } catch (err) {
        console.error(err);
        clearInterval(game_interval);
      }
  
    }
    
  }, speed);
}


function start_game() {

  //add_static({"type": "lblue", "loc": [0,19], "rot": 0 })
  new_piece(true);
  game_status = true;
  game_speed(500);
  

}

function start_game_button() {
  start_game();
  document.querySelector(".home").style.opacity = "0"
}

// create the buttons

for (i in settings) {
  var node = document.createElement("div");
  var node1 = document.querySelector(".template .toggle").cloneNode(true);
  var node2 = document.createElement("h3");
  node.classList.add("setting");
  node.setAttribute("onclick", `toggle_button(${i})`);
  node2.innerHTML = settings[i]["label"];
  node1.setAttribute("ja_id", `${i}`);
  if (settings[i]["default"] == true) {
    node1.classList.add("enabled");
  }
  node.appendChild(node1);
  node.appendChild(node2);
  document.querySelector(".settings").appendChild(node);
}


function toggle_button(id) {
  var enabledja = document.querySelector(`.toggle[ja_id="${id}"]`).classList.contains("enabled");
  if (enabledja == false) {
    document.querySelector(`.toggle[ja_id="${id}"]`).classList.add("enabled");
    settings[id].enable();
    setting_choices[settings[id]["id"]] = true;
  } else {
    document.querySelector(`.toggle[ja_id="${id}"]`).classList.remove("enabled");
    settings[id].disable();
    setting_choices[settings[id]["id"]] = false;
  }
  localStorage.setItem("dapuglol-tetris", JSON.stringify(setting_choices));
}

var localstorage = localStorage.getItem("dapuglol-tetris");
var localstorage = JSON.parse(localstorage);

for (i in localstorage) {
  var the_id = -1;
  for (e in settings) {
    if (settings[e]["id"] == i) {
      the_id = e;
    }
  }
  if (localstorage[i] == true) {
    document.querySelector(`.toggle[ja_id="${the_id}"]`).classList.add("enabled");
    settings[the_id].enable();
  } else if (localstorage[i] == true) {
    document.querySelector(`.toggle[ja_id="${the_id}"]`).classList.remove("enabled");
    settings[the_id].disable();
  }
}

function user_move(direction) {
  // when the user moves the piece
  var move_new = piece_move(gamesave["active piece"], direction);
  var bounds_move_check = check_bounds(move_new);
  if (bounds_move_check == true) {
    gamesave["active piece"] = {...move_new};
    clear_active_board();
    display_game(gamesave);
  } else if (bounds_move_check == false && direction[0] == 0) {
    new_piece();
  }
}

function user_rotate() {
  // when the user wants to rotate
  var rotate_new = piece_rotate(gamesave["active piece"]);
  var bounds_rotate_check = check_bounds(rotate_new);
  if (bounds_rotate_check == true) {
    gamesave["active piece"] = {...rotate_new};
    clear_active_board();
    display_game(gamesave);
  } else if (bounds_rotate_check == false) {  // if the shape is right up against the edge, figure out how to rotate it so its good
    var max_bounds = get_piece_max_bounds(rotate_new);
    var points = get_piece_points(gamesave["active piece"]);
    var in_left = false;
    var in_right = false;
    
    for (i in points) {                   // check if at the wall or not
      if (points[i][0] < max_bounds[0]) {
        // up against left wall
        in_left = true;
        console.log("left wall!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
      } else if (points[i][0] > 9 - max_bounds[0]) {
        // up against right wall
        in_right = true
        console.log("right wall!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
      }
    }

    if (in_left == true) {
      rotate_new["loc"][0] = 0;
      var bounds_rotate_check_2 = check_bounds(rotate_new);
      if (bounds_rotate_check_2 == true) {
        gamesave["active piece"] = copy_json(rotate_new);
        clear_active_board();
        display_game(gamesave);
      }
    } else if (in_right == true) {
      console.log("before", rotate_new["loc"][0]);
      rotate_new["loc"][0] = 9 - max_bounds[0];  // as much tm
      console.log("after", rotate_new["loc"][0]);
      var bounds_rotate_check_2 = check_bounds(rotate_new);
      if (bounds_rotate_check_2 == true) {
        gamesave["active piece"] = copy_json(rotate_new);
        clear_active_board();
        display_game(gamesave);
      }
    }
  }
}

function find_slam_height(data) {
  var height_out = 20;
  var height_try = 20;
  var height_found = false;
  var highest_point = data["loc"][1];
  var slam_new_try = copy_json(data);
  for (let i = 0; i < 20; i++) {
    height_try += -1;
    if (height_found == false) {
      height_out = height_try
    }
    slam_new_try["loc"][1] = height_try;
    //console.log(slam_new["loc"])
    //console.log(height_out);
    var slam_bounds_check = check_bounds(slam_new_try);
    if (slam_bounds_check == true) {
      height_found = true;
    } else {
      if (height_try >= highest_point) {
        height_found = false;
      }
    }
  }
  return height_out
}

/*

  */

function user_slam() {
  
  var slam_height = find_slam_height(gamesave["active piece"]);
  console.log(slam_height)
  var slam_new = copy_json(gamesave["active piece"]);
  slam_new["loc"][1] = slam_height;
  gamesave["active piece"] = copy_json(slam_new);
  new_piece();
  clear_active_board();
  display_game(gamesave);
  

}

document.addEventListener('keydown', (event) => {
  var name = event.key;
  var keyid = event.which;
  // Alert the key name and key code on keydown
  //console.log(keyid)

  if (game_status == true) {
    if (keyid == 27) {        // esc
      if (show_debug == true) {
        document.querySelector(".pausemenu").style.backgroundColor = "transparent";
      }
      clearTimeout(timeouts["gp"]);
      if (game_paused == false) {
        document.querySelector(".pausemenu").style.display = "";
        timeouts["gp"] = setTimeout( () => {
          document.querySelector(".pausemenu").style.opacity = "1";
        }, 10);
        game_paused = true;
      } else if (game_paused == true) {

        document.querySelector(".pausemenu").style.opacity = "0";
        timeouts["gp"] = setTimeout( () => {
          document.querySelector(".pausemenu").style.display = "none";
        }, 260);
        game_paused = false;
      }
    } else if (keyid == 38) { // up
      if (game_paused == false) {
        user_rotate();
      }
    } else if (keyid == 32) { // space
      if (game_paused == false) {
        user_slam();
      }
    } else if (keyid == 67) { // c
  
    }
  }

});

document.addEventListener('keydown', (event) => {
  var keyid = event.which;
  if (funny_keys.includes(keyid)) {
    key_delays[keyid] = 0;
    clearTimeout(timeouts["keypresses"][keyid]);
  }
});

function do_thingy(key, function_tm) {
  if (key_delays[key] >= 3) {
    function_tm();
    clearTimeout(timeouts["keypresses"][key]);
    timeouts["keypresses"][key] = setTimeout( () => {
      key_delays[key] = 0;
    }, 50);
  } else {
    if (key_delays[key] == 0) {
      function_tm();
    }
    if (typeof key_delays[key] == typeof 0) {
      key_delays[key] += 1;
    } else {
      //console.log("adding")
      key_delays[key] = 0;
    }
    
  }
}

window.addEventListener("keypressed", function (event) {
  switch (event.keyCode) {
  case 37:        // left
    var key = 37;
    //console.log(key_delays[`${key}`]);
    do_thingy(37, () => {if (game_paused == false) { user_move([-1,0]) }} );
    break;
  case 39:        // right
    do_thingy(39, () => {if (game_paused == false) { user_move([1,0]) }} );
    break;
  case 40:        // down
    do_thingy(40, () => {if (game_paused == false) { user_move([0,1]) }} );
    break;
  }
  //console.log(event.keyCode);
}, false);

