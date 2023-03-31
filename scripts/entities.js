
class Entity {
    constructor(id, x, y, size) {
        this.x = x;
        this.y = y;
        this.id = id;
        this.size = size;
        this.direction = "up";
        this.speed = 1;
    }
    
    move(direction) {
        switch (direction) {
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

    toString() {
        return `${this.id}: (${this.x}, ${this.y})`;
    }
}


class Player extends Entity {
    constructor(id, x, y, size, keymap) {
        super(id, x, y, size);
        this.keymap = keymap;
    }
}


class Enemy extends Entity {
    constructor(id, x, y, size) {
        super(id, x, y, size);
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
