import { ArcEntity } from "@dxfjs/parser";
import { LWPolyline, LWPolylineVertex } from "@tarikjabiri/dxf";
import { BufferGeometry, EllipseCurve, Line, LineBasicMaterial } from "three";
import { DxfParserContext, DxfWriterContext } from "../models/dxf-context.model";

export { addDxfArc, to3DArc };
const pointCount = 50;

function to3DArc(context: DxfParserContext, arc: ArcEntity): Line {
  const arcCurve = new EllipseCurve(context.fixLength(arc.centerX), context.fixLength(arc.centerY), context.fixLength(arc.radius),
    context.fixLength(arc.radius), arc.startAngle * Math.PI / 180, arc.endAngle * Math.PI / 180);
  const arcGeometry = new BufferGeometry().setFromPoints(arcCurve.getPoints(pointCount));
  const material = new LineBasicMaterial({ color: 0x0000FF });
  const arcLine = new Line(arcGeometry, material);
  return arcLine;
}

function addDxfArc(context: DxfWriterContext, line: Line): LWPolyline {
  const positions = line.geometry.getAttribute('position');
  const points: LWPolylineVertex[] = []
  for (let i = 0; i < positions.count; i++) {
    points.push({ point: { x: positions.getX(i), y: positions.getY(i) } });
  }
  return context.writer.addLWPolyline(points);
}