import { SlotModel } from '../models/SlotModel.js';
import { SlotView } from '../views/SlotView.js';

export class SlotController {
    private spacePressed = false;
    constructor(private model: SlotModel, private view: SlotView) {
        this.init();
    }

    init() {
        this.view.render(this.model.spin());
        document.getElementById('spin-btn')!.addEventListener('click', () => this.spin());
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !this.spacePressed) {
                this.spacePressed = true;
                this.spin();
            }
        });
        document.addEventListener('keyup', (e) => {
            if (e.code === 'Space') {
                this.spacePressed = false;
            }
        });
    }

    spin() {
        const state = this.model.spin();
        this.view.render(state);
    }
}