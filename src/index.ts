// This file is the entry point of the application. It initializes the application, sets up the controllers, and starts the server.

import { SlotController } from './controllers/SlotController';

const slotController = new SlotController();

function init() {
    slotController.startGame();
}

window.onload = init;