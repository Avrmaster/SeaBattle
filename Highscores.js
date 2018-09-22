let highscoresObj;
function Highscores() {

    let TEXT_SIZE = 50;
    let scores = [];

    /*************************************************/
    //adding fields and functions to retrieve ability to animate
    ShowAnimation.apply(this);
    this.animationDuration = 0.6;
    /*************************************************/

    this.draw = function () {

        this.hidden = (currentGameState != GameStates.HIGHSCORES);

        fill(255, 255, 255, pow(255, this.animationProgress));
        textSize(TEXT_SIZE);
        textAlign(CENTER);

        if (scores.length==0) {
            text("no highscores yet", width/2, height/2);
        }

        for (let i = 0; i < scores.length; i++) {
            let eachScore = scores[i];

            let hours = eachScore.date.getHours();
            let minutes = eachScore.date.getMinutes();

            var toPrint = (i + 1).toString() + ") " + eachScore.score +
                " (" + hours + ":" + (minutes.toString().length == 1? ("0" + minutes) : minutes) + ")";

            text(toPrint,
                lerp(width*(i%2 - (i/scores.length)), width/2, this.animationProgress),
                (height - TEXT_SIZE*(scores.length - 3*i))/2);

        }
    }

    this.addScore = function (newScore) {
        for (let i = 0; i < scores.length; i++) {
            if (newScore == scores[i].score) {
                //it will be replaced with same score but with new date
                scores.splice(i, 1);
            }
        }
        scores.push({
            date: new Date(),
            score: newScore
        });
        scores.sort(function (a, b) {
            return b.score - a.score;
        })
        if (scores.length > 5) {
            scores.splice(0, 1);
        }
    }

    highscoresObj = this;
}