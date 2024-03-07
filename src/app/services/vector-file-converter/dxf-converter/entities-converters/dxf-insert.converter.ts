import { InsertEntity } from "@dxfjs/parser";
import { Group } from "three";
import { DxfParserContext, DxfWriterContext } from "../models/dxf-context.model";
import { serializeEntities } from "./dxf-entities.converter";

export { addDxfInsert, to3DGroup };

function to3DGroup(context: DxfParserContext, insert: InsertEntity): Group {
  const group = context.groups.get(insert.blockName);
  if (undefined === group) throw new Error(`Can't find group ${insert.blockName}`);
  const newGroup = group.clone();
  newGroup.position.set(context.fixLength(insert.x), context.fixLength(insert.y), context.fixLength(insert.z));
  newGroup.scale.set(insert.xScale || 1, insert.yScale || 1, insert.zScale || 1);
  newGroup.rotation.z = (insert.rotation || 0) * Math.PI / 180;
  return newGroup;
}

function addDxfInsert(context: DxfWriterContext, group: Group) {
  if (group.children.length == 0) return;
  const subContext = context.createSubContext(group.name);
  serializeEntities(subContext, group.children);
  return context.writer.addInsert(group.name, group.position, { scaleFactor: group.scale, rotationAngle: group.rotation.z / Math.PI * 180 });
}