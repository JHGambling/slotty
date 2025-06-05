// This file is the entry point of the application. It initializes the application, sets up the controllers, and starts the server.
import { SlotModel } from './models/SlotModel.js';
import { SlotView } from './views/SlotView.js';
import { SlotController } from './controllers/SlotController.js';
window.onload = () => {
    const model = new SlotModel();
    const view = new SlotView();
    new SlotController(model, view);
};
