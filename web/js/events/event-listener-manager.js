const eventListenerManager = {
  listeners: [],

  add: function(element, eventType, handler, options) {
    element.addEventListener(eventType, handler, options);
    this.listeners.push({ element, eventType, handler });
    return handler;
  },

  remove: function(element, eventType, handler) {
    element.removeEventListener(eventType, handler);
    this.listeners = this.listeners.filter(listener =>
      !(listener.element === element &&
        listener.eventType === eventType &&
        listener.handler === handler)
    );
  },

  removeAll: function(element) {
    const listenersToRemove = this.listeners.filter(listener => listener.element === element);
    listenersToRemove.forEach(listener => {
      listener.element.removeEventListener(listener.eventType, listener.handler);
    });
    this.listeners = this.listeners.filter(listener => listener.element !== element);
  },

  removeAllListeners: function() {
    this.listeners.forEach(listener => {
      listener.element.removeEventListener(listener.eventType, listener.handler);
    });
    this.listeners = [];
  },

  removeByType: function(eventType) {
    const listenersToRemove = this.listeners.filter(listener => listener.eventType === eventType);
    listenersToRemove.forEach(listener => {
      listener.element.removeEventListener(listener.eventType, listener.handler);
    });
    this.listeners = this.listeners.filter(listener => listener.eventType !== eventType);
  }
};

export default eventListenerManager;
