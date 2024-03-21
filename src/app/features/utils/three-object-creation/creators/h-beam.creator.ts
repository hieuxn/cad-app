import { BoxGeometry, BufferGeometry, Group, Line, LineBasicMaterial, LineDashedMaterial, Mesh, MeshLambertMaterial, Object3D, Vector3 } from "three";
import { ThreeUtils } from "../../../../shared/utils/three.utils";

export class HBeamCreator {
  readonly name = "H-Beam";
  private _threeUtils = new ThreeUtils();

  create(l: number, b: number, d: number, t: number, s: number, color: number = 0x0000FF): Group {
    const group = new Group();
    const hBeam3D = this._create3DHBeam(l, b, d, t, s, color);
    hBeam3D.rotateY(Math.PI * 0.5);
    hBeam3D.rotateZ(Math.PI * 0.5);
    const hBeam2D = this._draw2DHBeam(l, b, s, color);

    group.add(hBeam3D);
    group.add(hBeam2D);
    group.name = this.name;
    group.userData = { length: l, depth: d, breadth: b, thickness: t, space: s, color: color }
    return group;
  }

  private _create3DHBeam(l: number, b: number, d: number, t: number, s: number, color: number = 0x0000FF): Mesh {
    const material = new MeshLambertMaterial({ color: color });
    const mesh = new Mesh();

    const flangeHeight = d;
    const flangeWidth = b;
    const webHeight = d - 2 * t; // Subtract space for the top and bottom flanges
    const webThickness = s;
    const flangeThickness = t;

    // Create flanges (top and bottom)
    const flangeGeometry = new BoxGeometry(flangeWidth, flangeThickness, l);
    const topFlange = new Mesh(flangeGeometry, material);
    const bottomFlange = new Mesh(flangeGeometry, material);
    topFlange.position.y = (flangeHeight / 2) - t / 2;
    bottomFlange.position.y = -(flangeHeight / 2) + t / 2;

    // Create web (middle part)
    const webGeometry = new BoxGeometry(webThickness, webHeight, l);
    const web = new Mesh(webGeometry, material);

    mesh.add(topFlange);
    mesh.add(bottomFlange);
    mesh.add(web);
    const layer = 1;
    mesh.layers.set(layer);
    mesh.children.forEach(c => c.layers.set(layer));

    return mesh;
  }

  private _draw2DHBeam(length: number, width: number, webThickness: number, color: number): Object3D {
    if (length === 0) return new Group();

    const basicMaterial = new LineBasicMaterial({ color: color });
    const points = [];
    points.push(new Vector3(-length / 2, -width / 2, 0));
    points.push(new Vector3(length / 2, -width / 2, 0));
    points.push(new Vector3(length / 2, width / 2, 0));
    points.push(new Vector3(-length / 2, width / 2, 0));
    points.push(new Vector3(-length / 2, -width / 2, 0));

    const basicGeometry = new BufferGeometry().setFromPoints(points);
    const outline = new Line(basicGeometry, basicMaterial);

    const line1 = this._drawDashedLine(new Vector3(-length / 2, -webThickness / 2, 0), new Vector3(length / 2, -webThickness / 2, 0), color);
    const line2 = this._drawDashedLine(new Vector3(-length / 2, webThickness / 2, 0), new Vector3(length / 2, webThickness / 2, 0), color);

    const mesh = new Mesh();
    mesh.add(line1);
    mesh.add(line2);
    mesh.add(outline);

    return mesh;
  }

  private _drawDashedLine(from: Vector3, to: Vector3, color: number): Line {
    const size = 0.2;
    const dashedMaterial = new LineDashedMaterial({ gapSize: size, dashSize: size, color: color });
    const points = [from, to];
    const dashedGeometry = new BufferGeometry().setFromPoints(points);
    const dashedLine = new Line(dashedGeometry, dashedMaterial);
    dashedLine.computeLineDistances();
    return dashedLine;
  }

  update(group: Group): Group {
    const { length, depth, breadth, thickness, space, color } = group.userData;

    const hBeam3D = this._create3DHBeam(length, breadth, depth, thickness, space, color);
    hBeam3D.rotateY(Math.PI * 0.5);
    hBeam3D.rotateZ(Math.PI * 0.5);
    let positions = this._threeUtils.getSetBitPositions(group.children[0].layers.mask);
    positions.forEach(pos => {
      hBeam3D.layers.set(pos);
      hBeam3D.children.forEach(c => c.layers.set(pos));
    });

    const hBeam2D = this._draw2DHBeam(length, breadth, space, color);
    positions = this._threeUtils.getSetBitPositions(group.children[1].layers.mask);
    positions.forEach(pos => {
      hBeam2D.layers.set(pos);
      hBeam2D.children.forEach(c => c.layers.set(pos));
    });

    group.clear();
    group.add(hBeam3D);
    group.add(hBeam2D);

    return group;
  }
}