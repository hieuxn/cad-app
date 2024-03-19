import { LineLoop, Mesh, Object3D, Vector3 } from "three";
import { ContextMenuCommandBase } from "../../../../../shared/commands/context-menu-command-base";
import { MousePlacementCommand } from "../../../../../shared/commands/mouse-placement.command";

export class DrawCylinderCommand extends MousePlacementCommand {
  override name: string = "Cylinder";
  color: number = 0x8888FF;
  userData: Record<string, string | number> = { 'height': 1 };
  private _forceFinish: boolean = false;
  private _finishCommand!: ContextMenuCommandBase;
  private _defaultRadius = 0.1; //m
  private _defaultLength = 1;//m

  protected override onInit() {
    super.onInit();
  }

  override execute(): void {
    super.execute();
    this._forceFinish = false;
  }

  protected override isFinished(mouseLocations: Vector3[]): boolean {
    super.isFinished(mouseLocations);
    const click2Times = mouseLocations.length >= 2;
    return click2Times;
  }

  protected override onCommandExecute(mouseLocations: Vector3[]): Object3D[] | null {
    if (mouseLocations.length == 2) {
      this._defaultRadius = mouseLocations[0].distanceTo(mouseLocations[1]);
    }
    
    const group = this.objectCreatorService.cylinder.create(this._defaultLength, this._defaultRadius, 32);
    group.name = this.userData['blockName'] as string;

    const cylinder = group.children[0] as Mesh;
    const spawnPosition = mouseLocations.at(0)!.clone().add(new Vector3(0, 0, this._defaultLength * -0.5));
    cylinder.position.copy(spawnPosition);

    const circleOutline = group.children[1] as LineLoop;
    circleOutline.position.copy(mouseLocations.at(0)!);
    return [group];
  }

  protected override onMenuContextOpen(mouseEvent: MouseEvent): void {
    super.onMenuContextOpen(mouseEvent);

    if (this.mouseLocations.length <= 2) {
      this._finishCommand.isVisible = false;
    }
    else {
      this._finishCommand.isVisible = true;
    }

    this.contextMenuService.open(mouseEvent, this.contextMenuCommmands);
  }
}