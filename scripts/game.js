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
    this.audio_intro = new Audio(`${this.pathAssets}/audios/intro.mp3`);
    this.audio_main = new Audio(`${this.pathAssets}/audios/main.mp3`);
    this.audio_powerup = new Audio(`${this.pathAssets}/audios/powerup.mp3`);
    this.audio_main.loop = true;
    this.audio_powerup.loop = true;
    this._update_canvas_subject = new rxjs.Subject();
    this._end_game_subject = new rxjs.Subject();
    this._powerup_observable = new rxjs.Subject();
    this.suscribeToPowerUpAudio();
    this._clock_observable = new rxjs.interval(1000 / this.fps);
    this._keyboard_observable = new rxjs.fromEvent(document, "keydown").pipe(
      rxjs.operators.map((event) => {
        if (event instanceof KeyboardEvent) {
          if (event.key in this.keymaps.player1) {
            const direction = this.keymaps.player1[event.key];
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

  unsubscribePowerUp() {
    this.powerup_subscription.unsubscribe();
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
    let skip_window = document.getElementById("skip-box-overlay");
    skip_window.style = "display: flex";
    let canvas_rect = this.canvas.canvas.getBoundingClientRect();
    skip_window.style.top = `${
      canvas_rect.y +
      window.scrollY +
      canvas_rect.height / 2 -
      skip_window.offsetHeight / 2
    }px`;

    skip_window.style.left = `${
      canvas_rect.x +
      window.scrollX +
      canvas_rect.width / 2 -
      skip_window.offsetWidth / 2
    }px`;
  }

  startGameIntro() {
    this.addPlayersAndEnemies();
    this.showSkipIntroWindow();
    this.playAudioIntro();
  }

  skipIntro(event) {
    this.stopAudioIntro();
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

  stopAudioIntro() {
    this.audio_intro.pause();
    this.audio_intro.currentTime = 0;
  }

  startGameAfterIntro() {
    let skip_window = document.getElementById("skip-box-overlay");
    skip_window.style = "display: none";
    this.audio_main.play();
    this.players.forEach((player) => {
      player.clock_subscription = this._clock_observable.subscribe(() =>
        player.callbackMoveSignal(this.board)
      );
      player.keyboard_subscription = this._keyboard_observable.subscribe(
        (direction) => player.callbackKeyboardEventSignal(direction)
      );
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
    this.audio_main.pause();
    this.audio_powerup.pause();
    this.restartHeartSprites();
    this.unsubscribeAll();
    this.board.restart();
    let result = this.players.length > 0 ? "p-win" : "e-win";
    this._end_game_subject.next(result);
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
    for (let player_number = 1; player_number < 2; player_number++) {
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
