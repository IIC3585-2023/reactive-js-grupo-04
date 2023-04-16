class Game {
  constructor(board, mode, difficulty, sizeCell, canvas, audios, keymaps) {
    this.board = board;
    this.mode = mode;
    this.difficulty = difficulty;
    this.sizeCell = sizeCell;
    this.canvas = canvas;
    this.keymaps = keymaps;
    this.players = [];
    this.enemies = [];
    this.entities = [];
    this.move_subscription = null;
    this.powerup_subscription = null;
    this.fps = 30;
    this.pathAssets = "./assets";
    this.audio_intro = audios.audio_intro;
    this.audio_main = audios.audio_main;
    this.audio_powerup = audios.audio_powerup;
    this.audio_gameover = audios.audio_gameover;
    this.audio_main.currentTime = 0;
    this.audio_powerup.currentTime = 0;
    this._end_game_subject = new rxjs.Subject();
    this._powerup_observable = new rxjs.Subject();
    this._clock_observable = new rxjs.interval(1000 / this.fps);
    this._keyboard_observable_1 = this.declareKeyBoardObservable(
      this.keymaps.player1
    );
    this._keyboard_observable_2 = this.declareKeyBoardObservable(
      this.keymaps.player2
    );
  }

  init() {
    window.addEventListener("beforeunload", (event) => {
      this.unsubscribeAll();
    });
    this.startGameIntro();
  }

  declareKeyBoardObservable(keymap) {
    return new rxjs.fromEvent(document, "keydown").pipe(
      rxjs.operators.map((event) => {
        if (event instanceof KeyboardEvent) {
          if (event.key in keymap) {
            const direction = keymap[event.key];
            return direction;
          }
        }
      })
    );
  }

  subscribeToCanvasUpdate(callback) {
    return this._clock_observable
      .pipe(rxjs.map(() => this.entities))
      .subscribe(callback);
  }

  subscribeToEndedGame(callback) {
    this._end_game_subject.subscribe(callback);
  }

  checkEntitiesCollissions(entity) {
    if (entity.id.includes("enemy")) {
      let { to_die: collision_entity_to_die, player_powered } =
        entity.checkCollisionWithPlayers(this.players);
      if (collision_entity_to_die) {
        if (collision_entity_to_die.id === entity.id) {
          // enemy has to die
          this.killEnemy(entity);
          player_powered.has_ability = false;
          player_powered.desactivatePower();
          if (this.enemies.length == 0) this.stopGame();
        } else {
          this.killPlayer(collision_entity_to_die);
          if (this.players.length == 0) this.stopGame();
        }
      }
    }
    if (entity.id === "player1" || entity.id === "player2") {
      if (entity.checkPlayerRewardCollision(this.board)) {
        // // show gif when powerup is activated
        // document.getElementById(`${entity.id}-gif`).style.display = "block";
        // const audio = document.getElementById(`audio-${entity.id}`);
        // audio.play();
        // this.removeClockSubscription();
        // const secondsToShow = 5;
        // setTimeout(() => {
        //   document.getElementById(`${entity.id}-gif`).style.display = "none";
        //   audio.pause();
        //   audio.currentTime = 0;
        //   this.refreshClockSubscription();
        //   entity.activatePower();
        // }, secondsToShow * 1000);
        entity.activatePower();
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
      if (player.id == "player1") {
        player.keyboard_subscription = this._keyboard_observable_1.subscribe(
          (direction) => player.callbackKeyboardEventSignal(direction)
        );
      } else {
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

  removeClockSubscription() {
    this.entities.forEach((entity) => {
      if (entity.clock_subscription) entity.clock_subscription.unsubscribe();
    });
  }

  refreshClockSubscription() {
    this.entities.forEach((entity) => {
      entity.clock_subscription = this._clock_observable.subscribe(() =>
        entity.callbackMoveSignal(this.board)
      );
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
      this.keymaps.player1,
      this._powerup_observable
    );
    this.players.push(player1);

    if (this.mode == 2) this.addSecondPlayer();

    this.entities.push(...this.players);

    this.addEnemy("enemy1");
    this.addEnemy("enemy2");
    if (this.difficulty >= 1) {
      this.addEnemy("enemy3");
      this.addEnemy("enemy4");
    }
    if (this.difficulty >= 2) {
      this.addEnemy("enemy5");
      this.addEnemy("enemy6");
    }

    this.entities.push(...this.enemies);
  }

  addSecondPlayer() {
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
  }

  addEnemy(id) {
    const sizeCharacter = this.sizeCell;
    let { x, y } = this.board.getRandomValidCell();

    const enemy = new Enemy(
      id,
      x * sizeCharacter,
      y * sizeCharacter,
      sizeCharacter,
      this.players
    );
    this.enemies.push(enemy);
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
    this.canvas.unsubscribeAll();
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
    if (this._enemies_observable) this._enemies_observable.unsubscribe();
    console.log(`All entities unsubscribed: ${i}/${this.entities.length}`);
  }
}
