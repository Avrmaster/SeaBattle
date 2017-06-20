function Weather() {

    const DROP_COUNTS = 300;
    const GRAVITY = 9.8;

    const MAX_RAIN_TIME = 20;
    const MIN_RAIN_TIME = 40;
    const MIN_RAIN_INTERVAL = 20;
    const MAX_RAIN_INTERVAL = 70;

    var rainSound = loadSound("data/sound/rain.mp3");
    var thunderSound = loadSound("data/sound/thunder.mp3");
    var lightningImg = loadImage("data/lightning.png");
    var lightningPartImg = loadImage("data/lightningPart.png");

    /*************************************************/
    //adding fields and functions to retrieve ability to animate
    ShowAnimation.apply(this);
    /*************************************************/

    function Drop() {
        this.pos = createVector(random(width), 2*window.height);
        this.size = random(10, 50);
        this.vel = createVector((random(1) - 0.5), random(1));
    }

    Drop.prototype.draw = function () {
        if (this.pos.y>window.height) return;
        push();
        noFill();
        stroke(255, 255, 255, 100);
        strokeWeight(2);
        translate(this.pos.x, this.pos.y);
        rotate(atan2(this.vel.x, this.vel.y));
        line(0, 0, 0, this.size);
        pop();
    }
    Drop.prototype.update = function (deltaTime) {
        this.vel.add(createVector(0, GRAVITY).mult(2*deltaTime).mult(map(this.size, 10, 50, 0.5, 1)));
        this.pos.add(this.vel);
        if (this.pos.y > window.height && (!this.hidden || random(1)<0.002)) {
            this.pos.y = random(-100, -1000);
            this.vel.y = random(10, 20);
        }
        if (this.pos.x < -100) {
            this.pos.x = random(window.width + 20, window.width + 100);
        }
        if (this.pos.x > window.width + 100) {
            this.pos.x = random(-200, -100);
        }
    }

    var drops = [];
    for (let i = 0; i < DROP_COUNTS; i++) {
        drops.push(new Drop());
    }


    /*
     * Timers decrease over time and while they're below zero -
     * corresponding action is active
     */

    let lastGameState;
    var rainTime = MIN_RAIN_TIME;
    var lightningTimer = 0;
    var rainingTimer = 0;
    this.draw = function (deltaTime) {


        if (lastGameState==GameStates.MENU && currentGameState==GameStates.GAME_LAUNCH) {
            rainingTimer = lightningTimer = 0; //force rain and thunder
        }
        lastGameState = currentGameState;

        this.hidden = currentGameState == GameStates.MENU ||
            currentGameState == GameStates.HIGHSCORES || rainingTimer > 0;

        if (!rainSound.isPlaying()) {
            rainSound.play();
            rainSound.loop();
        }

        rainSound.setVolume(this.animationProgress);
        thunderSound.setVolume(this.animationProgress);

        rainingTimer -= deltaTime;

        if (!this.hidden) {

            lightningTimer -= deltaTime;
            if (lightningTimer < 0) {
                if (!thunderSound.isPlaying()) {
                    thunderSound.play();
                }

                if (random(1) < 0.5) {
                    push();
                    translate(random()*window.width, -height/2);
                    drawLightning();
                    pop();
                }
                if (random(1) < 0.4) {
                    image(lightningImg, 0, 0, window.width, window.height/2);
                }

                if (lightningTimer < -1.5) {
                    lightningTimer = random(5);
                }
            }

            if (abs(rainingTimer) > rainTime) {
                rainingTimer = random(MIN_RAIN_INTERVAL, MAX_RAIN_INTERVAL);
                rainTime = random(MIN_RAIN_TIME, MAX_RAIN_TIME);
            }
        }

        for (var i = 0; i < drops.length; i++) {
            var eachDrop = drops[i];
            eachDrop.hidden = this.hidden;
            eachDrop.update(deltaTime);
            eachDrop.draw();
        }

    }

    function drawLightning(size = 100, rotation = 0) {

        image(lightningPartImg, 0, 0, size, size);
        translate(0, size);

        if (size < 60) return;

        push();
        rotate(radians(rotation));

        drawLightning(size*0.9, random(20, 30));
        drawLightning(size*0.9, random(-30, -20));
        pop();


    }

}