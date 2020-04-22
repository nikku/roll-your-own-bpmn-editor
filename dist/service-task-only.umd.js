(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = global || self, global.BpmnJSServiceTaskOnly = factory());
}(this, (function () { 'use strict';

  /**
   * Flatten array, one level deep.
   *
   * @param {Array<?>} arr
   *
   * @return {Array<?>}
   */

  function _extends() {
    _extends = Object.assign || function (target) {
      for (var i = 1; i < arguments.length; i++) {
        var source = arguments[i];

        for (var key in source) {
          if (Object.prototype.hasOwnProperty.call(source, key)) {
            target[key] = source[key];
          }
        }
      }

      return target;
    };

    return _extends.apply(this, arguments);
  }

  /**
   * Convenience wrapper for `Object.assign`.
   *
   * @param {Object} target
   * @param {...Object} others
   *
   * @return {Object} the target
   */

  function assign(target) {
    for (var _len = arguments.length, others = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      others[_key - 1] = arguments[_key];
    }

    return _extends.apply(void 0, [target].concat(others));
  }

  /**
   * A service-task-only palette provider for BPMN 2.0 elements.
   */
  function StoPaletteProvider(
      palette, elementFactory,
      create, translate
  ) {

    // register provider
    palette.registerProvider(700, this);

    // provider implementation

    function createAction(type, group, className, title, options) {

      function createListener(event) {
        var shape = elementFactory.createShape(assign({ type: type }, options));

        create.start(event, shape);
      }

      var shortType = type.replace(/^bpmn:/, '');

      return {
        group: group,
        className: className,
        title: title || translate('Create {type}', { type: shortType }),
        action: {
          dragstart: createListener,
          click: createListener
        }
      };
    }

    var customEntries = {
      'create.service-task': createAction(
        'bpmn:ServiceTask', 'activity', 'bpmn-icon-service-task',
        translate('Create ServiceTask')
      )
    };

    var entryToRemoveMap = {
      'create.task': null
    };

    this.getPaletteEntries = function(element) {

      return function(entries) {

        var filteredEntries = Object.keys(entries).reduce(function(newEntries, key) {

          var entry = entries[key];

          if (key in entryToRemoveMap) {
            entry = null;
          }

          if (entry) {
            newEntries[key] = entry;
          }

          return newEntries;
        }, {});

        // filter + add own entry
        return assign({}, filteredEntries, customEntries);
      };
    };

  }

  StoPaletteProvider.$inject = [
    'palette',
    'elementFactory',
    'create',
    'translate'
  ];

  /**
   * A service-task-only palette provider for BPMN 2.0 elements.
   */
  function StoContextPadProvider(
      injector, contextPad,
      elementFactory, create,
      translate) {

    // autoPlace is optional
    var autoPlace = injector.get('autoPlace', false);

    // register provider
    contextPad.registerProvider(700, this);

    // provider implementation

    function appendAction(type, className, title, options) {

      if (typeof title !== 'string') {
        options = title;
        title = translate('Append {type}', { type: type.replace(/^bpmn:/, '') });
      }

      function appendStart(event, element) {

        var shape = elementFactory.createShape(assign({ type: type }, options));
        create.start(event, shape, {
          source: element
        });
      }


      var append = autoPlace ? function(event, element) {
        var shape = elementFactory.createShape(assign({ type: type }, options));

        autoPlace.append(element, shape);
      } : appendStart;


      return {
        group: 'model',
        className: className,
        title: title,
        action: {
          dragstart: appendStart,
          click: append
        }
      };
    }

    var customEntries = {
      'append.service-task': appendAction(
        'bpmn:ServiceTask',
        'bpmn-icon-service-task',
        translate('Append ServiceTask')
      )
    };

    var entryToRemoveMap = {
      'append.append-task': null
    };

    this.getContextPadEntries = function(element) {


      return function(entries) {

        var filteredEntries = Object.keys(entries).reduce(function(newEntries, key) {

          var entry = entries[key];

          if (key in entryToRemoveMap) {
            entry = null;
          }

          if (entry) {
            newEntries[key] = entry;
          }

          return newEntries;
        }, {});

        // filter + add own entry
        return assign({}, filteredEntries, customEntries);
      };

    };
  }

  StoContextPadProvider.$inject = [
    'injector',
    'contextPad',
    'elementFactory',
    'create',
    'translate'
  ];

  /**
   * A service-task-only replace menu provider.
   *
   * @param {PopupMenu} popupMenu
   */
  function StoReplaceMenuProvider(popupMenu) {
    popupMenu.registerProvider('bpmn-replace', 700, this);
  }

  StoReplaceMenuProvider.$inject = [ 'popupMenu' ];

  StoReplaceMenuProvider.prototype.getPopupMenuEntries = function(element) {

    const entryToRemoveMap = {
      'replace-with-task': null,
      'replace-with-send-task': null,
      'replace-with-receive-task': null,
      'replace-with-user-task': null,
      'replace-with-manual-task': null,
      'replace-with-rule-task': null,
      'replace-with-script-task': null,
      'replace-with-rule-task': null
    };

    return function(entries) {

      return Object.keys(entries).reduce(function(newEntries, key) {

        var entry = entries[key];

        if (key in entryToRemoveMap) {
          entry = null;
        }

        if (entry) {
          newEntries[key] = entry;
        }

        return newEntries;
      }, {});
    };

  };

  var index = {
    __init__: [
      'stoPaletteProvider',
      'stoContextPadProvider',
      'stoReplaceMenuProvider'
    ],
    stoPaletteProvider: [ 'type', StoPaletteProvider ],
    stoContextPadProvider: [ 'type', StoContextPadProvider ],
    stoReplaceMenuProvider: [ 'type', StoReplaceMenuProvider ]
  };

  return index;

})));
