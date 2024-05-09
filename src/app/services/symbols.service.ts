import { Injectable } from "@angular/core";
import { UserData, defaultUserData } from "../utils/three-object-creation/creators/polyline.creator";
import { IndexedDbService } from "./indexed-db.service";

@Injectable({ providedIn: 'root' })
export class SymbolDefinitionService {
  public symbols: UserData[] = [defaultUserData]
  private _dataId: string = 'symbols';
  constructor(private _dbService: IndexedDbService) {
  }

  public async loadData() {
    this.symbols = await this._dbService.getData(this._dataId)
  }

  public clearData() {
    this._dbService.saveData(this._dataId, []);
  }

  public getUniqueName(obj: UserData): string {
    return `${obj.familyCategory} - ${obj.familyName} - ${obj.familySymbolName}`;
  }

  public findByName(uniqueName: string): UserData | undefined {
    const data = this.symbols.find(s => this.getUniqueName(s) === uniqueName);
    return data;
  }

  public async saveData() {
    await this._dbService.saveData(this._dataId, this.symbols);
  }
}