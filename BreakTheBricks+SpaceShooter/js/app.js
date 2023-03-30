class Game {
    constructor() {
        this.canvas = document.getElementById("canvas");
        this.canvas.height = 800;
        this.canvas.width = 800;
        this.ctx = this.canvas.getContext("2d");
        this.sprites = [];

        this.keysDown = {};

        this.addEventListeners(this.keysDown);
    }

    addEventListeners(keysDown) {
        addEventListener("keydown", function (e) {
            keysDown[e.keyCode] = true;
        }, false);

        addEventListener("keyup", function (e) {
            delete keysDown[e.keyCode];
        }, false);
    }

    update(modifier) {
        for (var i = 0; i < this.sprites.length; i++)
            this.sprites[i].update(modifier, this.sprites, this.keysDown);
    }

    deleteSprites() {
        var deadSprites = [];
        for (var i = 0; i < this.sprites.length; i++)
            if (this.sprites[i].alive == false)
                deadSprites.push(this.sprites[i]);
        
        for (var i = 0; i < deadSprites.length; i++) {
            var index = this.sprites.indexOf(deadSprites[i]);
            this.sprites.splice(index, 1);
        }
    }

    draw(fps) {
        this.ctx.clearRect(0, 0, 800, 800);
        this.ctx.fillStyle = "red";
        this.ctx.font = "16px Arial";
        this.ctx.fillText(fps + " fps", 2.75, 15);
        if (this.win()) {
            this.ctx.font = "76px Arial";
            this.ctx.fillStyle = "green";
            this.ctx.fillText("YOU WON", 217.6, 600);
            var ball = this.sprites[1];
            ball.dx = 0;    
            ball.dy = 0;
        }
        for (var i = 0; i < this.sprites.length; i++)
            this.sprites[i].draw(this.ctx);
    }

    addSprite(sprite) {
        this.sprites.push(sprite);
    }
    
    win() {
        for (var i = 0; i < this.sprites.length; i++)
            if (this.sprites[i] instanceof Brick)
                return false;
        return true;
    }
}

class Sprite {
    constructor() {}
    update(modifier, sprites, keysDown) {}
    draw(ctx) {}
}

class Paddle extends Sprite {
    constructor() {
        super();
        this.x = 325;
        this.y = 775;
        this.w = 150;
        this.h = 20;
        this.color = "red";
        this.alive = true;
        this.shoot = false;
        this.lastShot = Date.now();
    }

    update(modifier, sprites, keysDown) {
        if (65 in keysDown || 37 in keysDown)
            if (this.x >= 0)
                this.x -= 500*modifier;
        if (68 in keysDown || 39 in keysDown)
            if (this.x <= 650)
                this.x += 500*modifier;
        if (32 in keysDown && this.shoot == true && Date.now() - this.lastShot >= 150) {
            this.lastShot = Date.now();
            sprites.push(new Bullet(this.x, this.y));
            sprites.push(new Bullet(this.x + this.w - 5, this.y));
        }
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.rect(this.x, this.y, this.w, this.h);
        ctx.fillStyle = this.color;
        ctx.fill(); 
        ctx.stroke();
    }
}

class Ball extends Sprite {
    constructor(x, y, dx, dy, r) {
        super();
        this.x = x;
        this.y = y;
        this.dx = dx;
        this.dy = dy;
        this.r = r;
        this.hp = 3;
        this.alive = true;
        this.score = 0;
    }

