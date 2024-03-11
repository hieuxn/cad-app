
export abstract class ContextMenuCommandBase {
    abstract name: string;
    abstract execute(mouseEvent: MouseEvent): void;
    abstract isVisible: boolean;
}