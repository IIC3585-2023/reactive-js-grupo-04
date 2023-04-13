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

  addRewardToBoard() {
    let { x, y } = this.getRandomValidCell();
    const reward_object = {
      pos_y: y,
      pos_x: x,
      random_reward_number: Math.floor(Math.random() * 2) + 1,
    };
    this.reward_data.push(reward_object);
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

  restart() {
    this.reward_data = this.chooseRandomRewards();
  }
}

// difficulty: 0 = easy, 1 = medium, 2 = hard

const BOARDS = [
  {
    id: 0,
    difficulty: 1,
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
    difficulty: 2,
    board: `
        ############################
        #............##...........R#
        #.####.#####R##.#####.####.#
        #.####.#####.##.#####.####.#
        #.####.#####.##.#####.####.#
        #................R.........#
        #.####.##.########.##.####.#
        #.####.##.########.##.####.#
        #R.....##....##....##......#
        ######....##....##R...######
        ############################`,
  },
  {
    id: 2,
    difficulty: 2,
    board: `
        #############
        #.R.........#
        #.#.#.#.#.#.#
        #...........#
        #.#.#R#.#.#.#
        #...........#
        #.#.#.#.#.#.#
        #...........#
        #.#R#.#.#.#.#
        #...........#
        #.#.#.#.#R#.#
        #...........#
        #.#.#.#.#.#.#
        #....R......#
        #############`,
  },
  {
    id: 3,
    difficulty: 1,
    board: `
      #######
      #....R#
      #.#.#.#
      #.#.#.#
      #.#R..#
      #..##.#
      ##.##.#
      #R....#
      #######`,
  },
  {
    id: 4,
    difficulty: 1,
    board: `
      #######
      #....R#
      #.#.#.#
      #.#.#.#
      #..R#.#
      #.###.#
      #.#R#.#
      #.....#
      #######`,
  },
  {
    id: 5,
    difficulty: 1,
    board: `
      #######
      #....R#
      #.#.#.#
      #.....#
      #.#R#.#
      #.....#
      #.#.#.#
      #R....#
      #######`,
  },
];
