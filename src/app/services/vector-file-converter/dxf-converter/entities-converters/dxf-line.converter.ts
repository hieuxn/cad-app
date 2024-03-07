import { LWPolylineEntity, LineEntity } from "@dxfjs/parser";
import { LWPolyline, LWPolylineVertex } from "@tarikjabiri/dxf";
import { BufferGeometry, Line, Vector3 } from "three";
import { DxfParserContext, DxfWriterContext } from "../models/dxf-context.model";

export { addDxfLine, to3DLine, to3DPolyline };

function to3DPolyline(context: DxfParserContext, line: LWPolylineEntity): Line {
  const points = (line.vertices as unknown) as Vector3[];
  const lineGeometry = new BufferGeometry().setFromPoints(points)
  const material = context.getMaterial(context, line, line.linetypeName || '');
  const newLine = new Line(lineGeometry, material);
  return newLine;
}

function to3DLine(context: DxfParserContext, line: LineEntity): Line {
  const lineGeometry = new BufferGeometry().setFromPoints(
    [new Vector3(context.fixLength(line.startX), context.fixLength(line.startY), context.fixLength(line.startZ)),
    new Vector3(context.fixLength(line.endX), context.fixLength(line.endY), context.fixLength(line.endZ))]);
  const material = context.getMaterial(context, line, line.linetypeName || '');
  const newLine = new Line(lineGeometry, material);
  return newLine;
}

function addDxfLine(context: DxfWriterContext, line: Line): LWPolyline {
  const positions = line.geometry.getAttribute('position');
  const points: LWPolylineVertex[] = []
  for (let i = 0; i < positions.count; i++) {
    points.push({ point: { x: positions.getX(i), y: positions.getY(i) } });
  }
  const colorNumber = context.getColorNumber(line.material);
  return context.writer.addLWPolyline(points, { elevation: positions.getZ(0), colorNumber: colorNumber });
}
