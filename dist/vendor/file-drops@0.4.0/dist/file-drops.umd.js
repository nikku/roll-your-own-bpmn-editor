(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = global || self, global.FileDrops = factory());
}(this, (function () { 'use strict';

  /**
   * Set attribute `name` to `val`, or get attr `name`.
   *
   * @param {Element} el
   * @param {String} name
   * @param {String} [val]
   * @api public
   */

  /**
   * Expose `parse`.
   */

  var domify = parse;

  /**
   * Tests for browser support.
   */

  var innerHTMLBug = false;
  var bugTestDiv;
  if (typeof document !== 'undefined') {
    bugTestDiv = document.createElement('div');
    // Setup
    bugTestDiv.innerHTML = '  <link/><table></table><a href="/a">a</a><input type="checkbox"/>';
    // Make sure that link elements get serialized correctly by innerHTML
    // This requires a wrapper element in IE
    innerHTMLBug = !bugTestDiv.getElementsByTagName('link').length;
    bugTestDiv = undefined;
  }

  /**
   * Wrap map from jquery.
   */

  var map = {
    legend: [1, '<fieldset>', '</fieldset>'],
    tr: [2, '<table><tbody>', '</tbody></table>'],
    col: [2, '<table><tbody></tbody><colgroup>', '</colgroup></table>'],
    // for script/link/style tags to work in IE6-8, you have to wrap
    // in a div with a non-whitespace character in front, ha!
    _default: innerHTMLBug ? [1, 'X<div>', '</div>'] : [0, '', '']
  };

  map.td =
  map.th = [3, '<table><tbody><tr>', '</tr></tbody></table>'];

  map.option =
  map.optgroup = [1, '<select multiple="multiple">', '</select>'];

  map.thead =
  map.tbody =
  map.colgroup =
  map.caption =
  map.tfoot = [1, '<table>', '</table>'];

  map.polyline =
  map.ellipse =
  map.polygon =
  map.circle =
  map.text =
  map.line =
  map.path =
  map.rect =
  map.g = [1, '<svg xmlns="http://www.w3.org/2000/svg" version="1.1">','</svg>'];

  /**
   * Parse `html` and return a DOM Node instance, which could be a TextNode,
   * HTML DOM Node of some kind (<div> for example), or a DocumentFragment
   * instance, depending on the contents of the `html` string.
   *
   * @param {String} html - HTML string to "domify"
   * @param {Document} doc - The `document` instance to create the Node for
   * @return {DOMNode} the TextNode, DOM Node, or DocumentFragment instance
   * @api private
   */

  function parse(html, doc) {
    if ('string' != typeof html) throw new TypeError('String expected');

    // default to the global `document` object
    if (!doc) doc = document;

    // tag name
    var m = /<([\w:]+)/.exec(html);
    if (!m) return doc.createTextNode(html);

    html = html.replace(/^\s+|\s+$/g, ''); // Remove leading/trailing whitespace

    var tag = m[1];

    // body support
    if (tag == 'body') {
      var el = doc.createElement('html');
      el.innerHTML = html;
      return el.removeChild(el.lastChild);
    }

    // wrap map
    var wrap = map[tag] || map._default;
    var depth = wrap[0];
    var prefix = wrap[1];
    var suffix = wrap[2];
    var el = doc.createElement('div');
    el.innerHTML = prefix + html + suffix;
    while (depth--) el = el.lastChild;

    // one element
    if (el.firstChild == el.lastChild) {
      return el.removeChild(el.firstChild);
    }

    // several elements
    var fragment = doc.createDocumentFragment();
    while (el.firstChild) {
      fragment.appendChild(el.removeChild(el.firstChild));
    }

    return fragment;
  }

  var OVERLAY_HTML = '<div class="drop-overlay">' +
                       '<div class="box">' +
                          '<div class="label">{label}</div>' +
                       '</div>' +
                     '</div>';

  /**
   * Add file drop functionality to the given element,
   * calling fn(files...) on drop.
   *
   * @example
   *
   * var node = document.querySelector('#container');
   *
   * var dropHandler = fileDrop(handleFiles);
   *
   * node.addEventListener('dragover', dropHandler);
   *
   * @param {String} [label='Drop files here']
   * @param {Function} fn
   *
   * @return {Function} drag start callback function
   */
  function fileDrop(label, fn) {

    if (typeof label === 'function') {
      fn = label;
      label = 'Drop files here';
    }

    var self;
    var extraArgs;

    // we are bound, if overlay exists
    var overlay;

    function onDrop(event) {

      event.preventDefault();

      asyncMap(event.dataTransfer.files, readFile, function(err, files) {

        if (err) {
          console.warn('file drop failed', err);
        } else {

          var args = extraArgs.concat([ files, event ]);

          // cleanup on drop
          // onEnd(event);

          // call provided fn with extraArgs..., files, event
          fn.apply(self, args);
        }
      });
    }

    function isDragAllowed(dataTransfer) {

      if (!dataTransfer || !dataTransfer.items.length) {
        return false;
      }

      var hasFile = false;

      for (var i = 0; i < dataTransfer.items.length; i++) {
        if (dataTransfer.items[i].type === 'file' || dataTransfer.items[i].kind === 'file') {
          hasFile = true;
        }
      }

      return hasFile;
    }

    function onDragover() {

      // (0) extract extra arguments (extraArgs..., event)
      var args = slice(arguments),
          event = args.pop();

      var dataTransfer = event.dataTransfer,
          target = event.currentTarget || event.target;

      if (!isDragAllowed(dataTransfer)) {
        return;
      }

      // make us a drop zone
      event.preventDefault();

      dataTransfer.dropEffect = 'copy';

      // only register if we do not drag and drop already
      if (overlay) {
        return;
      }

      overlay = createOverlay(label);

      target.appendChild(overlay);

      self = this;
      extraArgs = args;


      // do not register events during testing
      if (!target) {
        return;
      }


      // (2) setup drag listeners

      function onLeave(event) {

        var relatedTarget = event.relatedTarget;

        if (target.contains(relatedTarget)) {
          return;
        }

        onEnd();
      }

      // (2.1) detach on end
      function onEnd(event) {

        document.removeEventListener('drop', onDrop);
        document.removeEventListener('drop', onEnd);
        document.removeEventListener('dragleave', onLeave);
        document.removeEventListener('dragend', onEnd);
        document.removeEventListener('dragover', preventDrop);

        if (overlay) {
          target.removeChild(overlay);
          overlay = null;
        }
      }

      // (2.0) attach drag + cleanup event
      document.addEventListener('drop', onDrop);
      document.addEventListener('drop', onEnd);
      document.addEventListener('dragleave', onLeave);
      document.addEventListener('dragend', onEnd);
      document.addEventListener('dragover', preventDrop);
    }

    onDragover.onDrop = onDrop;

    return onDragover;
  }


  // helpers ////////////////////////////////////

  function readFile(dropFile, done) {

    if (!window.FileReader) {
      return done();
    }

    var reader = new FileReader();

    // Closure to capture the file information.
    reader.onload = function(e) {

      done(null, {
        name: dropFile.name,
        path: dropFile.path,
        contents: e.target.result
      });
    };

    reader.onerror = function(event) {
      done(event.target.error);
    };

    // Read in the image file as a data URL.
    reader.readAsText(dropFile);
  }


  function asyncMap(elements, iterator, done) {

    var idx = 0,
        results = [];

    function next() {

      if (idx === elements.length) {
        done(null, results);
      } else {

        iterator(elements[idx], function(err, result) {

          if (err) {
            return done(err);
          } else {
            results[idx] = result;
            idx++;

            next();
          }
        });
      }
    }

    next();
  }

  function slice(arr) {
    return Array.prototype.slice.call(arr);
  }

  function createOverlay(label) {
    var markup = OVERLAY_HTML.replace('{label}', label);

    return domify(markup);
  }

  function preventDrop(event) {
    event.preventDefault();
  }

  return fileDrop;

})));
//# sourceMappingURL=file-drops.umd.js.map
