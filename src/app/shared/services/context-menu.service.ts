import { Injectable, Injector } from "@angular/core";
import { Object3D } from "three";
import { ContextMenuComponent } from "../../core/components/context-menu/context-menu.component";
import { ThreeViewLifecycleBase } from "../../core/models/three-view-ready.model";
import { ContextMenuCommandBase } from "../commands/context-menu-command-base";
import { ContextMenuGenericCommand } from "../commands/context-menu-generic-command";
import { ThreeUtils } from "../utils/three.utils";
import { FamilyCreatorService } from "./family-creator/family-creator.service";
import { LayerService } from "./layer.service";
import { MainView3DService } from "./main-view-3d.service";
import { MouseService, SINGLETON_MOUSE_SERVICE_TOKEN } from "./mouse.service";
import { ObjectSelectionService } from "./object-selection.service";

class ContextMenuWrapper {
    value!: ContextMenuComponent;
}

@Injectable({ providedIn: 'root' })
export class ContextMenuService extends ThreeViewLifecycleBase {
    private _selectionService!: ObjectSelectionService;
    private _mouseService!: MouseService;
    private _layerService!: LayerService;
    private _familyCreatorService!: FamilyCreatorService;
    private _contextMenuWrapper: ContextMenuWrapper = new ContextMenuWrapper();
    private _contextMenuCommands: ContextMenuCommandBase[] = [];
    private _threeUtils = new ThreeUtils();

    constructor(injector: Injector) {
        super(injector);
    }

    protected override afterThreeViewReady(afterThreeViewReady: MainView3DService) {
        this._selectionService = this.injector.get(ObjectSelectionService);
        this._mouseService = this.injector.get(SINGLETON_MOUSE_SERVICE_TOKEN);
        this._familyCreatorService = this.injector.get(FamilyCreatorService);
        this._layerService = this.injector.get(LayerService);
        this._initContextMenuCommands();
    }

    private _initContextMenuCommands() {
        this._mouseService.mouseContextMenu$.subscribe(this._onMenuContextOpening.bind(this));

        const deleteCommand = ContextMenuGenericCommand.create('Delete', (event) => {
            if (this._selectionService.selectedObjects.size === 0) return;
            for (const [obj, material] of this._selectionService.selectedObjects.values()) {
                const parent = this._threeUtils._getParentGroup(obj);
                if (!parent) continue;
                this._layerService.activeLayer.removeObjects(parent);
            }
        }, false);

        const createFamilyCommand = ContextMenuGenericCommand.create('Create Family', (event) => {
            if (this._selectionService.selectedObjects.size === 0) return;
            const group: Object3D[] = [];
            for (const [obj, _] of this._selectionService.selectedObjects.values()) {
                group.push(obj);
            }

            this._selectionService.deselectAll();
            this._familyCreatorService.openFamilyCreatorDialog(group);
        }, false);

        this._contextMenuCommands.push(deleteCommand);
        this._contextMenuCommands.push(createFamilyCommand);
    }

    private _onMenuContextOpening(onContextMenuOpening: any) {
        const deleteCommand = this._contextMenuCommands[0];
        const createFamilyCommand = this._contextMenuCommands[1];
        deleteCommand.isVisible = createFamilyCommand.isVisible = this._selectionService.selectedObjects.size > 0;
    }

    register(contextMenu: ContextMenuComponent) {
        this._contextMenuWrapper.value = contextMenu;
    }

    open(event: MouseEvent, commands: ContextMenuCommandBase[]) {
        this._contextMenuWrapper.value.open(event, commands.concat(this._contextMenuCommands));
    }
}