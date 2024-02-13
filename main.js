var windowWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
var windowHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
var mobile = false;
var active_board = document.querySelector(".active-board");
var static_bounds = [];
var active_bounds = [];
var setting_choices = {};
var show_debug = false;
var show_ghost = true;
var show_hold = true;
var show_next = true;
var show_replay = true;
var board_width = 10;
var board_height = 20;
var side_size = 5;
var next_height = 4;
var next_amount = 4;
var start_speed = 500;
var speed_increase = 1.025;
var game_paused = false;
var game_status = false;
var game_end = false;
var just_held = false;
var game_interval;
var slam_interval;
var timeouts = {
  "keypresses": {}
};
var key_delays = {};
var active_new;
var gamesave = {}; // find the default settings in the start_game() function
var game_replay = {}; // same with this one
var undo_history = [];
var reset_undo_history = true;
var replay_gamesave = {}; // for replaying
var replay_timeouts = [];
var replay_active = false;
var custom_open = false;
var original_colours;
var original_values = {};
var original_for_replay = {};

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

function doublefy(number) {
  var out = `${number}`;
  if (out.length == 1) {
    out = `0${out}`;
  }
  return out
}

function get_css_vars() {
  var out = {};
  var arr_tm = Array.from(document.styleSheets)
  .filter(
    sheet =>
      sheet.href === null || sheet.href.startsWith(window.location.origin)
  )
  .reduce(
    (acc, sheet) =>
      (acc = [
        ...acc,
        ...Array.from(sheet.cssRules).reduce(
          (def, rule) =>
            (def =
              rule.selectorText === ":root"
                ? [
                    ...def,
                    ...Array.from(rule.style).filter(name =>
                      name.startsWith("--")
                    )
                  ]
                : def),
          []
        )
      ]),
    []
  );

  console.log(arr_tm)

  for (i in arr_tm) {
    var val = getComputedStyle(document.documentElement).getPropertyValue(arr_tm[i]);
    if (val.includes("#")) {
      out[arr_tm[i]] = val.replace(" ", "");
    }
    
  }
  return out
}

original_colours = get_css_vars();

for (i in customs) {
  original_values[customs[i]["id"]] = customs[i].getvalue();
}


function save_settings() {
  localStorage.setItem("dapuglol-tetris", JSON.stringify(setting_choices));
}

if (!setting_choices["customs"]) {
  setting_choices["customs"] = {};
}

if (!setting_choices["customs"]["colours"]) {
  setting_choices["customs"]["colours"] = {};
}

function show_page(query) {
  document.querySelector(query).style.display = "";
  setTimeout( () => {
    document.querySelector(query).style.opacity = "1";
  }, 10);
}

function hide_page(query) {
  document.querySelector(query).style.opacity = "0";
  setTimeout( () => {
      document.querySelector(query).style.display = "none";
  }, 250);
}

function fix_contenteditable(query) {
  var ce = document.querySelector(query);
  ce.addEventListener('paste', function (e) {
    e.preventDefault()
    var text = e.clipboardData.getData('text/plain')
    document.execCommand('insertText', false, text)
  })
}


function clear_active_board() {
  active_board.innerHTML = "";
  document.querySelector(".active-hold-board").innerHTML = "";
  document.querySelector(".active-next-board").innerHTML = "";
}


