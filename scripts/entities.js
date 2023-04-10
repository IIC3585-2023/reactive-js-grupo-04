class Entity {
  constructor(id, x, y, size) {
    this.id = id;
    this.position = { x: x, y: y };
    this.size = size;
    this.img = document.getElementById(id);
    this.speed = size / 10;
    this.directionMovement = "up";
    this.directionKeyboard = "up";
    this.directionMap = {
      up: { x: 0, y: -1 },
      down: { x: 0, y: 1 },
      left: { x: -1, y: 0 },
      right: { x: 1, y: 0 },
    };
    this.has_ability = false;
    this.position_subject = new rxjs.Subject();
    this.clock_subscription = null;
    this.keyboard_subscription = null;
  }

  #move() {
    const { x, y } = this.directionMap[this.directionMovement];
    this.position.x += x * this.speed;
    this.position.y += y * this.speed;
  }

  getposBoard = (axis, direction) =>
    (this.position[axis] + this.directionMap[direction][axis] * this.speed) /
    this.size;

  checkWallCollision(direction, board) {
    if (!direction) return false;
    const y = this.getposBoard("y", direction);
    const x = this.getposBoard("x", direction);
    const yPos = parseInt(y);
    const xPos = parseInt(x);
    const yPosNext = parseInt(y + 0.9999);
    const xPosNext = parseInt(x + 0.9999);
    return [
      board.matrix_content[yPos][xPos],
      board.matrix_content[yPosNext][xPos],
      board.matrix_content[yPos][xPosNext],
      board.matrix_content[yPosNext][xPosNext],
    ].includes("#");
  }

  changeDirection(direction) {
    this.direction = direction;
  }

  callbackKeyboardEventSignal(direction) {
    this.directionKeyboard = direction;
  }

  callbackMoveSignal(board) {
    if (!this.checkWallCollision(this.directionMovement, board)) {
      this.#move();
    }
    this.position_subject.next(this);
  }

  unsubscribeEntity() {
    if (!this.clock_subscription) {
      throw new Error("Observable subject is not suscribed.");
    }
    this.clock_subscription.unsubscribe();
  }

  toString() {
    return `${this.id}: (${this.position.x}, ${this.position.y})`;
  }

  getMapX() {
    let map_x = parseInt(this.position.x / this.size);
    return map_x;
  }

  getMapY() {
    let map_y = parseInt(this.position.y / this.size);
    return map_y;
  }

  getMapCenterX() {
    let map_x = parseInt((this.position.x + this.size / 2) / this.size);
    return map_x;
  }

  getMapCenterY() {
    let map_y = parseInt((this.position.y + this.size / 2) / this.size);
    return map_y;
  }
}

class Player extends Entity {
  constructor(id, x, y, size, keymap, _powerup_observable) {
    super(id, x, y, size);
    this.keymap = keymap;
    this.ability_animation_speed = 200;
    this.ability_duration = 6000;
    this.lifes = 3;
    this.img_count = 1;
    this._powerup_observable = _powerup_observable;
    this.intervalId = null;
    this.timeoutId = null;
  }

  callbackMoveSignal(board) {
    if (!this.checkWallCollision(this.directionKeyboard, board)) {
      if (this.directionKeyboard)
        this.directionMovement = this.directionKeyboard;
    }
    super.callbackMoveSignal(board);
  }

  activatePower() {
    // If the ability is already active, clear the existing interval
    if (this.has_ability) {
      clearInterval(this.intervalId);
      clearTimeout(this.timeoutId);
      this.img_count = 1;
    }
    this.has_ability = true;
    this._powerup_observable.next(true);
    // this.img = document.getElementById(`${"player1"}-${this.img_count}`);
    this.img = document.getElementById(`${this.id}-${this.img_count}`);
    // Start the interval
    this.intervalId = setInterval(() => {
      if (this.img_count == 5) {
        this.img_count = 0;
      }
      this.img_count++;
      this.img = document.getElementById(`${this.id}-${this.img_count}`);
      // this.img = document.getElementById(`${"player1"}-${this.img_count}`);
    }, this.ability_animation_speed);

    // Stop the interval after 5 seconds
    this.timeoutId = setTimeout(() => {
      clearInterval(this.intervalId); // Stop the interval
      this.has_ability = false;
      this._powerup_observable.next(false);
      this.img = document.getElementById(this.id);
    }, this.ability_duration);
  }

