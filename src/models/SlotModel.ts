export class SlotModel {
    symbols: string[] = ['🍒', '🍋', '🍊', '🍉', '🍇', '⭐'];
    rows: number = 3;
    cols: number = 5;
    state: string[][] = [];

    spin(): string[][] {
        this.state = [];
        for (let r = 0; r < this.rows; r++) {
            const row: string[] = [];
            for (let c = 0; c < this.cols; c++) {
                row.push(this.symbols[Math.floor(Math.random() * this.symbols.length)]);
            }
            this.state.push(row);
        }
        return this.state;
    }
}