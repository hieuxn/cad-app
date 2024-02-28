import { Injectable } from "@angular/core";
import { CircleGeometry, Mesh, MeshBasicMaterial, Vector2, Vector3 } from "three";
import { ViewerService } from "./viewer.serive";

@Injectable({ providedIn: 'root' })
export class HighLightService {
  private boxes: Mesh[] = [];
  public readonly distance: number = 0.3;

  constructor(private viewerService: ViewerService) { }

  private createHighlightBox(position: Vector3, size: Vector2): Mesh {
    const geometry = new CircleGeometry(this.distance, 6);
    const material = new MeshBasicMaterial({ color: 0xffff00, wireframe: true });
    const boxMesh = new Mesh(geometry, material);
    boxMesh.position.copy(position);

    return boxMesh;
  }

  public isHighlight(): boolean {
    return this.boxes.length > 0;
  }

  public clearHighlight() {
    this.viewerService.view3D.scene.remove(...this.boxes);
    this.boxes.length = 0;
  }

  public getPosition(mousePosition: Vector3, distance: number = this.distance): Vector3 {
    for (const box of this.boxes) {
      if (box.position.distanceTo(mousePosition) < distance) return box.position;
    }
    return mousePosition;
  }

  public highlightPoint(point: Vector2, elevation: number) {
    const size = new Vector2(this.distance, this.distance);
    const highlightBox = this.createHighlightBox(new Vector3(point.x, point.y, elevation), size);
    this.viewerService.view3D.scene.add(highlightBox);
    this.boxes.push(highlightBox);
  }
}