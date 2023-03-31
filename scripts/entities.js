
class Entity {
    constructor(id, x, y, size) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.size = size;
        this.speed = 1;
        this.direction = 'up';
        this.entity$ = null;
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
        this.entity$.subscribe(
            (entity) => {
                if (canvas.getNextEntityCell(entity) === '#') return;
                canvas.clearEntity(this);
                this.move();
                canvas.drawEntity(this);
            },
            (err) => console.log(err),
            () => console.log('complete')
        );
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
                rxjs.operators.scan((player, event) => {
                    const direction = this.keymap[event.key] || this.direction;
                    if (direction) {
                        player.changeDirection(direction);
                    }
                    return player;
            }, this)
            );
    }
}


class Enemy extends Entity {
    constructor(id, x, y, size) {
        super(id, x, y, size);
    }

    declareObservableEnemy(canvas) {
        const interval$ = rxjs.interval(200);
        this.entity$ = interval$
            .pipe(
                rxjs.operators.scan((enemy, event) => {
                    const direction = this.chooseDirection(canvas);
                    enemy.changeDirection(direction);
                    return enemy;
                }, this)
            );
    }

    chooseDirection(canvas) {
        const surroundings = this.getSurroundings(canvas);
        let validSurroundings = surroundings.filter((surrounding) => {
            const key = Object.keys(surrounding)[0];
            const value = surrounding[key];
            return value !== '#';
        });
        if (validSurroundings.length === 1) return Object.keys(validSurroundings[0])[0];
        validSurroundings = validSurroundings.filter((surrounding) => {
            const key = Object.keys(surrounding)[0];
            return key !== this.opositeDirection(this.direction);
        });
        const randomIndex = Math.floor(Math.random() * validSurroundings.length);
        const randomCell = validSurroundings[randomIndex];
        return Object.keys(randomCell)[0];
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
        const surroundings = [];
        surroundings.push({"up" : canvas.getCell(this.x, this.y - 1)});
        surroundings.push({"down" : canvas.getCell(this.x, this.y + 1)});
        surroundings.push({"left" : canvas.getCell(this.x - 1, this.y)});
        surroundings.push({"right" : canvas.getCell(this.x + 1, this.y)});
        return surroundings;
    }

}
