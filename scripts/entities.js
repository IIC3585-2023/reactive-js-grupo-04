class Entity {
  constructor(id, x, y, size, map) {
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
    this.map = map;
  }

  #move() {
    const { x, y } = this.directionMap[this.directionMovement];
    this.position.x += x * this.speed;
    this.position.y += y * this.speed;
    this.position_subject.next(this);
  }

  checkWallCollission(direction) {
    let is_collided = false;
    const { x, y } = this.directionMap[direction];
    if (
      this.map.matrix_content[
        parseInt((this.position.y + y * this.speed) / this.size)
      ][parseInt((this.position.x + x * this.speed) / this.size)] == "#" ||
      this.map.matrix_content[
        parseInt((this.position.y + y * this.speed) / this.size + 0.9999)
      ][parseInt((this.position.x + x * this.speed) / this.size)] == "#" ||
      this.map.matrix_content[
        parseInt((this.position.y + y * this.speed) / this.size)
      ][parseInt((this.position.x + x * this.speed) / this.size + 0.9999)] ==
        "#" ||
      this.map.matrix_content[
        parseInt((this.position.y + y * this.speed) / this.size + 0.9999)
      ][parseInt((this.position.x + x * this.speed) / this.size + 0.9999)] ==
        "#"
    ) {
      is_collided = true;
    }
    return is_collided;
  }

  subscribeToPosition(callback) {
    this.position_subject.subscribe(callback);
  }

  changeDirection(direction) {
    this.direction = direction;
  }

  subscribeToKeyboardEvent(direction) {
    this.directionKeyboard = direction;
  }

  subscribeToMove(canvas) {
    if (this.checkWallCollission(this.directionMovement)) {
      return;
    } else {
      canvas.clearEntity(this);
      this.#move();
      canvas.drawEntity(this);
    }
  }

  unsuscribeEntity() {
    if (!this.clock_subscription) {
      throw new Error("Observable subject is not suscribed.");
    }
    this.clock_subscription.unsubscribe();
  }

  toString() {
    return `${this.id}: (${this.position.x}, ${this.position.y})`;
  }
}

class Player extends Entity {
  constructor(id, x, y, size, map, keymap) {
    super(id, x, y, size, map);
    this.keymap = keymap;
  }

  subscribeToMove(canvas) {
    if (!this.checkWallCollission(this.directionKeyboard)) {
      this.directionMovement = this.directionKeyboard;
    }
    super.subscribeToMove(canvas);
  }

  unsuscribeEntity() {
    super.unsuscribeEntity();
    this.keyboard_subscription.unsubscribe();
  }
}

class Enemy extends Entity {
  constructor(id, x, y, size, map, players) {
    super(id, x, y, size, map);
    this.playersArray = players;
    this.oppositeDirection = {
      up: "down",
      down: "up",
      left: "right",
      right: "left",
    };
  }

  subscribeToMove(canvas) {
    if (this.checkWallCollission(this.directionMovement)) {
      this.directionMovement = this.chooseDirection(canvas);
    }
    super.subscribeToMove(canvas);
  }

  chooseDirection(canvas) {
    const surroundings = this.getSurroundings(canvas);
    console.log(surroundings);
    let validSurroundings = surroundings.filter((surrounding) => {
      return surrounding.content !== "#";
    });

    // if there is only one direction, return it
    if (validSurroundings.length === 1) return validSurroundings[0].direction;

    // remove the oposite direction
    validSurroundings = validSurroundings.filter((surrounding) => {
      return surrounding.direction !== this.oppositeDirection[this.direction];
    });

    // with probability 0.2, return random direction
    if (Math.random() < 0.2) {
      const randomIndex = Math.floor(Math.random() * validSurroundings.length);
      return validSurroundings[randomIndex].direction;
    }

    // choose direction more close to the player
    if (this.playersArray) {
      this.playersArray.forEach((player) => {
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

  getSurroundings(canvas) {
    return Object.entries(this.directionMap).map(([direction, { x, y }]) => ({
      direction,
      content: canvas.getCell(
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
