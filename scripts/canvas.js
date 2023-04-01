
const getArrayFromBoard = (board) => {
    const rows = board.split('\n').filter((row) => row.length > 0);
    const columns = rows.map((row) => row.replace(/ /g, '').split(''));
    return columns;
}


class Canvas {
    constructor(board, sizeCell, canvas, context) {
        this.arrayBoard = getArrayFromBoard(board);
        this.validCells = this.getValidCells();
        this.sizeCell = sizeCell;
        this.canvas = canvas;
        this.context = context;
    }

    drawMap() {
        const cellSize = this.sizeCell;
        const boardHeight = this.arrayBoard.length * cellSize;
        const boardWidth = this.arrayBoard[0].length * cellSize;
        this.canvas.height = boardHeight;
        this.canvas.width = boardWidth;
        this.arrayBoard.map((row, rowIndex) => {
            row.map((cell, cellIndex) => {
                this.context.fillStyle = cell === '#' ? '#fed7aa' : 'transparent';
                this.context.fillRect(
                    cellIndex * (cellSize),
                    rowIndex * (cellSize),
                    cellSize,
                    cellSize
                );
                if (cell === '#') {
                    this.context.drawImage(
                        document.getElementById('tree'),
                        cellIndex * (cellSize),
                        rowIndex * (cellSize),
                        cellSize,
                        cellSize
                    );
                }
                if (cell === 'T') {
                    this.context.drawImage(
                        document.getElementById(`reward${Math.floor(Math.random() * 2) + 1}`),
                        cellIndex * (cellSize),
                        rowIndex * (cellSize),
                        cellSize,
                        cellSize
                    );
                }
            });
        });
    }

    drawEntity(entity) {
        const img = document.getElementById(entity.id);
        const { x, y }= this.getCoordinates(entity.x, entity.y);
        this.context.drawImage(img, x, y, entity.size, entity.size);
    }

    clearEntity(entity) {
        const { x, y }= this.getCoordinates(entity.x, entity.y);
        this.context.clearRect(x, y, entity.size, entity.size);
    }

    getCell(x, y) {
        return this.arrayBoard[y][x];
    }

    getNextEntityCell(entity) {
        const arrayBoard = this.arrayBoard;
        switch (entity.direction) {
            case "up":
                return arrayBoard[(entity.y - entity.speed)][entity.x];
            case "down":
                return arrayBoard[(entity.y + entity.speed)][entity.x];
            case "left":
                return arrayBoard[entity.y][(entity.x - entity.speed)];
            case "right":
                return arrayBoard[entity.y][(entity.x + entity.speed)];
        }
    }

    getCoordinates(x, y) {
        return {
            x: x * this.sizeCell,
            y: y * this.sizeCell
        }
    }

    getValidCells() {
        const validCells = [];
        this.arrayBoard.map((row, rowIndex) => {
            row.map((cell, cellIndex) => {
                if (cell === '.') {
                    validCells.push({
                        x: cellIndex,
                        y: rowIndex
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
}
