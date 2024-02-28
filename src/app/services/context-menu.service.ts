import { Injectable } from "@angular/core";
import { ContextMenuComponent } from "../components/context-menu/context-menu.component";

export class ContextMenuWrapper {
    public value!: ContextMenuComponent;
}

@Injectable({ providedIn: 'root' })
export class ContextMenuService {
    private contextMenuWrapper: ContextMenuWrapper = new ContextMenuWrapper();

    public inject(contextMenu: ContextMenuComponent) {
        this.contextMenuWrapper.value = contextMenu;
    }

    public lazyGet(): ContextMenuWrapper {
        return this.contextMenuWrapper;
    }

    public get(): ContextMenuComponent {
        if (!this.contextMenuWrapper.value) throw new Error('Context menu has not been injected yet');
        return this.contextMenuWrapper.value;
    }
}