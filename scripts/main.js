// import { Canvas } from './canvas.js';
// import { Player, Enemy } from './entities.js';
// import { BOARDS } from './boards.js';

var BOARD = BOARDS[0].board;
var entities = [];

// select map
const mapSelect = document.getElementById("map-select");
mapSelect.addEventListener("change", (e) => {
    const event = new CustomEvent("mapChange", {
        detail: e.target.value,
    });
    BOARD = BOARDS[e.target.value].board;
    unsubscribeAll(entities);
    main();
});

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
    canvas.drawMap();
    
    let players = [];
    const sizeCharacter = sizeCell;
    // player 1
    let { x, y } = canvas.getRandomValidCell();
    console.log();
    const player1 = new Player("player1", x = x, y = y, size = sizeCharacter, KEYMAP.player1);
    players.push(player1);

    canvas.drawEntity(player1);
    player1.declareObservablePlayer();
    player1.suscribeEntity(canvas);

    // // player 2
    // ({ x, y } = canvas.getRandomValidCell());
    // const player2 = new Player("player2", x = x, y = y, size = sizeCharacter, KEYMAP.player2);
    // players.push(player2);
    // canvas.drawEntity(player2);
    // player2.declareObservablePlayer();
    // player2.suscribeEntity(canvas);

    entities.push(...players);

    // enemy 1
    ({ x, y } = canvas.getRandomValidCell());
    const enemy1 = new Enemy("enemy1", x = x, y = y, size = sizeCharacter, players);
    entities.push(enemy1);
    canvas.drawEntity(enemy1);
    enemy1.declareObservableEnemy(canvas);
    enemy1.suscribeEntity(canvas);

    // // enemy 2
    // ({ x, y } = canvas.getRandomValidCell());
    // const enemy2 = new Enemy("enemy2", x = x, y = y, size = sizeCharacter, players);
    // entities.push(enemy2);
    // canvas.drawEntity(enemy2);
    // enemy2.declareObservableEnemy(canvas);
    // enemy2.suscribeEntity(canvas);
}


main();


////////////////////////////////////////////////////////////////////
// IMPORTANT !!
// unsubscribe all entities when close window to avoid memory leaks

const unsubscribeAll = (arrayEntities) => {
    let i = 0;
    arrayEntities.forEach((entity) => {
        entity.unsuscribeEntity();
        i += 1;
    });
    console.log(`All entities unsubscribed: ${i}/${arrayEntities.length}`);
}

window.addEventListener('beforeunload', (event) => {
    unsubscribeAll(entities);
});

////////////////////////////////////////////////////////////////////