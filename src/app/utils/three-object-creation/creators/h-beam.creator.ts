import { BoxGeometry, BufferGeometry, Group, Line, LineBasicMaterial, LineDashedMaterial, Mesh, MeshLambertMaterial, Object3D, Vector3 } from "three";
import { ThreeUtils } from "../../three.utils";

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
    const webHeight = d - 2 * t;
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

  temporarilyScale(group: Group): Group {
    const { length, depth, breadth, thickness, space, color } = group.userData;
    const webHeight = depth - 2 * thickness;

    const [topFlange, bottomFlange, web] = group.children[0].children as [Mesh, Mesh, Mesh];

    this._scaleMesh(topFlange, breadth, thickness, length);
    this._scaleMesh(bottomFlange, breadth, thickness, length);
    this._scaleMesh(web, space, webHeight, length);

    topFlange.position.y = (depth / 2) - thickness / 2;
    bottomFlange.position.y = -(depth / 2) + thickness / 2;

    const [line1, line2, outline] = group.children[1].children as [Line, Line, Line];
    this._updateLineGeometry(line1, space, length);
    this._updateLineGeometry(line2, -space, length);
    this._updateOutline(outline, length, breadth);

    return group;
  }

  private _scaleMesh(mesh: Mesh, width: number, height: number, depth: number) {
    const parameters = (mesh.geometry as BoxGeometry).parameters;
    const scaleX = width / parameters.width;
    const scaleY = height / parameters.height;
    const scaleZ = depth / parameters.depth;
    mesh.scale.set(scaleX, scaleY, scaleZ);
  }

  private _updateLineGeometry(line: Line, width: number, height: number) {
    line.geometry.setFromPoints([new Vector3(-height / 2, -width / 2, 0), new Vector3(height / 2, -width / 2, 0)]);
    line.computeLineDistances();
  }

  private _updateOutline(outline: Line, height: number, width: number) {
    const points = [];
    points.push(new Vector3(-height / 2, -width / 2, 0));
    points.push(new Vector3(height / 2, -width / 2, 0));
    points.push(new Vector3(height / 2, width / 2, 0));
    points.push(new Vector3(-height / 2, width / 2, 0));
    points.push(new Vector3(-height / 2, -width / 2, 0));
    outline.geometry.setFromPoints(points);
  }
}