
const getArrayFromBoard = (board) => {
    const rows = board.split('\n').filter((row) => row.length > 0);
    const columns = rows.map((row) => row.split(''));
    return columns;
}


const drawMap = (arrayBoard, canvas, context, sizeCell) => {
    const boardHeight = arrayBoard.length * sizeCell;
    const boardWidth = arrayBoard[0].length * sizeCell;
    canvas.height = boardHeight;
    canvas.width = boardWidth;
    const cellSize = sizeCell;
    arrayBoard.map((row, rowIndex) => {
        row.map((cell, cellIndex) => {
            context.fillStyle = cell === '#' ? 'black' : 'white';
            context.fillRect(
                cellIndex * (cellSize),
                rowIndex * (cellSize),
                cellSize,
                cellSize
            );
        });
    });
}


const drawPlayer = (player, context) => {
    context.fillStyle = player.color;
    context.fillRect(player.x, player.y, player.size, player.size);
}

const clearPlayer = (player, context) => {
    context.clearRect(player.x, player.y, player.size, player.size);
}

class Canvas {
    constructor(board, sizeCell, canvas, context) {
        this.arrayBoard = getArrayFromBoard(board);
        this.sizeCell = sizeCell;
        this.canvas = canvas;
        this.context = context;
    }


    draw() {
        drawMap(this.arrayBoard, this.canvas, this.context, this.sizeCell);
    }


    drawPlayer(player) {
        drawPlayer(player, this.context);
    }


    clearPlayer(player) {
        clearPlayer(player, this.context);
    }


    getCell(x, y) {
        return this.arrayBoard[y][x];
    }
}
