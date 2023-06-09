class MainScene {
  constructor(
    boards,
    sizeCell,
    canvas_element,
    context_element,
    map_select,
    players_select,
    start_button,
    restart_button,
    audios,
    keymaps
  ) {
    this.boards = boards;
    this.sizeCell = sizeCell;
    this.canvas_element = canvas_element;
    this.context_element = context_element;
    this.map_select = map_select;
    this.players_select = players_select;
    this.start_button = start_button;
    this.restart_button = restart_button;
    this.audios = audios;
    this.keymaps = keymaps;
    this.board = new Board(boards[0].board);
    this.mode = 1;
    this.difficulty = boards[0].difficulty;
    this.canvas = null;
    this.game = null;
    this.game_ended_signal_subcription = null;
  }

  init() {
    this.map_select.addEventListener("change", (e) => {
      this.board = new Board(this.boards[e.target.value].board);
      this.difficulty = this.boards[e.target.value].difficulty;
      this.newCanvas();
    });
    this.players_select.addEventListener("change", (e) => {
      this.mode = e.target.value;
      if (this.mode == 1) {
        for (let i = 1; i <= 3; i++) {
          document.getElementById("player2-life" + i).hidden = true;
        }
      }
      if (this.mode == 2) {
        for (let i = 1; i <= 3; i++) {
          document.getElementById("player2-life" + i).hidden = false;
        }
      }
    });
    this.newCanvas();
    this.restart_button.addEventListener("click", this.restartGame.bind(this));
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

  restartGame() {
    if (this.game != null) this.game.restartGame();
  }

  startGame() {
    this.map_select.disabled = true;
    this.players_select.disabled = true;
    this.start_button.disabled = true;
    this.restart_button.disabled = false;
    this.game = new Game(
      this.board,
      this.mode,
      this.difficulty,
      this.sizeCell,
      this.canvas,
      this.audios,
      this.keymaps
    ); //game not initialiazed
    this.canvas.updateSubscription = this.game.subscribeToCanvasUpdate(
      (entities) => {
        this.canvas.update(entities);
      }
    );
    this.game_ended_signal_subcription = this.game.subscribeToEndedGame(
      (result) => {
        this.map_select.disabled = false;
        this.players_select.disabled = false;
        this.start_button.disabled = false;
        this.restart_button.disabled = true;
        this.canvas.drawMap();
      }
    );
    this.game.init();
    document.getElementById("container-game-info").scrollIntoView();
    this.canvas_element.focus();
  }

  unsubscribeAll() {
    this.canvas.unsubscribeAll();
    if (this.game) this.game.unsubscribeAll();
  }
}

const loadAudio = (element_id) => {
  const audio = document.getElementById(element_id);
  audio.load();
  return audio;
};

const main = () => {
  const CANVAS = document.getElementById("map");
  const CONTEXT = CANVAS.getContext("2d");
  const map_select = document.getElementById("map-select");
  const players_select = document.getElementById("players-select");
  const start_button = document.getElementById("start-button");
  const restart_button = document.getElementById("restart-button");

  const audios = {
    audio_intro: loadAudio("audio-intro"),
    audio_main: loadAudio("audio-main"),
    audio_gameover: loadAudio("audio-gameover"),
    audio_powerup: loadAudio("audio-powerup"),
  };

  const KEYMAPS = {
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
    restart_button,
    audios,
    KEYMAPS
  );
  main_scene.init();
};
window.addEventListener("load", function (event) {
  main();
});