function do_lines(board_in, width, height) {
  var board = document.querySelector(board_in);

  var node = document.querySelector(".template .dark").cloneNode(true);
  node.setAttribute("width", width);
  node.setAttribute("height", height);
  board.querySelector(".background").appendChild(node)
  
  // for x lines
  for (let i = 0; i < width; i++) {
    var line_x = 0.95;
    if (i == 0) {
      line_x = 0;
    } else if (i == width) {
      line_x = (width - 1) + 0.9;
    } else {
      line_x += i - 1;
    }
    var node1 = document.querySelector(".template .light").cloneNode(true);
    node1.setAttribute("width", 0.1);
    node1.setAttribute("height", height);
    node1.setAttribute("x", line_x);
    node1.setAttribute("y", 0);
    board.querySelector(".background").appendChild(node1);
  }
  var node2 = document.querySelector(".template .light").cloneNode(true);
  node2.setAttribute("width", 0.1);
  node2.setAttribute("height", height);
  node2.setAttribute("x", width - 0.1);
  node2.setAttribute("y", 0);
  board.querySelector(".background").appendChild(node2);
  
  // for y lines
  for (let i = 0; i < height; i++) {
    var line_y = 0.95;
    if (i == 0) {
      line_y = 0;
    } else if (i == height) {
      line_y = (height - 1) + 0.9;
    } else {
      line_y += i - 1;
    }
    var node1 = document.querySelector(".template .light").cloneNode(true);
    node1.setAttribute("width", width);
    node1.setAttribute("height", 0.1);
    node1.setAttribute("x", 0);
    node1.setAttribute("y", line_y);
    board.querySelector(".background").appendChild(node1);
  }
  var node2 = document.querySelector(".template .light").cloneNode(true);
  node2.setAttribute("width", width);
  node2.setAttribute("height", 0.1);
  node2.setAttribute("x", 0);
  node2.setAttribute("y", height - 0.1);
  board.querySelector(".background").appendChild(node2);
}


