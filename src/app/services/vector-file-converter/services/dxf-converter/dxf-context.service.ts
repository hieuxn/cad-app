import { Injectable, Injector } from "@angular/core";
import { DXFContext } from "../../models/dxf-converter/dxf-context.model";

@Injectable({ providedIn: 'root' })
export class DXFContextService {

  private context!: DXFContext | null;
  constructor(private injector: Injector) { }

  public createNewContext() {
    this.context = new DXFContext(this.injector);
  }

  public getCurrentContext(): DXFContext {
    if (null === this.context) throw new Error('DXF context is not created');
    return this.context;
  }
}