import { Observable, Subject } from 'rxjs';

interface CollectionChange<T> {
  change: 'add' | 'remove';
  changedItem: T;
  disposeAction?: Function
}

export class ObservableSlim<T> {
  private _itemsSubject: Subject<CollectionChange<T>> = new Subject<CollectionChange<T>>();
  items$: Observable<CollectionChange<T>> = this._itemsSubject.asObservable();

  add(item: T): CollectionChange<T> {
    const param: CollectionChange<T> = { change: 'add', changedItem: item };
    this._itemsSubject.next(param);
    return param;
  }

  remove(item: T): CollectionChange<T> {
    const param: CollectionChange<T> = { change: 'remove', changedItem: item };
    this._itemsSubject.next(param);
    return param;
  }
}
