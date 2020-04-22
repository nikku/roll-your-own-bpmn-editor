(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = global || self, global.BpmnJSBpmnlint = factory());
}(this, function () { 'use strict';

  function EditorActions(injector, linting) {
    var editorActions = injector.get('editorActions', false);

    editorActions && editorActions.register({
      toggleLinting: function() {
        linting.toggle();
      }
    });
  }

  EditorActions.$inject = [
    'injector',
    'linting'
  ];

  /**
   * Traverse a moddle tree, depth first from top to bottom
   * and call the passed visitor fn.
   *
   * @param {ModdleElement} element
   * @param {Function} fn
   */
  var traverse = function traverse(element, fn) {
    fn(element);

    var descriptor = element.$descriptor;

    if (descriptor.isGeneric) {
      return;
    }

    var containedProperties = descriptor.properties.filter(p => {
      return !p.isAttr && !p.isReference && p.type !== 'String';
    });

    containedProperties.forEach(p => {
      if (p.name in element) {
        const propertyValue = element[p.name];

        if (p.isMany) {
          propertyValue.forEach(child => {
            traverse(child, fn);
          });
        } else {
          traverse(propertyValue, fn);
        }
      }
    });
  };

  class Reporter {
    constructor({ moddleRoot, rule }) {
      this.rule = rule;
      this.moddleRoot = moddleRoot;
      this.messages = [];
      this.report = this.report.bind(this);
    }

    report(id, message) {
      this.messages.push({ id, message });
    }
  }

  var testRule = function testRule({ moddleRoot, rule }) {
    const reporter = new Reporter({ rule, moddleRoot });
    traverse(moddleRoot, node => rule.check(node, reporter));
    return reporter.messages;
  };

  const categoryMap = {
    0: 'off',
    1: 'warn',
    2: 'error'
  };


  function Linter(options = {}) {

    const {
      config,
      resolver
    } = options;

    if (typeof resolver === 'undefined') {
      throw new Error('must provide <options.resolver>');
    }

    this.config = config;
    this.resolver = resolver;

    this.cachedRules = {};
    this.cachedConfigs = {};
  }


  var linter = Linter;

  /**
   * Applies a rule on the moddleRoot and adds reports to the finalReport
   *
   * @param {ModdleElement} moddleRoot
   *
   * @param {Object} ruleDefinition.name
   * @param {Object} ruleDefinition.config
   * @param {Object} ruleDefinition.category
   * @param {Rule} ruleDefinition.rule
   *
   * @return {Array<ValidationErrors>} rule reports
   */
  Linter.prototype.applyRule = function applyRule(moddleRoot, ruleDefinition) {

    const {
      config,
      rule,
      category,
      name
    } = ruleDefinition;

    try {

      const reports = testRule({
        moddleRoot,
        rule,
        config
      });

      return reports.map(function(report) {
        return {
          ...report,
          category
        };
      });
    } catch (e) {
      console.error('rule <' + name + '> failed with error: ', e);

      return [
        {
          message: 'Rule error: ' + e.message,
          category: 'error'
        }
      ];
    }

  };


  Linter.prototype.resolveRule = function(name) {

    const {
      pkg,
      ruleName
    } = this.parseRuleName(name);

    const id = `${pkg}-${ruleName}`;

    const rule = this.cachedRules[id];

    if (rule) {
      return Promise.resolve(rule);
    }

    return Promise.resolve(this.resolver.resolveRule(pkg, ruleName)).then((ruleFactory) => {

      if (!ruleFactory) {
        throw new Error(`unknown rule <${name}>`);
      }

      const rule = this.cachedRules[id] = ruleFactory();

      return rule;
    });
  };

  Linter.prototype.resolveConfig = function(name) {

    const {
      pkg,
      configName
    } = this.parseConfigName(name);

    const id = `${pkg}-${configName}`;

    const config = this.cachedConfigs[id];

    if (config) {
      return Promise.resolve(config);
    }

    return Promise.resolve(this.resolver.resolveConfig(pkg, configName)).then((config) => {

      if (!config) {
        throw new Error(`unknown config <${name}>`);
      }

      const actualConfig = this.cachedConfigs[id] = normalizeConfig(config, pkg);

      return actualConfig;
    });
  };

  /**
   * Take a linter config and return list of resolved rules.
   *
   * @param {Object} config
   *
   * @return {Array<RuleDefinition>}
   */
  Linter.prototype.resolveRules = function(config) {

    return this.resolveConfiguredRules(config).then((rulesConfig) => {

      // parse rule values
      const parsedRules = Object.entries(rulesConfig).map(([ name, value ]) => {
        const {
          category,
          config
        } = this.parseRuleValue(value);

        return {
          name,
          category,
          config
        };
      });

      // filter only for enabled rules
      const enabledRules = parsedRules.filter(definition => definition.category !== 'off');

      // load enabled rules
      const loaders = enabledRules.map((definition) => {

        const {
          name
        } = definition;

        return this.resolveRule(name).then(function(rule) {
          return {
            ...definition,
            rule
          };
        });
      });

      return Promise.all(loaders);
    });
  };


  Linter.prototype.resolveConfiguredRules = function(config) {

    let parents = config.extends;

    if (typeof parents === 'string') {
      parents = [ parents ];
    }

    if (typeof parents === 'undefined') {
      parents = [];
    }

    return Promise.all(
      parents.map((configName) => {
        return this.resolveConfig(configName).then((config) => {
          return this.resolveConfiguredRules(config);
        });
      })
    ).then((inheritedRules) => {

      const overrideRules = normalizeConfig(config, 'bpmnlint').rules;

      const rules = [ ...inheritedRules, overrideRules ].reduce((rules, currentRules) => {
        return {
          ...rules,
          ...currentRules
        };
      }, {});

      return rules;
    });
  };


  /**
   * Lint the given model root, using the specified linter config.
   *
   * @param {ModdleElement} moddleRoot
   * @param {Object} [config] the bpmnlint configuration to use
   *
   * @return {Object} lint results, keyed by category names
   */
  Linter.prototype.lint = function(moddleRoot, config) {

    config = config || this.config;

    // load rules
    return this.resolveRules(config).then((ruleDefinitions) => {

      const allReports = {};

      ruleDefinitions.forEach((ruleDefinition) => {

        const {
          name
        } = ruleDefinition;

        const reports = this.applyRule(moddleRoot, ruleDefinition);

        if (reports.length) {
          allReports[name] = reports;
        }
      });

      return allReports;
    });
  };


  Linter.prototype.parseRuleValue = function(value) {

    let category;
    let config;

    if (Array.isArray(value)) {
      category = value[0];
      config = value[1];
    } else {
      category = value;
      config = {};
    }

    // normalize rule flag to <error> and <warn> which
    // may be upper case or a number at this point
    if (typeof category === 'string') {
      category = category.toLowerCase();
    }

    category = categoryMap[category] || category;

    return {
      config,
      category
    };
  };

  Linter.prototype.parseRuleName = function(name) {

    const slashIdx = name.indexOf('/');

    // resolve rule as built-in, if unprefixed
    if (slashIdx === -1) {
      return {
        pkg: 'bpmnlint',
        ruleName: name
      };
    }

    const pkg = name.substring(0, slashIdx);
    const ruleName = name.substring(slashIdx + 1);

    if (pkg === 'bpmnlint') {
      return {
        pkg: 'bpmnlint',
        ruleName
      };
    } else {
      return {
        pkg: 'bpmnlint-plugin-' + pkg,
        ruleName
      };
    }
  };


  Linter.prototype.parseConfigName = function(name) {

    const localMatch = /^bpmnlint:(.*)$/.exec(name);

    if (localMatch) {
      return {
        pkg: 'bpmnlint',
        configName: localMatch[1]
      };
    }

    const pluginMatch = /^plugin:([^/]+)\/(.+)$/.exec(name);

    if (!pluginMatch) {
      throw new Error(`invalid config name <${ name }>`);
    }

    return {
      pkg: 'bpmnlint-plugin-' + pluginMatch[1],
      configName: pluginMatch[2]
    };
  };


  // helpers ///////////////////////////

  /**
   * Validate and return validated config.
   *
   * @param  {Object} config
   * @param  {String} pkg
   *
   * @return {Object} validated config
   */
  function normalizeConfig(config, pkg) {

    const rules = config.rules || {};

    const rulePrefix = pkg.startsWith('bpmnlint-plugin-') && pkg.replace('bpmnlint-plugin-', '');

    const validatedRules = Object.keys(rules).reduce((normalizedRules, name) => {

      const value = rules[name];

      // drop bpmnlint prefix, if existing
      if (name.startsWith('bpmnlint/')) {
        name = name.replace('bpmnlint/', '');
      } else

      if (rulePrefix) {

        // prefix local rule definition
        if (!name.startsWith(rulePrefix)) {
          name = `${rulePrefix}/${name}`;
        }
      }

      normalizedRules[name] = value;

      return normalizedRules;
    }, {});

    return {
      ...config,
      rules: validatedRules
    };
  }

  var lib = {
    Linter: linter
  };
  var lib_1 = lib.Linter;

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
  function isFunction(obj) {
    var tag = nativeToString.call(obj);
    return tag === '[object Function]' || tag === '[object AsyncFunction]' || tag === '[object GeneratorFunction]' || tag === '[object AsyncGeneratorFunction]' || tag === '[object Proxy]';
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
   * Group collection members by attribute.
   *
   * @param  {Object|Array} collection
   * @param  {Function} extractor
   *
   * @return {Object} map with { attrValue => [ a, b, c ] }
   */

  function groupBy(collection, extractor) {
    var grouped = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    extractor = toExtractor(extractor);
    forEach(collection, function (val) {
      var discriminator = extractor(val) || '_';
      var group = grouped[discriminator];

      if (!group) {
        group = grouped[discriminator] = [];
      }

      group.push(val);
    });
    return grouped;
  }

  function toExtractor(extractor) {
    return isFunction(extractor) ? extractor : function (e) {
      return e[extractor];
    };
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

  /**
   * Set attribute `name` to `val`, or get attr `name`.
   *
   * @param {Element} el
   * @param {String} name
   * @param {String} [val]
   * @api public
   */

  /**
   * Element prototype.
   */

  var proto = Element.prototype;

  /**
   * Vendor function.
   */

  var vendor = proto.matchesSelector
    || proto.webkitMatchesSelector
    || proto.mozMatchesSelector
    || proto.msMatchesSelector
    || proto.oMatchesSelector;

  var bind = window.addEventListener ? 'addEventListener' : 'attachEvent',
      unbind = window.removeEventListener ? 'removeEventListener' : 'detachEvent';

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

  var proto$1 = typeof Element !== 'undefined' ? Element.prototype : {};
  var vendor$1 = proto$1.matches
    || proto$1.matchesSelector
    || proto$1.webkitMatchesSelector
    || proto$1.mozMatchesSelector
    || proto$1.msMatchesSelector
    || proto$1.oMatchesSelector;

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

  var HTML_ESCAPE_MAP = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    '\'': '&#39;'
  };

  function escapeHTML(str) {
    str = '' + str;

    return str && str.replace(/[&<>"']/g, function(match) {
      return HTML_ESCAPE_MAP[match];
    });
  }

  var ErrorSvg = "<svg width=\"12\" height=\"12\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 352 512\"><path fill=\"currentColor\" d=\"M242.72 256l100.07-100.07c12.28-12.28 12.28-32.19 0-44.48l-22.24-22.24c-12.28-12.28-32.19-12.28-44.48 0L176 189.28 75.93 89.21c-12.28-12.28-32.19-12.28-44.48 0L9.21 111.45c-12.28 12.28-12.28 32.19 0 44.48L109.28 256 9.21 356.07c-12.28 12.28-12.28 32.19 0 44.48l22.24 22.24c12.28 12.28 32.2 12.28 44.48 0L176 322.72l100.07 100.07c12.28 12.28 32.2 12.28 44.48 0l22.24-22.24c12.28-12.28 12.28-32.19 0-44.48L242.72 256z\"></path></svg>";

  var WarningSvg = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"12\" height=\"12\" viewBox=\"0 0 512 512\"><path fill=\"currentColor\" d=\"M288 328.83c-45.518 0-82.419 34.576-82.419 77.229 0 42.652 36.9 77.229 82.419 77.229 45.518 0 82.419-34.577 82.419-77.23 0-42.652-36.9-77.229-82.419-77.229zM207.439 57.034l11.61 204.348c.544 9.334 8.78 16.64 18.755 16.64h100.392c9.975 0 18.211-7.306 18.754-16.64l11.611-204.348c.587-10.082-7.98-18.56-18.754-18.56H226.192c-10.775 0-19.34 8.478-18.753 18.56z\"/></svg>";

  var SuccessSvg = "<svg width=\"12\" height=\"12\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 512 512\"><path fill=\"currentColor\" d=\"M173.898 439.404l-166.4-166.4c-9.997-9.997-9.997-26.206 0-36.204l36.203-36.204c9.997-9.998 26.207-9.998 36.204 0L192 312.69 432.095 72.596c9.997-9.997 26.207-9.997 36.204 0l36.203 36.204c9.997 9.997 9.997 26.206 0 36.204l-294.4 294.401c-9.998 9.997-26.207 9.997-36.204-.001z\"></path></svg>";

  var OFFSET_TOP = -7,
      OFFSET_RIGHT = -7;

  var LOW_PRIORITY = 500;

  var emptyConfig = {
    resolver: {
      resolveRule: function() {
        return null;
      }
    },
    config: {}
  };

  var stateToIcon = {
    error: ErrorSvg,
    warning: WarningSvg,
    success: SuccessSvg,
    inactive: SuccessSvg
  };

  function Linting(
      bpmnjs,
      canvas,
      config,
      elementRegistry,
      eventBus,
      overlays,
      translate
  ) {
    this._bpmnjs = bpmnjs;
    this._canvas = canvas;
    this._elementRegistry = elementRegistry;
    this._eventBus = eventBus;
    this._overlays = overlays;
    this._translate = translate;

    this._issues = {};

    this._active = config && config.active || false;
    this._linterConfig = emptyConfig;

    this._overlayIds = {};

    var self = this;

    eventBus.on([
      'import.done',
      'elements.changed',
      'linting.configChanged',
      'linting.toggle'
    ], LOW_PRIORITY, function(e) {
      if (self.isActive()) {
        self.update();
      }
    });

    eventBus.on('linting.toggle', function(event) {

      const active = event.active;

      if (!active) {
        self._clearIssues();
        self._updateButton();
      }
    });

    eventBus.on('diagram.clear', function() {
      self._clearIssues();
    });

    var linterConfig = config && config.bpmnlint;

    linterConfig && eventBus.once('diagram.init', function() {

      // bail out if config was already provided
      // during initialization of other modules
      if (self.getLinterConfig() !== emptyConfig) {
        return;
      }

      try {
        self.setLinterConfig(linterConfig);
      } catch (err) {
        console.error(
          '[bpmn-js-bpmnlint] Invalid lint rules configured. ' +
          'Please doublecheck your linting.bpmnlint configuration, ' +
          'cf. https://github.com/bpmn-io/bpmn-js-bpmnlint#configure-lint-rules'
        );
      }
    });

    this._init();
  }

  Linting.prototype.setLinterConfig = function(linterConfig) {

    if (!linterConfig.config || !linterConfig.resolver) {
      throw new Error('Expected linterConfig = { config, resolver }');
    }

    this._linterConfig = linterConfig;

    this._eventBus.fire('linting.configChanged');
  };

  Linting.prototype.getLinterConfig = function() {
    return this._linterConfig;
  };

  Linting.prototype._init = function() {
    this._createButton();

    this._updateButton();
  };

  Linting.prototype.isActive = function() {
    return this._active;
  };

  Linting.prototype._formatIssues = function(issues) {

    const reports = reduce(issues, function(reports, ruleReports, rule) {

      return reports.concat(ruleReports.map(function(report) {
        report.rule = rule;

        return report;
      }));

    }, []);

    return groupBy(reports, function(report) {
      return report.id;
    });
  };

  /**
   * Toggle linting on or off.
   *
   * @param {boolean} [newActive]
   *
   * @return {boolean} the new active state
   */
  Linting.prototype.toggle = function(newActive) {

    newActive = typeof newActive === 'undefined' ? !this.isActive() : newActive;

    this._setActive(newActive);

    return newActive;
  };

  Linting.prototype._setActive = function(active) {

    if (this._active === active) {
      return;
    }

    this._active = active;

    this._eventBus.fire('linting.toggle', { active: active });
  };

  /**
   * Update overlays. Always lint and check wether overlays need update or not.
   */
  Linting.prototype.update = function() {
    var self = this;

    var definitions = this._bpmnjs.getDefinitions();

    if (!definitions) {
      return;
    }

    var lintStart = this._lintStart = Math.random();

    this.lint().then(function(newIssues) {

      if (self._lintStart !== lintStart) {
        return;
      }

      newIssues = self._formatIssues(newIssues);

      var remove = {},
          update = {},
          add = {};

      for (var id1 in self._issues) {
        if (!newIssues[id1]) {
          remove[id1] = self._issues[id1];
        }
      }

      for (var id2 in newIssues) {
        if (!self._issues[id2]) {
          add[id2] = newIssues[id2];
        } else {
          if (newIssues[id2] !== self._issues[id2]) {
            update[id2] = newIssues[id2];
          }
        }
      }

      remove = assign(remove, update);
      add = assign(add, update);

      self._clearOverlays();
      self._createIssues(add);

      self._issues = newIssues;

      self._updateButton();

      self._fireComplete(newIssues);
    });
  };

  Linting.prototype._fireComplete = function(issues) {
    this._eventBus.fire('linting.completed', { issues: issues });
  };

  Linting.prototype._createIssues = function(issues) {
    for (var id in issues) {
      this._createElementIssues(id, issues[id]);
    }
  };

  /**
   * Create overlays for an elements issues.
   *
   * @param {string} elementId - Elements ID.
   * @param {Array} elementIssues - All element issues including warnings and errors.
   */
  Linting.prototype._createElementIssues = function(elementId, elementIssues) {
    var element = this._elementRegistry.get(elementId);

    if (!element) {
      return;
    }

    var menuPosition;
    var position;

    if (element === this._canvas.getRootElement()) {
      menuPosition = 'bottom-right';

      position = {
        top: 20,
        left: 150
      };
    } else {
      menuPosition = 'top-right';

      position = {
        top: OFFSET_TOP,
        left: OFFSET_RIGHT
      };
    }

    var issuesByType = groupBy(elementIssues, function(elementIssue) {
      return elementIssue.category;
    });

    var errors = issuesByType.error,
        warnings = issuesByType.warn;

    if (!errors && !warnings) {
      return;
    }

    var $html = domify(
      '<div class="bjsl-overlay bjsl-issues-' + menuPosition + '"></div>'
    );

    var $icon = errors
      ? domify('<div class="bjsl-icon bjsl-icon-error">' + ErrorSvg + '</div>')
      : domify('<div class="bjsl-icon bjsl-icon-warning">' + WarningSvg + '</div>');

    var $dropdown = domify('<div class="bjsl-dropdown"></div>');
    var $dropdownContent = domify('<div class="bjsl-dropdown-content"></div>');
    var $issues = domify('<div class="bjsl-issues"></div>');
    var $issueList = domify('<ul></ul>');

    $html.appendChild($icon);
    $html.appendChild($dropdown);

    $dropdown.appendChild($dropdownContent);
    $dropdownContent.appendChild($issues);

    $issues.appendChild($issueList);

    if (errors) {
      this._addErrors($issueList, errors);
    }

    if (warnings) {
      this._addWarnings($issueList, warnings);
    }

    this._overlayIds[elementId] = this._overlays.add(element, 'linting', {
      position: position,
      html: $html,
      scale: {
        min: .9
      }
    });
  };

  Linting.prototype._addErrors = function($ul, errors) {

    var self = this;

    errors.forEach(function(error) {
      self._addEntry($ul, 'error', error);
    });
  };

  Linting.prototype._addWarnings = function($ul, warnings) {

    var self = this;

    warnings.forEach(function(error) {
      self._addEntry($ul, 'warning', error);
    });
  };

  Linting.prototype._addEntry = function($ul, state, entry) {

    var rule = entry.rule,
        message = this._translate(entry.message);

    var icon = stateToIcon[state];

    var $entry = domify(
      '<li class="' + state + '">' +
        icon +
        '<a title="' + escapeHTML(rule) + ': ' + escapeHTML(message) + '" ' +
           'data-rule="' + escapeHTML(rule) + '" ' +
           'data-message="' + escapeHTML(message) + '"' +
        '>' +
          escapeHTML(message) +
        '</a>' +
      '</li>'
    );

    $ul.appendChild($entry);
  };

  Linting.prototype._clearOverlays = function() {
    this._overlays.remove({ type: 'linting' });

    this._overlayIds = {};
  };

  Linting.prototype._clearIssues = function() {
    this._issues = {};

    this._clearOverlays();
  };

  Linting.prototype._setButtonState = function(state, errors, warnings) {
    var button = this._button;

    var icon = stateToIcon[state];

    var html = icon + '<span>' + this._translate('{errors} Errors, {warnings} Warnings', { errors: errors.toString(), warnings: warnings.toString() }) + '</span>';

    [
      'error',
      'inactive',
      'success',
      'warning'
    ].forEach(function(s) {
      if (state === s) {
        button.classList.add('bjsl-button-' + s);
      } else {
        button.classList.remove('bjsl-button-' + s);
      }
    });

    button.innerHTML = html;
  };

  Linting.prototype._updateButton = function() {

    if (!this.isActive()) {
      this._setButtonState('inactive', 0, 0);

      return;
    }

    var errors = 0,
        warnings = 0;

    for (var id in this._issues) {
      this._issues[id].forEach(function(issue) {
        if (issue.category === 'error') {
          errors++;
        } else if (issue.category === 'warn') {
          warnings++;
        }
      });
    }

    var state = (errors && 'error') || (warnings && 'warning') || 'success';

    this._setButtonState(state, errors, warnings);
  };

  Linting.prototype._createButton = function() {

    var self = this;

    this._button = domify(
      '<button class="bjsl-button bjsl-button-inactive" title="' + this._translate('Toggle linting') + '"></button>'
    );

    this._button.addEventListener('click', function() {
      self.toggle();
    });

    this._canvas.getContainer().appendChild(this._button);
  };

  Linting.prototype.lint = function() {
    var definitions = this._bpmnjs.getDefinitions();

    var linter = new lib_1(this._linterConfig);

    return linter.lint(definitions);
  };

  Linting.$inject = [
    'bpmnjs',
    'canvas',
    'config.linting',
    'elementRegistry',
    'eventBus',
    'overlays',
    'translate'
  ];

  var index = {
    __init__: [ 'linting', 'lintingEditorActions' ],
    linting: [ 'type', Linting ],
    lintingEditorActions: ['type', EditorActions ]
  };

  return index;

}));
