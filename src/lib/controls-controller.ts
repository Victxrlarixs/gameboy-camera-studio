import { AppStore } from "../store/app";

/**
 * ControlsController
 * Unifies physical button interaction (mouse/touch) and keyboard mapping.
 * Translates various input sources into standardized system actions.
 */
export class ControlsController {
    /** Mapping of element IDs to system action identifiers */
    private buttons: Record<string, string> = {
        'btn-up': 'up',
        'btn-down': 'down',
        'btn-left': 'left',
        'btn-right': 'right',
        'btn-a': 'a',
        'btn-b': 'b',
        'btn-start': 'start',
        'btn-select': 'select'
    };

    /** Mapping of keyboard keys to system action identifiers */
    private keyboardMap: Record<string, string> = {
        'ArrowUp': 'up',
        'ArrowDown': 'down',
        'ArrowLeft': 'left',
        'ArrowRight': 'right',
        'w': 'up',
        's': 'down',
        'a': 'left',
        'd': 'right',
        'W': 'up',
        'S': 'down',
        'A': 'left',
        'D': 'right',
        'z': 'a',
        'Z': 'a',
        'x': 'b',
        'X': 'b',
        'Enter': 'start',
        'Shift': 'select',
        ' ': 'a' // Spacebar as A
    };

    constructor() {
        this.bindButtons();
        this.bindKeyboard();
    }

    /**
     * Attaches interaction listeners to virtual hardware buttons.
     */
    private bindButtons(): void {
        Object.entries(this.buttons).forEach(([id, action]) => {
            const btn = document.getElementById(id);
            btn?.addEventListener('mousedown', () => AppStore.handleInput(action));
            btn?.addEventListener('touchstart', (e) => {
                e.preventDefault();
                AppStore.handleInput(action);
            }, { passive: false });
        });
    }

    /**
     * Attaches keyboard event listener for desktop controls.
     */
    private bindKeyboard(): void {
        window.addEventListener('keydown', (e) => {
            const action = this.keyboardMap[e.key];
            if (action) {
                AppStore.handleInput(action);
            }
        });
    }
}
