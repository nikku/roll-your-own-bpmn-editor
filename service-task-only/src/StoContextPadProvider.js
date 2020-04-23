import {
  assign
} from 'min-dash';

/**
 * A service-task-only palette provider for BPMN 2.0 elements.
 */
export default function StoContextPadProvider(
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

      // replace the task contextPad entry with a service task one
      if (!('append.append-task' in entries)) {
        return entries;
      }

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