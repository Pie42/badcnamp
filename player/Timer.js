export default class Timer {
    static timers = {};

    static key = 0;

    static init() {
        window.Timer = this;
    }

    static start(name) {
        this.timers[this.key] = [performance.now(), name];
        return this.key++;
    }

    static stop(index) {
        if (this.timers[index]) {
            let endTime = performance.now();
            console.log(
                `${this.timers[index][1]} completed in ${
                    (endTime - this.timers[index][0]) / 1000
                } seconds!`
            );
            delete this.timers[index];
        }
    }
}
