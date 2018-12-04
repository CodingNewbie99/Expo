import { Platform } from 'react-native';
/*
 * Importing this directly will circumvent the webpack alias `react-native$`
 * This will enable us to use NativeEventEmitter from React Native and not from RNWeb.
 */
import NativeEventEmitter from 'react-native/Libraries/EventEmitter/NativeEventEmitter';
export default class EventEmitter {
    constructor(nativeModule) {
        this._listenersCount = 0;
        this._nativeModule = nativeModule;
        this._eventEmitter = new NativeEventEmitter(nativeModule);
    }
    addListener(eventName, listener) {
        this._listenersCount += 1;
        if (Platform.OS === 'android' && this._nativeModule.startObserving) {
            if (this._listenersCount === 1) {
                // We're not awaiting start of updates
                // they should start shortly.
                this._nativeModule.startObserving();
            }
        }
        return this._eventEmitter.addListener(eventName, listener);
    }
    removeAllListeners(eventName) {
        const listenersToRemoveCount = this._eventEmitter.listeners(eventName).length;
        const newListenersCount = Math.max(0, this._listenersCount - listenersToRemoveCount);
        if (Platform.OS === 'android' && this._nativeModule.stopObserving && newListenersCount === 0) {
            this._nativeModule.stopObserving();
        }
        this._eventEmitter.removeAllListeners(eventName);
        this._listenersCount = newListenersCount;
    }
    removeSubscription(subscription) {
        this._listenersCount -= 1;
        if (Platform.OS === 'android' && this._nativeModule.stopObserving) {
            if (this._listenersCount === 0) {
                this._nativeModule.stopObserving();
            }
        }
        this._eventEmitter.removeSubscription(subscription);
    }
    emit(eventType, ...params) {
        this._eventEmitter.emit(eventType, ...params);
    }
}
//# sourceMappingURL=EventEmitter.js.map