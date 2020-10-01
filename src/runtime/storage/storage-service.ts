/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
import {Store} from './store.js';
import {CRDTTypeRecord} from '../../crdt/internal/crdt.js';
import {CRDTMuxEntity, ToStore, newStore} from './storage.js';
import {ProxyMessage} from './store-interface.js';
import {Type} from '../../types/lib-types.js';
import {noAwait} from '../../utils/lib-utils.js';
import {StoreInfo} from './store-info.js';
import {StorageKey} from './storage-key.js';

export type StorageServiceCallback = (data: {}) => void;

export interface StorageService {
  onRegister(store: Store<CRDTTypeRecord>,
    messagesCallback: StorageServiceCallback,
    idCallback: StorageServiceCallback);

  onDirectStoreMuxerRegister(store: Store<CRDTMuxEntity>,
    messagesCallback: StorageServiceCallback,
    idCallback: StorageServiceCallback);

  onProxyMessage(store: Store<CRDTTypeRecord>, message: ProxyMessage<CRDTTypeRecord>);
  onStorageProxyMuxerMessage(store: Store<CRDTMuxEntity>, message: ProxyMessage<CRDTMuxEntity>);

  getActiveStore<T extends Type>(storeInfo: StoreInfo<T>): ToStore<T>;
}

export class StorageServiceImpl implements StorageService {
  // All the stores, mapped by store ID
  private readonly storesByKey = new Map<StorageKey, Store<CRDTTypeRecord>>();

  async onRegister(store: Store<CRDTTypeRecord>, messagesCallback: StorageServiceCallback, idCallback: StorageServiceCallback) {
    // Need an ActiveStore here to listen to changes. Calling .activate() should
    // generally be a no-op.
    // TODO: add listener removal callback to storageListenerRemovalCallbacks
    //       for StorageNG if necessary.
    const id = (await store.activate()).on(async data => {
      messagesCallback(data);
    });
    idCallback(id);
  }

  async onDirectStoreMuxerRegister(store: Store<CRDTMuxEntity>,
    messagesCallback: StorageServiceCallback,
    idCallback: StorageServiceCallback) {
      const id = (await store.activate()).on(async data => {
        messagesCallback(data);
      });
      idCallback(id);
    }

  async onProxyMessage(store: Store<CRDTTypeRecord>, message: ProxyMessage<CRDTTypeRecord>) {
    // Need an ActiveStore here in order to forward messages. Calling
    // .activate() should generally be a no-op.
    noAwait((await store.activate()).onProxyMessage(message));
  }

  async onStorageProxyMuxerMessage(store: Store<CRDTMuxEntity>, message: ProxyMessage<CRDTMuxEntity>) {
    noAwait((await store.activate()).onProxyMessage(message));
  }

  getActiveStore<T extends Type>(storeInfo: StoreInfo<T>): ToStore<T> {
    if (!this.storesByKey.has(storeInfo.storageKey)) {
      this.storesByKey.set(storeInfo.storageKey, newStore(storeInfo));
    }
    return this.storesByKey.get(storeInfo.storageKey) as ToStore<T>;
  }
}