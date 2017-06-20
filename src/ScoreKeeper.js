function ScoreKeeper() {

    const HIT_SCORE = 50;
    const KILL_SCORE = 250;
    const SHOW_SCORE_TIME = 2;

    /*************************************************/
    //adding fields and functions to retrieve ability to animate
    ShowAnimation.apply(this);
    /*************************************************/

    let currScore = 0;
    let aimStrike = 0;

    this.newGame = function() {
        currScore = 0;
        aimStrike = 0;
    }

    let showScoreTime=SHOW_SCORE_TIME;
    let addedScore=0;
    let newScorePos;
    let initScorePos = createVector(width/2, height/10);
    let gameOverPos = createVector();
    let scorePos = initScorePos.copy();


    this.processResult = function(result) {
        if (result.hitPerformed) {
            let moveScore  = 0;

            if (showScoreAnimation==0) {
                newScorePos = createVector(result.absX, result.absY);
                addedScore = 0;
            }

            if (result.boatHit) {
                aimStrike++;
                moveScore += HIT_SCORE*aimStrike;
            } else {
                aimStrike=0;
            }
            if (result.boatKilled) {
                moveScore += KILL_SCORE*(5-result.boatSize);
            }
            if (moveScore>0) {
                showScoreTime = 0;
            }

            addedScore += moveScore;
            currScore += moveScore;
        }
    }

    let showScoreAnimation = new ShowAnimation();
    screens.push(showScoreAnimation);

    this.draw = function(deltaTime) {
        showScoreTime += deltaTime;

        showScoreAnimation.hidden = showScoreTime>SHOW_SCORE_TIME;// || !this.bombFallen;
        this.hidden  = currentGameState!=GameStates.GAME;

        fill(215,255,230, 255*this.animationProgress);
        stroke(0,255,200,255*this.animationProgress);
        textAlign(CENTER);

        if (showScoreAnimation>0.01) {
            push();
            translate(newScorePos.x-100, newScorePos.y+100);
            rotate(sin(5*t)*PI/6);
            textSize(showScoreAnimation*50);
            text("+"+addedScore, 0,0);
            pop();
        }



        gameOverPos.set(this.userWon? width*0.15 : width*0.1,
                        this.userWon? height*0.2 : height*0.18);

        //this.gameOver - property defined by game
        scorePos.set(lerp(scorePos.x, this.gameOver? gameOverPos.x : initScorePos.x, 2*deltaTime),
                    lerp(scorePos.y, this.gameOver? gameOverPos.y : initScorePos.y, 2*deltaTime));


        textSize(height/10);
        text("Score", scorePos.x, scorePos.y);
        text(currScore, scorePos.x, scorePos.y+height/10);
        noStroke();

    }

    this.getScore = function() {
        return currScore;
    }

    screens.push(this);
}