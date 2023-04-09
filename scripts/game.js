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
    this.powerup_subscription = null;
    this.fps = 60;
    this.pathAssets = "./assets";
    this.audio_intro = document.getElementById("audio-intro");
    this.audio_main = document.getElementById("audio-main");
    this.audio_powerup = document.getElementById("audio-powerup");
    this.audio_gameover = document.getElementById("audio-gameover");
    this.audio_main.currentTime = 0;
    this.audio_powerup.currentTime = 0;
    this._update_canvas_subject = new rxjs.Subject();
    this._end_game_subject = new rxjs.Subject();
    this._powerup_observable = new rxjs.Subject();
    this._clock_observable = new rxjs.interval(1000 / this.fps);
    this._keyboard_observable_1 = new rxjs.fromEvent(document, "keydown").pipe(
      rxjs.operators.map((event) => {
        if (event instanceof KeyboardEvent) {
          if (event.key in this.keymaps.player1) {
            const direction = this.keymaps.player1[event.key];
            return direction;
          }
        }
      })
    );
    this._keyboard_observable_2 = new rxjs.fromEvent(document, "keydown").pipe(
      rxjs.operators.map((event) => {
        if (event instanceof KeyboardEvent) {
          if (event.key in this.keymaps.player2) {
            const direction = this.keymaps.player2[event.key];
            return direction;
          }
        }
      })
    );
  }

  init() {
    window.addEventListener("beforeunload", (event) => {
      this.unsubscribeAll();
    });
    this.startGameIntro();
  }

  subscribeToCanvasUpdate(callback) {
    this._update_canvas_subject.subscribe(callback);
  }

  subscribeToEndedGame(callback) {
    this._end_game_subject.subscribe(callback);
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

  suscribeToPowerUpAudio() {
    this.powerup_subscription = this._powerup_observable.subscribe(
      (has_changed) => {
        let keep_playing = false;
        this.players.forEach((player) => {
          if (player.has_ability) keep_playing = true;
        });
        if (keep_playing) {
          this.startPowerUpAudio();
        } else {
          this.stopPowerUpAudio();
        }
      }
    );
  }

  startPowerUpAudio() {
    if (this.audio_powerup.paused) {
      this.audio_powerup.play();
      this.audio_main.pause();
    }
  }

  stopPowerUpAudio() {
    if (!this.audio_powerup.paused) {
      this.audio_powerup.pause();
      this.audio_main.play();
    }
  }

  refreshSubscription() {
    this.suscribeToPowerUpAudio();
    this.move_subscription = rxjs
      .merge(...this.entities.map((entity) => entity.position_subject))
      .subscribe((entity) => {
        this.checkEntitiesCollissions(entity);
      });
  }

  showSkipIntroWindow() {
    const game_over_window = document.getElementById("game-over-overlay");
    game_over_window.style = "display: none";
    const skip_window = document.getElementById("skip-box-overlay");
    skip_window.style = "display: flex";
  }

  startGameIntro() {
    this.stopAudio(this.audio_gameover);
    this.addPlayersAndEnemies();
    this.showSkipIntroWindow();
    this.playAudioIntro();
  }

  skipIntro() {
    this.stopAudio(this.audio_intro);
    this.startGameAfterIntro();
  }

  playAudioIntro() {
    this.audio_intro.play();

    const control_key = rxjs
      .fromEvent(document, "keydown")
      .pipe(rxjs.filter((event) => event.key === "Control"));

    const stop_listening_subject = new rxjs.Subject();
    const audio_end_observable = rxjs
      .fromEvent(this.audio_intro, "ended")
      .pipe(rxjs.takeUntil(stop_listening_subject));
    const control_pressed_observable = control_key.pipe(
      rxjs.takeUntil(stop_listening_subject)
    );

    rxjs
      .merge(audio_end_observable, control_pressed_observable)
      .pipe(rxjs.take(1))
      .subscribe((event) => {
        if (event.type === "ended") {
          this.startGameAfterIntro();
        } else if (event.type === "keydown") {
          this.skipIntro();
        }
        stop_listening_subject.next();
      });
  }

  stopAudio(audio) {
    if (!audio.paused) audio.pause();
    audio.currentTime = 0;
  }

  startGameAfterIntro() {
    const skip_window = document.getElementById("skip-box-overlay");
    skip_window.style = "display: none";
    this.audio_main.play();
    this.players.forEach((player) => {
      player.clock_subscription = this._clock_observable.subscribe(() =>
        player.callbackMoveSignal(this.board)
      );
      if (player.id == "player1"){
        player.keyboard_subscription = this._keyboard_observable_1.subscribe(
          (direction) => player.callbackKeyboardEventSignal(direction)
        );
      }
      else {
        player.keyboard_subscription = this._keyboard_observable_2.subscribe(
          (direction) => player.callbackKeyboardEventSignal(direction)
        );
      }
    });
    this.enemies.forEach(
      (enemy) =>
        (enemy.clock_subscription = this._clock_observable.subscribe(() =>
          enemy.callbackMoveSignal(this.board, this.players)
        ))
    );
    this.refreshSubscription();
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
      this.keymaps.player1,
      this._powerup_observable
    );
    this.players.push(player1);
    this.entities.push(...this.players);

    if (this.mode == 2) this.addSecondPlayer();

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
  }

  addSecondPlayer(){
    const sizeCharacter = this.sizeCell;
    // player 2
    let { x, y } = this.board.getRandomValidCell();
    const player2 = new Player(
      "player2",
      x * sizeCharacter,
      y * sizeCharacter,
      sizeCharacter,
      this.keymaps.player2,
      this._powerup_observable
    );
    this.players.push(player2);
    this.entities.push(...this.players);
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
    document.getElementById(
      `${player.id}-life${player.lifes + 1}`
    ).src = `${this.pathAssets}/hearts/heart-${player.id}-empty.png`;
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
    this.audio_gameover.play();
    this.audio_main.pause();
    this.audio_powerup.pause();
    this.restartHeartSprites();
    this.unsubscribeAll();
    this.board.restart();
    const result = this.players.length > 0 ? "p-win" : "e-win";
    this._end_game_subject.next(result);
    this.showGameOverWindow(result);
  }

  showGameOverWindow(result) {
    const game_over_window = document.getElementById("game-over-overlay");
    if (result === "e-win") {
      game_over_window.innerHTML =
        document.getElementById("lose-overlay").innerHTML;
    } else if (result === "p-win") {
      game_over_window.innerHTML =
        document.getElementById("win-overlay").innerHTML;
    }
    game_over_window.style = "display: flex";
  }

  restartGame() {
    this.audio_main.pause();
    this.restartHeartSprites();
    this.unsubscribeAll();
    this.board.restart();
    let result = this.players.length > 0 ? "p-win" : "e-win";
    this._end_game_subject.next(result);
  }

  restartHeartSprites() {
    for (let player_number = 1; player_number < 3; player_number++) {
      for (let heart_number = 1; heart_number < 4; heart_number++) {
        document.getElementById(
          `player${player_number}-life${heart_number}`
        ).src = `${this.pathAssets}/hearts/heart-player${player_number}-full.png`;
      }
    }
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
    if (this.powerup_subscription) this.powerup_subscription.unsubscribe();
    if (this.move_subscription) this.move_subscription.unsubscribe();
    console.log(`All entities unsubscribed: ${i}/${this.entities.length}`);
  }
}
