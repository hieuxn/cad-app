import { Observable, Subject } from 'rxjs';

interface CollectionChange<T> {
  change: 'add' | 'remove';
  changedItem: T;
}

export class ObservableSlim<T> {
  private _itemsSubject: Subject<CollectionChange<T>> = new Subject<CollectionChange<T>>();
  items$: Observable<CollectionChange<T>> = this._itemsSubject.asObservable();

  add(item: T): void {
    this._itemsSubject.next({ change: 'add', changedItem: item });
  }

  remove(item: T): void {
    this._itemsSubject.next({ change: 'remove', changedItem: item });
  }
}