function board_size(game, width, height) {
  var selected_board = document.querySelector(".board-wrapper");

  selected_board.setAttribute("viewBox", `0 0 ${width + (side_size * 2) + 2} ${height}`);
  selected_board.querySelector(".board .background").innerHTML = "";
  selected_board.querySelector(".board").style = `transform: translate(${side_size + 1}px, 0px)`

  do_lines(".board", width, height);
  do_lines(".hold-board", side_size, side_size);
  do_lines(".next-board", side_size, next_height * game["next pieces"].length);
  selected_board.querySelector(".next-board .background").style = `transform: translate(${side_size + 2 + board_width}px, 2px)`;
  selected_board.querySelector(".next-board .active-next-board").style = `transform: translate(${side_size + 2 + board_width}px, 2px)`;
  selected_board.querySelector(".hold-board .side-text").setAttribute("y", `${side_size + 1}`)
  selected_board.querySelector(".side-text.score").setAttribute("x", `${side_size + 2 + board_width}`);
  
  console.log((next_height * game["next pieces"].length) + 2)
  if ((next_height * game["next pieces"].length) + 2 > height) {
    selected_board.setAttribute("viewBox", `0 0 ${width + (side_size * 2) + 2} ${(next_height * game["next pieces"].length) + 2}`);
  }
  

  //document.querySelector(".funny-css").innerHTML = `:root {--board-scale: calc(90vh / ${height}) !important;} .board {height: calc(var(--board-scale) * ${height}) !important}`
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
    if (light == true) {
      y += gamesave["active piece"]["loc"][1];
    }
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

function clear_check_debug() {
  var heehee = active_board.querySelectorAll(".debug.check");
  for (h in heehee) {
    if (is_element(heehee[h])) {
      heehee[h].remove();
    }
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

  if (replay_active == false) {

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
      if (lines[i].length == board_width) {
        lines_clear.push(parseInt(i));
      }
    }
    console.log(lines);
    console.log(lines_clear);

    var lines_clear_shift = {};
    lines_clear.sort();
    lines_clear.reverse();

    for (i in lines_clear) {
      lines_clear_shift[lines_clear[i]] = parseInt(i) + 1;
    }
    console.log("shifts:", lines_clear_shift);

    var new_static = [];
    var lines_cleared = lines_clear.length;
  
    for (i in gamesave["static"]) {
      var y = gamesave["static"][i]["loc"][1];
      if (lines_clear.includes(y)) {
        //console.log(y);
        gamesave["score"] += 1;

        if (gamesave["score"] % 100 == 0 && ( gamesave["score"] >= 100 && gamesave["score"] <= 1000 ) ) {
          start_speed = start_speed / speed_increase;
          game_speed(start_speed);
        }
  
        // do NOT add it because it is being removed
  
      } else {
        var new_piece_entry = copy_json(gamesave["static"][i]);
        var shift = 0;
        for (e in lines_clear_shift) {
          if (y < e) {
            if (lines_clear_shift[e] > shift) {
              shift = lines_clear_shift[e];
            }
          }
        }
        console.log("line:", y, "shift:", shift);
        new_piece_entry["loc"][1] += shift;
        new_static.push(new_piece_entry);
      }
    }
    gamesave["static"] = copy_json(new_static);
  }

}

function display_game(game) {
  // for (i in game["pieces"]) {
  //   display_shape(game["pieces"][i]);
  // }
  if (show_debug == true) {
    game["debug"] = true;
  } else {
    game["debug"] = false;
  }
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
  
  if (replay_active == false) {
    display_ghost_block(game["active piece"]);
  }
  display_shape(game["active piece"]);
  

  // hold board
  if (game["hold"] != false) {
    //console.log("hi")
    document.querySelector(".active-hold-board").innerHTML = "";
    var hp_points = get_piece_points(game["hold"]);
    var hp_bounds = get_piece_max_bounds(game["hold"]);
    var x_translate = (side_size / 2) - ( (hp_bounds[0] + 1) / 2);
    var y_translate = (side_size / 2) - ( (hp_bounds[1] + 1) / 2);
    console.log(hp_bounds[0], hp_bounds[1]);
    
    for (i in hp_points) {
      var x = hp_points[i][0] + x_translate;
      var y = hp_points[i][1] + y_translate;
      var node = document.querySelector(".template .block").cloneNode(true);
      if (just_held == true) {
        node.classList.add("disabled");
      } else {
        node.classList.add(game["hold"]["type"]);
      }
      node.style = `transform: translate(${x}px, ${y}px);`;
      document.querySelector(".active-hold-board").appendChild(node);
    }
  }

  // next pieces

  document.querySelector(".active-next-board").innerHTML = "";
  for (d in game["next pieces"]) {
    var np_points = get_piece_points(game["next pieces"][d]);
    var np_bounds = get_piece_max_bounds(game["next pieces"][d]);
    var x_translate = (side_size / 2) - ( (np_bounds[0] + 1) / 2);
    var y_translate = (next_height / 2) - ( (np_bounds[1] + 1) / 2) + (next_height * d);
    //console.log(np_bounds[0], np_bounds[1]);
    
    //console.log(JSON.stringify(game["next pieces"][d]))

    for (e in np_points) {
      var x = np_points[e][0] + x_translate;
      var y = np_points[e][1] + y_translate;
      var node = document.querySelector(".template .block").cloneNode(true);
      node.classList.add(game["next pieces"][d]["type"]);
      node.style = `transform: translate(${x}px, ${y}px);`;
      document.querySelector(".active-next-board").appendChild(node);
    }


  }

  if (game["debug"] == true) {
    document.querySelector(".board-wrapper .side-text.score").innerHTML = `score: ${game["score"]} [debug]`;
  } else {
    document.querySelector(".board-wrapper .side-text.score").innerHTML = `score: ${game["score"]}`;
  }
  




  if (show_debug == true && replay_active == false) {
    display_ghost_debug(active_bounds, true);
    display_ghost_debug(static_bounds, false);
  }

  if (replay_active == false) {
    if (setting_choices["highscore"] < game["score"]) {
      setting_choices["highscore"] = game["score"];
    }
    save_settings();
  }



  
  // MAKE SURE THIS STAYS AT THE END!!!
  
  if (replay_active == false) {
    if (show_replay == true) {
      game_replay["log"].push({
        "time": new Date(),
        "game": copy_json(game)
      });
    }
    if (reset_undo_history == true) {
      console.log("ya");
      undo_history = [...game_replay["log"]];
    }
  }
  // DONT PUT ANYTHING ELSE BELOW HERE!!!!!  

  // btoa: encode to base64
  // atob: decode to string

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
  clear_check_debug();
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

  if (show_debug == true) {
    for (g in piece_points) {
      var node = document.querySelector(".template .debug").cloneNode(true);
      node.style = `transform: translate(${piece_points[g][0]}px, ${piece_points[g][1]}px)`
      for (i in node.querySelectorAll("rect")) {
        var shape = node.querySelectorAll("rect")[i]
        if (is_element(shape)) {
          //console.log(shape)
          shape.classList.add("check");
        }
      }
      active_board.appendChild(node);
    }
  }

  for (i in active_bounds) {
    var loc_tm = active_bounds[i];
    //console.log(loc_tm);

    if (inlist(loc_tm, static_bounds) == true) {
      final = false
    }
    if (loc_tm[0] < 0 || loc_tm[0] > (board_width - 1)) {
      final = false
    }
    if (loc_tm[1] < 0 || loc_tm[1] > (board_height - 1)) {
      final = false
    }

  }

  return final
}

function new_piece(first, second) {
  if (first != true) {
    add_static(gamesave["active piece"]);
    just_held = false;
  }
  var the_piece;
  var piece_good = false;
  while (piece_good == false) {
    the_piece = rand(piece_types);
    console.log("checking piece...");
    if (gamesave["next pieces"].length >= 1) {
      if (the_piece == gamesave["next pieces"][gamesave["next pieces"].length - 1]["type"]) {
        console.log("retrying piece...");
      } else {
        console.log("piece good");
        piece_good = true;
      }
    } else {
      console.log("piece good");
      piece_good = true;
    }
    
  }
  console.log(the_piece);
  console.log({"type": `${the_piece}`, "rot": 0, "loc": [0,0]});
  
  gamesave["next pieces"].push({"type": `${the_piece}`, "rot": 0, "loc": [0,0]});
  console.log(gamesave["next pieces"])
  gamesave["active piece"] = copy_json(gamesave["next pieces"][0]);
  if (second != true) {
    gamesave["next pieces"].splice(0, 1);
  }
  var piece_bounds = get_piece_max_bounds(gamesave["active piece"]);
  gamesave["active piece"]["loc"][0] = Math.floor(board_width / 2) - (Math.floor(piece_bounds[0] / 2) + 1 ); // put it at the center
}



function game_over() {
  clearInterval(game_interval);
  game_status = false;
  game_end = true;

  if (show_replay == true) {
    var encoded_replay = btoa(JSON.stringify(game_replay));
    document.querySelector(".gameover .replay-data p").innerHTML = encoded_replay;
    document.querySelector(".home .replay-data p").innerHTML = encoded_replay;
  }
  document.querySelector(".scoretm .score").innerHTML = gamesave["score"];

  show_page(".gameover");
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
        
        
      } catch (err) {
        console.error(err);
        clearInterval(game_interval);
      }
  
    }
    
  }, speed);
}


