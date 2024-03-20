import { ContextMenuCommandBase } from "./context-menu-command-base";
export type Action = (mouseEvent: MouseEvent) => void;
export class ContextMenuGenericCommand extends ContextMenuCommandBase {
    override isVisible: boolean = true;
    override name!: string;
    private _action!: Action;

    constructor(name: string, action: Action, isVisible: boolean = true) {
        super();
        this.name = name;
        this._action = action;
        this.isVisible = isVisible;

    }
    override execute(mouseEvent: MouseEvent): void {
        this._action(mouseEvent);
    }

    static create(name: string, action: Action, isVisible: boolean = true): ContextMenuCommandBase {
        return new ContextMenuGenericCommand(name, action, isVisible);
    }
}