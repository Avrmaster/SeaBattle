function GameAI(userField, moveCallback) {

    let THINK_TIME = 1.2;
    let movesToPerformCount = 0;
    let time = 0;

    this.update = function (deltaTime) {
        if (movesToPerformCount > 0) {
            if (time < THINK_TIME) {
                time += deltaTime;
            } else {
                lastResult = makeMove();
                moveCallback(lastResult);
                movesToPerformCount--;
                time = 0;
            }
            fill(255);
            //ellipse(width/2, height/2, 100*(1 + sin(10*t)), 100*(1 + cos(10*t)));
        }
    }

    this.initiateMove = function () {
        movesToPerformCount++;
    }

    let iterators;
    this.newGame = function () {
        iterators = [];
        iterators.push(createRandomIterator());
        let gridOffset = floor(random(4));
        let yDirection = random(1)<0.5;
        iterators.push(createSkewGridIterator(2, gridOffset, yDirection, false)); //don't shuffle
        iterators.push(createSkewGridIterator(4, gridOffset, yDirection, false)); //don't shuffle
    }

    let lastResult;

    function makeMove() {
        if (iterators.length == 0) {
            console.log("oopsie! out of iterators");
            return;
        }
        var mostRecentIterator = iterators[iterators.length - 1];

        let toHit;
        do {
            if (!mostRecentIterator.hasNext()) {
                iterators.pop();
                return makeMove();
            }
            toHit = mostRecentIterator.next();
        } while (!userField.canHit(toHit.x, toHit.y));

        console.log("hitting.. (" + toHit.x + ", " + toHit.y + ")");
        let result = userField.hitInFieldCords(toHit.x, toHit.y);
        if (!mostRecentIterator.fobiddenIteratorChanges) {
            if (result.boatHit && !result.boatKilled) {
                iterators.push(createBoatSearchIterator(result.x, result.y));
            }
        }
        mostRecentIterator.processResult(result);
        return result;
    }

    function getSmallestAliveBoatSize(minSizeInterested) {
        for (let i=minSizeInterested; i<=4; i++) {
            let boats = userField.getBoatsBySize(i);
            for (let j=0; j<boats.length; j++) {
                if (!boats[j].isDead())
                    return i;
            }
        }
    }
    function canBoatFit(cords, size) {
        var maxSizes = [0];
        for (let j = 0; j < 2; j++) {//j=0 for horizontal, j=1 for vertical
            let currSize = 0;
            for (let i = -size + 1; i < size; i++) {
                if (userField.canBoatBeAt((cords.x + (1 - j)*i), (cords.y + (j)*i))) {
                    currSize++;
                } else {
                    maxSizes.push(currSize);
                    currSize = 0;
                }
            }
            maxSizes.push(currSize);
        }
        return (max(maxSizes) >= size);
    }

    function createBoatSearchIterator(foundX, foundY) {
        console.log("boat search at (" + foundX + "," + foundY + ") created");

        function getAroundCords(order) {
            return {
                "x": function () {
                    switch (order) {
                        case 0:
                            return -1;
                        case 1:
                            return 0;
                        case 2:
                            return 1;
                        case 3:
                            return 0;
                    }
                }() + foundX,
                "y": function () {
                    switch (order) {
                        case 0:
                            return 0;
                        case 1:
                            return 1;
                        case 2:
                            return 0;
                        case 3:
                            return -1;

                    }
                }() + foundY
            }
        }

        var currStep = 0; //for hitting around part
        var hittingAroundOrder = [0, 1, 2, 3];
        shuffle(hittingAroundOrder, true);

        var foundCords = [{"x": foundX, "y": foundY}];
        var isHorizontal = false;
        var positiveDirection = false;

        var isDone = false;
        return {
            next: function () {
                console.log("boat search next");
                if (foundCords.length == 1) {//search in 4 directions, in hitting around order
                    console.log("hitting around..");
                    while(!canBoatFit(getAroundCords(hittingAroundOrder[currStep]), getSmallestAliveBoatSize(2))) {
                        console.log("skipping cords:");
                        console.log(getAroundCords(hittingAroundOrder[currStep]));
                        currStep++;
                        if (currStep>3) {
                            currStep=0;
                            break;
                        }
                    }
                    return getAroundCords(hittingAroundOrder[currStep++]);
                } else {
                    console.log("hitting in direction. Horizontal: " + isHorizontal + ", positiveDirection: " + positiveDirection);
                    let cornerCords = foundCords[positiveDirection? (foundCords.length - 1) : 0];

                    try {
                        return {
                            "x": cornerCords.x + (isHorizontal? (positiveDirection? 1 : -1) : 0),
                            "y": cornerCords.y + (isHorizontal? 0 : (positiveDirection? 1 : -1))
                        }
                    } finally {
                        positiveDirection = !positiveDirection;
                    }
                }

            },
            hasNext: function () {
                return !isDone;
            },
            processResult: function (result) {
                if (result.boatHit) {
                    foundCords.push({"x": result.x, "y": result.y});
                    foundCords.sort(function (a, b) {
                        return (a.x - b.x + a.y - b.y);
                    });
                    console.log("found parts: ");
                    console.log(foundCords);

                    isHorizontal = foundCords[0].y == foundCords[1].y; //if new spot has the same y coordinate as start one
                    positiveDirection = random(1) > 0.5;
                }
                if (result.boatKilled) {
                    isDone = true;
                }
            },
            fobiddenIteratorChanges: true
        }

    }

    /**
     * @param yDirection: from top to bottom - true, or false - visa versa
     */
    function createSkewGridIterator(gridWidth, offset = 0, yDirection=true, needShuffle = false) {
        let xOffset = offset%gridWidth;
        let yOffset = yDirection? 0 : userField.height-1;
        let allCellsCords = [];

        while (true) {
            allCellsCords.push({
                "x": xOffset,
                "y": yOffset
            });
            xOffset += gridWidth;
            if (xOffset >= userField.width) {
                xOffset -= userField.width - 1;
                xOffset %= gridWidth;
                yOffset += yDirection? 1 : -1;
            }
            if (yOffset<0 || yOffset >= userField.height) break;
        }

        if (needShuffle) {
            shuffle(allCellsCords, true);
        }

        let currCords = 0;
        return {
            hasNext: function () {
                return currCords < (allCellsCords.length) && (function () {
                        let allExistingBoats = []; //with size greater or equal to this' grid size
                        for (let i = gridWidth; i <= 4; i++) {
                            allExistingBoats = allExistingBoats.concat(userField.getBoatsBySize(i));//every boat with size equal and bigger than gridWidth
                        }
                        let allDead = true;
                        for (let i = 0; i < allExistingBoats.length; i++) {
                            if (!allExistingBoats[i].isDead()) {
                                allDead = false;
                                break;
                            }
                        }
                        return !allDead;
                    })();
            },
            next: function () {
                console.log("skew iterator with gridWidth " + gridWidth + " next");

                let toReturn = allCellsCords[currCords++];
                if (canBoatFit(toReturn, gridWidth) || !this.hasNext()) {
                    return toReturn;
                } else {
                    console.log("skipping: ");
                    console.log(toReturn);
                    return this.next();
                }
            },
            processResult: function (result) {
                //no adjustments here
            },
        }
    }
    function createRandomIterator() {
        var allCellsCords = [];
        for (let i = 0; i < userField.width; i++) {
            for (let j = 0; j < userField.height; j++) {
                allCellsCords.push({"x": i, "y": j});
            }
        }
        shuffle(allCellsCords, true);
        var currCords = 0;
        return {
            hasNext: function () {
                return currCords < allCellsCords.length;
            },
            next: function () {
                console.log("random next");
                let toHit;
                do {
                    toHit = allCellsCords[currCords++];
                } while (!userField.canHit(toHit.x, toHit.y));

                return toHit;
            },
            processResult: function (result) {
                //it's random! No adjustments
            }
        }
    }

}