function start_game() {

  var date_now = new Date();
  game_paused = false;
  gamesave = {
    "static": [],
    "active piece": {},
    "next pieces": [],
    "hold": false,
    "score": 0,
    "width": board_width,
    "height": board_height
  }
  game_replay = {
    "name": `${date_now.getFullYear()}-${doublefy(date_now.getMonth() + 1)}-${doublefy(date_now.getDate())} ${doublefy(date_now.getHours())}:${doublefy(date_now.getMinutes())}:${doublefy(date_now.getSeconds())}`,
    "start": date_now,
    "custom settings": copy_json(setting_choices),
    "log": []
  }
  for (let i = 0; i < next_amount; i++) {
    new_piece(true, true);
  }

  //add_static({"type": "lblue", "loc": [0,19], "rot": 0 })
  board_size(gamesave, board_width, board_height);
  //new_piece(true);
  game_status = true;
  game_speed(start_speed);
  
  clear_active_board();
  display_game(gamesave);

}

function start_game_button() {
  start_game();
  hide_page(".home");
  hide_page(".pausemenu");
  hide_page(".gameover");
  game_end = false;
}

function show_start_screen() {
  show_page(".home");
  setTimeout( () => {
    hide_page(".pausemenu");
    hide_page(".gameover");
    game_end = false;
  }, 100)
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
  save_settings();
}

var localstorage = localStorage.getItem("dapuglol-tetris");

