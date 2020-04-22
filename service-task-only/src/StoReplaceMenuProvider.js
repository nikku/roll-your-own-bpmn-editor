import {
  assign
} from 'min-dash';


/**
 * A service-task-only replace menu provider.
 *
 * @param {PopupMenu} popupMenu
 */
export default function StoReplaceMenuProvider(popupMenu) {
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