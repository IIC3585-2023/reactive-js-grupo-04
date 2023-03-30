// import { Board } from './map.js';
// import { Player } from './player.js';

const BOARD = `
###############################
#..............#..............#
#..............#..............#
#.............................#
#..............#..............#
#..............#..............#
######....###########....######
#..............#..............#
#..............#..............#
#.............................#
#..............#..............#
#..............#..............#
###############################
`

const CANVAS = document.getElementById('map');
const CONTEXT = CANVAS.getContext('2d');


const KEYMAP = {
    player1: {
        "ArrowUp": "up",
        "ArrowDown": "down",
        "ArrowLeft": "left",
        "ArrowRight": "right"
    },
    player2: {
        "w": "up",
        "s": "down",
        "a": "left",
        "d": "right"
    },
};

const sizeCell = 20;


const getNextCell = (player, canvas) => {
    const arrayBoard = canvas.arrayBoard;
    const sizeCell = canvas.sizeCell;
    switch (player.direction) {
        case "up":
            return arrayBoard[(player.y - player.speed) / sizeCell][player.x / sizeCell];
        case "down":
            return arrayBoard[(player.y + player.speed) / sizeCell][player.x / sizeCell];
        case "left":
            return arrayBoard[player.y / sizeCell][(player.x - player.speed) / sizeCell];
        case "right":
            return arrayBoard[player.y / sizeCell][(player.x + player.speed) / sizeCell];
    }
}

const main = () => {
    // canvas
    const canvas = new Canvas(BOARD, sizeCell, CANVAS, CONTEXT);
    canvas.draw();

    const changeDirectionPlayer = (playerObj) => 
        // execute every 200ms or when a key is pressed
        Rx.Observable.interval(200)
            .merge(Rx.Observable.fromEvent(document, 'keydown'))
            .scan((player, event) => {
                const direction = player.keymap[event.key] || player.direction;
                player.changeDirection(direction);
                return player;
            }, playerObj);


    const suscribePlayer = (observablePlayer, playerObj, canvas) => 
        observablePlayer.subscribe((player) => {
            if (getNextCell(player, canvas) === '#') return;
            canvas.clearPlayer(playerObj);
            playerObj.move(player.direction);
            canvas.drawPlayer(playerObj);
        });


    // player 1
    const player1 = new Player(1, x = 20, y = 20, size = sizeCell, keymap=KEYMAP.player1);
    canvas.drawPlayer(player1);
    const player1$ = changeDirectionPlayer(player1);
    suscribePlayer(player1$, player1, canvas);

    // player 2
    const player2 = new Player(2, x = 40, y = 20, size = sizeCell, keymap=KEYMAP.player2);
    canvas.drawPlayer(player2);
    const player2$ = changeDirectionPlayer(player2);
    suscribePlayer(player2$, player2, canvas);
}

main();