  takeDamage() {
    this.lifes -= 1;
  }

  checkPlayerRewardCollision(board) {
    const collisions = board.reward_data.filter(
      (reward_object) =>
        this.getMapCenterX() === reward_object.pos_x &&
        this.getMapCenterY() === reward_object.pos_y
    );
    if (collisions.length > 0) {
      this.activatePower();
      board.reward_data = board.reward_data.filter(
        (x) => !collisions.includes(x)
      );
      return true;
    }
    return false;
  }

  unsubscribeEntity() {
    super.unsubscribeEntity();
    clearInterval(this.intervalId);
    clearTimeout(this.timeoutId);
    this.keyboard_subscription.unsubscribe();
  }
}

class Enemy extends Entity {
  constructor(id, x, y, size, players) {
    super(id, x, y, size);

    this.oppositeDirection = {
      up: "down",
      down: "up",
      left: "right",
      right: "left",
    };
    this.best_direction = { x: 1, y: 0 };
  }

  callbackMoveSignal(board, players_array) {
    let best_direction = this.chooseDirection(board, players_array);
    if (
      !this.checkWallCollision(best_direction, board) &&
      best_direction != this.best_direction
    ) {
      this.best_direction = best_direction;
      this.directionMovement = best_direction;
    }
    super.callbackMoveSignal(board);
  }

  checkCollisionWithPlayers(players_array) {
    let collision_entity_to_die = null;
    players_array.forEach((player) => {
      if (
        player.getMapCenterX() === this.getMapCenterX() &&
        player.getMapCenterY() === this.getMapCenterY()
      ) {
        if (player.has_ability) {
          collision_entity_to_die = this;
        } else {
          collision_entity_to_die = player;
        }
      }
    });
    return collision_entity_to_die;
  }

  chooseDirection(board, players_array) {
    const surroundings = this.getSurroundings(board);
    let validSurroundings = surroundings.filter((surrounding) => {
      return surrounding.content !== "#";
    });

    // if there is only one direction, return it
    if (validSurroundings.length === 1) return validSurroundings[0].direction;

    // remove the oposite direction
    validSurroundings = validSurroundings.filter((surrounding) => {
      return (
        surrounding.direction !== this.oppositeDirection[this.directionMovement]
      );
    });

    // with 20% probability, return random direction
    // if (Math.random() < 0.2) {
    //   const randomIndex = Math.floor(Math.random() * validSurroundings.length);
    //   return validSurroundings[randomIndex].direction;
    // }

    // choose direction more close to the player
    if (players_array) {
      players_array.forEach((player) => {
        // absolute value of the distance between the player and the enemy
        // root((x2 - x1)^2 + (y2 - y1)^2)
        validSurroundings.forEach((surrounding) => {
          const { x, y } = surrounding.coords;
          const distance = Math.sqrt(
            Math.pow(player.position.x - x * this.size, 2) +
              Math.pow(player.position.y - y * this.size, 2)
          );
          if (!player.has_ability){
            surrounding.distance.push(distance);
          }
          else {
            surrounding.distance.push(-distance);
          }
        });
      });
    }

    // choose the direction with the lowest distance
    const min = validSurroundings.reduce((min, surrounding) => {
      const minDistance = Math.min(...min.distance);
      const surroundingDistance = Math.min(...surrounding.distance);
      return minDistance < surroundingDistance ? min : surrounding;
    }, validSurroundings[0]);

    return min ? min.direction : this.direction;
  }

  getSurroundings(board) {
    return Object.entries(this.directionMap).map(([direction, { x, y }]) => ({
      direction,
      content: board.getCell(
        parseInt(this.getMapX() + x),
        parseInt(this.getMapY() + y)
      ),
      coords: {
        x: parseInt(this.getMapX() + x),
        y: parseInt(this.getMapY() + y),
      },
      distance: [],
    }));
  }
}
