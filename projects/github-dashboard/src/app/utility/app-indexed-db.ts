import {deleteDB, IDBPDatabase, IDBPObjectStore, openDB} from 'idb';
import {ReplaySubject, Subject} from 'rxjs';
import {DEMO_DASHBOARDS_ANGULAR} from '../repository/utility/demo-config/demo-dashboards-angular';
import {DEMO_DASHBOARDS_COMPONENTS} from '../repository/utility/demo-config/demo-dashboards-components';
import {DEMO_QUERIES_ANGULAR} from '../repository/utility/demo-config/demo-queries-angular';
import {DEMO_RECOMMENDATIONS_ANGULAR} from '../repository/utility/demo-config/demo-recommendations-angular';
import {DEMO_RECOMMENDATIONS_COMPONENTS} from '../repository/utility/demo-config/demo-recommendations-components';

const DB_VERSION = 1;

// TODO: Use enum
export type StoreId = 'items'|'labels'|'contributors'|'dashboards'|'queries'|'recommendations';

export const STORE_IDS: StoreId[] =
    ['items', 'labels', 'contributors', 'dashboards', 'queries', 'recommendations'];

export class AppIndexedDb {
  initialValues: {[key in StoreId]?: Subject<any[]>} = {};

  name: string;

  private db: Promise<IDBPDatabase>;

  private destroyed = new Subject();

  constructor(name: string) {
    STORE_IDS.forEach(id => this.initialValues[id] = new ReplaySubject<any[]>(1));
    this.name = name;
    this.openDb();
  }

  close() {
    return this.db.then(db => db.close());
  }

  ngOnDestroy() {
    this.destroyed.next();
    this.destroyed.complete();
  }

  removeData() {
    this.db
        .then(db => {
          db.close();
          return deleteDB(this.name);
        })
        .then(() => this.openDb());
  }

  updateValues(values: any[], collectionId: string) {
    return this.db.then(db => {
      const transaction = db.transaction(collectionId, 'readwrite');
      const store = transaction.objectStore(collectionId);
      values.forEach(v => store.put(v));
      return transaction.oncomplete;
    });
  }

  removeValues(ids: string[], collectionId: string) {
    return this.db.then(db => {
      const transaction = db.transaction(collectionId, 'readwrite');
      const store = transaction.objectStore(collectionId);
      ids.forEach(id => store.delete(id));
      return transaction.oncomplete;
    });
  }

  removeAllValues(collectionId: string) {
    return this.db.then(db => {
      const transaction = db.transaction(collectionId, 'readwrite');
      const store = transaction.objectStore(collectionId);
      return store.clear();
    });
  }

  private openDb() {
    this.db = openDB(this.name, DB_VERSION, {
      upgrade: db => {
        STORE_IDS.forEach(collectionId => {
          if (!db.objectStoreNames.contains(collectionId)) {
            const objectStore = db.createObjectStore(collectionId, {keyPath: 'id'});

            if (this.name === 'angular/components') {
              initializeDemoConfigComponents(collectionId, objectStore);
            }
            if (this.name === 'angular/angular') {
              initializeDemoConfigAngular(collectionId, objectStore);
            }
          }
        });
      },
    });

    this.db.then(() => this.initializeAllValues());
  }

  private initializeAllValues() {
    STORE_IDS.forEach(id => {
      this.db.then(db => db.transaction(id, 'readonly').objectStore(id).getAll()).then(result => {
        const initialValues = this.initialValues[id];
        if (!initialValues) {
          throw Error('Object store not initialized :' + id);
        }
        initialValues.next(result);
      });
    });
  }
}

function initializeDemoConfigComponents(collectionId: string, objectStore: IDBPObjectStore<any, any, any>) {
  switch (collectionId) {
    case 'dashboards':
      DEMO_DASHBOARDS_COMPONENTS.forEach(d => objectStore.add(d));
      break;
    case 'queries':
      // TODO: Add some demo queries
      break;
    case 'recommendations':
      DEMO_RECOMMENDATIONS_COMPONENTS.forEach(d => objectStore.add(d));
      break;

  }
}

function initializeDemoConfigAngular(collectionId: string, objectStore: IDBPObjectStore<any, any, any>) {
  switch (collectionId) {
    case 'dashboards':
      DEMO_DASHBOARDS_ANGULAR.forEach(d => objectStore.add(d));
      break;
    case 'queries':
      DEMO_QUERIES_ANGULAR.forEach(d => objectStore.add(d));
      break;
    case 'recommendations':
      DEMO_RECOMMENDATIONS_ANGULAR.forEach(d => objectStore.add(d));
      break;

  }
}
