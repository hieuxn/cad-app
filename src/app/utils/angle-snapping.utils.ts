import { Quaternion, Vector3 } from "three";

export class AngleSnappingUtils {
  private _angleThreshold = 0.1;
  private _xVector = new Vector3(1, 0, 0);
  private _zVector = new Vector3(0, 0, 1);
  private _snapAngle = Math.PI * 0.25;

  snapPoint(previousPosition: Vector3, currentPosition: Vector3): Vector3 | null {
    const directionVector = currentPosition.clone().sub(previousPosition);
    const clockwise = this._xVector.clone().cross(directionVector).z < 0;
    const currentAngle = this._xVector.angleTo(directionVector);
    const roundedAngle = +(currentAngle / this._snapAngle).toFixed(0) * this._snapAngle;
    const diff = currentAngle - roundedAngle;
    // console.log(currentAngle + "  " + roundedAngle + "  " + diff);

    if (Math.abs(diff) < this._angleThreshold) {
      const radius = previousPosition.distanceTo(currentPosition);
      const rotation = new Quaternion().setFromAxisAngle(this._zVector, clockwise ? -roundedAngle : roundedAngle)
      const snapPoint = this._xVector.clone().applyQuaternion(rotation).multiplyScalar(radius).add(previousPosition);
      currentPosition.copy(snapPoint);
      return snapPoint;
    }

    return null;
  }
}