try {
  localstorage = JSON.parse(localstorage);
} catch (err) {
  localstorage = {};
}


for (i in localstorage) {
  console.log(i, localstorage[i])
  var the_id = -1;
  for (e in settings) {
    if (settings[e]["id"] == i) {
      the_id = e;
    }
  }
  if (localstorage[i] == true) {
    if (document.querySelector(`.toggle[ja_id="${the_id}"]`)) {
      document.querySelector(`.toggle[ja_id="${the_id}"]`).classList.add("enabled");
      settings[the_id].enable();
    }
  } else if (localstorage[i] == false) {
    if (document.querySelector(`.toggle[ja_id="${the_id}"]`)) {
      document.querySelector(`.toggle[ja_id="${the_id}"]`).classList.remove("enabled");
      settings[the_id].disable();
    }
  }
  setting_choices = copy_json(localstorage);
}
if (!setting_choices["highscore"]) {
  setting_choices["highscore"] = 0;
}

if (!setting_choices["customs"]) {
  setting_choices["customs"] = {};
}

if (!setting_choices["customs"]["colours"]) {
  setting_choices["customs"]["colours"] = {};
}

function user_move(direction) {
  // when the user moves the piece
  var move_new = piece_move(gamesave["active piece"], direction);
  var bounds_move_check = check_bounds(move_new);
  if (bounds_move_check == true) {
    gamesave["active piece"] = {...move_new};
    clear_active_board();
    display_game(gamesave);
  } else if (bounds_move_check == false && direction[0] == 0 && direction[1] >= 0 && game_paused == false) {
    new_piece();
  }
}

function user_rotate() {
  var rotate_new = piece_rotate(copy_json(gamesave["active piece"]));
  var bounds_rotate_check = check_bounds(rotate_new);

  var max_bounds = get_piece_max_bounds(rotate_new);
  var points = get_piece_points(gamesave["active piece"]);

  var piece_loc_checks = [];
  var piece_max = get_piece_max_bounds(gamesave["active piece"]);

  for (let b = 0; b < piece_max[0] + 1; b++) {
    // the bounds
    piece_loc_checks.push([gamesave["active piece"]["loc"][0] + b, gamesave["active piece"]["loc"][1]]);
  }

  console.log(piece_loc_checks);

  var checked_good = false;
  var checked_good_coords;

  // rotate check blast #1

  for (j in piece_loc_checks) {
    if (checked_good == false) {
      var check_piece = copy_json(rotate_new);
      check_piece["loc"][0] = piece_loc_checks[j][0];
      check_piece["loc"][1] = piece_loc_checks[j][1];
      var check_tm = check_bounds(check_piece);
      if (check_tm == true) {
        checked_good_coords = piece_loc_checks[j];
        console.log("yay!!", checked_good_coords);
        checked_good = true;
      }
    }
  }

// rotate check blast #2
  
  if (checked_good == false) {
    
    piece_loc_checks = [];
    piece_max = get_piece_max_bounds(rotate_new);

    for (let b = 0; b < piece_max[0] + 1; b++) {
      // the bounds
      piece_loc_checks.push([rotate_new["loc"][0] - b, rotate_new["loc"][1]]);
    }

    console.log(piece_loc_checks);

    for (j in piece_loc_checks) {
      if (checked_good == false) {
        var check_piece = copy_json(rotate_new);
        check_piece["loc"][0] = piece_loc_checks[j][0];
        check_piece["loc"][1] = piece_loc_checks[j][1];
        var check_tm = check_bounds(check_piece);
        if (check_tm == true) {
          checked_good_coords = piece_loc_checks[j];
          console.log("yay!!", checked_good_coords);
          checked_good = true;
        }
      }
    }

  }

  // rotate check blast #3

  if (checked_good == false) {
    piece_loc_checks = [];
    piece_max = get_piece_max_bounds(rotate_new);

    for (let b = 0; b < piece_max[1] + 1; b++) {
      // the bounds
      piece_loc_checks.push([rotate_new["loc"][0], rotate_new["loc"][1] - b]);
    }

    console.log(piece_loc_checks);

    for (j in piece_loc_checks) {
      if (checked_good == false) {
        var check_piece = copy_json(rotate_new);
        check_piece["loc"][0] = piece_loc_checks[j][0];
        check_piece["loc"][1] = piece_loc_checks[j][1];
        var check_tm = check_bounds(check_piece);
        if (check_tm == true) {
          checked_good_coords = piece_loc_checks[j];
          console.log("yay!!", checked_good_coords);
          checked_good = true;
        }
      }
    }
  }

  if (checked_good == true) {
    rotate_new["loc"] = [...checked_good_coords];
    gamesave["active piece"] = copy_json(rotate_new);
    clear_active_board();
    display_game(gamesave);
  }


}

