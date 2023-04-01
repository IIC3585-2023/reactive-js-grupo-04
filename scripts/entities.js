
class Entity {
    constructor(id, x, y, size) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.size = size;
        this.speed = 1;
        this.direction = 'up';
        this.directionMap = {
            up: { x: 0, y: -1 },
            down: { x: 0, y: 1 },
            left: { x: -1, y: 0 },
            right: { x: 1, y: 0 }
        }
        this.entity$ = null;
        this.suscription$ = null;
    }

    move() {
        const { x, y } = this.directionMap[this.direction];
        this.x += x * this.speed;
        this.y += y * this.speed;
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
        this.oppositeDirection = {
            up: "down",
            down: "up",
            left: "right",
            right: "left"
        };
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
            return surrounding.direction !== this.oppositeDirection[this.direction];
        });

        // with probability 0.2, return random direction
        if (Math.random() < 0.2) {
            const randomIndex = Math.floor(Math.random() * validSurroundings.length);
            return validSurroundings[randomIndex].direction;
        }

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
                    surrounding.distance.push(distance);
                }); 
            });
        }

        // choose the direction with the lowest distance
        const min = validSurroundings.reduce((min, surrounding) => {
            const minDistance = Math.min(...min.distance);
            const surroundingDistance = Math.min(...surrounding.distance);
            return (minDistance < surroundingDistance) ? min : surrounding;
        }, validSurroundings[0]);

        return (min) ? min.direction : this.direction;
    }

    getSurroundings(canvas) {
        return Object.entries(this.directionMap)
            .map(([direction, {x, y}]) => 
                ({
                    direction,
                    content: canvas.getCell(this.x + x, this.y + y),
                    coords: { x: this.x + x, y: this.y + y },
                    distance: []
                }));
    }
}
