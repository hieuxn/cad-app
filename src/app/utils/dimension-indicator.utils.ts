import { Injector } from "@angular/core";
import { Subscription } from "rxjs";
import { BufferGeometry, EllipseCurve, Group, Line, LineBasicMaterial, LineDashedMaterial, OrthographicCamera, PerspectiveCamera, Quaternion, Sprite, SpriteMaterial, Texture, Vector3 } from "three";
import { MainView3DService } from "../services/main-view-3d.service";
import { SINGLETON_MOUSE_SERVICE_TOKEN } from "../services/mouse.service";

export class IndicatorUtils {
  static readonly xVector = new Vector3(1, 0, 0);
  static scaleFactor = 1;
  static maxTextLength = 32;

  private static get _dashSize(): number {
    return 0.2 / this.scaleFactor;
  }

  static enableDynamicScaling(injector: Injector): Subscription {
    const mouseService = injector.get(SINGLETON_MOUSE_SERVICE_TOKEN);
    const mainView3DService = injector.get(MainView3DService);

    const sub = mouseService.wheel$.subscribe(event => {
      const camera = mainView3DService.activeCamera as OrthographicCamera | PerspectiveCamera;
      const zoom = Math.max(0.0001, camera.zoom);
      this.scaleFactor = zoom;
    });

    return sub;
  }

  static drawDashedLine(position: Vector3, angle: number, length: number, color: number): Line {
    const lengthVector = new Vector3(length, 0, 0);
    if (angle !== 0) {
      const rotationQuaternion = new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), angle);
      lengthVector.applyQuaternion(rotationQuaternion);
    }

    const geometry = new BufferGeometry().setFromPoints([position, position.clone().add(lengthVector)]);
    let gapSize = this._dashSize;
    let dashSize = gapSize;
    const material = new LineDashedMaterial({ dashSize: dashSize, gapSize: gapSize, color: color });

    const line = new Line(geometry, material);
    line.computeLineDistances();

    return line;
  }

  static drawDashedLine2(start: Vector3, end: Vector3, color: number): Line {
    const geometry = new BufferGeometry().setFromPoints([start, end]);
    const length = end.distanceTo(start);
    let gapSize = this._dashSize;
    let dashSize = gapSize;
    const material = new LineDashedMaterial({ dashSize: dashSize, gapSize: gapSize, color: color });

    const line = new Line(geometry, material);
    line.computeLineDistances();
    return line;
  }

  static drawArcLine(pivotPoint: Vector3, fromVector: Vector3, toPoint: Vector3, radius: number, pointCount: number, color: number): [Line | null, number, boolean] {
    const toVector = toPoint.clone().sub(pivotPoint);
    const angle = fromVector.angleTo(toVector)
    const clockwise = fromVector.clone().cross(toVector).z < 0;
    const rotation = clockwise ? 2 * Math.PI - angle : 0;

    const arcCurve = new EllipseCurve(pivotPoint.x, pivotPoint.y, radius, radius, 0, angle, false, rotation);
    const arcGeometry = new BufferGeometry().setFromPoints(arcCurve.getPoints(pointCount));
    let gapSize = this._dashSize;
    let dashSize = gapSize;
    const material = new LineDashedMaterial({ dashSize: dashSize, gapSize: gapSize, color: color });

    const line = new Line(arcGeometry, material);

    const rotationQuaternion = new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), (clockwise ? -1 : 1) * (angle * 0.5));
    const textPosition = fromVector.clone().multiplyScalar(radius * 0.88).applyQuaternion(rotationQuaternion).add(pivotPoint);
    const degree = (angle / Math.PI * 180);
    const arcText = this.drawText(`${degree.toFixed(2)}º`, textPosition);

    if (arcText) {
      line.add(arcText);
      const halfLength = 0.2;
      const tickMarkPosition = fromVector.clone().multiplyScalar(radius).add(pivotPoint);
      const tickMark1 = this.drawTickMark(tickMarkPosition, halfLength, 0, color);
      const tickMark2 = this.drawTickMark(toVector.clone().normalize().multiplyScalar(radius).add(pivotPoint), halfLength, clockwise ? -angle : angle, color);
      line.add(tickMark1);
      line.add(tickMark2);
    }

    line.computeLineDistances();
    return [line, angle, clockwise];
  }

  static drawText(text: string, position: Vector3): Sprite | null {
    text = this._centerPad(text, this.maxTextLength);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) return null;

    const fontSize = 96;
    ctx.font = `${fontSize}px Arial`;

    const textWidth = ctx.measureText(text).width;
    const padding = 20;
    canvas.width = textWidth + padding * 2;
    canvas.height = textWidth + padding * 2;

    ctx.font = `${fontSize}px Arial`;
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new Texture(canvas);
    texture.needsUpdate = true;

    const material = new SpriteMaterial({ map: texture });
    const sprite = new Sprite(material);
    const scaleFactor = 30 / (canvas.width * IndicatorUtils.scaleFactor / fontSize);
    sprite.scale.set(scaleFactor, scaleFactor, 1);
    sprite.name = text;
    sprite.position.copy(position);

    return sprite;
  }

  static drawTickMark(position: Vector3, halfLength: number, angle: number, color: number): Line {
    const halfLengthVector = new Vector3(halfLength, halfLength, 0);
    if (angle !== 0) {
      const rotationQuaternion = new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), angle);
      halfLengthVector.applyQuaternion(rotationQuaternion);
    }

    const geometry = new BufferGeometry().setFromPoints([position.clone().sub(halfLengthVector), position.clone().add(halfLengthVector)]);
    const material = new LineBasicMaterial({ color: color });

    const line = new Line(geometry, material);
    return line;
  }

  private static _centerPad(str: string, totalLength: number, padChar = ' ') {
    const paddingNeeded = totalLength - str.length;
    const paddingLeft = Math.floor(paddingNeeded / 2);
    const paddingRight = paddingNeeded - paddingLeft;

    return str.padStart(paddingLeft + str.length, padChar)
      .padEnd(totalLength, padChar);
  }
}

