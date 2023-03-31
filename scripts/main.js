// import { Board } from './map.js';
// import { Player } from './entities.js';

const BOARD = `
############################
#............##...........T#
#.####.#####.##.#####.####.#
#.####.#####.##.#####.####.#
#.####.#####.##.#####.####.#
#..........................#
#.####.##.########.##.####.#
#.####.##.########.##.####.#
#T.....##....##....##......#
######....##....##T...######
############################`;

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


const getNextCell = (player, canvas) => {
    const arrayBoard = canvas.arrayBoard;
    switch (player.direction) {
        case "up":
            return arrayBoard[(player.y - player.speed)][player.x];
        case "down":
            return arrayBoard[(player.y + player.speed)][player.x];
        case "left":
            return arrayBoard[player.y][(player.x - player.speed)];
        case "right":
            return arrayBoard[player.y][(player.x + player.speed)];
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