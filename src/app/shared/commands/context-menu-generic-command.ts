import { ContextMenuCommandBase } from "./context-menu-command-base";
export type Action = (mouseEvent: MouseEvent) => void;
export class ContextMenuGenericCommand extends ContextMenuCommandBase {
    override isVisible: boolean = true;
    override name!: string;
    private action!: Action;

    constructor(name: string, action: Action, isVisible: boolean = true) {
        super();
        this.name = name;
        this.action = action;
        this.isVisible = isVisible;

    }
    override execute(mouseEvent: MouseEvent): void {
        this.action(mouseEvent);
    }

    static Create(name: string, action: Action, isVisible: boolean = true): ContextMenuCommandBase {
        return new ContextMenuGenericCommand(name, action, isVisible);
    }
}