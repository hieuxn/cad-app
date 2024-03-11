import { Injectable } from "@angular/core";
import { ContextMenuCommandBase } from "../components/context-menu/commands/context-menu-command-base";
import { ContextMenuComponent } from "../components/context-menu/context-menu.component";

class ContextMenuWrapper {
    value!: ContextMenuComponent;
}

@Injectable({ providedIn: 'root' })
export class ContextMenuService {
    private contextMenuWrapper: ContextMenuWrapper = new ContextMenuWrapper();

    inject(contextMenu: ContextMenuComponent) {
        this.contextMenuWrapper.value = contextMenu;
    }

    open(event: MouseEvent, commands: ContextMenuCommandBase[]) {
        this.contextMenuWrapper.value.open(event, commands);
    }
}