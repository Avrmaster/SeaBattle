const BUTTON_SIZE = 80;

let GameStates = {
    MENU: 0,
    HIGHSCORES: 1,
    GAME_LAUNCH: 2,
    GAME: 3
}
let currentGameState = GameStates.MENU; //we'll be visible to every object

let gameFont;
let screens = []; //thing to update every frame
const GAME_WIDTH = 1280, GAME_HEIGHT = 720;

//all images are loaded in constructors - so we'll place these in preload
function preload() {
    window.width = GAME_WIDTH;
    window.height = GAME_HEIGHT;
    gameFont = loadFont("data/fonts/GameOverFont.ttf");

    screens.push(new Background());
    screens.push(new Menu());
    screens.push(new Highscores());
    screens.push(new GameLauncher());
    screens.push(new Weather());
    /*game itself will be added from game launcher
    /*in order to maintain access to it from there */
    screens.push(createCancelButton());
}

function setup() {
    createCanvas(GAME_WIDTH, GAME_HEIGHT);
}

let cancelButton;
function createCancelButton() {
    cancelButton = createButton("<-");
    cancelButton.size(BUTTON_SIZE, BUTTON_SIZE);//it's just s square
    cancelButton.position(window.width - BUTTON_SIZE, window.height - BUTTON_SIZE);
    cancelButton.addClass("button");
    let cancelBtnOpacity = 0;
    cancelButton.draw = function (deltaTime) {
        cancelButton.hidden = currentGameState == GameStates.MENU; //from every button except MENU we can go back
        cancelBtnOpacity = lerp(cancelBtnOpacity, cancelButton.hidden? 0:1, 2 * deltaTime);
        cancelButton.style("opacity", cancelBtnOpacity.toString());
    }
    cancelButton.mouseClicked(function () {
        if (cancelButton.hidden) return;
        for (let i=0; i<screens.length; i++) {
            if (screens[i].onBackPressed) {
                screens[i].onBackPressed();
            }
        }
        switch (currentGameState) {
            case GameStates.HIGHSCORES:
            case GameStates.GAME_LAUNCH:
                currentGameState = GameStates.MENU;
                break;
            case GameStates.GAME:
                currentGameState = GameStates.GAME_LAUNCH;
        }
    });
    return cancelButton;
}

let t = 0;
let previousDate = performance.now();
function draw() {
    //mechanism that counts delta time between frames
    let currentDate = performance.now();
    let deltaTime = min((currentDate - previousDate) / 1000, 1);
    previousDate = currentDate;

    t += deltaTime;
    for (let i = 0; i < screens.length; i++) {
        let s = screens[i];
        if (s.update) {//if this function exists
            s.update(deltaTime);
        }
        if (s.draw) {
            s.draw(deltaTime);
        }
    }
}

/* functions below are called by p5. Some screens may want to
receive these events to. Forwarding to them here. */
function mousePressed() {
    for (let i = 0; i < screens.length; i++) {
        if (screens[i].onMousePressed) {
            screens[i].onMousePressed(mouseX, mouseY);
        }
    }
}
function mouseReleased() {
    for (let i = 0; i < screens.length; i++) {
        if (screens[i].onMouseReleased) {
            screens[i].onMouseReleased(mouseX, mouseY);
        }
    }
}
function mouseDragged() {
    for (let i = 0; i < screens.length; i++) {
        if (screens[i].onMouseDragged) {
            screens[i].onMouseDragged(mouseX, mouseY);
        }
    }
}
function mouseWheel(event) {
    for (let i = 0; i < screens.length; i++) {
        if (screens[i].onMouseWheel) {
            screens[i].onMouseWheel(event);
        }
    }
}
function keyPressed(event) {
    switch(event.key) {
        case "Escape":
            cancelButton._events.click();
            break;
    }
    for (var i = 0; i < screens.length; i++) {
        var s = screens[i];
        if (s.onKeyPressed) {
            s.onKeyPressed(event);
        }
    }
}