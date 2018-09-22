function Menu() {
    let waveImg = loadImage('data/wave.png');
    let sunImg = loadImage("data/sun.png");
    let islandImg = loadImage('data/island.png');
    let rainbowImg = loadImage("data/rainbow.png");
    let backgroundSound = loadSound("data/sound/background.mp3");

    let WAVES_COUNT = 60;
    let WAVES_LAYERS = 4;
    let BUTTONS_WIDTH = 300;
    let BUTTONS_HEIGHT = 80;
    let ISLAND_SIZE = 320;
    let SUN_SIZE = 200;

    let buttonsAlpha = 0;
    let sunScl = 0;
    let wavesVerticalOffset = 100;
    let islandHorizontalOffset = -2*ISLAND_SIZE;
    let wavesSizesCoefficients = [];
    for (let i = 0; i < WAVES_COUNT; i++) {
        wavesSizesCoefficients.push(random(0.3, 1.3));
    }

    /*************************************************/
    //adding fields and functions to retrieve ability to animate
    ShowAnimation.apply(this);
    /*************************************************/

    let buttons = [];

    let playBtn = createButton("PLAY");
    playBtn.mousePressed((function () {
        if (this.hidden) return;
        console.log("PLAY PRESSED");
        currentGameState = GameStates.GAME_LAUNCH;
    }).bind(this));

    let highscoresBtn = createButton("HIGHSCORES");
    highscoresBtn.mousePressed((function () {
        if (this.hidden) return;
        console.log("HIGHSCORES PRESSED");
        currentGameState = GameStates.HIGHSCORES;
    }).bind(this));

    //place buttons on the field
    buttons.push(playBtn);
    buttons.push(highscoresBtn);
    for (let i = 0; i < buttons.length; i++) {
        let b = buttons[i];
        b.position((width - BUTTONS_WIDTH)/2, height/2 + BUTTONS_HEIGHT*(i*1.5 - buttons.length/3));
        b.size(BUTTONS_WIDTH, BUTTONS_HEIGHT);
        b.addClass("button");
    }

    var seaBattlesLabelPoints;
    var backgroundSoundVolume = 0;
    this.draw = function (deltaTime) {

        this.hidden = (currentGameState != GameStates.MENU);

        if (!backgroundSound.isPlaying()) {
            backgroundSound.loop();
        }

        backgroundSoundVolume = lerp(backgroundSoundVolume,
            (currentGameState==GameStates.MENU || currentGameState==GameStates.HIGHSCORES)? 1:0, 2*deltaTime);
        backgroundSound.setVolume(backgroundSoundVolume);

        buttonsAlpha = lerp(0, 1, this.animationProgress);
        sunScl = lerp(0, 1, this.animationProgress);
        wavesVerticalOffset = lerp(100, 0, this.animationProgress);
        islandHorizontalOffset = lerp(-2*ISLAND_SIZE, 0, this.animationProgress);

        if (this.hidden) {
            playBtn.position(lerp(width, playBtn.x, this.animationProgress));
            highscoresBtn.position(lerp(-BUTTONS_WIDTH, highscoresBtn.x, this.animationProgress));
        } else {
            playBtn.position(lerp(playBtn.x, (width - BUTTONS_WIDTH)/2, this.animationProgress));
            highscoresBtn.position(lerp(highscoresBtn.x, (width - BUTTONS_WIDTH)/2, this.animationProgress));
        }


        playBtn.style("opacity", buttonsAlpha);
        highscoresBtn.style("opacity", buttonsAlpha);

        /**
         * Rainbow
         */
        push();
        translate(width/2, height+200*(1-this.animationProgress));
        rotate(PI*((1+sin(t/80))*this.animationProgress+(1-this.animationProgress)));
        translate(-width/2, -height);
        image(rainbowImg, 0, 0, width, height);
        pop();

        /**
         * Island
         */
        push();
        var islandX = 20*(2 + cos(t));
        var islandY = height - ISLAND_SIZE - 10*(sin(t));
        translate(islandX + islandHorizontalOffset, islandY);
        rotate(atan2(islandX, islandY));
        image(islandImg, 0, 0, ISLAND_SIZE, ISLAND_SIZE);
        pop();


        /**
         * Waves
         */
        var scl = WAVES_LAYERS*width/WAVES_COUNT;
        for (let i = 0; i < WAVES_COUNT/WAVES_LAYERS; i++) {
            for (let j = 0; j < WAVES_LAYERS; j++) {
                let size = min(height/10, scl);
                /*Every wave layer has TWO_PI/WAVES_LAYERS offset relative to previous one
                 to form complete period overall. Every wave in layer has it's own offset
                 3*PI/WAVES_COUNT relative to previous one in the same layer to complete
                 period in a single layer. Every wave also get offset time in order
                 to wave as time goes. */
                let waveY = size*(0.5*j + sin(2*t + 3*PI*i/WAVES_COUNT + j*TWO_PI/WAVES_LAYERS))/6;
                size *= wavesSizesCoefficients[max(0, i*WAVES_LAYERS + j)];
                image(waveImg, (i + j/WAVES_LAYERS)*scl, height - size/1.5 + waveY + wavesVerticalOffset, size, size);
            }
        }

        /**
         * Rotating sun
         */
        push();
        translate(width*7/8, height/5);
        rotate(radians((50*t)%360));
        scale(sunScl);
        image(sunImg, -SUN_SIZE/2, -SUN_SIZE/2, SUN_SIZE, SUN_SIZE);
        pop();

        if (!seaBattlesLabelPoints) {
            seaBattlesLabelPoints = gameFont.textToPoints("Sea", 0, 0, height*0.24, {}).
                                    concat(gameFont.textToPoints("Battles", width/20, height*0.2, height*0.2, {}));
            // for (var i = 0; i < seaBattlesLabelPoints.length; i++) {
            //     var obj = seaBattlesLabelPoints[i];
            //     seaBattlesLabelPoints[i] = createVector(obj.x, obj.y);
            // }
        }

        if (this.animationProgress>0.05) {
            push();
            translate(width/20, height*0.37+10*sin(t/5));
            rotate(-PI/8);

            fill(255, 255, 255, 10*this.animationProgress);
            for (var i = 0; i < seaBattlesLabelPoints.length; i++) {
                var obj = seaBattlesLabelPoints[i];
                ellipse(obj.x, obj.y, 60);
            }

            colorMode(HSB);

            for (var i = 0; i < seaBattlesLabelPoints.length; i++) {
                var obj = seaBattlesLabelPoints[i];
                fill((abs(i/seaBattlesLabelPoints.length-t/5)%1)*255, 255, 255, 255*this.animationProgress);
                ellipse(obj.x, obj.y, 8*(1+sin(t+PI*i/3)/2));
            }

            colorMode(RGB);
            pop();
        }

    }

}