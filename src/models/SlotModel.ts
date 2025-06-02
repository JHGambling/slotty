class SlotModel {
    reels: string[][];
    private currentState: string[];

    constructor() {
        this.reels = [
            ['🍒', '🍋', '🍊', '🍉', '🍇', '⭐'],
            ['🍒', '🍋', '🍊', '🍉', '🍇', '⭐'],
            ['🍒', '🍋', '🍊', '🍉', '🍇', '⭐']
        ];
        this.currentState = [];
    }

    spin(): string[] {
        this.currentState = this.reels.map(reel => {
            const randomIndex = Math.floor(Math.random() * reel.length);
            return reel[randomIndex];
        });
        return this.currentState;
    }

    reset(): void {
        this.currentState = [];
    }

    getCurrentState(): string[] {
        return this.currentState;
    }
}