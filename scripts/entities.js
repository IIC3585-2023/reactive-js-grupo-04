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

  checkWallCollission(direction, board) {
    let is_collided = false;
    const { x, y } = this.directionMap[direction];
    if (
      board.matrix_content[
        parseInt((this.position.y + y * this.speed) / this.size)
      ][parseInt((this.position.x + x * this.speed) / this.size)] == "#" ||
      board.matrix_content[
        parseInt((this.position.y + y * this.speed) / this.size + 0.9999)
      ][parseInt((this.position.x + x * this.speed) / this.size)] == "#" ||
      board.matrix_content[
        parseInt((this.position.y + y * this.speed) / this.size)
      ][parseInt((this.position.x + x * this.speed) / this.size + 0.9999)] ==
        "#" ||
      board.matrix_content[
        parseInt((this.position.y + y * this.speed) / this.size + 0.9999)
      ][parseInt((this.position.x + x * this.speed) / this.size + 0.9999)] ==
        "#"
    ) {
      is_collided = true;
    }
    return is_collided;
  }

  changeDirection(direction) {
    this.direction = direction;
  }

  callbackKeyboardEventSignal(direction) {
    this.directionKeyboard = direction;
  }

  callbackMoveSignal(board) {
    if (!this.checkWallCollission(this.directionMovement, board)) {
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
}

class Player extends Entity {
  constructor(id, x, y, size, keymap) {
    super(id, x, y, size);
    this.keymap = keymap;
    this.ability_animation_speed = 200;
    this.ability_duration = 6000;
    this.lifes = 3;
    this.img_count = 1;
  }

  callbackMoveSignal(board) {
    if (!this.checkWallCollission(this.directionKeyboard, board)) {
      this.directionMovement = this.directionKeyboard;
    }
    super.callbackMoveSignal(board);
  }

  activatePower() {
    this.has_ability = true;
    this.img = document.getElementById(this.id + "-" + this.img_count);
    // Start the interval
    const intervalId = setInterval(() => {
      if (this.img_count == 5) {
        this.img_count = 0;
      }
      this.img_count++;
      this.img = document.getElementById(this.id + "-" + this.img_count);
    }, this.ability_animation_speed);

    // Stop the interval after 5 seconds
    setTimeout(() => {
      clearInterval(intervalId); // Stop the interval
      this.has_ability = false;
      this.img = document.getElementById(this.id);
    }, this.ability_duration);
  }

  takeDamage() {
    let heart_element = document.getElementById(this.id + "-life" + this.lifes);
    heart_element.src = "../assets/heart-" + this.id + "-empty.png";
    this.lifes -= 1;
  }

  checkPlayerRewardCollision(board) {
    const collisions = board.reward_data.filter(
      (reward_object) =>
        this.getMapX() === reward_object.pos_x &&
        this.getMapY() === reward_object.pos_y
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
      !this.checkWallCollission(best_direction, board) &&
      best_direction != this.best_direction
    ) {
      this.best_direction = best_direction;
      this.directionMovement = best_direction;
    }
    super.callbackMoveSignal(board);
  }

  checkCollisionWithPlayers(players_array) {
    let collision_entity_to_die = null;
    players_array.every((player) => {
      if (
        player.getMapX() === this.getMapX() &&
        player.getMapY() === this.getMapY()
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

    // with probability 0.2, return random direction
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
          surrounding.distance.push(distance);
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
        parseInt(this.position.x / this.size) + x,
        parseInt(this.position.y / this.size) + y
      ),
      coords: {
        x: parseInt(this.position.x / this.size) + x,
        y: parseInt(this.position.y / this.size) + y,
      },
      distance: [],
    }));
  }
}
