export class Layer {
	public id: number;
	public name: string;
	public visible: boolean;
	public constructor(id: number, name: string, visible: boolean = true) {
		this.id = id;
		this.name = name;
		this.visible = visible;
	}
}