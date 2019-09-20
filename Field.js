let bombGif;
let explosionGif;
let fireGif;
let boatImages = [];

let dataPreloaded = false;
let boatExplosion;
let emptyCellExplosion;
let bombLaunchSound;

function preloadFieldImages() {
    bombGif = loadImage("data/bomb.png");
    // explosionGif = loadGif("data/explosion.gif");
    fireGif = loadImage("data/fire.jpg");

    boatImages[0] = loadImage("data/boats/0.png"); //part of the boat that is damaged but boat isn't yet dead
    for (let i = 1; i <= 4; i++) {
        let singleBoatImages = []; //with fixed size
        for (let j = 1; j <= i; j++) {
            singleBoatImages.push(loadImage("data/boats/" + i + "-" + j + ".png"));
        }
        boatImages[i] = singleBoatImages;
    }

    boatExplosion = loadSound("data/sound/boatCellExplosion.mp3");
    emptyCellExplosion = loadSound("data/sound/emptyCellExplosion.mp3");
    bombLaunchSound = loadSound("data/sound/bombLaunch.mp3");
    dataPreloaded = true;
}

function Field(fieldWidth = 10, fieldHeight = 10) {
    if (!dataPreloaded) {
        preloadFieldImages();
    }
    let modifiable = false;
    let boats = [];
    let showBoats = true;
    let fieldGoalPos = createVector();
    let fieldPos = fieldGoalPos.copy();
    let goalCellSize = 0;
    let cellSize = 0.1;//prevent zero sizes at the beginning
    let alpha = 0;
    let flyingBombsCount = 0;

    Object.defineProperties(this, {
        "width": {
            get: function () {
                return fieldWidth;
            }
        },
        "height": {
            get: function () {
                return fieldHeight;
            }
        },
        "showBoats": {
            get: function () {
                return showBoats;
            },
            set: function (isBoatsShown) {
                showBoats = isBoatsShown? true : false;
            }
        },
        "goalPos": {
            get: function () {
                return fieldGoalPos.copy();
            }
        },
        "pos": {
            get: function () {
                return fieldPos.copy();
            }
        },
        "goalCellSize": {
            get: function () {
                return cellSize;
            },
            set: function (newSize) {
                if (isFinite(newSize)) {
                    goalCellSize = newSize;
                }
            }
        },
        "cellSize": {
            get: function () {
                return cellSize;
            },
            set: function (newSize) {
                if (isFinite(newSize)) {
                    cellSize = newSize;
                }
            }
        },
        "readyForMove": {
            get: function () {
                return flyingBombsCount == 0;
            }
        },
        "modifiable": {
            get: function () {
                return modifiable;
            },
            set: function (isModifiable) {
                modifiable = !!isModifiable;
            }
        }
    });

    /*************************************************/
    //adding fields and functions to retrieve ability to animate
    ShowAnimation.apply(this);
    this.animationDuration = 0.5;
    /*************************************************/

    /**
     * Sets a position of a field that it will approach as time goes
     * @param x (number)
     * @param y (number)
     * @param instantTransfer - changes current position to goalPos instantly
     */
    this.setGoalPos = function (x, y, instantTransfer) {
        fieldGoalPos.set(x, y);
        if (instantTransfer) {
            this.setPos(x, y);
        }
    }
    this.setPos = function (x, y) {
        fieldPos.set(x, y);
    }

    //adding boats
    for (let i = 4; i > 0; i--) {//size of boats differ from 1 to 4
        for (let j = 0; j <= (4 - i); j++) {//boats with size 1 repeats 4 times, 2-3, 3-2, 4-1
            let newPos = genInitBoatPos(i, j);
            let newBoat = new Boat(newPos.x, newPos.y, 1, i);
            newBoat.number = j; //so every boat will know where to be spawn at
            boats.push(newBoat);
        }
    }

    //adding cells
    let fieldCells = [];
    for (let i = 0; i < fieldWidth; i++) {
        let newColumn = [];
        for (let j = 0; j < fieldWidth; j++) {
            newColumn.push(new Cell(i, j));
        }
        fieldCells.push(newColumn);
    }

    this.draw = function (deltaTime) {
        this.hidden = (currentGameState != GameStates.GAME_LAUNCH) &&
            (currentGameState != GameStates.GAME);

        fieldPos.set(
            //x
            lerp(fieldPos.x, (function () {
                if (!this.hidden) return fieldGoalPos.x;

                //hide to corresponding side of the screen
                if (fieldPos.x < window.width/2) {
                    return -fieldWidth*goalCellSize;
                } else {
                    return window.width;
                }
            }).bind(this)(), 2*deltaTime),
            //y
            lerp(fieldPos.y, fieldGoalPos.y, 2*deltaTime)
        );

        let x = fieldPos.x, y = fieldPos.y;

        cellSize = lerp(cellSize, goalCellSize, 2*deltaTime);
        alpha = this.animationProgress;

        if (!this.modifiable) {//then cells must be drawn in front of boats - they are drawn first
            alignAndDrawBoats(deltaTime);
        }

        push();
        noFill();
        translate(x, y);
        for (let i = 0; i < fieldWidth; i++)
            for (let j = 0; j < fieldHeight; j++)
                fieldCells[i][j].draw(deltaTime);
        pop();

        if (this.modifiable) {
            markCellsAroundBoats();
            alignAndDrawBoats(deltaTime);
        }

    }

    function alignAndDrawBoats(deltaTime) {
        for (let i = 0; i < boats.length; i++) {
            if (boats[i] != selectedBoat) {
                boats[i].alignToCell(true);//move there
            }
            boats[i].draw(deltaTime);
        }
    }

    /**
     *
     * @param x - [0, fieldWidth-1]
     * @param y - [0, fieldHeight-1]
     * @returns {HitResult} result object with keys "
     */
    this.hitInFieldCords = function (x, y) {
        if (isValidCords(x, y)) {
            return fieldCells[x][y].hit();
        } else return new HitResult();
    }
    /**
     *
     * @param x - absolute x coordinate relative to canvas
     * @param y - absolute y coordinate relative to canvas
     * @returns {HitResult}
     */
    this.hit = function (x, y) {
        let hitX = floor((x - fieldPos.x)/cellSize);
        let hitY = floor((y - fieldPos.y)/cellSize);
        return this.hitInFieldCords(hitX, hitY);
    }

    this.canBoatBeAt = function(x, y) {
        return isValidCords(x, y) && !(fieldCells[x][y].marked)
    }
    this.canHit = function (x, y) {
        return this.canBoatBeAt(x, y) && !fieldCells[x][y].marked;
    }

    function HitResult(hitPerformed = false, boatHit = false, boatKilled = false, boatSize = 0) {
        Object.defineProperties(this, {
            "hitPerformed": {
                get: function () {
                    return hitPerformed;
                }
            },
            "boatHit": {
                get: function () {
                    return boatHit;
                }
            },
            "boatKilled": {
                get: function () {
                    return boatKilled;
                }
            },
            "boatSize": {
                get: function () {
                    return boatSize;
                }
            }
        });
        this.attachCell = function (cell) {
            this.x = cell.x;
            this.y = cell.y;
            this.absX = fieldPos.x+cellSize*cell.x;
            this.absY = fieldPos.y+cellSize*cell.y;
            return this;
        }
    }

    function Cell(x, y) {
        let marked = false;
        let wasHit = false;
        Object.defineProperties(this, {
            "wasHit": {
                get: function () {
                    return wasHit;
                }
            },
            "marked": {
                get: function () {
                    return marked;
                },
                set: function (isMarked) {
                    marked = isMarked? true : false;
                }
            },
            "x": {
                get: function () {
                    return x;
                }
            },
            "y": {
                get: function () {
                    return y;
                }
            },
            "bombFallen": {
                get: function () {
                    return bombFallen;
                }
            }
        });

        let markAnimationProgress = 0;
        let hitAnimationProgress = 0;

        /*************************************************/
        //adding fields and functions to retrieve ability to animate
        ShowAnimation.apply(this);
        this.animationDuration = 1.3;
        /*************************************************/

        const CIRCLES_COUNT = 10;
        var aimCirclesOffsets=[];
        var aimCirclesSizes = [];

        let hitTime; //save a time when a boat was hit in order to properly animate
        this.hit = function () {
            if (marked || wasHit) return new HitResult().attachCell(this);

            aimCirclesOffsets=[];
            aimCirclesSizes = [];
            for (var i = 0; i < CIRCLES_COUNT; i++) {
                aimCirclesOffsets.push(i*TWO_PI/CIRCLES_COUNT);
                aimCirclesSizes.push(random(TWO_PI));
            }

            bombLaunchSound.play();

            wasHit = true;
            flyingBombsCount++;
            hitTime = t;
            let boatHit = false;
            let boatKilled = false;
            let boatSize = 0;
            if (this.boat) {
                boatHit = true;
                boatKilled = this.boat.hit();
                if (boatKilled) {
                    boatSize = this.boat.size;
                }
            }
            return new HitResult(true, boatHit, boatKilled, boatSize).attachCell(this); //save cords as well
        }

        let bombFallen = false;

        let onBombFallen = function () {
            bombFallen = true;
            if (this.boat) {
                boatExplosion.play();
                if (this.boat.isDead()) {//if it died
                    markCellsAroundBoat(this.boat);
                }
            } else {//no boat here. Just mark
                emptyCellExplosion.play();
                marked = true;
            }
            flyingBombsCount--;
        }.bind(this);

        this.reset = function () {
            bombFallen = false;
            wasHit = false;
            marked = false;
        }

        this.draw = function (deltaTime) {

            stroke(255, 255, 255, 255*alpha);
            strokeWeight(1);
            rect(x*cellSize, y*cellSize, cellSize, cellSize);

            markAnimationProgress = lerp(markAnimationProgress, (marked? 1 : 0), 2*deltaTime);

            this.hidden = !wasHit; //hidden state relates to hit animation
            this.update(deltaTime);
            hitAnimationProgress = this.animationProgress;

            push();
            translate((x + 0.5)*cellSize, (y + 0.5)*cellSize); //to center of the cell

            if (wasHit) {
                if (hitAnimationProgress < 1) {

                    if (hitAnimationProgress < 0.8) {
                        ellipseMode(CENTER);
                        colorMode(HSB);

                        for (let i = 0; i < CIRCLES_COUNT; i++) {
                            stroke(i*25, 200, 100);
                            strokeWeight(5);

                            aimCirclesSizes[i] += deltaTime;
                            aimCirclesOffsets[i] += 2*deltaTime;

                            arc(0,0,
                                i*(0.8 - hitAnimationProgress)*cellSize,
                                i*(0.8 - hitAnimationProgress)*cellSize,
                                aimCirclesOffsets[i], aimCirclesOffsets[i]+PI*(1+sin(aimCirclesSizes[i])));

                        }
                        colorMode(RGB);
                    }

                    imageMode(CENTER);
                    image(bombGif, 0,0,
                        3*cellSize*(1 - hitAnimationProgress), 3*cellSize*(1 - hitAnimationProgress));
                    if (hitAnimationProgress > 0.5) {
                        push();
                        // image(explosionGif, 0,0,
                        //     cellSize*(sin(hitAnimationProgress*PI)), cellSize*(sin(hitAnimationProgress*PI)));

                        pop();
                    }
                    imageMode(CORNER);
                }

                if (hitAnimationProgress > 0.8) {//bomb fallen
                    if (!bombFallen) {
                        onBombFallen();
                    }
                }
            }


            if (markAnimationProgress > 0.02) {
                stroke(255, 0, 0, 255*alpha);
                strokeWeight(2);
                translate(-cellSize/2, -cellSize/2);

                for (let i = 0; i <= 1; i += 1/2) {
                    line(i*cellSize, 0,
                        cellSize*(markAnimationProgress*(1 - i) + i*(1 - markAnimationProgress)),
                        cellSize*markAnimationProgress);
                    line(0, i*cellSize,
                        cellSize*markAnimationProgress,
                        cellSize*(markAnimationProgress*(1 - i) + i*(1 - markAnimationProgress)));
                }
            }
            pop();

        }

    }

    function Boat(x = 0, y = 0, w = 1, h = 1) {
        let pos = createVector(x, y);
        let goalPos = pos.copy();
        let stackedPos = pos.copy(); //a position where boat is confirmed to be placed correctly
        let rotatedWhenStacked = false; //a rotation in which boat is confirmed to placed correctly

        this.cells = [];
        this.size = max(w, h);
        this.health = this.size;
        this.validlyPlaced = true;
        let rotated = false;

        //remove current boat references from cells it's in
        this.unbindCells = function () {
            for (let i = 0; i < this.cells.length; i++) {
                this.cells[i].boat = null;
            }
        }
        this.hit = function () {
            this.health--;
            return this.isDead();
        }
        this.isDead = function () {
            return this.health <= 0;
        }

        this.alignToCell = function (moveThere) {
            if (this.cells.length > 0) {
                stackedPos = createVector((this.cells[0].x)*cellSize + fieldPos.x, (this.cells[0].y)*cellSize + fieldPos.y);
                rotatedWhenStacked = rotated;
                if (moveThere) {
                    goalPos = stackedPos.copy();
                }
            }
        }

        this.tryToPlaceInCell = function (startCellX, startCellY, moveThere = false) {
            if (this.cells.length > 0) {
                if (startCellX == undefined) {
                    startCellX = this.cells[0].x;
                }
                if (startCellY == undefined) {
                    startCellY = this.cells[0].y;
                }
            } else {
                if (startCellX == undefined || startCellY == undefined) {
                    return;
                }
            }

            try {
                if (startCellX < 0 || startCellX > (fieldWidth - w) ||
                    startCellY < 0 || startCellY > (fieldHeight - h)) {
                    this.validlyPlaced = false;
                    return;
                }

                this.unbindCells();

                //check whether there's no boats around
                for (let i = 0; i < w; i++) {
                    for (let j = 0; j < h; j++) {
                        let iterator = createNeighboursCellIterator(i + startCellX, j + startCellY);
                        while (iterator.hasNext()) {
                            let cords = iterator.next();
                            let cellToTest = fieldCells[cords.x][cords.y];
                            if (cellToTest.boat) {
                                //restore references;
                                for (let i = 0; i < this.cells.length; i++) {
                                    this.cells[i].boat = this;
                                }
                                this.validlyPlaced = false;
                                return;
                            }
                        }
                    }
                }

                this.cells = [];
                for (let i = 0; i < w; i++) {
                    for (let j = 0; j < h; j++) {
                        let cellToMark = fieldCells[startCellX + i][startCellY + j];
                        cellToMark.boat = this;
                        this.cells.push(cellToMark);
                    }
                }

                this.alignToCell(moveThere);

                this.validlyPlaced = true;

            } finally {
                lastCellX = startCellX;
                lastCellY = startCellY;
                return this.validlyPlaced;
            }
        }

        let rotation = 0;
        this.draw = function (deltaTime) {
            pos.x = lerp(pos.x, goalPos.x, 10*deltaTime);
            pos.y = lerp(pos.y, goalPos.y, 10*deltaTime);
            rotation = lerp(rotation, rotated? -PI/2 : 0, 4*deltaTime);

            if (alpha > 0.03) {
                push();
                translate(pos.x + cellSize/2, pos.y + cellSize/2);
                rotate(rotation);
                translate(-cellSize/2, -cellSize/2);


                let allBombsFallen = true;
                for (var i = 0; i < this.cells.length; i++) {
                    let cell = this.cells[i];
                    if (cell && !cell.bombFallen) {
                        allBombsFallen = false;
                        break;
                    }
                }

                for (let i = 0; i < this.size; i++) {
                    if (!this.validlyPlaced) {
                        fill(255, 0, 0, 100*alpha);
                        rect(0, 0, cellSize, cellSize);
                    }

                    imageMode(CENTER);
                    function drawImageInCell(toDraw) {
                        image(toDraw, cellSize/2, cellSize/2, cellSize*alpha, cellSize*alpha);
                    }

                    let currBombFallen = (this.cells.length > 0 && this.cells[i].bombFallen);


                    if ((this.isDead() && allBombsFallen) || showBoats) {
                        drawImageInCell(boatImages[this.size][i]);
                    } else if (currBombFallen) {
                        //just damaged part, the same for all the boats
                        drawImageInCell(boatImages[0]);
                    }

                    if (currBombFallen) {
                        drawImageInCell(fireGif);
                    }
                    imageMode(CORNER);

                    //move to next cell of this boat
                    translate(0, cellSize);
                }
                pop();
            }

        }

        this.isInside = function (x, y) {
            return (x > pos.x && x < pos.x + w*cellSize &&
            y > pos.y && y < pos.y + h*cellSize);
        }

        let lastCellX = -1, lastCellY = -1;
        this.moveBy = function (x, y, checkAnyway) {
            goalPos.add(createVector(x, y));

            let cellX = round((goalPos.x - fieldPos.x)/cellSize);
            let cellY = round((goalPos.y - fieldPos.y)/cellSize);

            //if we transfer to nearby cell - check validness
            if (cellX != lastCellX || cellY != lastCellY || checkAnyway) {
                this.tryToPlaceInCell(cellX, cellY);
            }

        }

        this.rotate = function () {
            rotated = !rotated;
            if (!rotated) {
                h = max(w, h);
                w = 1;
            } else {
                w = max(w, h);
                h = 1;
            }
            this.moveBy(0, 0, true);//check anyway
        }

        this.normalizePosition = function () {
            try {
                if (lastCellX < 0 || lastCellY < 0 || lastCellY >= fieldHeight || lastCellX >= fieldWidth || this.cells.length==0) {


                    if (lastCellX < 0 || this.cells.length==0) {
                        goalPos.x = fieldPos.x + cellSize*fieldWidth + random(50, 300);
                    }
                    if (lastCellY < 0 || lastCellY >= fieldHeight || this.cells.length==0) {
                        goalPos.x = fieldPos.x + cellSize*fieldWidth + random(50, 300);
                        goalPos.y = fieldPos.y + random(cellSize*(fieldHeight - 4));
                    }

                    this.unbindCells();
                    this.cells = [];
                    this.validlyPlaced = true;

                    stackedPos = pos.copy();
                    rotatedWhenStacked = rotated;

                    return;
                }

                //if it's not - it will be dropped out of the field anyway
                if (!this.validlyPlaced) {
                    goalPos = stackedPos.copy();
                    if (rotatedWhenStacked != rotated) {
                        this.rotate();
                    }
                    this.validlyPlaced = true;
                    return;
                }

            } finally {
                this.alignToCell();
                markCellsAroundBoats();
            }
        }

        this.reset = function () {
            goalPos = genInitBoatPos(this.size, this.number);
            if (rotated) this.rotate();

            this.unbindCells();
            this.cells = [];
            this.validlyPlaced = true;
            this.restoreHealth();
        }

        this.restoreHealth = function() {
            this.health = this.size;
        }

    }

    function markCellsAroundBoats() {
        for (let i = 0; i < fieldWidth; i++) {
            for (let j = 0; j < fieldHeight; j++) {
                fieldCells[i][j].marked = false;
            }
        }

        for (let i = 0; i < boats.length; i++) {
            let b = boats[i];
            markCellsAroundBoat(b);
        }
    }

    function markCellsAroundBoat(boat) {
        for (let j = 0; j < boat.cells.length; j++) {
            let c = boat.cells[j];
            let iterator = createNeighboursCellIterator(c.x, c.y);

            while (iterator.hasNext()) {
                let cords = iterator.next();
                let cellToMark = fieldCells[cords.x][cords.y];
                cellToMark.marked = !cellToMark.boat; //if there's no boat - it's marked
            }

        }
    }

    let selectedBoat;
    this.selectBoatByCords = function (x, y) {
        for (let i = 0; i < boats.length; i++) {
            if (boats[i].isInside(x, y)) {
                selectedBoat = boats[i];

                //place boat on the top of another
                boats.splice(i, 1);
                boats.push(selectedBoat);
                return;
            }
        }
    }

    let lastPos = createVector();
    this.onMousePressed = function (x, y) {
        if (!this.modifiable) return;
        lastPos.x = x;
        lastPos.y = y;
        this.selectBoatByCords(x, y);
    }
    this.onMouseDragged = function (x, y) {
        if (!this.modifiable) return;

        if (selectedBoat && x < (window.width - cellSize)) {
            selectedBoat.moveBy(x - lastPos.x, y - lastPos.y);
            lastPos.x = x;
            lastPos.y = y;
        }
    }
    this.onMouseReleased = function () {
        if (!this.modifiable) return;

        if (selectedBoat) {
            selectedBoat.normalizePosition();
        }
        selectedBoat = null;
    }
    let wheelCounter = 0;
    this.onMouseWheel = function (event) {
        if (!this.modifiable) return;

        wheelCounter += event.delta;
        if (abs(wheelCounter) >= 200) {
            if (selectedBoat) {
                selectedBoat.rotate();
            }
            wheelCounter = 0;
        }
    }

    this.reset = function () {
        for (let i = 0; i < boats.length; i++) {
            boats[i].reset();
        }
        this.resetCells();
    }
    this.resetCells = function () {
        for (let i = 0; i < fieldWidth; i++) {
            for (let j = 0; j < fieldHeight; j++) {
                fieldCells[i][j].reset();
            }
        }
        for (let i = 0; i < boats.length; i++) {
            boats[i].restoreHealth();
        }
    }
    this.mix = function () {
        this.reset();
        let triesCount = 0;

        for (let i = 4; i >= 1; i--) {
            let toPlace = this.getBoatsBySize(i);

            while (toPlace.length > 0) {
                let randomX = floor(random(fieldWidth));
                let randomY = floor(random(fieldHeight));
                let randomR = random(1);

                if (randomR > 0.5) {
                    toPlace[0].rotate();
                }
                if (toPlace[0].tryToPlaceInCell(randomX, randomY, true)) {//and move there
                    toPlace.splice(0, 1);//[0].normalizePosition();
                }

                triesCount++;
                if (triesCount > 10000) {
                    this.mix();
                    return;
                }
            }
        }
    }
    this.getBoatsBySize = function (size) {
        let toReturn = [];
        for (let i = 0; i < boats.length; i++) {
            let b = boats[i];
            if (b.size == size)
                toReturn.push(b);
        }
        return toReturn;
    }

    this.isValid = function () {
        for (let i = 0; i < boats.length; i++) {
            let b = boats[i];
            if (!b.validlyPlaced || b.cells == undefined || b.cells.length == 0) {
                return false;
            }
        }
        return true;
    }
    this.isDone = function () {
        let state = true;
        for (var i = 0; i < boats.length; i++) {
            var b = boats[i];
            if (!b.isDead()) {
                state = false;
                break;
            }
        }
        return state;
    }

    this.onKeyPressed = function (event) {
        switch (event.which) {
            // case "r":
            case 82:
                if (selectedBoat) {
                    selectedBoat.rotate();
                }
                break;
        }
    }

    function isValidCords(x, y) {
        return (x >= 0 && x < fieldWidth && y >= 0 && y < fieldHeight);
    }

    function genInitBoatPos(size, number) {
        let offset = goalCellSize/2; //between boats
        let boatCell = goalCellSize + offset;
        let fieldRight = fieldGoalPos.x + fieldWidth*goalCellSize;
        let boatPos = createVector(fieldRight + boatCell, fieldGoalPos.y); // y-from field
        boatPos.x += boatCell*(function (i, j) {
                switch (i) {
                    case 1:
                        return 1 + (j >= 2? 0 : 1);
                    case 2:
                        return j;
                    case 3:
                        return 3;
                    case 4:
                        return 0;
                }
            })(size, number);
        boatPos.y += boatCell*(function (i, j) {
                switch (i) {
                    case 1:
                        return j%2 + 0.5;
                    case 2:
                        return 3;
                    case 3:
                        return j*2.32;
                    case 4:
                        return 0;
                }
            })(size, number);
        return boatPos;
    }

    //cycles around the specific cords with step and radius of 1
    function createNeighboursCellIterator(x, y) {
        let i = 0;
        return {
            next: function () {
                try {
                    return createVector(constrain(i%3 + x - 1, 0, fieldWidth - 1), constrain(floor(i/3) + y - 1, 0, fieldHeight - 1));
                } finally {
                    i++; //will increment before quiting the function
                }
            },
            hasNext: function () {
                return i < 9;
            }
        }
    }
}

