class Game {
  constructor(board, sizeCell, canvas, keymaps) {
    this.board = board;
    this.sizeCell = sizeCell;
    this.canvas = canvas;
    this.keymaps = keymaps;
    this.players = [];
    this.enemies = [];
    this.entities = [];
    this.move_subscription = null;
    this.fps = 30;
    this._update_canvas_subject = new rxjs.Subject();
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

  subscribeToCanvasUpdate(callback) {
    this._update_canvas_subject.subscribe(callback);
  }

  checkPlayerRewardCollision(player) {
    const collisions = this.board.reward_data.filter(
      (reward_object) =>
        player.getMapX() === reward_object.pos_x &&
        player.getMapY() === reward_object.pos_y
    );
    if (collisions.length > 0) {
      player.has_ability = true;
      this.board.reward_data = this.board.reward_data.filter(
        (x) => !collisions.includes(x)
      );
      this._update_canvas_subject.next(this.entities);
    }
  }

  refreshSubscription() {
    this.move_subscription = rxjs
      .merge(...this.entities.map((entity) => entity.position_subject))
      .subscribe((entity) => {
        this._update_canvas_subject.next(this.entities);
        if (entity.id === "enemy1") this.checkPlayerEnemyCollision(entity);
        if (entity.id === "player1") this.checkPlayerRewardCollision(entity);
      });
  }

  checkPlayerEnemyCollision(enemy) {
    this.players.forEach((player) => {
      if (
        player.getMapX() === enemy.getMapX() &&
        player.getMapY() === enemy.getMapY()
      ) {
        if (player.has_ability) {
          this.killEnemy(enemy);
          this._update_canvas_subject.next(this.entities);
          if (this.enemies.length == 0) this.stopGame();
        } else {
          this.killPlayer(player);
          this._update_canvas_subject.next(this.entities);
          if (this.players.length == 0) this.stopGame();
        }
      }
    });
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
    player1.clock_subscription = this._clock_observable.subscribe(() =>
      player1.callbackMoveSignal(this.canvas, this.board)
    );
    player1.keyboard_subscription = this._keyboard_observable.subscribe(
      (direction) => player1.callbackKeyboardEventSignal(direction)
    );
    this.entities.push(...this.players);

    // enemy 1
    ({ x, y } = this.canvas.getRandomValidCell());

    const enemy1 = new Enemy(
      "enemy1",
      x * sizeCharacter,
      y * sizeCharacter,
      sizeCharacter,
      this.players
    );
    this.enemies.push(enemy1);
    this.entities.push(...this.enemies);
    this.canvas.drawEntity(enemy1);
    enemy1.clock_subscription = this._clock_observable.subscribe(() =>
      enemy1.callbackMoveSignal(this.canvas, this.board)
    );

    this.refreshSubscription();

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

  killEntity(entity) {
    this.unsubscribeEntity(entity);
    this.entities = this.entities.filter(
      (array_entity) => entity.id != array_entity.id
    );
  }
  killEnemy(enemy) {
    this.killEntity(enemy);
    this.enemies = this.enemies.filter(
      (array_enemy) => enemy.id != array_enemy.id
    );
  }

  killPlayer(player) {
    this.killEntity(player);
    this.players = this.players.filter(
      (array_player) => player.id != array_player.id
    );
  }
  stopGame() {
    console.log("juego terminado");
    if (this.players.length === 0) console.log("ganan malos");
    else console.log("ganan bueno");
    this.unsubscribeAll();
  }

  unsubscribeEntity(entity) {
    this.move_subscription.unsubscribe();
    this.refreshSubscription();
    entity.unsubscribeEntity();
  }

  unsubscribeAll() {
    let i = 0;
    this.entities.forEach((entity) => {
      this.unsubscribeEntity(entity);
      i += 1;
    });
    console.log(`All entities unsubscribed: ${i}/${this.entities.length}`);
  }
}