    update(modifier, sprites) {
        this.x += modifier*this.dx;
        this.y += modifier*this.dy;

        var paddle = sprites[0];
        // COLLISION WITH PADDLE
        var horiD = this.x - (paddle.x + paddle.w/2);
        var veriD = this.y - (paddle.y + paddle.h/2);
        if (Math.abs(horiD) <= this.r + paddle.w/2 && Math.abs(veriD) <= this.r + paddle.h/2)
            if (this.dy > 0) {
                this.dy *= -1;
                return;
            }
        

        // CHECK IF LOST
        if (this.y - this.r > 800) {
            // Make sure hp doesn't go below 0
            this.hp = (this.hp > 0)? this.hp - 1: 0;
            if (this.hp == 0)
                return;
            this.x = 400;
            this.y = 725;
            this.dx = 0;
            this.dy = 0;

            this.dx = (Math.random() < 0.5)? randomSpeed(): -randomSpeed();
            this.dy = -randomSpeed();
        }


        // COLLISION WITH BRICKS
        for (var i = 0; i < sprites.length; i++) {
            if (!(sprites[i] instanceof Brick))
                continue;

            // Calculate horizontal distance and vertical distance
            // Compare with the sum of widths and sum of heights halved
            horiD = this.x - sprites[i].centerX;
            veriD = this.y - sprites[i].centerY;
            if (Math.abs(horiD) <= this.r + sprites[i].w/2 && Math.abs(veriD) <= this.r + sprites[i].h/2) {

                if (--sprites[i].hp == 0) {
                    sprites[i].alive = false;
                    if (Math.random() < 0.333)
                        sprites.push(new Powerup(sprites[i].centerX, sprites[i].centerY));
                }

                // CHECK IF VERTICAL COLLISION OR HORIZONTAL COLLISION
                // Image in the zip file explains the formula
                if (this.r + sprites[i].w/2 - Math.abs(horiD) >= this.r + sprites[i].h/2 - Math.abs(veriD)) { // VERTICAL COLLISION
                    if (veriD > 0) {
                        if (this.dy < 0)
                            this.dy *= -1;
                    }
                    else {
                        if (this.dy > 0)
                            this.dy *= -1;
                    }
                } 
                else if (this.r + sprites[i].w/2 - Math.abs(horiD) < this.r + sprites[i].h/2 - Math.abs(veriD)) { // HORIZONTAL COLLISION
                    if (horiD > 0) {
                        if (this.dx < 0)
                            this.dx *= -1;
                    }
                    else {
                        if (this.dx > 0)
                            this.dx *= -1;
                    }
                }
                this.score += 100;
                return;
            }
        }


        // CHECK FOR COLLISION WITH BORDERS
        if (this.x <= this.r) {
            if (this.dx < 0)
                this.dx *= -1;
            return;
        }
        if (this.y <= this.r) {
            if (this.dy < 0)
                this.dy *= -1;
            return;
        }
        if (this.x >= 800 - this.r) {
            if (this.dx > 0)
                this.dx *= -1;
            return;
        }
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.fillStyle = "red";
        ctx.arc(this.x, this.y, this.r, 2 * Math.PI, false);
        ctx.fill();
        ctx.stroke();
        ctx.font = "32px Arial";
        ctx.fillText("Score: " + this.score, 325, 27);
        ctx.font = "24px Arial";
        ctx.fillText("Lives: " + this.hp, 710, 23);
        if (this.hp == 0) {
            ctx.font = "76px Arial";
            ctx.fillStyle = "red";
            ctx.fillText("YOU LOST", 209, 600);
        }
    }
}


class Brick extends Sprite {
    constructor(x, y) {
        super();
        this.x = x;
        this.y = y;
        this.w = 100;
        this.h = 25;
        this.centerX = x + 50;
        this.centerY = y + 12.5;
        this.hp = 3;
        this.alive = true;
    }
    
    update(modifier, sprites) {}
    
    draw(ctx) {
        ctx.lineWidth = 2; 
        ctx.fillStyle = "darkred";
        ctx.fillRect(this.x, this.y, this.w, this.h*this.hp/3);
        ctx.strokeStyle = "black";
        ctx.rect(this.x, this.y, this.w, this.h);
        ctx.stroke();
    }
}

class Powerup extends Sprite {
    constructor(x, y) {
        super();
        this.x = x;
        this.y = y;
        this.r = 10;
        this.dy = 200;
        this.alive = true;
    }

    update(modifier, sprites) {
        this.y += modifier*this.dy;
        
        var paddle = sprites[0];
        var horiD = this.x - (paddle.x + 75);
        var veriD = this.y - (paddle.y + 10);
        if (Math.abs(horiD) <= this.r + paddle.w/2 && Math.abs(veriD) <= this.r + paddle.h/2) {
            paddle.shoot = true;
            paddle.color = "greenyellow";
            this.alive = false;
        }

        if (veriD > this.r + 10)
            this.alive = false;

        if (sprites[1].hp == 0)
            this.alive = false;
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2, false);
        ctx.fillStyle = "greenyellow";
        ctx.fill();
        ctx.stroke();
    }
}

