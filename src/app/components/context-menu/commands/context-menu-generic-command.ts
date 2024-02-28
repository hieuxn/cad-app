import { ContextMenuCommandBase } from "./context-menu-command-base";
export type Action = (mouseEvent: MouseEvent) => void;
export class ContextMenuGenericCommand extends ContextMenuCommandBase {
    public override isVisible: boolean = true;
    public override name!: string;
    private action!: Action;

    public constructor(name: string, action: Action, isVisible: boolean = true) {
        super();
        this.name = name;
        this.action = action;
        this.isVisible = isVisible;

    }
    public override execute(mouseEvent: MouseEvent): void {
        this.action(mouseEvent);
    }

    public static Create(name: string, action: Action, isVisible: boolean = true): ContextMenuCommandBase {
        return new ContextMenuGenericCommand(name, action, isVisible);
    }
}