function find_slam_height(data) {
  var height_out = board_height;
  var height_try = board_height;
  var height_found = false;
  var highest_point = data["loc"][1];
  var slam_new_try = copy_json(data);
  for (let i = 0; i < board_height; i++) {
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

function user_hold() {
  // put active piece into hold
  if (just_held == false) {
    just_held = true;
    var active_piece = copy_json(gamesave["active piece"]);
    if (gamesave["hold"] != false) {
      // take piece out and make it active piece
      gamesave["active piece"] = copy_json(gamesave["hold"]);
      gamesave["active piece"]["loc"] = active_piece["loc"];
    } else {
      // new random piece
      new_piece(true);
    }
    gamesave["hold"] = copy_json(active_piece);
    var hp_bounds = get_piece_max_bounds(gamesave["hold"]);
    hp_bounds[0] += 1;
    hp_bounds[1] += 1;
    gamesave["hold"]["loc"] = [0, 0];
  }
}

document.addEventListener('keydown', (event) => {
  var name = event.key;
  var keyid = event.which;
  // Alert the key name and key code on keydown
  //console.log(keyid)

  if (game_status == true) {
    if (keyid == 27) {        // esc
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
        clear_active_board();
        display_game(gamesave);
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
      if (game_paused == false) {
        if (show_hold == true) {
          user_hold();
          clear_active_board();
          display_game(gamesave);
        }
      }
    } else if (keyid == 82) { // r for rotate
      if (game_paused == false || (game_paused == true && show_debug == true)) {
        user_rotate();
      }
    }  else if (keyid == 13) {  // enter
      if (game_paused == true) {
        game_over();
      }
    }
  } else {
    if (keyid == 27) {  // esc
      if (replay_active == true) {
        end_replay();
      } else if (custom_open == true) {
        close_custom();
      } else if (game_end == true) {
        show_start_screen();
      }
    } else if (keyid == 13) { // enter
      if (custom_open == false) {
        start_game_button();
      }
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
    do_thingy(37, () => {if ( (game_paused == false && game_status == true) || (game_paused == true && show_debug == true && game_status == true) ) { user_move([-1,0]) }} );
    break;
  case 39:        // right
    do_thingy(39, () => {if ( (game_paused == false && game_status == true) || (game_paused == true && show_debug == true && game_status == true) ) { user_move([1,0]) }} );
    break;
  case 40:        // down
    do_thingy(40, () => {if ( (game_paused == false && game_status == true) || (game_paused == true && show_debug == true && game_status == true) ) { user_move([0,1]) }} );
    break;
  case 38:
    do_thingy(40, () => {if (game_paused == true && show_debug == true && game_status == true) { user_move([0,-1]) }} );
    break;
  }
  //console.log(event.keyCode);
}, false);



// REPLAY STUFF


fix_contenteditable(".home .replay-data p");
fix_contenteditable(".custom-css p");


function end_replay() {
  for (t in replay_timeouts) {
    clearTimeout(replay_timeouts[t])
  }
  replay_active = false;
  setting_choices = copy_json(original_for_replay["settings"]);
  show_start_screen();
}

function play_replay() {

  // PLAY THE REPLAY

  try {
    var raw_data = document.querySelector(".replay-data p").innerHTML;
    replay_gamesave = JSON.parse(atob(raw_data));
    var start_time = Date.parse(replay_gamesave["start"]);
    replay_active = true;
    var last_timetm = 0;

    var speed = parseFloat(document.querySelector(".replay-speed").value);
    var speed_min = parseFloat(document.querySelector(".replay-speed").getAttribute("min"));
    var speed_max = parseFloat(document.querySelector(".replay-speed").getAttribute("max"));
    if (speed < speed_min) {
      speed = speed_min;
    } else if (speed > speed_max) {
      speed = speed_max;
    }

    //settings
    original_for_replay["settings"] = copy_json(setting_choices);
    setting_choices = copy_json(replay_gamesave["custom settings"]);
    document.querySelector(".funny-css4").innerHTML = replay_gamesave["custom settings"]["custom css"]

    board_size(replay_gamesave["log"][0]["game"], replay_gamesave["log"][0]["game"]["width"], replay_gamesave["log"][0]["game"]["height"]);
    clear_active_board();

    hide_page(".home");

    setTimeout( () => {
      for (y in replay_gamesave["log"]) {
        var time = (Date.parse(replay_gamesave["log"][y]["time"]) - start_time );
        //console.log(time);
        replay_timeouts.push(
          setTimeout( (index) => {
            //console.log("hi");
            var the_game = copy_json(replay_gamesave["log"][parseInt(index)]["game"]);
            console.log(parseInt(index));
            clear_active_board();
            display_game(the_game);
          }, time / speed, `${y}`)
        );
        last_timetm = time / speed;
      }
      replay_timeouts.push(setTimeout(end_replay, last_timetm + 1000));
  
    }, 1000);

    

  } catch (err) {
    console.error(err)
    show_page(".replay-error");
    setTimeout( () => {
      hide_page(".replay-error");
    }, 3000);
  }
}


// debug mode active pieces thingy lmao

// {"type": `${the_piece}`, "rot": 0, "loc": [0,0]}

function replace_piece(data) {
  data["loc"] = [...gamesave["active piece"]["loc"]];

  var new_data = copy_json(data)
  
  var max_bounds = get_piece_max_bounds(data);
  var points = get_piece_points(new_data);
  var in_left = false;
  var in_right = false;
  
  for (i in points) {                   // check if at the wall or not
    if (points[i][0] < max_bounds[0]) {
      // up against left wall
      in_left = true;
      console.log("left wall!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    } else if (points[i][0] > (board_width - 1) - max_bounds[0]) {
      // up against right wall
      in_right = true
      console.log("right wall!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    }
  }

  if (in_left == true) {
    data["loc"][0] = 0;
    var bounds_rotate_check_2 = check_bounds(data);
    if (bounds_rotate_check_2 == true) {
      new_data = copy_json(data);
      //clear_active_board();
      //display_game(gamesave);
    }
  } else if (in_right == true) {
    console.log("before", data["loc"][0]);
    data["loc"][0] = (board_width - 1) - max_bounds[0];  // as much tm
    console.log("after", data["loc"][0]);
    var bounds_rotate_check_2 = check_bounds(data);
    if (bounds_rotate_check_2 == true) {
      new_data = copy_json(data);
      //clear_active_board();
      //display_game(gamesave);
    }
  }


  
  gamesave["active piece"] = copy_json(new_data);
  clear_active_board();
  display_game(gamesave);
}

for (i in piece_types) {
  var ptm = {"type": `${piece_types[i]}`, "rot": 0, "loc": [0, 0]};
  var pb = get_piece_max_bounds(ptm);
  var pp = get_piece_points(ptm);
  var node = document.querySelector(".debug-stuff .active-pieces .template svg").cloneNode(true);
  var wid = pb[0] + 1;
  var hei = pb[1] + 1;
  node.setAttribute("viewBox", `0 0 ${wid} ${hei}`);
  node.style.maxWidth = `${wid * 3}em`;
  node.style.maxHeight = `${hei * 3}em`;
  for (b in pp) {
    var node1 = document.querySelector(".template .block").cloneNode(true);
    node1.classList.add(ptm["type"]);
    node1.style = `transform: translate(${pp[b][0]}px, ${pp[b][1]}px);`;
    node.appendChild(node1);
  }
  node.setAttribute("onclick", `replace_piece(${JSON.stringify(ptm)})`);
  document.querySelector(".debug-stuff .active-pieces").appendChild(node);
}



// customisation screen!!!

function open_custom() {
  show_page(".game-custom");
  custom_open = true;
}
function close_custom() {
  hide_page(".game-custom");
  custom_open = false;
}

function apply_custom_css() {
  var custom_css = `${document.querySelector(".custom-css p").innerHTML}`.replaceAll("<br>", "\n");
  document.querySelector(".funny-css4").innerHTML = custom_css;
  if (custom_css != "" && custom_css != undefined && custom_css != "undefined") {
    setting_choices["custom css"] = custom_css;
  }
  save_settings();
}

function apply_settings() {
  console.log("hi")
  // colour
  var css_tmtm = ":root {";
  for (i in setting_choices["customs"]["colours"]) {
    css_tmtm += `\n${i}: ${setting_choices["customs"]["colours"][i]};`;
    document.querySelector(`input[setting="${i}"]`).value = setting_choices["customs"]["colours"][i];
  }
  css_tmtm += "\n}";
  if (setting_choices["customs"]["colours"] >= 1) {
    document.querySelector(".funny-css3").innerHTML = css_tmtm;
  }
  

  // values
  for (i in customs) {
    console.log(setting_choices["customs"][customs[i]["id"]])
    if (setting_choices["customs"][customs[i]["id"]]) {
      customs[i].onchange(parseFloat(setting_choices["customs"][customs[i]["id"]]));
    }
  }
  apply_custom_css();
}

function reset_settings() {
  localStorage.setItem("dapuglol-tetris", "");
  window.location.reload();
}

function update_colour_setting(that, setting) {
  console.log(that, setting);
  if (!setting_choices["customs"]) {
    setting_choices["customs"] = {};
  }
  if (!setting_choices["customs"]["colours"]) {
    setting_choices["customs"]["colours"] = {};
  }
  setting_choices["customs"]["colours"][setting] = `${that.value}`;
  save_settings();
  apply_settings();
}

// colour settings

var colour_var_list = get_css_vars();
for (i in colour_var_list) {
  var node = document.querySelector(".game-custom .colour-list .template .colour").cloneNode(true);
  node.querySelector("input").value = `${colour_var_list[i]}`;
  node.querySelector("input").setAttribute("onchange", `update_colour_setting(this, "${i}")`);
  node.querySelector("input").setAttribute("setting", `${i}`);
  node.querySelector("p").innerHTML = `${i.replaceAll("--", "")}`;

  document.querySelector(".colour-list").appendChild(node);
}

function update_value_setting(that, index) {
  index = parseInt(index);
  console.log(that, index);
  if (!setting_choices["customs"]) {
    setting_choices["customs"] = {};
  }
  setting_choices["customs"][customs[index]["id"]] = `${parseFloat(that.value)}`;
  save_settings();
  apply_settings();
}


// value settings

for (i in customs) {
  var node = document.querySelector(".game-custom .value-list .template .value").cloneNode(true);
  node.querySelector("input").setAttribute("onchange", `update_value_setting(this, "${i}")`);
  node.querySelector("input").setAttribute("idtm", customs[i]["id"]);
  node.querySelector("p").innerHTML = `${customs[i]["label"]}`;
  document.querySelector(".value-list").appendChild(node);
  customs[i].fillvalue(customs[i]["id"]);
}

// custom css
if (setting_choices["custom css"] != "" && setting_choices["custom css"] != undefined && setting_choices["custom css"] != "undefined") {
  document.querySelector(".custom-css p").innerHTML = setting_choices["custom css"];  
}

apply_settings();

document.querySelector(".custom-css p").addEventListener("keyup", () => {
  clearTimeout(timeouts["customcss"])
  timeouts["customcss"] = setTimeout( apply_custom_css, 1000);
});