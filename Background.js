function Background() {
    let BACK_RECTS_HOR_COUNT = 15;

    let scl = window.width/BACK_RECTS_HOR_COUNT;
    this.draw = function() {
        noStroke();
        for (let i=0; i<BACK_RECTS_HOR_COUNT; i++) {
            for (let j=0; j<BACK_RECTS_HOR_COUNT; j++) {
                var blue = 50+200*noise(i/10+t/5, j/10+t/10);
                fill(0, 60, blue, 200);
                rect(i*scl, j*scl, scl, scl);
            }
        }

    }

}