(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = global || self, global.DiagramJSMinimap = factory());
}(this, function () { 'use strict';

  /**
   * Set attribute `name` to `val`, or get attr `name`.
   *
   * @param {Element} el
   * @param {String} name
   * @param {String} [val]
   * @api public
   */
  function attr(el, name, val) {
    // get
    if (arguments.length == 2) {
      return el.getAttribute(name);
    }

    // remove
    if (val === null) {
      return el.removeAttribute(name);
    }

    // set
    el.setAttribute(name, val);

    return el;
  }

  var indexOf = [].indexOf;

  var indexof = function(arr, obj){
    if (indexOf) return arr.indexOf(obj);
    for (var i = 0; i < arr.length; ++i) {
      if (arr[i] === obj) return i;
    }
    return -1;
  };

  /**
   * Taken from https://github.com/component/classes
   *
   * Without the component bits.
   */

  /**
   * Whitespace regexp.
   */

  var re = /\s+/;

  /**
   * toString reference.
   */

  var toString = Object.prototype.toString;

  /**
   * Wrap `el` in a `ClassList`.
   *
   * @param {Element} el
   * @return {ClassList}
   * @api public
   */

  function classes(el) {
    return new ClassList(el);
  }

  /**
   * Initialize a new ClassList for `el`.
   *
   * @param {Element} el
   * @api private
   */

  function ClassList(el) {
    if (!el || !el.nodeType) {
      throw new Error('A DOM element reference is required');
    }
    this.el = el;
    this.list = el.classList;
  }

  /**
   * Add class `name` if not already present.
   *
   * @param {String} name
   * @return {ClassList}
   * @api public
   */

  ClassList.prototype.add = function (name) {
    // classList
    if (this.list) {
      this.list.add(name);
      return this;
    }

    // fallback
    var arr = this.array();
    var i = indexof(arr, name);
    if (!~i) arr.push(name);
    this.el.className = arr.join(' ');
    return this;
  };

  /**
   * Remove class `name` when present, or
   * pass a regular expression to remove
   * any which match.
   *
   * @param {String|RegExp} name
   * @return {ClassList}
   * @api public
   */

  ClassList.prototype.remove = function (name) {
    if ('[object RegExp]' == toString.call(name)) {
      return this.removeMatching(name);
    }

    // classList
    if (this.list) {
      this.list.remove(name);
      return this;
    }

    // fallback
    var arr = this.array();
    var i = indexof(arr, name);
    if (~i) arr.splice(i, 1);
    this.el.className = arr.join(' ');
    return this;
  };

  /**
   * Remove all classes matching `re`.
   *
   * @param {RegExp} re
   * @return {ClassList}
   * @api private
   */

  ClassList.prototype.removeMatching = function (re) {
    var arr = this.array();
    for (var i = 0; i < arr.length; i++) {
      if (re.test(arr[i])) {
        this.remove(arr[i]);
      }
    }
    return this;
  };

  /**
   * Toggle class `name`, can force state via `force`.
   *
   * For browsers that support classList, but do not support `force` yet,
   * the mistake will be detected and corrected.
   *
   * @param {String} name
   * @param {Boolean} force
   * @return {ClassList}
   * @api public
   */

  ClassList.prototype.toggle = function (name, force) {
    // classList
    if (this.list) {
      if ('undefined' !== typeof force) {
        if (force !== this.list.toggle(name, force)) {
          this.list.toggle(name); // toggle again to correct
        }
      } else {
        this.list.toggle(name);
      }
      return this;
    }

    // fallback
    if ('undefined' !== typeof force) {
      if (!force) {
        this.remove(name);
      } else {
        this.add(name);
      }
    } else {
      if (this.has(name)) {
        this.remove(name);
      } else {
        this.add(name);
      }
    }

    return this;
  };

  /**
   * Return an array of classes.
   *
   * @return {Array}
   * @api public
   */

  ClassList.prototype.array = function () {
    var className = this.el.getAttribute('class') || '';
    var str = className.replace(/^\s+|\s+$/g, '');
    var arr = str.split(re);
    if ('' === arr[0]) arr.shift();
    return arr;
  };

  /**
   * Check if class `name` is present.
   *
   * @param {String} name
   * @return {ClassList}
   * @api public
   */

  ClassList.prototype.has = ClassList.prototype.contains = function (name) {
    return this.list ? this.list.contains(name) : !!~indexof(this.array(), name);
  };

  var bind = window.addEventListener ? 'addEventListener' : 'attachEvent',
      unbind = window.removeEventListener ? 'removeEventListener' : 'detachEvent',
      prefix = bind !== 'addEventListener' ? 'on' : '';

  /**
   * Bind `el` event `type` to `fn`.
   *
   * @param {Element} el
   * @param {String} type
   * @param {Function} fn
   * @param {Boolean} capture
   * @return {Function}
   * @api public
   */

  var bind_1 = function(el, type, fn, capture){
    el[bind](prefix + type, fn, capture || false);
    return fn;
  };

  /**
   * Unbind `el` event `type`'s callback `fn`.
   *
   * @param {Element} el
   * @param {String} type
   * @param {Function} fn
   * @param {Boolean} capture
   * @return {Function}
   * @api public
   */

  var unbind_1 = function(el, type, fn, capture){
    el[unbind](prefix + type, fn, capture || false);
    return fn;
  };

  var componentEvent = {
  	bind: bind_1,
  	unbind: unbind_1
  };

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

  function query(selector, el) {
    el = el || document;

    return el.querySelector(selector);
  }

  function ensureImported(element, target) {

    if (element.ownerDocument !== target.ownerDocument) {
      try {
        // may fail on webkit
        return target.ownerDocument.importNode(element, true);
      } catch (e) {
        // ignore
      }
    }

    return element;
  }

  /**
   * appendTo utility
   */

  /**
   * Append a node to a target element and return the appended node.
   *
   * @param  {SVGElement} element
   * @param  {SVGElement} target
   *
   * @return {SVGElement} the appended node
   */
  function appendTo(element, target) {
    return target.appendChild(ensureImported(element, target));
  }

  /**
   * append utility
   */

  /**
   * Append a node to an element
   *
   * @param  {SVGElement} element
   * @param  {SVGElement} node
   *
   * @return {SVGElement} the element
   */
  function append(target, node) {
    appendTo(node, target);
    return target;
  }

  /**
   * attribute accessor utility
   */

  var LENGTH_ATTR = 2;

  var CSS_PROPERTIES = {
    'alignment-baseline': 1,
    'baseline-shift': 1,
    'clip': 1,
    'clip-path': 1,
    'clip-rule': 1,
    'color': 1,
    'color-interpolation': 1,
    'color-interpolation-filters': 1,
    'color-profile': 1,
    'color-rendering': 1,
    'cursor': 1,
    'direction': 1,
    'display': 1,
    'dominant-baseline': 1,
    'enable-background': 1,
    'fill': 1,
    'fill-opacity': 1,
    'fill-rule': 1,
    'filter': 1,
    'flood-color': 1,
    'flood-opacity': 1,
    'font': 1,
    'font-family': 1,
    'font-size': LENGTH_ATTR,
    'font-size-adjust': 1,
    'font-stretch': 1,
    'font-style': 1,
    'font-variant': 1,
    'font-weight': 1,
    'glyph-orientation-horizontal': 1,
    'glyph-orientation-vertical': 1,
    'image-rendering': 1,
    'kerning': 1,
    'letter-spacing': 1,
    'lighting-color': 1,
    'marker': 1,
    'marker-end': 1,
    'marker-mid': 1,
    'marker-start': 1,
    'mask': 1,
    'opacity': 1,
    'overflow': 1,
    'pointer-events': 1,
    'shape-rendering': 1,
    'stop-color': 1,
    'stop-opacity': 1,
    'stroke': 1,
    'stroke-dasharray': 1,
    'stroke-dashoffset': 1,
    'stroke-linecap': 1,
    'stroke-linejoin': 1,
    'stroke-miterlimit': 1,
    'stroke-opacity': 1,
    'stroke-width': LENGTH_ATTR,
    'text-anchor': 1,
    'text-decoration': 1,
    'text-rendering': 1,
    'unicode-bidi': 1,
    'visibility': 1,
    'word-spacing': 1,
    'writing-mode': 1
  };


  function getAttribute(node, name) {
    if (CSS_PROPERTIES[name]) {
      return node.style[name];
    } else {
      return node.getAttributeNS(null, name);
    }
  }

  function setAttribute(node, name, value) {
    var hyphenated = name.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();

    var type = CSS_PROPERTIES[hyphenated];

    if (type) {
      // append pixel unit, unless present
      if (type === LENGTH_ATTR && typeof value === 'number') {
        value = String(value) + 'px';
      }

      node.style[hyphenated] = value;
    } else {
      node.setAttributeNS(null, name, value);
    }
  }

  function setAttributes(node, attrs) {

    var names = Object.keys(attrs), i, name;

    for (i = 0, name; (name = names[i]); i++) {
      setAttribute(node, name, attrs[name]);
    }
  }

  /**
   * Gets or sets raw attributes on a node.
   *
   * @param  {SVGElement} node
   * @param  {Object} [attrs]
   * @param  {String} [name]
   * @param  {String} [value]
   *
   * @return {String}
   */
  function attr$1(node, name, value) {
    if (typeof name === 'string') {
      if (value !== undefined) {
        setAttribute(node, name, value);
      } else {
        return getAttribute(node, name);
      }
    } else {
      setAttributes(node, name);
    }

    return node;
  }

  /**
   * Clear utility
   */
  function index(arr, obj) {
    if (arr.indexOf) {
      return arr.indexOf(obj);
    }


    for (var i = 0; i < arr.length; ++i) {
      if (arr[i] === obj) {
        return i;
      }
    }

    return -1;
  }

  var re$1 = /\s+/;

  var toString$1 = Object.prototype.toString;

  function defined(o) {
    return typeof o !== 'undefined';
  }

  /**
   * Wrap `el` in a `ClassList`.
   *
   * @param {Element} el
   * @return {ClassList}
   * @api public
   */

  function classes$1(el) {
    return new ClassList$1(el);
  }

  function ClassList$1(el) {
    if (!el || !el.nodeType) {
      throw new Error('A DOM element reference is required');
    }
    this.el = el;
    this.list = el.classList;
  }

  /**
   * Add class `name` if not already present.
   *
   * @param {String} name
   * @return {ClassList}
   * @api public
   */

  ClassList$1.prototype.add = function(name) {

    // classList
    if (this.list) {
      this.list.add(name);
      return this;
    }

    // fallback
    var arr = this.array();
    var i = index(arr, name);
    if (!~i) {
      arr.push(name);
    }

    if (defined(this.el.className.baseVal)) {
      this.el.className.baseVal = arr.join(' ');
    } else {
      this.el.className = arr.join(' ');
    }

    return this;
  };

  /**
   * Remove class `name` when present, or
   * pass a regular expression to remove
   * any which match.
   *
   * @param {String|RegExp} name
   * @return {ClassList}
   * @api public
   */

  ClassList$1.prototype.remove = function(name) {
    if ('[object RegExp]' === toString$1.call(name)) {
      return this.removeMatching(name);
    }

    // classList
    if (this.list) {
      this.list.remove(name);
      return this;
    }

    // fallback
    var arr = this.array();
    var i = index(arr, name);
    if (~i) {
      arr.splice(i, 1);
    }
    this.el.className.baseVal = arr.join(' ');
    return this;
  };

  /**
   * Remove all classes matching `re`.
   *
   * @param {RegExp} re
   * @return {ClassList}
   * @api private
   */

  ClassList$1.prototype.removeMatching = function(re) {
    var arr = this.array();
    for (var i = 0; i < arr.length; i++) {
      if (re.test(arr[i])) {
        this.remove(arr[i]);
      }
    }
    return this;
  };

  /**
   * Toggle class `name`, can force state via `force`.
   *
   * For browsers that support classList, but do not support `force` yet,
   * the mistake will be detected and corrected.
   *
   * @param {String} name
   * @param {Boolean} force
   * @return {ClassList}
   * @api public
   */

  ClassList$1.prototype.toggle = function(name, force) {
    // classList
    if (this.list) {
      if (defined(force)) {
        if (force !== this.list.toggle(name, force)) {
          this.list.toggle(name); // toggle again to correct
        }
      } else {
        this.list.toggle(name);
      }
      return this;
    }

    // fallback
    if (defined(force)) {
      if (!force) {
        this.remove(name);
      } else {
        this.add(name);
      }
    } else {
      if (this.has(name)) {
        this.remove(name);
      } else {
        this.add(name);
      }
    }

    return this;
  };

  /**
   * Return an array of classes.
   *
   * @return {Array}
   * @api public
   */

  ClassList$1.prototype.array = function() {
    var className = this.el.getAttribute('class') || '';
    var str = className.replace(/^\s+|\s+$/g, '');
    var arr = str.split(re$1);
    if ('' === arr[0]) {
      arr.shift();
    }
    return arr;
  };

  /**
   * Check if class `name` is present.
   *
   * @param {String} name
   * @return {ClassList}
   * @api public
   */

  ClassList$1.prototype.has =
  ClassList$1.prototype.contains = function(name) {
    return (
      this.list ?
        this.list.contains(name) :
        !! ~index(this.array(), name)
    );
  };

  function remove(element) {
    var parent = element.parentNode;

    if (parent) {
      parent.removeChild(element);
    }

    return element;
  }

  function clone(element) {
    return element.cloneNode(true);
  }

  var ns = {
    svg: 'http://www.w3.org/2000/svg'
  };

  /**
   * DOM parsing utility
   */

  var SVG_START = '<svg xmlns="' + ns.svg + '"';

  function parse(svg) {

    var unwrap = false;

    // ensure we import a valid svg document
    if (svg.substring(0, 4) === '<svg') {
      if (svg.indexOf(ns.svg) === -1) {
        svg = SVG_START + svg.substring(4);
      }
    } else {
      // namespace svg
      svg = SVG_START + '>' + svg + '</svg>';
      unwrap = true;
    }

    var parsed = parseDocument(svg);

    if (!unwrap) {
      return parsed;
    }

    var fragment = document.createDocumentFragment();

    var parent = parsed.firstChild;

    while (parent.firstChild) {
      fragment.appendChild(parent.firstChild);
    }

    return fragment;
  }

  function parseDocument(svg) {

    var parser;

    // parse
    parser = new DOMParser();
    parser.async = false;

    return parser.parseFromString(svg, 'text/xml');
  }

  /**
   * Create utility for SVG elements
   */


  /**
   * Create a specific type from name or SVG markup.
   *
   * @param {String} name the name or markup of the element
   * @param {Object} [attrs] attributes to set on the element
   *
   * @returns {SVGElement}
   */
  function create(name, attrs) {
    var element;

    if (name.charAt(0) === '<') {
      element = parse(name).firstChild;
      element = document.importNode(element, true);
    } else {
      element = document.createElementNS(ns.svg, name);
    }

    if (attrs) {
      attr$1(element, attrs);
    }

    return element;
  }

  /**
   * Geometry helpers
   */

  // fake node used to instantiate svg geometry elements
  var node = create('svg');

  /**
   * Flatten array, one level deep.
   *
   * @param {Array<?>} arr
   *
   * @return {Array<?>}
   */

  var nativeToString = Object.prototype.toString;
  var nativeHasOwnProperty = Object.prototype.hasOwnProperty;
  function isUndefined(obj) {
    return obj === undefined;
  }
  function isArray(obj) {
    return nativeToString.call(obj) === '[object Array]';
  }
  function isObject(obj) {
    return nativeToString.call(obj) === '[object Object]';
  }
  function isNumber(obj) {
    return nativeToString.call(obj) === '[object Number]';
  }
  /**
   * Return true, if target owns a property with the given key.
   *
   * @param {Object} target
   * @param {String} key
   *
   * @return {Boolean}
   */

  function has(target, key) {
    return nativeHasOwnProperty.call(target, key);
  }
  /**
   * Iterate over collection; returning something
   * (non-undefined) will stop iteration.
   *
   * @param  {Array|Object} collection
   * @param  {Function} iterator
   *
   * @return {Object} return result that stopped the iteration
   */

  function forEach(collection, iterator) {
    var val, result;

    if (isUndefined(collection)) {
      return;
    }

    var convertKey = isArray(collection) ? toNum : identity;

    for (var key in collection) {
      if (has(collection, key)) {
        val = collection[key];
        result = iterator(val, convertKey(key));

        if (result === false) {
          return val;
        }
      }
    }
  }
  /**
   * Reduce collection, returning a single result.
   *
   * @param  {Object|Array} collection
   * @param  {Function} iterator
   * @param  {Any} result
   *
   * @return {Any} result returned from last iterator
   */

  function reduce(collection, iterator, result) {
    forEach(collection, function (value, idx) {
      result = iterator(result, value, idx);
    });
    return result;
  }
  /**
   * Return true if every element in the collection
   * matches the criteria.
   *
   * @param  {Object|Array} collection
   * @param  {Function} matcher
   *
   * @return {Boolean}
   */

  function every(collection, matcher) {
    return !!reduce(collection, function (matches, val, key) {
      return matches && matcher(val, key);
    }, true);
  }

  function identity(arg) {
    return arg;
  }

  function toNum(arg) {
    return Number(arg);
  }

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

  var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

  function createCommonjsModule(fn, module) {
  	return module = { exports: {} }, fn(module, module.exports), module.exports;
  }

  var css_escape = createCommonjsModule(function (module, exports) {
  (function(root, factory) {
  	// https://github.com/umdjs/umd/blob/master/returnExports.js
  	{
  		// For Node.js.
  		module.exports = factory(root);
  	}
  }(typeof commonjsGlobal != 'undefined' ? commonjsGlobal : commonjsGlobal, function(root) {

  	if (root.CSS && root.CSS.escape) {
  		return root.CSS.escape;
  	}

  	// https://drafts.csswg.org/cssom/#serialize-an-identifier
  	var cssEscape = function(value) {
  		if (arguments.length == 0) {
  			throw new TypeError('`CSS.escape` requires an argument.');
  		}
  		var string = String(value);
  		var length = string.length;
  		var index = -1;
  		var codeUnit;
  		var result = '';
  		var firstCodeUnit = string.charCodeAt(0);
  		while (++index < length) {
  			codeUnit = string.charCodeAt(index);
  			// Note: there’s no need to special-case astral symbols, surrogate
  			// pairs, or lone surrogates.

  			// If the character is NULL (U+0000), then the REPLACEMENT CHARACTER
  			// (U+FFFD).
  			if (codeUnit == 0x0000) {
  				result += '\uFFFD';
  				continue;
  			}

  			if (
  				// If the character is in the range [\1-\1F] (U+0001 to U+001F) or is
  				// U+007F, […]
  				(codeUnit >= 0x0001 && codeUnit <= 0x001F) || codeUnit == 0x007F ||
  				// If the character is the first character and is in the range [0-9]
  				// (U+0030 to U+0039), […]
  				(index == 0 && codeUnit >= 0x0030 && codeUnit <= 0x0039) ||
  				// If the character is the second character and is in the range [0-9]
  				// (U+0030 to U+0039) and the first character is a `-` (U+002D), […]
  				(
  					index == 1 &&
  					codeUnit >= 0x0030 && codeUnit <= 0x0039 &&
  					firstCodeUnit == 0x002D
  				)
  			) {
  				// https://drafts.csswg.org/cssom/#escape-a-character-as-code-point
  				result += '\\' + codeUnit.toString(16) + ' ';
  				continue;
  			}

  			if (
  				// If the character is the first character and is a `-` (U+002D), and
  				// there is no second character, […]
  				index == 0 &&
  				length == 1 &&
  				codeUnit == 0x002D
  			) {
  				result += '\\' + string.charAt(index);
  				continue;
  			}

  			// If the character is not handled by one of the above rules and is
  			// greater than or equal to U+0080, is `-` (U+002D) or `_` (U+005F), or
  			// is in one of the ranges [0-9] (U+0030 to U+0039), [A-Z] (U+0041 to
  			// U+005A), or [a-z] (U+0061 to U+007A), […]
  			if (
  				codeUnit >= 0x0080 ||
  				codeUnit == 0x002D ||
  				codeUnit == 0x005F ||
  				codeUnit >= 0x0030 && codeUnit <= 0x0039 ||
  				codeUnit >= 0x0041 && codeUnit <= 0x005A ||
  				codeUnit >= 0x0061 && codeUnit <= 0x007A
  			) {
  				// the character itself
  				result += string.charAt(index);
  				continue;
  			}

  			// Otherwise, the escaped character.
  			// https://drafts.csswg.org/cssom/#escape-a-character
  			result += '\\' + string.charAt(index);

  		}
  		return result;
  	};

  	if (!root.CSS) {
  		root.CSS = {};
  	}

  	root.CSS.escape = cssEscape;
  	return cssEscape;

  }));
  });

  /**
   * SVGs for elements are generated by the {@link GraphicsFactory}.
   *
   * This utility gives quick access to the important semantic
   * parts of an element.
   */

  /**
   * Returns the visual part of a diagram element
   *
   * @param {Snap<SVGElement>} gfx
   *
   * @return {Snap<SVGElement>}
   */
  function getVisual(gfx) {
    return gfx.childNodes[0];
  }

  var MINIMAP_VIEWBOX_PADDING = 50;

  var RANGE = { min: 0.2, max: 4 },
      NUM_STEPS = 10;

  var DELTA_THRESHOLD = 0.1;

  var LOW_PRIORITY = 250;


  /**
   * A minimap that reflects and lets you navigate the diagram.
   */
  function Minimap(
      config, injector, eventBus,
      canvas, elementRegistry) {

    var self = this;

    this._canvas = canvas;
    this._elementRegistry = elementRegistry;
    this._eventBus = eventBus;
    this._injector = injector;

    this._state = {
      isOpen: undefined,
      isDragging: false,
      initialDragPosition: null,
      offsetViewport: null,
      cachedViewbox: null,
      dragger: null,
      svgClientRect: null,
      parentClientRect: null,
      zoomDelta: 0
    };

    this._init();

    this.toggle((config && config.open) || false);

    function setViewboxCenteredAroundClickEvent(event) {

      // getBoundingClientRect might return zero-dimensional when called for the first time
      if (!self._state._svgClientRect || isZeroDimensional(self._state._svgClientRect)) {
        self._state._svgClientRect = self._svg.getBoundingClientRect();
      }

      var diagramPoint = mapMousePositionToDiagramPoint({
        x: event.clientX - self._state._svgClientRect.left,
        y: event.clientY - self._state._svgClientRect.top
      }, self._svg, self._lastViewbox);

      setViewboxCenteredAroundPoint(diagramPoint, self._canvas);

      self._update();
    }

    // set viewbox on click
    componentEvent.bind(this._svg, 'click', function(event) {
      event.preventDefault();
      event.stopPropagation();

      setViewboxCenteredAroundClickEvent(event);
    });

    function mousedown(center) {

      return function onMousedown(event) {

        // getBoundingClientRect might return zero-dimensional when called for the first time
        if (!self._state._svgClientRect || isZeroDimensional(self._state._svgClientRect)) {
          self._state._svgClientRect = self._svg.getBoundingClientRect();
        }

        if (center) {
          setViewboxCenteredAroundClickEvent(event);
        }

        var diagramPoint = mapMousePositionToDiagramPoint({
          x: event.clientX - self._state._svgClientRect.left,
          y: event.clientY - self._state._svgClientRect.top
        }, self._svg, self._lastViewbox);

        var viewbox = canvas.viewbox();

        var offsetViewport = getOffsetViewport(diagramPoint, viewbox);

        var initialViewportDomRect = self._viewportDom.getBoundingClientRect();

        // take border into account (regardless of width)
        var offsetViewportDom = {
          x: event.clientX - initialViewportDomRect.left + 1,
          y: event.clientY - initialViewportDomRect.top + 1
        };

        // init dragging
        assign(self._state, {
          cachedViewbox: viewbox,
          initialDragPosition: {
            x: event.clientX,
            y: event.clientY
          },
          isDragging: true,
          offsetViewport: offsetViewport,
          offsetViewportDom: offsetViewportDom,
          viewportClientRect: self._viewport.getBoundingClientRect(),
          parentClientRect: self._parent.getBoundingClientRect()
        });

        componentEvent.bind(document, 'mousemove', onMousemove);
        componentEvent.bind(document, 'mouseup', onMouseup);
      };
    }

    function onMousemove(event) {

      // set viewbox if dragging active
      if (self._state.isDragging) {

        // getBoundingClientRect might return zero-dimensional when called for the first time
        if (!self._state._svgClientRect || isZeroDimensional(self._state._svgClientRect)) {
          self._state._svgClientRect = self._svg.getBoundingClientRect();
        }

        // update viewport DOM
        var offsetViewportDom = self._state.offsetViewportDom,
            viewportClientRect = self._state.viewportClientRect,
            parentClientRect = self._state.parentClientRect;

        assign(self._viewportDom.style, {
          top: (event.clientY - offsetViewportDom.y - parentClientRect.top) + 'px',
          left: (event.clientX - offsetViewportDom.x - parentClientRect.left) + 'px'
        });

        // update overlay
        var clipPath = getOverlayClipPath(parentClientRect, {
          top: event.clientY - offsetViewportDom.y - parentClientRect.top,
          left: event.clientX - offsetViewportDom.x - parentClientRect.left,
          width: viewportClientRect.width,
          height: viewportClientRect.height
        });

        assign(self._overlay.style, {
          clipPath: clipPath
        });

        var diagramPoint = mapMousePositionToDiagramPoint({
          x: event.clientX - self._state._svgClientRect.left,
          y: event.clientY - self._state._svgClientRect.top
        }, self._svg, self._lastViewbox);

        setViewboxCenteredAroundPoint({
          x: diagramPoint.x - self._state.offsetViewport.x,
          y: diagramPoint.y - self._state.offsetViewport.y
        }, self._canvas);
      }
    }

    function onMouseup(event) {

      if (self._state.isDragging) {

        // treat event as click
        if (self._state.initialDragPosition.x === event.clientX
            && self._state.initialDragPosition.y === event.clientY) {
          setViewboxCenteredAroundClickEvent(event);
        }

        self._update();

        // end dragging
        assign(self._state, {
          cachedViewbox: null,
          initialDragPosition: null,
          isDragging: false,
          offsetViewport: null,
          offsetViewportDom: null
        });

        componentEvent.unbind(document, 'mousemove', onMousemove);
        componentEvent.unbind(document, 'mouseup', onMouseup);
      }
    }

    // dragging viewport scrolls canvas
    componentEvent.bind(this._viewportDom, 'mousedown', mousedown(false));
    componentEvent.bind(this._svg, 'mousedown', mousedown(true));

    componentEvent.bind(this._parent, 'wheel', function(event) {

      // stop propagation and handle scroll differently
      event.preventDefault();
      event.stopPropagation();

      // only zoom in on ctrl; this aligns with diagram-js navigation behavior
      if (!event.ctrlKey) {
        return;
      }

      // getBoundingClientRect might return zero-dimensional when called for the first time
      if (!self._state._svgClientRect || isZeroDimensional(self._state._svgClientRect)) {
        self._state._svgClientRect = self._svg.getBoundingClientRect();
      }

      // disallow zooming through viewport outside of minimap as it is very confusing
      if (!isPointInside(event, self._state._svgClientRect)) {
        return;
      }

      var factor = event.deltaMode === 0 ? 0.020 : 0.32;

      var delta = (
        Math.sqrt(
          Math.pow(event.deltaY, 2) +
          Math.pow(event.deltaX, 2)
        ) * sign(event.deltaY) * -factor
      );

      // add until threshold reached
      self._state.zoomDelta += delta;

      if (Math.abs(self._state.zoomDelta) > DELTA_THRESHOLD) {
        var direction = delta > 0 ? 1 : -1;

        var currentLinearZoomLevel = Math.log(canvas.zoom()) / Math.log(10);

        // zoom with half the step size of stepZoom
        var stepSize = getStepSize(RANGE, NUM_STEPS * 2);

        // snap to a proximate zoom step
        var newLinearZoomLevel = Math.round(currentLinearZoomLevel / stepSize) * stepSize;

        // increase or decrease one zoom step in the given direction
        newLinearZoomLevel += stepSize * direction;

        // calculate the absolute logarithmic zoom level based on the linear zoom level
        // (e.g. 2 for an absolute x2 zoom)
        var newLogZoomLevel = Math.pow(10, newLinearZoomLevel);

        canvas.zoom(cap(RANGE, newLogZoomLevel), diagramPoint);

        // reset
        self._state.zoomDelta = 0;

        var diagramPoint = mapMousePositionToDiagramPoint({
          x: event.clientX - self._state._svgClientRect.left,
          y: event.clientY - self._state._svgClientRect.top
        }, self._svg, self._lastViewbox);

        setViewboxCenteredAroundPoint(diagramPoint, self._canvas);

        self._update();
      }
    });

    componentEvent.bind(this._toggle, 'click', function(event) {
      event.preventDefault();
      event.stopPropagation();

      self.toggle();
    });

    // add shape on shape/connection added
    eventBus.on([ 'shape.added', 'connection.added' ], function(context) {
      var element = context.element;

      self._addElement(element);

      self._update();
    });

    // remove shape on shape/connection removed
    eventBus.on([ 'shape.removed', 'connection.removed' ], function(context) {
      var element = context.element;

      self._removeElement(element);

      self._update();
    });

    // update on elements changed
    eventBus.on('elements.changed', LOW_PRIORITY, function(context) {
      var elements = context.elements;

      elements.forEach(function(element) {
        self._updateElement(element);
      });

      self._update();
    });

    // update on element ID update
    eventBus.on('element.updateId', function(context) {
      var element = context.element,
          newId = context.newId;

      self._updateElementId(element, newId);
    });

    // update on viewbox changed
    eventBus.on('canvas.viewbox.changed', function() {
      if (!self._state.isDragging) {
        self._update();
      }
    });

    eventBus.on('canvas.resized', function() {

      // only update if present in DOM
      if (document.body.contains(self._parent)) {
        if (!self._state.isDragging) {
          self._update();
        }

        self._state._svgClientRect = self._svg.getBoundingClientRect();
      }

    });
  }

  Minimap.$inject = [
    'config.minimap',
    'injector',
    'eventBus',
    'canvas',
    'elementRegistry'
  ];

  Minimap.prototype._init = function() {
    var canvas = this._canvas,
        container = canvas.getContainer();

    // create parent div
    var parent = this._parent = document.createElement('div');

    classes(parent).add('djs-minimap');

    container.appendChild(parent);

    // create toggle
    var toggle = this._toggle = document.createElement('div');

    classes(toggle).add('toggle');

    parent.appendChild(toggle);

    // create map
    var map = this._map = document.createElement('div');

    classes(map).add('map');

    parent.appendChild(map);

    // create svg
    var svg = this._svg = create('svg');
    attr$1(svg, { width: '100%', height: '100%' });
    append(map, svg);

    // add groups
    var elementsGroup = this._elementsGroup = create('g');
    append(svg, elementsGroup);

    var viewportGroup = this._viewportGroup = create('g');
    append(svg, viewportGroup);

    // add viewport SVG
    var viewport = this._viewport = create('rect');

    classes$1(viewport).add('viewport');

    append(viewportGroup, viewport);

    // prevent drag propagation
    componentEvent.bind(parent, 'mousedown', function(event) {
      event.stopPropagation();
    });

    // add viewport DOM
    var viewportDom = this._viewportDom = document.createElement('div');

    classes(viewportDom).add('viewport-dom');

    this._parent.appendChild(viewportDom);

    // add overlay
    var overlay = this._overlay = document.createElement('div');

    classes(overlay).add('overlay');

    this._parent.appendChild(overlay);
  };

  Minimap.prototype._update = function() {
    var viewbox = this._canvas.viewbox(),
        innerViewbox = viewbox.inner,
        outerViewbox = viewbox.outer;

    if (!validViewbox(viewbox)) {
      return;
    }

    var x, y, width, height;

    var widthDifference = outerViewbox.width - innerViewbox.width,
        heightDifference = outerViewbox.height - innerViewbox.height;

    // update viewbox
    // x
    if (innerViewbox.width < outerViewbox.width) {
      x = innerViewbox.x - widthDifference / 2;
      width = outerViewbox.width;

      if (innerViewbox.x + innerViewbox.width < outerViewbox.width) {
        x = Math.min(0, innerViewbox.x);
      }
    } else {
      x = innerViewbox.x;
      width = innerViewbox.width;
    }

    // y
    if (innerViewbox.height < outerViewbox.height) {
      y = innerViewbox.y - heightDifference / 2;
      height = outerViewbox.height;

      if (innerViewbox.y + innerViewbox.height < outerViewbox.height) {
        y = Math.min(0, innerViewbox.y);
      }
    } else {
      y = innerViewbox.y;
      height = innerViewbox.height;
    }

    // apply some padding
    x = x - MINIMAP_VIEWBOX_PADDING;
    y = y - MINIMAP_VIEWBOX_PADDING;
    width = width + MINIMAP_VIEWBOX_PADDING * 2;
    height = height + MINIMAP_VIEWBOX_PADDING * 2;

    this._lastViewbox = {
      x: x,
      y: y,
      width: width,
      height: height
    };

    attr$1(this._svg, {
      viewBox: x + ', ' + y + ', ' + width + ', ' + height
    });

    // update viewport SVG
    attr$1(this._viewport, {
      x: viewbox.x,
      y: viewbox.y,
      width: viewbox.width,
      height: viewbox.height
    });

    // update viewport DOM
    var parentClientRect = this._state._parentClientRect = this._parent.getBoundingClientRect();
    var viewportClientRect = this._viewport.getBoundingClientRect();

    var withoutParentOffset = {
      top: viewportClientRect.top - parentClientRect.top,
      left: viewportClientRect.left - parentClientRect.left,
      width: viewportClientRect.width,
      height: viewportClientRect.height
    };

    assign(this._viewportDom.style, {
      top: withoutParentOffset.top + 'px',
      left: withoutParentOffset.left + 'px',
      width: withoutParentOffset.width + 'px',
      height: withoutParentOffset.height + 'px'
    });

    // update overlay
    var clipPath = getOverlayClipPath(parentClientRect, withoutParentOffset);

    assign(this._overlay.style, {
      clipPath: clipPath
    });
  };

  Minimap.prototype.open = function() {
    assign(this._state, { isOpen: true });

    classes(this._parent).add('open');

    var translate = this._injector.get('translate', false) || function(s) { return s; };

    attr(this._toggle, 'title', translate('Close minimap'));

    this._update();

    this._eventBus.fire('minimap.toggle', { open: true });
  };

  Minimap.prototype.close = function() {
    assign(this._state, { isOpen: false });

    classes(this._parent).remove('open');

    var translate = this._injector.get('translate', false) || function(s) { return s; };

    attr(this._toggle, 'title', translate('Open minimap'));

    this._eventBus.fire('minimap.toggle', { open: false });
  };

  Minimap.prototype.toggle = function(open) {

    var currentOpen = this.isOpen();

    if (typeof open === 'undefined') {
      open = !currentOpen;
    }

    if (open == currentOpen) {
      return;
    }

    if (open) {
      this.open();
    } else {
      this.close();
    }
  };

  Minimap.prototype.isOpen = function() {
    return this._state.isOpen;
  };

  Minimap.prototype._updateElement = function(element) {

    try {

      // if parent is null element has been removed, if parent is undefined parent is root
      if (element.parent !== undefined && element.parent !== null) {
        this._removeElement(element);
        this._addElement(element);
      }
    } catch (error) {
      console.warn('Minimap#_updateElement errored', error);
    }

  };

  Minimap.prototype._updateElementId = function(element, newId) {

    try {
      var elementGfx = query('#' + css_escape(element.id), this._elementsGroup);

      if (elementGfx) {
        elementGfx.id = newId;
      }
    } catch (error) {
      console.warn('Minimap#_updateElementId errored', error);
    }

  };

  /**
   * Adds an element to the minimap.
   */
  Minimap.prototype._addElement = function(element) {
    var self = this;

    this._removeElement(element);

    var parent,
        x, y;

    var newElementGfx = this._createElement(element);
    var newElementParentGfx = query('#' + css_escape(element.parent.id), this._elementsGroup);

    if (newElementGfx) {

      var elementGfx = this._elementRegistry.getGraphics(element);
      var parentGfx = this._elementRegistry.getGraphics(element.parent);

      var index = getIndexOfChildInParentChildren(elementGfx, parentGfx);

      // index can be 0
      if (index !== 'undefined') {
        if (newElementParentGfx) {

          // in cases of doubt add as last child
          if (newElementParentGfx.childNodes.length > index) {
            insertChildAtIndex(newElementGfx, newElementParentGfx, index);
          } else {
            insertChildAtIndex(newElementGfx, newElementParentGfx, newElementParentGfx.childNodes.length - 1);
          }

        } else {
          this._elementsGroup.appendChild(newElementGfx);
        }

      } else {

        // index undefined
        this._elementsGroup.appendChild(newElementGfx);
      }

      if (isConnection(element)) {
        parent = element.parent;
        x = 0;
        y = 0;

        if (typeof parent.x !== 'undefined' && typeof parent.y !== 'undefined') {
          x = -parent.x;
          y = -parent.y;
        }

        attr$1(newElementGfx, { transform: 'translate(' + x + ' ' + y + ')' });
      } else {
        x = element.x;
        y = element.y;

        if (newElementParentGfx) {
          parent = element.parent;

          x -= parent.x;
          y -= parent.y;
        }

        attr$1(newElementGfx, { transform: 'translate(' + x + ' ' + y + ')' });
      }

      if (element.children && element.children.length) {
        element.children.forEach(function(child) {
          self._addElement(child);
        });
      }

      return newElementGfx;
    }
  };

  Minimap.prototype._removeElement = function(element) {
    var elementGfx = this._svg.getElementById(element.id);

    if (elementGfx) {
      remove(elementGfx);
    }
  };

  Minimap.prototype._createElement = function(element) {
    var gfx = this._elementRegistry.getGraphics(element),
        visual;

    if (gfx) {
      visual = getVisual(gfx);

      if (visual) {
        var elementGfx = clone(visual);
        attr$1(elementGfx, { id: element.id });

        return elementGfx;
      }
    }
  };

  function isConnection(element) {
    return element.waypoints;
  }

  function getOffsetViewport(diagramPoint, viewbox) {
    var centerViewbox = {
      x: viewbox.x + (viewbox.width / 2),
      y: viewbox.y + (viewbox.height / 2)
    };

    return {
      x: diagramPoint.x - centerViewbox.x,
      y: diagramPoint.y - centerViewbox.y
    };
  }

  function mapMousePositionToDiagramPoint(position, svg, lastViewbox) {

    // firefox returns 0 for clientWidth and clientHeight
    var boundingClientRect = svg.getBoundingClientRect();

    // take different aspect ratios of default layers bounding box and minimap into account
    var bBox =
      fitAspectRatio(lastViewbox, boundingClientRect.width / boundingClientRect.height);

    // map click position to diagram position
    var diagramX = map(position.x, 0, boundingClientRect.width, bBox.x, bBox.x + bBox.width),
        diagramY = map(position.y, 0, boundingClientRect.height, bBox.y, bBox.y + bBox.height);

    return {
      x: diagramX,
      y: diagramY
    };
  }

  function setViewboxCenteredAroundPoint(point, canvas) {

    // get cached viewbox to preserve zoom
    var cachedViewbox = canvas.viewbox(),
        cachedViewboxWidth = cachedViewbox.width,
        cachedViewboxHeight = cachedViewbox.height;

    canvas.viewbox({
      x: point.x - cachedViewboxWidth / 2,
      y: point.y - cachedViewboxHeight / 2,
      width: cachedViewboxWidth,
      height: cachedViewboxHeight
    });
  }

  function fitAspectRatio(bounds, targetAspectRatio) {
    var aspectRatio = bounds.width / bounds.height;

    // assigning to bounds throws exception in IE11
    var newBounds = assign({}, {
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height
    });

    if (aspectRatio > targetAspectRatio) {

      // height needs to be fitted
      var height = newBounds.width * (1 / targetAspectRatio),
          y = newBounds.y - ((height - newBounds.height) / 2);

      assign(newBounds, {
        y: y,
        height: height
      });
    } else if (aspectRatio < targetAspectRatio) {

      // width needs to be fitted
      var width = newBounds.height * targetAspectRatio,
          x = newBounds.x - ((width - newBounds.width) / 2);

      assign(newBounds, {
        x: x,
        width: width
      });
    }

    return newBounds;
  }

  function map(x, inMin, inMax, outMin, outMax) {
    var inRange = inMax - inMin,
        outRange = outMax - outMin;

    return (x - inMin) * outRange / inRange + outMin;
  }

  /**
   * Returns index of child in children of parent.
   *
   * g
   * '- g.djs-element // parentGfx
   * '- g.djs-children
   *    '- g
   *       '-g.djs-element // childGfx
   */
  function getIndexOfChildInParentChildren(childGfx, parentGfx) {
    var childrenGroup = query('.djs-children', parentGfx.parentNode);

    if (!childrenGroup) {
      return;
    }

    var childrenArray = [].slice.call(childrenGroup.childNodes);

    var indexOfChild = -1;

    childrenArray.forEach(function(childGroup, index) {
      if (query('.djs-element', childGroup) === childGfx) {
        indexOfChild = index;
      }
    });

    return indexOfChild;
  }

  function insertChildAtIndex(childGfx, parentGfx, index) {
    var childrenArray = [].slice.call(parentGfx.childNodes);

    var childAtIndex = childrenArray[index];

    parentGfx.insertBefore(childGfx, childAtIndex.nextSibling);
  }

  function isZeroDimensional(clientRect) {
    return clientRect.width === 0 && clientRect.height === 0;
  }

  function isPointInside(point, rect) {
    return point.x > rect.left
      && point.x < rect.left + rect.width
      && point.y > rect.top
      && point.y < rect.top + rect.height;
  }

  var sign = Math.sign || function(n) {
    return n >= 0 ? 1 : -1;
  };

  /**
   * Get step size for given range and number of steps.
   *
   * @param {Object} range - Range.
   * @param {number} range.min - Range minimum.
   * @param {number} range.max - Range maximum.
   */
  function getStepSize(range, steps) {

    var minLinearRange = Math.log(range.min) / Math.log(10),
        maxLinearRange = Math.log(range.max) / Math.log(10);

    var absoluteLinearRange = Math.abs(minLinearRange) + Math.abs(maxLinearRange);

    return absoluteLinearRange / steps;
  }

  function cap(range, scale) {
    return Math.max(range.min, Math.min(range.max, scale));
  }

  function getOverlayClipPath(outer, inner) {
    var coordinates = [
      toCoordinatesString(inner.left, inner.top),
      toCoordinatesString(inner.left + inner.width, inner.top),
      toCoordinatesString(inner.left + inner.width, inner.top + inner.height),
      toCoordinatesString(inner.left, inner.top + inner.height),
      toCoordinatesString(inner.left, outer.height),
      toCoordinatesString(outer.width, outer.height),
      toCoordinatesString(outer.width, 0),
      toCoordinatesString(0, 0),
      toCoordinatesString(0, outer.height),
      toCoordinatesString(inner.left, outer.height)
    ].join(', ');

    return 'polygon(' + coordinates + ')';
  }

  function toCoordinatesString(x, y) {
    return x + 'px ' + y + 'px';
  }

  function validViewbox(viewBox) {

    return every(viewBox, function(value) {

      // check deeper structures like inner or outer viewbox
      if (isObject(value)) {
        return validViewbox(value);
      }

      return isNumber(value) && isFinite(value);
    });
  }

  var index$1 = {
    __init__: [ 'minimap' ],
    minimap: [ 'type', Minimap ]
  };

  return index$1;

}));
