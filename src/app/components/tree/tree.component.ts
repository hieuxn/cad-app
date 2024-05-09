import { NestedTreeControl } from '@angular/cdk/tree';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTreeModule, MatTreeNestedDataSource } from '@angular/material/tree';

export interface TreeNode {
  name: string;
  children?: TreeNode[];
  data?: any;
  iconClass?: string,
  iconSrc?: string,
}

@Component({
  selector: 'app-tree',
  standalone: true,
  imports: [MatTreeModule, MatButtonModule, MatIconModule],
  templateUrl: './tree.component.html',
  styleUrl: './tree.component.scss'
})
export class Tree {
  constructor() {

  }
  @Input() set data(data: TreeNode[]) {
    this.dataSource.data = data;
  }

  @Output() nodeClick: EventEmitter<TreeNode> = new EventEmitter<TreeNode>();

  treeControl = new NestedTreeControl<TreeNode>(node => node.children);
  dataSource = new MatTreeNestedDataSource<TreeNode>();

  init(data: TreeNode[]) {
    this.dataSource.data = data;
  }

  hasChild = (_: number, node: TreeNode) => !!node.children && node.children.length > 0;

  onLeafNodeClick(node: TreeNode) {
    this.nodeClick.emit(node);
  }
}


