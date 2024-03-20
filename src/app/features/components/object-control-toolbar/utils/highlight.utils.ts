import { LineLoop, MeshBasicMaterial, Object3D, RingGeometry, Vector2, Vector3 } from "three";
import { LayerService } from "../../../../shared/services/layer.service";

export class HighLightUtils {
  readonly radius: number = 0.2;
  private _highlights: Object3D[] = [];

  constructor(private _layerService: LayerService) {
  }

  private _createHighlight(position: Vector3, size: Vector2): Object3D {
    const geometry = new RingGeometry(this.radius, this.radius, 16);
    const material = new MeshBasicMaterial({ color: 0x00FF00 });
    const circleOutline = new LineLoop(geometry, material);
    circleOutline.position.copy(position);
    return circleOutline;
  }

  isHighlight(): boolean {
    return this._highlights.length > 0;
  }

  clearHighlight() {
    if (this._highlights.length === 0) return;
    this._layerService.activeLayer.removeObjects(this._highlights, false);
    this._highlights.length = 0;
  }

  getPosition(mousePosition: Vector3, distance: number = this.radius): Vector3 {
    for (const box of this._highlights) {
      if (box.position.distanceTo(mousePosition) < distance) return box.position;
    }
    return mousePosition;
  }

  highlightPoint(point: Vector2, elevation: number) {
    const size = new Vector2(this.radius, this.radius);
    const highlight = this._createHighlight(new Vector3(point.x, point.y, elevation), size);
    this._layerService.activeLayer.addObjects(highlight, false);
    this._highlights.push(highlight);
  }
}