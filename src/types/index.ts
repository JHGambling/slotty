export interface SlotMachine {
    reels: string[];
    spin(): void;
    reset(): void;
}

export interface GameState {
    isActive: boolean;
    currentBet: number;
    winnings: number;
}