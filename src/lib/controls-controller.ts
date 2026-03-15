import { AppStore } from "../store/app";

export class ControlsController {
    private buttons: Record<string, string> = {
        'btn-up': 'up', 'btn-down': 'down', 'btn-left': 'left', 'btn-right': 'right',
        'btn-a': 'a', 'btn-b': 'b', 'btn-start': 'start', 'btn-select': 'select'
    };

    private keyMap: Record<string, string> = {
        'ArrowUp': 'up', 'ArrowDown': 'down', 'ArrowLeft': 'left', 'ArrowRight': 'right',
        'w': 'up', 's': 'down', 'a': 'left', 'd': 'right',
        'W': 'up', 'S': 'down', 'A': 'left', 'D': 'right',
        'z': 'a', 'Z': 'a', 'x': 'b', 'X': 'b',
        'Enter': 'start', 'Shift': 'select', ' ': 'a'
    };

    constructor() {
        Object.entries(this.buttons).forEach(([id, action]) => {
            const btn = document.getElementById(id);
            btn?.addEventListener('mousedown', () => AppStore.handleInput(action));
            btn?.addEventListener('touchstart', (e) => {
                e.preventDefault();
                AppStore.handleInput(action);
            }, { passive: false });
        });

        window.addEventListener('keydown', (e) => {
            const action = this.keyMap[e.key];
            if (action) AppStore.handleInput(action);
        });
    }
}
