
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
        const img = document.getElementById(player.id);
        const { x, y }= this.getCoordinates(player.x, player.y);
        this.context.drawImage(img, x, y, player.size, player.size);
    }


    clearPlayer(player) {
        const { x, y }= this.getCoordinates(player.x, player.y);
        this.context.clearRect(x, y, player.size, player.size);
    }


    getCell(x, y) {
        return this.arrayBoard[y][x];
    }

    getCoordinates(x, y) {
        return {
            x: x * this.sizeCell,
            y: y * this.sizeCell
        }
    }
}
