export class SlotView {
    reelsDiv: HTMLElement;

    constructor() {
        this.reelsDiv = document.getElementById('reels')!;
    }

    render(state: string[][]) {
        let html = '<table class="slot-table">';
        for (const row of state) {
            html += '<tr>';
            for (const symbol of row) {
                html += `<td>${symbol}</td>`;
            }
            html += '</tr>';
        }
        html += '</table>';
        this.reelsDiv.innerHTML = html;
    }
}