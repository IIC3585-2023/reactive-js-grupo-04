
class Entity {
    constructor(id, x, y, size) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.size = size;
        this.speed = 1;
        this.direction = 'up';
        this.entity$ = null;
        this.suscription$ = null;
    }
    
    move() {
        switch (this.direction) {
            case "up":
                this.y -= this.speed;
                break;
            case "down":
                this.y += this.speed;
                break;
            case "left":
                this.x -= this.speed;
                break;
            case "right":
                this.x += this.speed;
                break;
        }
    }

    changeDirection(direction) {
        this.direction = direction;
    }

    suscribeEntity(canvas) {
        // subscribe to the new observable
        if (!this.entity$) {
            throw new Error('Observable subject not declared.');
        }
        this.suscription$ = this.entity$.subscribe(
            (direction) => {
                if (!direction) return;
                this.changeDirection(direction);

                if (canvas.getNextEntityCell(this) === '#') return;
                canvas.clearEntity(this);
                this.move();
                canvas.drawEntity(this);
                return this;
            },
        );
    }

    unsuscribeEntity() {
        if (!this.suscription$) {
            throw new Error('Observable subject not suscribed.');
        }
        this.suscription$.unsubscribe();
    }

    toString() {
        return `${this.id}: (${this.x}, ${this.y})`;
    }
}


class Player extends Entity{
    constructor(id, x, y, size, keymap) {
        super(id, x, y, size);
        this.keymap = keymap;
    }

    declareObservablePlayer() {
        const interval$ = rxjs.interval(200);
        const keydown$ = rxjs.fromEvent(document, 'keydown');
        this.entity$ = rxjs
            .merge(interval$, keydown$)
            .pipe(
                rxjs.operators.map((event) => {
                    if (event instanceof KeyboardEvent){
                        const direction = this.keymap[event.key] || this.direction;
                        // to avoid spamming the same key to move faster
                        return (direction === this.direction) ? null : direction;
                    }
                    return this.direction;
                })
            );
    }
}


class Enemy extends Entity {
    constructor(id, x, y, size, players) {
        super(id, x, y, size);
        this.playersArray = players;
    }

    declareObservableEnemy(canvas) {
        const interval$ = rxjs.interval(200);
        this.entity$ = interval$
            .pipe(
                rxjs.operators.map(() => {
                    const direction = this.chooseDirection(canvas);
                    return direction;
                })
            );
    }

    chooseDirection(canvas) {
        const surroundings = this.getSurroundings(canvas);
        let validSurroundings = surroundings.filter((surrounding) => {
            return surrounding.content !== '#';
        });
        // if there is only one direction, return it
        if (validSurroundings.length === 1) return validSurroundings[0].direction;

        // remove the oposite direction
        validSurroundings = validSurroundings.filter((surrounding) => {
            return surrounding.direction !== this.opositeDirection(this.direction);
        });

        // choose direction more close to the player
        if (this.playersArray) {
            this.playersArray.forEach((player) => {
                // absolute value of the distance between the player and the enemy
                // root((x2 - x1)^2 + (y2 - y1)^2)
                validSurroundings.forEach((surrounding) => {
                    const { x, y } = surrounding.coords;
                    const distance = Math.sqrt(
                        Math.pow(player.x - x, 2) + Math.pow(player.y - y, 2)
                    );
                    surrounding.distance += distance;
                }); 
            });
        }

        // choose the direction with the lowest distance
        const min = validSurroundings.reduce((min, surrounding) => {
            return (min.distance < surrounding.distance) ? min : surrounding;
        }, validSurroundings[0]);
        return (min) ? min.direction : this.direction;


        // const randomIndex = Math.floor(Math.random() * validSurroundings.length);
        // const randomCell = validSurroundings[randomIndex];
        // return Object.keys(randomCell)[0];
    }

    opositeDirection(direction) {
        switch (direction) {
            case "up":
                return "down";
            case "down":
                return "up";
            case "left":
                return "right";
            case "right":
                return "left";
        }
    }

    getSurroundings(canvas) {
        const surroundingCells = [
            {x: 0, y: -1, direction: "up"},
            {x: 0, y: 1, direction: "down"},
            {x: -1, y: 0, direction: "left"},
            {x: 1, y: 0, direction: "right"},
        ];
        return surroundingCells.map(({x, y, direction}) => ({
            direction,
            content: canvas.getCell(this.x + x, this.y + y),
            coords: { x: this.x + x, y: this.y + y },
            distance: 0,
        }));
    }

}
