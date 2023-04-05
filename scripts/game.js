class Game {
  constructor(board, sizeCell, canvas, keymaps) {
    this.board = board;
    this.sizeCell = sizeCell;
    this.canvas = canvas;
    this.keymaps = keymaps;
    this.players = [];
    this.enemies = [];
    this.entities = [];
    this._collision_subject = new rxjs.Subject();
    this.fps = 30;
    this._clock_observable = new rxjs.interval(1000 / this.fps);
    this._keyboard_observable = new rxjs.fromEvent(document, "keydown").pipe(
      rxjs.operators.map((event) => {
        if (event instanceof KeyboardEvent) {
          const direction = this.keymaps.player1[event.key];
          return direction;
        }
      })
    );
  }
  init() {
    window.addEventListener("beforeunload", (event) => {
      this.unsubscribeAll();
    });
    this.addPlayersAndEnemies();
  }

  checkPlayerRewardCollision(player) {
    const collisions = this.board.reward_data.filter(
      (reward_object) =>
        player.position.x === reward_object.pos_x &&
        player.position.y === reward_object.pos_y
    );
    if (collisions.length > 0) {
      player.has_ability = true;
      this.board.reward_data = this.board.reward_data.filter(
        (reward_object) =>
          player.position.x != reward_object.pos_x ||
          player.position.y != reward_object.pos_y
      );
      this._collision_subject.next(player);
    }
  }

  checkPlayerEnemyCollision(enemy) {
    this.players.forEach((player, player_index) => {
      if (
        player.position.x === enemy.position.x &&
        player.position.y === enemy.position.y
      ) {
        if (player.has_ability) {
          this.killEnemy(enemy, player);
          this.canvas.clearEntity(enemy);
        } else {
          this.stopGame();
        }
      }
    });
  }

  checkPlayerCollisions(player) {
    this.checkPlayerRewardCollision(player);
    this.checkPlayerEnemyCollision(player);
  }

  subscribeToCollision(callback) {
    this._collision_subject.subscribe(callback);
  }

  addPlayersAndEnemies() {
    const sizeCharacter = this.sizeCell;
    // player 1
    let { x, y } = this.canvas.getRandomValidCell();
    const player1 = new Player(
      "player1",
      x * sizeCharacter,
      y * sizeCharacter,
      sizeCharacter,
      this.board,
      this.keymaps.player1
    );
    this.players.push(player1);
    this.canvas.drawEntity(player1);
    // player1.declareObservablePlayer();
    // player1.suscribeEntity(this.canvas);
    player1.subscribeToPosition((player) => {
      this.checkPlayerRewardCollision(player);
    });
    player1.clock_subscription = this._clock_observable.subscribe(() =>
      player1.subscribeToMove(this.canvas)
    );
    player1.keyboard_subscription = this._keyboard_observable.subscribe(
      (direction) => player1.subscribeToKeyboardEvent(direction)
    );

    // // player 2
    // ({ x, y } = canvas.getRandomValidCell());
    // const player2 = new Player("player2", x = x, y = y, size = sizeCharacter, KEYMAP.player2);
    // players.push(player2);
    // canvas.drawEntity(player2);
    // player2.declareObservablePlayer();
    // player2.suscribeEntity(canvas);

    this.entities.push(...this.players);

    // enemy 1
    ({ x, y } = this.canvas.getRandomValidCell());

    const enemy1 = new Enemy(
      "enemy1",
      x * sizeCharacter,
      y * sizeCharacter,
      sizeCharacter,
      this.board,
      this.players
    );
    this.entities.push(enemy1);
    this.enemies.push(enemy1);
    this.canvas.drawEntity(enemy1);
    enemy1.subscribeToPosition((enemy) => {
      this.checkPlayerEnemyCollision(enemy);
    });
    enemy1.clock_subscription = this._clock_observable.subscribe(() =>
      enemy1.subscribeToMove(this.canvas)
    );

    // // enemy 2
    // ({ x, y } = canvas.getRandomValidCell());
    // const enemy2 = new Enemy("enemy2", x = x, y = y, size = sizeCharacter, players);
    // entities.push(enemy2);
    // canvas.drawEntity(enemy2);
    // enemy2.declareObservableEnemy(canvas);
    // enemy2.suscribeEntity(canvas);
    // const clicksOrTimer = rxjs.concat(
    //   enemy1.position_subject,
    //   player1.position_subject
    // );
    // let w = 1;
    // clicksOrTimer.subscribe((x) => console.log(++w));
  }
  killEnemy(enemy, player) {
    enemy.unsuscribeEntity();
    this._collision_subject.next(player);
  }

  stopGame() {
    this.unsubscribeAll();
  }
  unsubscribeAll() {
    let i = 0;
    this.entities.forEach((entity) => {
      entity.unsuscribeEntity();
      i += 1;
    });
    console.log(`All entities unsubscribed: ${i}/${this.entities.length}`);
  }
}
