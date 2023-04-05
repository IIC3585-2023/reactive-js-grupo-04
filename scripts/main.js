// import { Canvas } from './canvas.js';
// import { Player, Enemy } from './entities.js';
// import { BOARDS } from './boards.js';

class MainScene {
  constructor(
    boards,
    sizeCell,
    canvas_element,
    context_element,
    map_select,
    players_select,
    start_button,
    keymaps
  ) {
    this.boards = boards;
    this.sizeCell = sizeCell;
    this.canvas_element = canvas_element;
    this.context_element = context_element;
    this.map_select = map_select;
    this.players_select = players_select;
    this.start_button = start_button;
    this.keymaps = keymaps;
    this.board = new Board(boards[0].board);
    this.canvas = null;
    this.game = null;
  }
  init() {
    this.map_select.addEventListener("change", (e) => {
      this.board = new Board(this.boards[e.target.value].board);
      this.newCanvas();
    });
    this.newCanvas();
    this.start_button.addEventListener("click", this.startGame.bind(this));
    window.addEventListener("beforeunload", (event) => {
      this.unsubscribeAll();
    });
  }
  newCanvas() {
    this.canvas = new Canvas(
      this.board,
      this.sizeCell,
      this.canvas_element,
      this.context_element
    );

    this.canvas.drawMap();
  }
  startGame() {
    this.map_select.setAttribute("disabled", true);
    this.players_select.setAttribute("disabled", true);
    this.start_button.setAttribute("disabled", true);
    this.game = new Game(this.board, this.sizeCell, this.canvas, this.keymaps); //game not initialiazed
    this.game.init();
    this.canvas.updateSubscription = this.game.subscribeToCanvasUpdate(
      (entities) => {
        this.canvas.update(entities);
      }
    );
    this.canvas_element.scrollIntoView();
    this.canvas_element.focus();
  }
  unsubscribeAll() {
    this.canvas.unsubscribeAll();
    if (this.game) this.game.unsubscribeAll();
  }
}

const main = () => {
  const CANVAS = document.getElementById("map");
  const CONTEXT = CANVAS.getContext("2d");
  const map_select = document.getElementById("map-select");
  const players_select = document.getElementById("players-select");
  const start_button = document.getElementById("start-button");

  const KEYMAP = {
    player1: {
      ArrowUp: "up",
      ArrowDown: "down",
      ArrowLeft: "left",
      ArrowRight: "right",
    },
    player2: {
      w: "up",
      s: "down",
      a: "left",
      d: "right",
    },
  };

  const sizeCell = 100;
  const main_scene = new MainScene(
    BOARDS,
    sizeCell,
    CANVAS,
    CONTEXT,
    map_select,
    players_select,
    start_button,
    KEYMAP
  );
  main_scene.init();
};
window.addEventListener("load", function (event) {
  main();
});
