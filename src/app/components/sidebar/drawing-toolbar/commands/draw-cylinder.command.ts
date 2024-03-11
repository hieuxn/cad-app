import { CylinderGeometry, Group, LineLoop, Mesh, MeshBasicMaterial, Object3D, RingGeometry, Vector3 } from "three";
import { ManagedLayer } from "../../../../models/managed-layer.model";
import { ContextMenuCommandBase } from "../../../context-menu/commands/context-menu-command-base";
import { DrawingCommand } from "./drawing.command";

export class DrawCylinderCommand extends DrawingCommand {
  override name: string = "Cylinder";
  color: number = 0x8888FF;
  userData: Record<string, string> = {};
  private _forceFinish: boolean = false;
  private _finishCommand!: ContextMenuCommandBase;
  private _defaultRadius = 0.1; //m
  private _defaultLength = 1;//m

  protected override onInit() {
    super.onInit();
  }

  override execute(layer: ManagedLayer): void {
    super.execute(layer);
    this._forceFinish = false;
  }

  protected override isFinished(mouseLocations: Vector3[]): boolean {
    super.isFinished(mouseLocations);
    const click2Times = mouseLocations.length >= 2;
    return click2Times;
  }

  protected override drawShapeImplementation(mouseLocations: Vector3[]): Object3D[] | null {
    if (mouseLocations.length == 2) {
      this._defaultRadius = mouseLocations[0].distanceTo(mouseLocations[1]);
    }
    const geometry = new CylinderGeometry(this._defaultRadius, this._defaultRadius, this._defaultLength, 32);
    geometry.rotateX(Math.PI * 0.5);
    const material = new MeshBasicMaterial({ color: this.color });
    const cylinder = new Mesh(geometry, material);

    const spawnPosition = mouseLocations.at(0)!.clone().add(new Vector3(0, 0, this._defaultLength * -0.5));
    cylinder.position.copy(spawnPosition);

    const geometry2 = new RingGeometry(this._defaultRadius, this._defaultRadius, 16);
    const material2 = new MeshBasicMaterial({ color: this.color });
    const circleOutline = new LineLoop(geometry2, material2);
    circleOutline.position.copy(mouseLocations.at(0)!);

    const group = new Group();
    group.add(cylinder);
    group.add(circleOutline);
    group.name = this.userData['blockName'];
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