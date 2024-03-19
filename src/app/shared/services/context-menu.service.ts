import { Injectable } from "@angular/core";
import { ContextMenuComponent } from "../../core/components/context-menu/context-menu.component";
import { ContextMenuCommandBase } from "../commands/context-menu-command-base";

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