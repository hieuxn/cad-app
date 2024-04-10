import { NestedTreeControl } from '@angular/cdk/tree';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTreeModule, MatTreeNestedDataSource } from '@angular/material/tree';

export interface Node {
  name: string;
  children?: Node[];
}

@Component({
  selector: 'app-tree',
  standalone: true,
  imports: [MatTreeModule, MatButtonModule, MatIconModule],
  templateUrl: './tree.component.html',
  styleUrl: './tree.component.scss'
})
export class Tree {
  @Input() set data(data: Node[]) {
    this.dataSource.data = data;
  }

  @Output() nodeClick: EventEmitter<Node> = new EventEmitter<Node>();

  treeControl = new NestedTreeControl<Node>(node => node.children);
  dataSource = new MatTreeNestedDataSource<Node>();

  init(data: Node[]) {
    this.dataSource.data = data;
  }

  hasChild = (_: number, node: Node) => !!node.children && node.children.length > 0;

  onLeafNodeClick(node: Node) {
    this.nodeClick.emit(node);
  }
}


