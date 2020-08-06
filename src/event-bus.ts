class EventEmitter {
  _listeners = {}
  on(type: string, fn: Function) {
    if (!this._listeners[type]) {
      this._listeners[type] = [];
    }
    this._listeners[type].push(fn);
  }

  emit(type: string, payload) {
    if(this._listeners[type]) {
      this._listeners[type].forEach(l => l(payload));
    }
  }
}

export const emitter = new EventEmitter();