class Bullet extends Sprite {
    constructor(x, y) {
        super();
        this.x = x;
        this.y = y;
        this.w = 5;
        this.h = 15;
        this.dy = 500;
        this.alive = true;
    }

    update(modifier, sprites) {
        this.y -= this.dy * modifier;

        if (sprites[1].hp == 0) {
            this.alive = false;
            return;
        }

        if (this.y + 10 <= 0) {
            this.alive = false;
            return;
        }

        for (var i = 0; i < sprites.length; i++) {
            if (!(sprites[i] instanceof Brick))
                continue;
            var horiD = (this.x + this.w/2) - sprites[i].centerX;
            var veriD = (this.y + this.h/2) - sprites[i].centerY;
            if (Math.abs(horiD) <= this.w/2 + sprites[i].w/2 && Math.abs(veriD) <= this.h/2 + sprites[i].h/2 ) {
                sprites[1].score += 100;
                this.alive = false;
                if (--sprites[i].hp == 0) {
                    sprites[i].alive = false;
                    if (Math.random() < 0.333)
                        sprites.push(new Powerup(sprites[i].centerX, sprites[i].centerY));
                }
                return;
            }
        }
    }

    draw(ctx) {
        ctx.fillStyle = "black";
        ctx.fillRect(this.x, this.y, this.w, this.h);
    }
}

var requestAnimFrame = (function () {
    return window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    function (callback) {
        window.setTimeout(callback, 1000 / 60);
    };
})();

function randomSpeed() {
    return 350 + 300*Math.random();
}

var game = new Game();

function start() {
    //hide main menu, show canvas (game)
    document.getElementById("main_menu").style.display = "none";
    document.getElementById("reset").style.display = "inline";
    document.getElementById("game").style.marginTop = "-37px";
    document.getElementById("canvas").style.display = "block";


    //create paddle, ball, and brick objects
    var player = new Paddle();
    var ball = new Ball(400, 725, (Math.random() < 0.5)? randomSpeed(): -randomSpeed(), -randomSpeed(), 15);
    game.addSprite(player);
    game.addSprite(ball);
    //add 4 rows of 4 bricks
    addBricks(4, game);


    //start the timers for the modifier and the fps counter
    var then = Date.now();
    var start = Date.now();
    var counter = 0;
    var currentFPS = 0;
    gameEngineLoop();

    //MAIN GAME ENGINE
    function gameEngineLoop() {
        //count frames
        counter++;
        var now = Date.now();
        var delta = now - then;
        if (now - start >= 1000) {
            start = now;
            currentFPS = counter;
            counter = 0;
        }
        game.update(delta / 1000);
        game.deleteSprites();
        game.draw(currentFPS);
        then = now;
        requestAnimFrame(gameEngineLoop);
    }    
}

// add brick sprites rows to the game object
function addBricks(rows, game) {
    for (var i = 0, y = 75; i < rows; i++, y+= 100)
        for (var x = 50; x < 800; x+= 200) 
            game.addSprite(new Brick(x, y));
}

function reset(button) {
    button.blur();
    for (var i = 0; i < game.sprites.length; i++)
        if (game.sprites[i] instanceof Brick
                || game.sprites[i] instanceof Powerup
                || game.sprites[i] instanceof Bullet)
            game.sprites[i].alive = false;
    game.deleteSprites();
    addBricks(4, game);
    var player = game.sprites[0];
    var ball = game.sprites[1];
    player.shoot = false;
    player.color = "red";
    player.x = 325;
    player.y = 775;
    ball.x = 400;
    ball.y = 725;
    ball.dx = 0;
    ball.dy = 0;
    ball.hp = 3;
    ball.score = 0;

    ball.dx = (Math.random() < 0.5)? randomSpeed(): -randomSpeed();
    ball.dy = -randomSpeed();
}