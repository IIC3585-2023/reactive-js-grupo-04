// import { Canvas } from './canvas.js';
// import { Player, Enemy } from './entities.js';
// import { BOARDS } from './boards.js';

var BOARD = BOARDS[0].board;

// // select map
// const mapSelect = document.getElementById("map-select");
// mapSelect.addEventListener("change", (e) => {
//     const event = new CustomEvent("mapChange", {
//         detail: e.target.value,
//     });
//     BOARD = BOARDS[e.target.value].board;
//     main();
// });

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
var entities = [];



const main = () => {
    // canvas
    const canvas = new Canvas(BOARD, sizeCell, CANVAS, CONTEXT);
    canvas.drawMap();

    // player 1
    const sizeCharacter = sizeCell;
    const player1 = new Player("player1", x = 1, y = 1, size = sizeCharacter, KEYMAP.player1);
    entities.push(player1);

    canvas.drawEntity(player1);
    player1.declareObservablePlayer();
    player1.suscribeEntity(canvas);

    // // player 2
    // const player2 = new Player("player2", x = 1, y = 1, size = sizeCharacter, KEYMAP.player2);
    // entities.push(player2);
    // canvas.drawEntity(player2);
    // player2.declareObservablePlayer();
    // player2.suscribeEntity(canvas);

    // enemy 1
    const enemy1 = new Enemy("enemy1", x = 12, y = 10, size = sizeCharacter);
    entities.push(enemy1);
    canvas.drawEntity(enemy1);
    enemy1.declareObservableEnemy(canvas);
    enemy1.suscribeEntity(canvas);
}


main();


////////////////////////////////////////////////////////////////////
// IMPORTANT !!
// unsubscribe all entities when close window to avoid memory leaks

const unsubscribeAll = (arrayEntities) => {
    arrayEntities.forEach((entity) => {
        entity.unsuscribeEntity();
    });
    console.log("All entities unsubscribed");
}

window.addEventListener('beforeunload', (event) => {
    unsubscribeAll(entities);
});

////////////////////////////////////////////////////////////////////