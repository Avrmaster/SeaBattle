let FIELD_MARGIN = 60;
let GAME_FIELD_WIDTH = 10;
let GAME_FIELD_HEIGHT = 10;
function GameLauncher() {

    let BUTTONS_WIDTH = 180;
    let BUTTONS_SPACE = BUTTONS_WIDTH*1.2; //with offsets around

    /*************************************************/
    //adding fields and functions to retrieve ability to animate
    ShowAnimation.apply(this);
    /*************************************************/

    this.draw = function(deltaTime) {
        this.hidden = (currentGameState != GameStates.GAME_LAUNCH);
        userField.modifiable = (!this.hidden);
        if (!this.hidden) {
            userField.goalCellSize = ((height-2*FIELD_MARGIN)/GAME_FIELD_HEIGHT);
        }
    }

    let resetButton = createButton("RESET");
    resetButton.mouseClicked(function() {
        if (this.hidden) return;
        userField.reset();
    });
    resetButton.position(window.width-BUTTON_SIZE-BUTTONS_SPACE*2, window.height-BUTTON_SIZE);

    let mixButton = createButton("MIX");
    mixButton.mouseClicked(function() {
        if (this.hidden) return;
        userField.mix();
    });
    mixButton.position(window.width-BUTTON_SIZE-BUTTONS_SPACE, window.height-BUTTON_SIZE);

    let startButton = createButton("START");
    startButton.mouseClicked(function() {
        if (this.hidden) return;
        currentGameState = GameStates.GAME;
        gameToLaunch.newGame();
        console.log("starting..");
    });
    startButton.position(window.width*3/4-BUTTON_SIZE/2, (window.height-BUTTON_SIZE)/2);

    var stylish = function(launcherButton) {
        launcherButton.addClass("button");
        launcherButton.size(BUTTONS_WIDTH, BUTTON_SIZE);
        launcherButton.opacity = 0;
        launcherButton.draw = function(deltaTime) {
            launcherButton.hidden = currentGameState != GameStates.GAME_LAUNCH;
            if (launcherButton == startButton) {
                launcherButton.hidden |= !userField.isValid(); //shown only if userField is also valid in addition
            }
            launcherButton.opacity = lerp(launcherButton.opacity, launcherButton.hidden? 0:1, 2 * deltaTime);
            launcherButton.style("opacity", launcherButton.opacity.toString());
        };
        screens.push(launcherButton);
    }
    stylish(resetButton);
    stylish(mixButton);
    stylish(startButton);

    var userField = new Field(GAME_FIELD_WIDTH,GAME_FIELD_HEIGHT);
    userField.setGoalPos(FIELD_MARGIN, FIELD_MARGIN);
    userField.goalCellSize = ((height-2*FIELD_MARGIN)/GAME_FIELD_HEIGHT);
    userField.reset();


    screens.push(userField);

    var gameToLaunch = new Game(userField);
    screens.push(gameToLaunch);

}