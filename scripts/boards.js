class Board {
  constructor(raw_board) {
    this.raw_board = raw_board;
    this.matrix_content = this.getArrayFromBoard();
    this.reward_data = this.chooseRandomRewards();
  }
  getArrayFromBoard() {
    const rows = this.raw_board.split("\n").filter((row) => row.length > 0);
    const columns = rows.map((row) => row.replace(/ /g, "").split(""));
    return columns;
  }

  chooseRandomRewards() {
    const reward_list = [];
    this.matrix_content.map((row, rowIndex) => {
      row.forEach((cell, cellIndex) => {
        if (cell === "R") {
          const reward_object = {
            pos_y: rowIndex,
            pos_x: cellIndex,
            random_reward_number: Math.floor(Math.random() * 2) + 1,
          };
          reward_list.push(reward_object);
        }
      });
    });
    return reward_list;
  }

  getCell(x, y) {
    return this.matrix_content[y][x];
  }

  getValidCells() {
    const validCells = [];
    this.matrix_content.map((row, rowIndex) => {
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
    let validCells = this.getValidCells();
    const randomIndex = Math.floor(Math.random() * validCells.length);
    return validCells[randomIndex];
  }
}

const BOARDS = [
  {
    id: 0,
    difficulty: "easy",
    board: `
        ##############
        #.......#R...#
        #.#####.####.#
        #.####..####.#
        #.####.#####.#
        #............#
        ##.########.##
        ##.########.##
        #...R####R...#
        #.##########.#
        #............#
        ##############`,
  },
  {
    id: 1,
    difficulty: "medium",
    board: `
        ############################
        #............##...........R#
        #.####.#####.##.#####.####.#
        #.####.#####.##.#####.####.#
        #.####.#####.##.#####.####.#
        #..........................#
        #.####.##.########.##.####.#
        #.####.##.########.##.####.#
        #R.....##....##....##......#
        ######....##....##R...######
        ############################`,
  },
  {
    id: 2,
    difficulty: "hard",
    board: `
        #############
        #...........#
        #.#.#.#.#.#.#
        #...........#
        #.#.#R#.#.#.#
        #...........#
        #.#.#.#.#.#.#
        #...........#
        #.#.#.#.#.#.#
        #...........#
        #.#.#.#.#R#.#
        #...........#
        #.#.#.#.#.#.#
        #....R......#
        #############`,
  },
];
