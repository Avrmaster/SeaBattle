function ShowAnimation() {
    this.animationTime = 0;
    this.animationDuration = 0.5; //in seconds
    this.animationProgress = 0;
    this.hidden = true;
    this.update = function (deltaTime) {
        if (this.hidden) {
            if (this.animationProgress <= 0) {
                this.animationTime = 0;
            } else {
                this.animationTime -= deltaTime;
            }
        } else {
            if (this.animationProgress >= 1) {
                this.animationTime = this.animationDuration;
            } else {
                this.animationTime += deltaTime;
            }
        }
        if (!this.ignoreUpdate) {
            this.animationProgress = this.animationTime/this.animationDuration;
        }
    }
    this.ignoreUpdate = false;
    this.valueOf = function() {
        return this.animationProgress;
    }
}