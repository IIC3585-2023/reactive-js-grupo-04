class Game {
  constructor(board, mode, sizeCell, canvas, keymaps) {
    this.board = board;
    this.mode = mode;
    this.sizeCell = sizeCell;
    this.canvas = canvas;
    this.keymaps = keymaps;
    this.players = [];
    this.enemies = [];
    this.entities = [];
    this.move_subscription = null;
    this.fps = 30;
    this.audio_intro = new Audio("../assets/intro.mp3");
    this.audio_main = new Audio("../assets/main.mp3");
    this.audio_main.loop = true;
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

  checkEntitiesCollissions(entity) {
    this._update_canvas_subject.next(this.entities);
    if (entity.id === "enemy1") {
      let collision_entity_to_die = entity.checkCollisionWithPlayers(
        this.players
      );
      if (collision_entity_to_die) {
        if (collision_entity_to_die.id === entity.id) {
          // enemy has to die
          this.killEnemy(entity);
          this._update_canvas_subject.next(this.entities);
          if (this.enemies.length == 0) this.stopGame();
        } else {
          this.killPlayer(collision_entity_to_die);
          this._update_canvas_subject.next(this.entities);
          if (this.players.length == 0) this.stopGame();
        }
      }
    }
    if (entity.id === "player1") {
      if (entity.checkPlayerRewardCollision(this.board)) {
        this._update_canvas_subject.next(this.entities);
      }
    }
  }

  refreshSubscription() {
    this.move_subscription = rxjs
      .merge(...this.entities.map((entity) => entity.position_subject))
      .subscribe((entity) => {
        this.checkEntitiesCollissions(entity);
      });
  }

  addPlayersAndEnemies() {
    const sizeCharacter = this.sizeCell;
    // player 1
    let { x, y } = this.board.getRandomValidCell();
    const player1 = new Player(
      "player1",
      x * sizeCharacter,
      y * sizeCharacter,
      sizeCharacter,
      this.keymaps.player1
    );
    this.players.push(player1);
    this.entities.push(...this.players);

    // enemy 1
    ({ x, y } = this.board.getRandomValidCell());

    const enemy1 = new Enemy(
      "enemy1",
      x * sizeCharacter,
      y * sizeCharacter,
      sizeCharacter,
      this.players
    );
    this.enemies.push(enemy1);
    this.entities.push(...this.enemies);
    this._update_canvas_subject.next(this.entities);

    this.audio_intro.play();

    this.audio_intro.addEventListener("ended", () => {
      console.log(this);
      player1.clock_subscription = this._clock_observable.subscribe(() =>
        player1.callbackMoveSignal(this.board)
      );
      player1.keyboard_subscription = this._keyboard_observable.subscribe(
        (direction) => player1.callbackKeyboardEventSignal(direction)
      );
      enemy1.clock_subscription = this._clock_observable.subscribe(() =>
        enemy1.callbackMoveSignal(this.board, this.players)
      );
      this.refreshSubscription();
      this.audio_main.play();
    });
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
    player.takeDamage();
    if (player.lifes > 0) {
      let { x, y } = this.board.getRandomValidCell();
      player.position.x = x * player.size;
      player.position.y = y * player.size;
    } else {
      this.killEntity(player);
      this.players = this.players.filter(
        (array_player) => player.id != array_player.id
      );
    }
  }

  stopGame() {
    this.audio_main.pause();
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
      entity.unsubscribeEntity();
      i += 1;
    });
    if (this.move_subscription) this.move_subscription.unsubscribe();
    console.log(`All entities unsubscribed: ${i}/${this.entities.length}`);
  }
}
