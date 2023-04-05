class Canvas {
  constructor(board, sizeCell, canvas, context) {
    this.board = board;
    this.validCells = this.getValidCells();
    this.sizeCell = sizeCell;
    this.canvas = canvas;
    this.context = context;
    this.updateSubscription = null;
  }

  drawMap() {
    const cellSize = this.sizeCell;
    const boardHeight = this.board.matrix_content.length * cellSize;
    const boardWidth = this.board.matrix_content[0].length * cellSize;
    this.canvas.height = boardHeight;
    this.canvas.width = boardWidth;
    const imgTree = document.getElementById("tree");
    this.board.matrix_content.map((row, rowIndex) => {
      row.map((cell, cellIndex) => {
        this.context.fillStyle = cell === "#" ? "#fed7aa" : "transparent";
        this.context.fillRect(
          cellIndex * cellSize,
          rowIndex * cellSize,
          cellSize,
          cellSize
        );
        if (cell === "#") {
          this.drawImageOnCell(imgTree, cellIndex, rowIndex);
        }
      });
    });
    this.drawRewards();
  }

  drawRewards() {
    const imgReward = (randomN) => document.getElementById(`reward${randomN}`);
    this.board.reward_data.forEach((reward_object) => {
      this.drawImageOnCell(
        imgReward(reward_object.random_reward_number),
        reward_object.pos_x,
        reward_object.pos_y
      );
    });
  }

  drawImageOnCell(img, col, row) {
    this.context.drawImage(
      img,
      col * this.sizeCell,
      row * this.sizeCell,
      this.sizeCell,
      this.sizeCell
    );
  }

  drawEntity(entity) {
    this.context.drawImage(
      entity.img,
      entity.position.x,
      entity.position.y,
      this.sizeCell,
      this.sizeCell
    );
    this.drawRewards();
  }

  clearEntity(entity) {
    const { x, y } = this.getCoordinates(entity.position.x, entity.position.y);
    this.context.clearRect(
      entity.position.x,
      entity.position.y,
      this.sizeCell,
      this.sizeCell
    );
  }

  getCell(x, y) {
    return this.board.matrix_content[y][x];
  }

  getNextEntityCell(entity) {
    const board = this.board;
    switch (entity.direction) {
      case "up":
        return board.matrix_content[entity.position.y - entity.speed][
          entity.position.x
        ];
      case "down":
        return board.matrix_content[entity.position.y + entity.speed][
          entity.position.x
        ];
      case "left":
        return board.matrix_content[entity.position.y][
          entity.position.x - entity.speed
        ];
      case "right":
        return board.matrix_content[entity.position.y][
          entity.position.x + entity.speed
        ];
    }
  }

  getCoordinates(x, y) {
    return {
      x: x * this.sizeCell,
      y: y * this.sizeCell,
    };
  }

  getValidCells() {
    const validCells = [];
    this.board.matrix_content.map((row, rowIndex) => {
      row.map((cell, cellIndex) => {
        if (cell === ".") {
          validCells.push({
            x: cellIndex,
            y: rowIndex,
          });
        }
      });
    });
    return validCells;
  }

  getRandomValidCell() {
    const randomIndex = Math.floor(Math.random() * this.validCells.length);
    return this.validCells[randomIndex];
  }
  update(entities) {
    this.drawMap();
    entities.forEach((entity) => this.drawEntity(entity));
  }
  unsubscribeAll() {
    if (this.updateSubscription) this.updateSubscription.unsubscribe();
  }
}
