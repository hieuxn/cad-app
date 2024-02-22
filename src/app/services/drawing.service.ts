import { Injectable } from '@angular/core';
import * as THREE from 'three';
import { ThreeDService } from './three-d.service';

@Injectable({ providedIn: 'root' })
export class DrawingService {
	private points: THREE.Vector3[] = [];
	private lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });

	public constructor(private threeDService: ThreeDService) { }

	public startDrawing(): void {
		this.points = []; // Reset points for a new drawing
	}

	public addPoint(x: number, y: number): void {
		// Convert screen coordinates to world coordinates
		const vector = new THREE.Vector3(x, y, 0).unproject(this.threeDService.camera);
		this.points.push(vector);

		if (this.points.length > 1) {
			this.draw();
		}
	}

	private draw(): void {
		// Remove the last drawn line if it exists
		if (this.threeDService.scene.children.length > 2) {
			const lastIndex = this.threeDService.scene.children.length - 1;
			this.threeDService.scene.remove(this.threeDService.scene.children[lastIndex]);
		}

		const geometry = new THREE.BufferGeometry().setFromPoints(this.points);
		const line = new THREE.Line(geometry, this.lineMaterial);
		this.threeDService.scene.add(line);
	}
}
