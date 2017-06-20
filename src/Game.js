function Game(userField) {
    let fireBackgroundGif = loadGif("data/backFire.gif");
    let gameBackgroundSound = loadSound("data/sound/gameBackground.mp3")

    /*************************************************/
    //adding fields and functions to retrieve ability to animate
    ShowAnimation.apply(this);
    /*************************************************/

    //turn triangle
    let TRIANGLE_HEIGHT = window.height / 5;
    let TRIANGLE_WIDTH = TRIANGLE_HEIGHT / 3;

    let compField = new Field(GAME_FIELD_WIDTH, GAME_FIELD_HEIGHT);
    compField.setPos(window.width, window.height, true); //and instantly transfer out of view
    compField.showBoats = false;
    screens.push(compField);

    let usersTurn = true;
    let gameAI = new GameAI(userField, processResult);
    let gameOver = false;
    let userWon = false;

    let turnAnimation = new ShowAnimation();
    turnAnimation.draw = (deltaTime)=> {
        turnAnimation.hidden = usersTurn;

        turnAnimation.ignoreUpdate = gameOver; //when game is over - it lerps to 0.5
        if (gameOver) {
            turnAnimation.animationProgress = lerp(turnAnimation.animationProgress, 0.5, deltaTime);
        }

        //this stands for Game. So when current state is not GameStates.Game - turnAnimation get hidden
        fill(255*(turnAnimation.animationProgress),
            255*(1-turnAnimation.animationProgress), 100, 255 * this.animationProgress); //green for user and red for computer

        push();
        translate(width / 2, userField.pos.y + userField.height * userField.cellSize / 2); //center between fields
        rotate(PI * (1-turnAnimation.animationProgress));
        beginShape(TRIANGLES);
        vertex(0, ( -TRIANGLE_HEIGHT) / 2, 0);
        vertex(TRIANGLE_WIDTH * 2 * abs((turnAnimation.animationProgress - 0.5)), 0, 0);
        vertex(0, ( +TRIANGLE_HEIGHT) / 2, 0);
        endShape(CLOSE);
        pop();
    }
    screens.push(turnAnimation);

    let gameOverGoalPoints;
    let youWonGoalPoints;
    let gameResultInitPoints = [];
    let gameResultShowPoints = [];
    let gameOverAnimation = new ShowAnimation();
    gameOverAnimation.animationDuration = 3;
    gameOverAnimation.draw = (deltaTime) => {
        gameOverAnimation.hidden = !gameOver;

        noStroke();
        fill(0,0,0, 150*gameOverAnimation*this.animationProgress);
        rect(0,0,window.width, window.height);

        if (!gameOverGoalPoints) {
            gameOverGoalPoints = gameFont.textToPoints("GAME", width*0.2, height*0.4, height*0.4, {}).
                            concat(gameFont.textToPoints("OVER", width*0.05, height*0.9, height*0.5, {}));

            youWonGoalPoints = gameFont.textToPoints("YOU", width*0.3, height*0.4, height*0.35, {}).
                            concat(gameFont.textToPoints("WON", width*0.03, height*0.9, height*0.45, {}));

            for (var i = 0; i < gameOverGoalPoints.length; i++) {
                gameOverGoalPoints[i] = createVector(gameOverGoalPoints[i].x, gameOverGoalPoints[i].y);
            }
            for (var i = 0; i < youWonGoalPoints.length; i++) {
                youWonGoalPoints[i] = createVector(youWonGoalPoints[i].x, youWonGoalPoints[i].y);
            }

            for (var i = 0; i < max(youWonGoalPoints.length, gameOverGoalPoints.length); i++) {
                gameResultInitPoints.push(createVector(random(width), random(height)));
                gameResultShowPoints.push(gameResultInitPoints[i].copy());
            }
        }

        if (this.animationProgress*gameOverAnimation<0.01) return;

        for (let i=0; i<gameResultShowPoints.length; i++) {
            let goalPos = userWon? youWonGoalPoints[i] : gameOverGoalPoints[i];
            let showPos = gameResultShowPoints[i];
            let initPos = gameResultInitPoints[i];

            let hide = false;
            if (goalPos == undefined) {//it's extra point from another text. Hide it
                goalPos = initPos;
                hide = true;
            }

            showPos.set(lerp(showPos.x,
                gameOver? goalPos.x : initPos.x, 2*deltaTime),
                lerp(showPos.y,
                    gameOver? goalPos.y : initPos.y, 2*deltaTime));

            if (!hide) {
                fill(255,255,255, 255*this.animationProgress*gameOverAnimation);
                ellipse(gameResultShowPoints[i].x, gameResultShowPoints[i].y, 10,10);
            }

        }

    }
    screens.push(gameOverAnimation);

    let resultProcessed = true;

    this.draw = function (deltaTime) {
        this.hidden = (currentGameState != GameStates.GAME);
        gameAI.update(deltaTime);

        if (userField.readyForMove && !usersTurn && resultProcessed && !gameOver) {
            resultProcessed = false;
            gameAI.initiateMove();
        }

        if (!gameBackgroundSound.isPlaying()) {
            gameBackgroundSound.loop();
        }
        gameBackgroundSound.setVolume(this.animationProgress);


        if (this.hidden) {
            compField.setGoalPos(window.width + 100, compField.cellSize); //100 - because actual value will approaches but not intersect it
        } else {
            userField.goalCellSize = (window.width - 3 * FIELD_MARGIN) / (userField.width * 2.5);
            compField.goalCellSize = userField.goalCellSize;
            compField.setGoalPos(window.width - FIELD_MARGIN - compField.width * compField.cellSize, FIELD_MARGIN);
        }

    }

    this.newGame = function () {
        userField.modifiable = false;
        userField.resetCells();
        userField.scoreKeeper.newGame();

        compField.showBoats = false;
        compField.mix();
        compField.resetCells();

        gameAI.newGame();

        usersTurn = true;
        gameOver = false;
    }

    this.onMousePressed = function (x, y) {
        if (this.hidden || !usersTurn || !userField.readyForMove
            || !compField.readyForMove || gameOver) return;

        processResult(compField.hit(x,y));
    }
    this.onBackPressed = function () {
        userField.resetCells();//stop from burning
        gameOver = false;
        let gainedScore = userField.scoreKeeper.getScore()
        if (gainedScore!=0) {
            highscoresObj.addScore(gainedScore);
        }
    }
    this.onKeyPressed = function(event) {
        switch (event.which) {
            // case "s":
            // case "ы":
            // case "і":
            case 83:
                compField.showBoats = !compField.showBoats;
                break;
            // case "g":
            // case "п":
            case 71:
                gameOver = !gameOver;
                break;
            // case "w":
            // case "ц":
            case 87:
                userWon = !userWon;
                break;
        }
    }

    function processResult(moveResult) {
        if (usersTurn) {
            userField.scoreKeeper.processResult(moveResult);
        }

        if (moveResult.hitPerformed) {
            if (!moveResult.boatHit)
                usersTurn = !usersTurn;

            gameOver |= userField.isDone() || compField.isDone();
            userWon = compField.isDone();

            if (gameOver) {

                compField.showBoats = userField.showBoats = true;
                return;
            }
        }
        resultProcessed = true;
    }

    userField.scoreKeeper = new ScoreKeeper();
    Object.defineProperties(userField.scoreKeeper, {
        "gameOver": {
            get: function() {
                return gameOver;
            }
        },
        "userWon": {
            get: function() {
                return userWon;
            }
        },
        "bombFallen": {
            get: function() {
                return compField.readyForMove;
            }
        }
    })

}