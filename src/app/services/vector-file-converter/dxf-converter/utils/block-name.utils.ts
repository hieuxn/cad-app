import { InsertEntity } from "@dxfjs/parser";

export { getLayerNameFromBlockName, getLayerNameFromInsert };


function getLayerNameFromInsert(insert: InsertEntity): string {
  return getLayerNameFromBlockName(insert.blockName) || insert.layerName || '0';
}

function getLayerNameFromBlockName(blockName: string): string {
  return blockName.split('-').at(-3)?.trim() || '0';
}