export class AngleIndicatorUtils {
  private _lastMousePosition: Vector3 | null = null;
  private _color: number = 0xFFFFFF;
  private _pointCount = 16;
  private _group = new Group();
  currentAngle: number = 0;

  cancel(): Group {
    this._lastMousePosition = null;
    this._group.clear();
    return this._group;
  }

  init(pivotPosition: Vector3): Group {

    const length = this._calculateLengthBasedOnZoomScale();
    const horizontalLine = IndicatorUtils.drawDashedLine(pivotPosition, 0, length, this._color);
    this._group.add(horizontalLine);

    return this._group;
  }

  onMousePositionUpdate(pivotPosition: Vector3, mousePosition: Vector3) {
    this._lastMousePosition = mousePosition;
    const length = this._calculateLengthBasedOnZoomScale();

    this._group.children.length = 0;

    const horizontalLine = IndicatorUtils.drawDashedLine(pivotPosition, 0, length, this._color);
    this._group.add(horizontalLine);

    const [arcLine, angle, clockwise] = IndicatorUtils.drawArcLine(pivotPosition, IndicatorUtils.xVector, this._lastMousePosition, length * 0.5, this._pointCount, this._color);
    this._group.add(arcLine!);

    this.currentAngle = angle;

    const distance = pivotPosition.distanceTo(mousePosition);
    if (distance < length * 0.5) {
      const directionLine = IndicatorUtils.drawDashedLine(mousePosition, clockwise ? -angle : angle, length - distance, this._color);
      this._group.add(directionLine);
    }
  }

  private _calculateLengthBasedOnZoomScale(): number {
    return 8 / IndicatorUtils.scaleFactor;
  }
}

export class LengthIndicatorUtils {
  private _startPosition: Vector3 | null = null;
  private _color: number = 0xFFFFFF;
  private _group = new Group();

  cancel(): Group {
    this._startPosition = null;
    this._group.clear();
    return this._group;
  }

  init(startPosition: Vector3): Group {
    this._startPosition = startPosition;
    // Optionally initialize a visual element to represent the starting point
    return this._group;
  }

  onMousePositionUpdate(endPosition: Vector3) {
    if (!this._startPosition) {
      console.error('LengthIndicatorUtils has not been initialized with a start position.');
      return;
    }

    this._group.children.length = 0; // Clear previous measurement

    const halfLengthTickMark = 0.2;

    const directionVector = endPosition.clone().sub(this._startPosition);
    const normalizedDirectionVector = directionVector.clone().normalize();
    const length = directionVector.length();
    const normalVector = new Vector3(-normalizedDirectionVector.y, normalizedDirectionVector.x, normalizedDirectionVector.z);
    const clockwise = IndicatorUtils.xVector.clone().cross(directionVector).z < 0;
    const angle = (clockwise ? -1 : 1) * IndicatorUtils.xVector.angleTo(directionVector);

    const subEndpoint1 = this._startPosition.clone().add(normalVector.clone().divideScalar(IndicatorUtils.scaleFactor));
    const subLine1 = IndicatorUtils.drawDashedLine2(this._startPosition, subEndpoint1, this._color);
    this._group.add(subLine1);

    const subEndpoint2 = endPosition.clone().add(normalVector.clone().divideScalar(IndicatorUtils.scaleFactor));
    const subLine2 = IndicatorUtils.drawDashedLine2(endPosition, subEndpoint2, this._color);
    this._group.add(subLine2);

    const measureLine = IndicatorUtils.drawDashedLine2(subEndpoint1, subEndpoint2, this._color);
    this._group.add(measureLine);

    const tickMark1 = IndicatorUtils.drawTickMark(subEndpoint1, halfLengthTickMark, angle, this._color);
    this._group.add(tickMark1);

    const tickMark2 = IndicatorUtils.drawTickMark(subEndpoint2, halfLengthTickMark, angle, this._color);
    this._group.add(tickMark2);

    const midPoint = new Vector3().lerpVectors(this._startPosition, endPosition, 0.5).add(normalVector.multiplyScalar(1.5 / IndicatorUtils.scaleFactor));
    const lengthText = IndicatorUtils.drawText(`${length.toFixed(2)} m`, midPoint);

    if (lengthText) this._group.add(lengthText);
  }
}

export class LengthAngleIndicatorUtils {
  private _subscription = new Subscription();
  length = new LengthIndicatorUtils();
  angle = new AngleIndicatorUtils();

  constructor(injector: Injector) {
    const sub = IndicatorUtils.enableDynamicScaling(injector);
    this._subscription.add(sub);
  }

  dispose() {
    this._subscription.unsubscribe();
  }

  cancel(): Group[] {
    return [this.length.cancel(), this.angle.cancel()];
  }

  init(startPosition: Vector3): Group[] {
    return [this.length.init(startPosition), this.angle.init(startPosition)];
  }

  onMousePositionUpdate(startPosition: Vector3, endPosition: Vector3) {
    this.length.onMousePositionUpdate(endPosition);
    this.angle.onMousePositionUpdate(startPosition, endPosition);
  }
}
