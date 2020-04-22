import {
  assign
} from 'min-dash';

/**
 * A service-task-only palette provider for BPMN 2.0 elements.
 */
export default function StoPaletteProvider(
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