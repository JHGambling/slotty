export class SlotModel {
    constructor() {
        this.symbols = ['🍒', '🍋', '🍊', '🍉', '🍇', '⭐'];
        this.rows = 3;
        this.cols = 5;
        this.state = [];
    }
    spin() {
        this.state = [];
        for (let r = 0; r < this.rows; r++) {
            const row = [];
            for (let c = 0; c < this.cols; c++) {
                row.push(this.symbols[Math.floor(Math.random() * this.symbols.length)]);
            }
            this.state.push(row);
        }
        return this.state;
    }
}
