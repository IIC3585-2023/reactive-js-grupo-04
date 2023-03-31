// import { Canvas } from './canvas.js';
// import { Player } from './entities.js';
// import { BOARDS } from './boards.js';

const BOARD = BOARDS[0].board;

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

const sizeCell = 100;


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
            if (canvas.getNextPlayerCell(player) === '#') return;
            canvas.clearPlayer(playerObj);
            playerObj.move(player.direction);
            canvas.drawPlayer(playerObj);
        });


    // player 1
    const sizeCharacter = sizeCell;
    const player1 = new Player("player1", x = 1, y = 1, size = sizeCharacter, KEYMAP.player1);
    canvas.drawPlayer(player1);
    const player1$ = changeDirectionPlayer(player1);
    suscribePlayer(player1$, player1, canvas);

//     // player 2
//     const player2 = new Player("player2", x = 2, y = 1, size = sizeCharacter, KEYMAP.player2);
//     canvas.drawPlayer(player2);
//     const player2$ = changeDirectionPlayer(player2);
//     suscribePlayer(player2$, player2, canvas);
}

main();