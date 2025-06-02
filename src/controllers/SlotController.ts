export class SlotController {
    private model: any;
    private view: any;

    constructor(model: any, view: any) {
        this.model = model;
        this.view = view;
    }

    public startGame(): void {
        this.model.spin();
        this.view.updateDisplay(this.model.getReels());
    }

    public stopGame(): void {
        this.model.reset();
        this.view.updateDisplay(this.model.getReels());
    }
}