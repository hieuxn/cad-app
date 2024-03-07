import { Entities } from "@dxfjs/parser";
import { Group, Line, Object3D } from "three";
import { DxfParserContext, DxfWriterContext } from "../models/dxf-context.model";
import { to3DArc } from "./dxf-arc.converter";
import { addDxfInsert, to3DGroup } from "./dxf-insert.converter";
import { addDxfLine, to3DLine, to3DPolyline } from "./dxf-line.converter";

export { deserializeEntities, serializeEntities };

function deserializeEntities(context: DxfParserContext, entities: Entities): Object3D[] {
  const object3Ds: Object3D[] = [];
  for (const arc of entities.arcs) object3Ds.push(to3DArc(context, arc));
  for (const line of entities.lines) object3Ds.push(to3DLine(context, line));
  for (const line of entities.lwPolylines) object3Ds.push(to3DPolyline(context, line));
  for (const insert of entities.inserts) object3Ds.push(to3DGroup(context, insert));
  return object3Ds;
}

function serializeEntities(context: DxfWriterContext, objects: Object3D[]) {
  for (const object of objects) {
    if (object instanceof Group) addDxfInsert(context, object);
    if (object instanceof Line) addDxfLine(context, object);
  }
}