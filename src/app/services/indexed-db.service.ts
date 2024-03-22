import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class IndexedDbService {
  private _worker: Worker;

  constructor() {
    this._worker = new Worker(new URL('../workers/indexed-db.worker', import.meta.url), { type: 'module' });
  }

  saveData(id: string, content: any): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this._worker.onmessage = ({ data }) => {
        resolve(data);
      };
      this._worker.postMessage({ type: 'put', id, content: content });
    });
  }

  getData(id: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this._worker.onmessage = ({ data }) => {
        resolve(data ? data.content : null);
      };
      this._worker.postMessage({ type: 'get', id });
    });
  }
}
