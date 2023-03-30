
class Entity {
    constructor(id, x, y, size) {
        this.x = x;
        this.y = y;
        this.id = id;
        this.size = size;
        this.direction = "up";
        this.speed = 1;
    }
}

class Player extends Entity {
    constructor(id, x, y, size, keymap) {
        super(id, x, y, size);
        this.keymap = keymap;
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
}

