export class SlotController {
    constructor(model, view) {
        this.model = model;
        this.view = view;
        this.spacePressed = false;
        this.init();
    }
    init() {
        this.view.render(this.model.spin());
        document.getElementById('spin-btn').addEventListener('click', () => this.spin());
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
