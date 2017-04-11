/*
 *  ___ __ __
 * (   (  /  \
 *  ) ) )( () )
 * (___(__\__/
 *
 * a javascript library for building user interfaces
 */
(function (factory) {
	if (typeof exports === 'object' && typeof module !== 'undefined') {
		module.exports = factory(global);
	} else if (typeof define === 'function' && define.amd) {
		define(factory(window));
	} else {
		window.dio = factory(window);
	}
}(function (global) {


	'use strict';


	/**
	 * ## Constants
	 */
	var version = '7.0.0';
	var noop = function () {};
	var array = [];
	var object = {};
	var browser = global.window !== void 0;
	var document = window.document;
	var mount = browser === true ? document.body : null;
	var Promise = global.Promise || noop;
	var schedule = global.requestIdleCallback || global.requestAnimationFrame || setTimeout;
	
	/**
	 * ## Element Flags
	 *
	 * 1: text
	 * 2: element
	 * 3: n/a
	 * 4: n/a
	 * 5: n/a
	 * 6: n/a
	 * 7: n/a
	 * 8: n/a
	 * 9: n/a
	 * 10: n/a
	 * 11: fragment
	 *
	 * ## Element Type Casts
	 *
	 * 0: Element
	 * 1: Component
	 * 2: Function
	 */
	
	/**
	 * ## Element Shapes
	 *
	 * name:     node tag             {String}
	 * type:     node type            {Function|Class|String}
	 * props:    node properties      {Object?}
	 * attrs:    node attributes      {Object?}
	 * children: node children        {Array<Tree>}
	 * key:      node key             {Any}
	 * flag:     node flag            {Number}
	 * xmlns:    node xmlns namespace {String?}
	 * owner:    node component       {Component?}
	 * node:     node DOM reference   {Node?}
	 * cast:     node type case       {Number}
	 */
	
	 /**
	  * ## Component Shape
	  *
	  * _block:      block          {Number}
	  * _tree:       current tree   {Tree?}
	  * _state:      previous state {Object}
	  *
	  * props:       current props  {Object}
	  * state:       current state  {Object}
	  * refs:        refs           {Object?}
	  * setState:    method         {Function}
	  * forceUpdate: method         {Function}
	  */
	
	/**
	 * ## Component Levels
	 *
	 * 0: not pending/blocked(ready) `non of the below`
	 * 1: blocked/pending `instance creation | prior merging new state | resolving async render`
	 */
	
	/**
	 * ## Notes
	 *
	 * `_name` prefix is used to identify function arguments
	 * when the value is expected to change within the function
	 * and private component properties
	 */
	
	/**
	 * Component
	 *
	 * @param {Object?} _props
	 */
	function Component (_props) {
		var props = _props;
		var state = this.state;
	
		this.refs = null;
		this._tree = null;
		this._block = 1;
	
		// props
		if (this.props === void 0) {
			this.props = props !== null && props !== void 0 ? props : (props = {});
		}
	
		// state
		if (state === void 0) {
			this.state = state = this.getInitialState === void 0 ? {} : dataBoundary(this, 1, props);
		}
	
		this._state = state;
	}
	
	/**
	 * setState
	 *
	 * @param {Object} state
	 * @param {Function=} callback
	 */
	function setState (state, callback) {
		if (state === void 0) {
			return;
		}
	
		var nextState = state;
		var prevState = this._state = this.state;
	
		if (typeof nextState === 'function') {
			if ((nextState = callbackBoundary(this, nextState, prevState)) === void 0) {
				return;
			}
		}
	
		this.state = updateState({}, prevState, nextState);
	
		this.forceUpdate(callback);
	}
	
	/**
	 * forceUpdate
	 *
	 * @param {Function=} callback
	 */
	function forceUpdate (callback) {
		if (this._block !== 0) {
			return;
		}
	
		var tree = this._tree;
	
		patch(tree, tree, 1);
	
		if (callback !== void 0 && typeof callback === 'function') {
			callbackBoundary(this, callback, this.state);
		}
	}
	
	/**
	 * Component Prototype
	 *
	 * @type {Object}
	 */
	Component.prototype = Object.create(null, {
		setState: {value: setState},
		forceUpdate: {value: forceUpdate},
		_: {value: 7}
	});
	
	/**
	 * Extend Class
	 *
	 * @param  {Class} type
	 * @param  {Object} proto
	 */
	function extendClass (type, proto) {
		if (proto.constructor !== type) {
			Object.defineProperty(proto, 'constructor', {
				value: type
			});
		}
	
		Object.defineProperties(proto, {
			setState: {value: setState},
			forceUpdate: {value: forceUpdate}
		});
	}
	
	/**
	 * Update State
	 *
	 * @param  {Object} state
	 * @param  {Object} prevState
	 * @param  {Object} nextState
	 * @return {Object}
	 */
	function updateState (state, prevState, nextState) {
		for (var name in prevState) {
			state[name] = prevState[name];
		}
	
		for (var name in nextState) {
			state[name] = nextState[name];
		}
	
		return state;
	}
	
	/**
	 * shouldUpdate
	 *
	 * @param  {Tree} older
	 * @param  {Tree} newer
	 * @param  {Number} cast
	 * @return {Boolean}
	 */
	function shouldUpdate (older, newer, cast) {
		var owner = older.owner;
		var nextProps = newer.props;
		var prevProps = older.props;
	
		var recievedProps;
		var defaultProps;
		var prevState;
		var nextState;
		var nextProps;
		var prevProps;
		var result;
	
		if (cast === 1) {
			if (owner._block !== 0) {
				return null;
			}
	
			nextState = owner.state;
			prevState = owner._state;
	
			owner._block = 1;
		} else {
			nextState = nextProps || object;
			prevState = prevProps || object;
		}
	
		if ((recievedProps = nextProps !== null) === true) {
			if (owner.componentWillReceiveProps !== void 0) {
				dataBoundary(owner, 0, nextProps);
			}
	
			defaultProps = older.type.defaultProps;
	
			if (defaultProps !== void 0) {
				merge(defaultProps, nextProps);
			}
		}
	
		if (
			owner.shouldComponentUpdate !== void 0 &&
			updateBoundary(owner, 0, nextProps, nextState) === false
		) {
			return (owner._block = 0, null);
		}
	
		if (recievedProps === true) {
			(cast === 1 ? owner : older).props = nextProps;
		}
	
		if (owner.componentWillUpdate !== void 0) {
			updateBoundary(owner, 1, nextProps, nextState);
		}
	
		result = renderBoundary(cast === 1 ? owner : older, cast);
	
		if (owner.componentDidUpdate !== void 0) {
			updateBoundary(owner, 2, prevProps, prevState);
		}
	
		if (cast === 1) {
			owner._block = 0;
		}
	
		return shape(result, owner, false);
	}
	
	/**
	 * Create Element
	 *
	 * @param  {String|Function} _type
	 * @param  {...} _props
	 * @return {Tree}
	 */
	function element (_type, _props) {
		var type = _type;
		var props = _props !== void 0 ? _props : null;
		var length = arguments.length;
		var children = length !== 1 ? [] : array;
		var tree = new Tree(2);
		var index = 0;
		var i = 2;
		var proto;
	
		if (props !== null) {
			if (props.cast !== void 0 || props.constructor !== Object) {
				props = null;
				i = 1;
			} else {
				tree.props = props;
	
				if (props.key !== void 0) {
					tree.key = props.key;
				}
				if (props.xmlns !== void 0) {
					tree.xmlns = props.xmlns;
				}
			}
		}
	
		switch (typeof type) {
			case 'string': {
				tree.tag = type;
				tree.attrs = props;
				break;
			}
			case 'function': {
				tree.cast = (proto = type.prototype) !== void 0 && proto.render !== void 0 ? 1 : 2
				break;
			}
		}
	
		tree.type = type;
		tree.children = children;
	
		if (length !== 1) {
			for (; i < length; i++) {
				index = adopt(tree, index, arguments[i]);
			}
		}
	
		return tree;
	}
	
	/**
	 * Adopt Element Children
	 *
	 * @param  {Tree} tree
	 * @param  {Number} index
	 * @param  {Any} child
	 * @return {Number}
	 */
	function adopt (tree, index, child) {
		var children = tree.children;
		var i = index;
		var length;
	
		if (child === null || child === void 0) {
			children[i] = text('');
		} else if (child.cast !== void 0) {
			if (tree.keyed === false && child.key !== null) {
				tree.keyed = true;
			}
	
			children[i] = child;
		} else {
			switch (typeof child) {
				case 'function': {
					children[i] = element(child, null);
					break;
				}
				case 'object': {
					if ((length = child.length) > 0) {
						for (var j = 0; j < length; j++) {
							i = adopt(tree, i, child[j]);
						}
					} else if (length === void 0 && child.constructor === Date) {
						children[i++] = text(child+'');
					}
	
					return i;
				}
				default: {
					children[i] = text(child);
				}
			}
		}
	
		return i + 1;
	}
	
	/**
	 * Create Text
	 *
	 * @param  {String|Number|Boolean} value
	 * @param  {Tree}
	 * @return {Tree}
	 */
	function text (value) {
		var tree = new Tree(1);
	
		tree.type = tree.tag = '#text';
		tree.children = ((value === true || value === false) ? '' : value);
	
		return tree;
	}
	
	/**
	 * Create Fragment
	 *
	 * @param  {Tree[]|Tree|Function} children
	 * @return {Tree}
	 */
	function fragment (children) {
		return element('section', null, children);
	}
	
	/**
	 * Copy Tree
	 *
	 * @param  {Tree} older
	 * @param  {Tree} newer
	 * @param  {Boolean} deep
	 * @return {Tree}
	 */
	function copy (older, newer, deep) {
		older.flag = newer.flag;
		older.tag = newer.tag;
		older.attrs = newer.attrs;
		older.children = newer.children;
		older.xmlns = newer.xmlns;
		older.node = newer.node;
		older.keyed = newer.keyed;
	
		if (deep === true) {
			older.cast = older.cast;
			older.type = newer.type;
			older.props = newer.props;
			older.owner = newer.owner;
			older.key = newer.key;
		}
	
		return older;
	}
	
	/**
	 * Tree
	 *
	 * @param {Number} flag
	 */
	function Tree (flag) {
		this.flag = flag;
		this.tag = null;
		this.type = null;
		this.props = null;
		this.attrs = null;
		this.children = null;
		this.xmlns = null;
		this.owner = null;
		this.node = null;
		this.key = null;
		this.keyed = false;
		this.cast = 0;
	}
	
	/**
	 * Tree Prototype
	 *
	 * @type {Object}
	 */
	Tree.prototype = element.prototype = Object.create(null);
	
	/**
	 * Shape Tree
	 *
	 * @param  {Tree} _tree
	 * @param  {Component} owner
	 * @param  {Boolean} deep
	 * @return {Tree}
	 */
	function shape (_tree, owner, deep) {
		var tree = (_tree !== null && _tree !== void 0) ? _tree : text('');
		var cast = tree.cast;
	
		if (cast === void 0) {
			switch (typeof tree) {
				case 'function': {
					tree = fragment(element(tree, owner === null ? null : owner.props));
					break;
				}
				case 'string':
				case 'number':
				case 'boolean': {
					tree = text(tree);
					break;
				}
				case 'object': {
					switch (tree.constructor) {
						case Promise: return resolve(tree, owner);
						case Array: tree = fragment(tree); break;
						case Date: tree = text(tree+''); break;
						default: tree = text('');
					}
					break;
				}
			}
			cast = tree.cast;
		} else if (cast > 0) {
			tree = fragment(tree);
		}
	
		if (cast > 0 && deep === true && tree.tag === null) {
			return extract(tree);
		}
	
		return tree;
	}
	
	/**
	 * Extract Component
	 *
	 * @param  {Tree} tree
	 * @return {Tree}
	 */
	function extract (tree) {
		var type = tree.type;
		var props = tree.props;
		var children = tree.children;
		var length = children.length;
		var cast = tree.cast;
	
		var result;
		var owner;
		var proto;
	
		if (type.defaultProps !== void 0) {
			props = merge(type.defaultProps, props === null ? {} : props);
		}
	
		if (length !== 0) {
			if (props === null) {
				props = {children: children};
			} else {
				props.children = children;
			}
		}
	
		if (cast === 1) {
			proto = type.prototype;
	
			if (proto._ === 7) {
				owner = new type(props);
			} else {
				if (proto.setState === void 0) {
					extendClass(type, proto);
				}
	
				owner = new type(props);
				Component.call(owner, props);
			}
	
			result = renderBoundary(owner, cast);
	
			owner._block = 0;
	
			result = shape(result, owner, false);
	
			owner._tree = tree;
			tree.owner = owner;
		} else {
			tree.cast = cast;
			tree.owner = type;
	
			result = shape(renderBoundary(tree, cast), null, false);
		}
	
		tree.flag = result.flag;
		tree.tag = result.tag;
		tree.attrs = result.attrs;
		tree.children = result.children;
		tree.keyed = result.keyed;
		tree.xmlns = result.xmlns;
	
		return result;
	}
	
	/**
	 * Resolve Promises
	 *
	 * @param {Promise} pending
	 * @param {Component} owner
	 */
	function resolve (pending, owner) {
		var tree = owner._tree;
	
		if (tree === null) {
			tree = text('');
		}
	
		owner._block = 1;
	
		pending.then(function (value) {
			var status = value.status;
	
			if (
				value !== void 0 &&
				value !== null &&
				status !== void 0
			) {
				if (status >= 200 && status < 400) {
					value.text().then(function (source) {
						var addrs = value.url;
						var cache = owner._cache === void 0 ? (owner._cache = {}) : owner._cache;
						var store = cache[addrs];
						var older;
						var result;
	
						if (store !== void 0) {
							older = store.src;
							result = store.res;
						}
	
						if (older !== source) {
							result = addrs.lastIndexOf('.js') > addrs.length - 4 ? module(source, owner, addrs) : source;
							cache[addrs] = {src: source, res: result};
						}
	
						refresh(result, owner);
					});
				} else {
					refresh(tree, owner);
				}
			} else {
				refresh(value, owner);
			}
		});
	
		return tree;
	}
	
	/**
	 * Refresh Module
	 *
	 * @param {Any}
	 * @param {Component}
	 */
	function refresh (source, owner) {
		var older = owner._tree;
		var newer = shape(source, owner, false);
	
		owner._block = 0;
	
		if (older === null) {
			return;
		}
	
		if (older.tag !== newer.tag) {
			swap(older, newer, false);
		} else {
			patch(older, newer, 0);
		}
	}
	
	/**
	 * Extract Module
	 *
	 * @param  {String} source
	 * @param  {Component} owner
	 * @return {Function}
	 */
	function module (source, owner, addrs) {
		try {
			return new Function('"use strict";' + format(source)).call(global);
		} catch (err) {
			errorBoundary(err instanceof Error ? err.stack : err, owner, 6, addrs);
		}
	}
	
	/**
	 * Format Source
	 *
	 * @param  {String} source
	 * @return {String}
	 */
	function format (source) {
		return source.replace(/^[\t ]*export[\t ]+(?:default[\t ]|)/gm, 'return ');
	}
	
	/**
	 * Data Boundary
	 *
	 * @param  {Component} owner
	 * @param  {Number} type
	 * @param  {Object} props
	 * @return {Object?}
	 */
	function dataBoundary (owner, type, props) {
		try {
			switch (type) {
				case 0: return owner.componentWillReceiveProps(props);
				case 1: return owner.getInitialState(props);
				case 2: return owner.getDefaultProps(props);
			}
		} catch (err) {
			errorBoundary(err, owner, 0, type);
		}
	}
	
	/**
	 * Update Boundary
	 *
	 * @param  {Component} owner
	 * @param  {Number} type
	 * @param  {Object} props
	 * @param  {Object} state
	 * @return {Boolean?}
	 */
	function updateBoundary (owner, type, props, state) {
		try {
			switch (type) {
				case 0: return owner.shouldComponentUpdate(props, state);
				case 1: return owner.componentWillUpdate(props, state);
				case 2: return owner.componentDidUpdate(props, state);
			}
		} catch (err) {
			errorBoundary(err, owner, 1, type);
		}
	}
	
	/**
	 * Render Boundary
	 *
	 * @param  {Component|Tree} owner
	 * @param  {Number} cast
	 * @return {Tree}
	 */
	function renderBoundary (owner, cast) {
		try {
			switch (cast) {
				case 1: return owner.render(owner.props, owner.state);
				case 2: return owner.type(owner.props || object);
			}
		} catch (err) {
			return errorBoundary(err, cast === 1 ? owner : owner.type, 3, cast);
		}
	}
	
	/**
	 * Node Boundary
	 *
	 * @param  {Number} flag
	 * @param  {Tree} newer
	 * @param  {String?} xmlns
	 * @param  {Component} owner
	 * @return {Node}
	 */
	function nodeBoundary (flag, newer, xmlns, owner) {
		try {
			if (xmlns === null) {
				return document.createElement(newer.tag);
			}
			return document.createElementNS(newer.xmlns === xmlns, newer.tag);
		} catch (err) {
			return errorBoundary(err, owner, 5, (newer.flag = 3, 0));
		}
	}
	
	/**
	 * Mount Boundary
	 *
	 * @param {Component} owner
	 * @param {Number} type
	 */
	function mountBoundary (owner, type) {
		try {
			switch (type) {
				case 0: return owner.componentWillMount();
				case 1: return owner.componentDidMount();
				case 2: return owner.componentWillUnmount();
			}
		} catch (err) {
			errorBoundary(err, owner, 4, type);
		}
	}
	
	/**
	 * Callback Boundary
	 *
	 * @param {Function} callback
	 * @param {Component} owner
	 * @param {Object|Node} param
	 */
	function callbackBoundary (owner, callback, param) {
		try {
			return callback.call(owner, param);
		} catch (err) {
			errorBoundary(err, owner, 2, callback);
		}
	}
	
	/**
	 * Events Boundary
	 *
	 * @param {Component} owner
	 * @param {Function} fn
	 * @param {Event} e
	 */
	function eventBoundary (owner, fn, e) {
		try {
			return fn.call(owner, owner.props, owner.state, e);
		} catch (err) {
			errorBoundary(err, owner, 5, fn);
		}
	}
	
	/**
	 * Error Boundary
	 *
	 * @param  {Error|String} message
	 * @param  {Component} owner
	 * @param  {Number} type
	 * @param  {Number|Function} from
	 * @return {Tree?}
	 */
	function errorBoundary (message, owner, type, from) {
		var name = '#unknown';
		var location = name;
		var tree;
	
		try {
			if (typeof from !== 'function') {
				switch (type) {
					case 0: {
						switch (from) {
							case 0: location = 'componentWillReceiveProps'; break;
							case 1: location = 'getInitialState'; break;
							case 2: location = 'getDefaultProps'; break;
						}
						break;
					}
					case 1: {
						switch (from) {
							case 0: location = 'shouldComponentUpdate'; break;
							case 1: location = 'componentWillUpdate'; break;
							case 2: location = 'componentDidUpdate'; break;
						}
						break;
					}
					case 3: {
						switch (from) {
							case 1: location = 'render'; break;
							case 2: location = 'function'; break;
						}
						break;
					}
					case 4: {
						switch (from) {
							case 0: location = 'componentWillMount'; break;
							case 1: location = 'componentDidMount'; break;
							case 2: location = 'componentWillUnmount'; break;
						}
						break;
					}
					case 5: {
						location = 'render';
						break;
					}
					case 6: {
						location = from;
						break;
					}
				}
			} else {
				location = from.name;
			}
	
			if (owner !== null) {
				if (owner.componentDidThrow !== void 0) {
					tree = owner.componentDidThrow({location: location, message: message});
				}
	
				if (type === 3 && from === 2) {
					name = owner.name;
				} else {
					name = owner.constructor.name;
				}
			}
		} catch (err) {
			location = 'componentDidThrow';
			message = err;
		}
	
		error(name, location, message instanceof Error ? message.stack : message);
	
		if (type === 3 || type === 5) {
			return shape(tree === void 0 ? element('noscript') : tree, owner, false);
		}
	}
	
	/**
	 * Error Logger
	 *
	 * @param  {String} component
	 * @param  {String} location
	 * @param  {String} message
	 */
	function error (component, location, message) {
		console.error(
			message+'\n\n  ^^ Error caught in Component '+'"'+component+'"'+
			' from "'+location+'" \n'
		);
	}
	
	/**
	 * Create Attributes
	 *
	 * @param {Tree} newer
	 * @param {Component?} owner
	 * @param {String?} xmlns
	 * @param {Node} node
	 * @param {Boolean} hydrate
	 */
	function attribute (newer, owner, xmlns, node, hydrate) {
		var attrs = newer.attrs;
	
		for (var name in attrs) {
			if (valid(name) === true) {
				if (evt(name) === true) {
					event(name.toLowerCase().substring(2), attrs[name], owner, node);
				} else if (hydrate === false) {
					assign(attr(name), name, attrs[name], xmlns, node);
				}
			} else if (name === 'ref') {
				refs(attrs[name], owner, node);
			}
		}
	}
	
	/**
	 * Reconcile Attributes
	 *
	 * @param {Tree} newer
	 * @param {Tree} older
	 */
	function attributes (older, newer) {
		var oldAttrs = older.attrs;
		var newAttrs = newer.attrs;
		var xmlns = older.xmlns;
		var node = older.node;
	
		var oldValue;
		var newValue;
	
		for (var name in newAttrs) {
			if (valid(name) === true && evt(name) === false) {
				oldValue = oldAttrs[name];
				newValue = newAttrs[name];
	
				if (newValue !== oldValue && newValue !== null && newValue !== void 0) {
					assign(attr(name), name, newValue, xmlns, node);
				}
			}
		}
	
		for (var name in oldAttrs) {
			if (valid(name) === true && evt(name) === false) {
				newValue = newAttrs[name];
	
				if (newValue === null || newValue === void 0) {
					assign(attr(name), name, newValue, xmlns, node);
				}
			}
		}
	
		older.attrs = newAttrs;
	}
	
	/**
	 * Create Refs
	 *
	 * @param  {Function|String} value
	 * @param  {Component} owner
	 * @param  {Node} node
	 */
	function refs (value, owner, node) {
		if (owner !== null && owner.refs === null) {
			owner.refs = {};
		}
	
		switch (typeof value) {
			case 'string': {
				if (owner !== null) {
					owner.refs[value] = node;
				}
				break;
			}
			case 'function': {
				callbackBoundary(owner, value, node);
				break;
			}
		}
	}
	
	/**
	 * Assign Attributes
	 *
	 * @param {Number} type
	 * @param {String} name
	 * @param {Any} value
	 * @param {String?} xmlns
	 * @param {Node} node
	 */
	function assign (type, name, value, xmlns, node) {
		switch (type) {
			case 1: {
				if (xmlns === null) {
					node.className = value;
				} else {
					assign(6, 'class', value, xmlns, node);
				}
				break;
			}
			case 2: {
				node.id = value;
				break;
			}
			case 3: {
				if (typeof value === 'string') {
					node.style.cssText = value;
				} else {
					style(value, node.style);
				}
				break;
			}
			case 4: {
				node.innerHTML = value;
				break;
			}
			case 5: {
				if (node[name] === void 0) {
					node.style.setProperty(name, value);
				} else if (isNaN(Number(value)) === true) {
					assign(6, name, value, xmlns, node);
				} else {
					node[name] = value;
				}
				break;
			}
			case 6: {
				if (name === 'xlink:href') {
					node.setAttributeNS('http://www.w3.org/1999/xlink', 'href', value);
				} else if (value !== null && value !== void 0 && value !== false) {
					node.setAttribute(name, (value === true ? '' : value));
				} else {
					node.removeAttribute(name);
				}
				break;
			}
		}
	}
	
	/**
	 * Attribute Identifier [Whitelist]
	 *
	 * @param  {String} name
	 * @param  {Tree} tree
	 * @return {Number}
	 */
	function attr (name, tree) {
		switch (name) {
			case 'class': case 'className': return 1;
			case 'id': return 2;
			case 'style': return 3;
			case 'innerHTML': return 4;
			case 'width': case 'height': return 5;
			default: return 6;
		}
	}
	
	/**
	 * Attribute Validator [Blacklist]
	 *
	 * @param  {String} name
	 * @return {Boolean}
	 */
	function valid (name) {
		return name !== 'key' && name !== 'children' && name !== 'ref';
	}
	
	/**
	 * Event Attribute Validator [Whitelist]
	 *
	 * @param  {String} name
	 * @return {Boolean}
	 */
	function evt (name) {
		return name.charCodeAt(0) === 111 && name.charCodeAt(1) === 110;
	}
	
	/**
	 * Assign Styles
	 *
	 * @param {Object} source
	 * @param {Object} target
	 */
	function style (source, target) {
		for (var name in source) {
			if (name in target) {
				target[name] = source[name];
			}
		}
	}
	
	/**
	 * Merge Props
	 *
	 * @param {Object} source
	 * @param {Object} props
	 */
	function merge (source, props) {
		for (var name in source) {
			if (props[name] === void 0) {
				props[name] = source[name];
			}
		}
	}
	
	/**
	 * Event Station
	 *
	 * @param {String} type
	 * @param {Function} listener
	 * @param {Component} owner
	 * @param {Node} node
	 */
	function event (type, listener, owner, node) {
		if (owner !== null) {
			node.addEventListener(type, function (e) {
				var result = eventBoundary(owner, listener, e);
	
				if (result !== void 0) {
					if (e.defaultPrevented !== true && e.allowDefault !== true) {
						e.preventDefault();
					}
	
					if (result !== false) {
						owner.setState(result);
					}
				}
			}, false);
		} else {
			node.addEventListener(type, listener, false);
		}
	}
	
	/**
	 * Create Node
	 *
	 * @param  {Tree} newer
	 * @param  {String?} _xmlns
	 * @param  {Component?} _owner
	 * @return {Node}
	 */
	function create (newer, _xmlns, _owner) {
		var cast = newer.cast;
		var xmlns = _xmlns;
		var owner = _owner;
		var flag = newer.flag;
	
		var node;
		var children;
		var length;
	
		if (flag === 1) {
			return newer.node = document.createTextNode(newer.children);
		}
	
		if (newer.xmlns !== null) {
			xmlns = newer.xmlns;
		}
	
		if (cast > 0) {
			extract(newer);
	
			owner = newer.owner;
			flag = newer.flag;
	
			if (owner.componentWillMount !== void 0) {
				mountBoundary(owner, 0);
			}
	
			if (flag === 1) {
				return newer.node = document.createTextNode(newer.children);
			}
		}
	
		node = nodeBoundary(flag, newer, xmlns, owner);
	
		// error creating node
		if (newer.flag === 3) {
			newer.flag = flag;
			node = create(node, xmlns, owner);
		}
	
		children = newer.children;
		length = children.length;
	
		if (length > 0) {
			for (var i = 0, child; i < length; i++) {
				child = children[i];
	
				if (child.node !== null) {
					child = children[i] = copy(new Tree(child.flag), child, true);
				}
	
				append(child, node, create(child, xmlns, owner));
			}
		}
	
		attribute(newer, owner, xmlns, node, false);
	
		return newer.node = node;
	}
	
	/**
	 * Append Node
	 *
	 * @param {Tree} newer
	 * @param {Node} parent
	 * @param {Function} node
	 */
	function append (newer, parent, node) {
		parent.appendChild(node);
	
		if (newer.cast > 0 && newer.owner.componentDidMount !== void 0) {
			mountBoundary(newer.owner, 1);
		}
	}
	
	/**
	 * Insert Node
	 *
	 * @param {Tree} newer
	 * @param {Node} parent
	 * @param {Node} node
	 * @param {Node} anchor
	 */
	function insert (newer, parent, node, sibling) {
		parent.insertBefore(node, sibling);
	
		if (newer.cast > 0 && newer.owner.componentDidMount !== void 0) {
			mountBoundary(newer.owner, 1);
		}
	}
	
	/**
	 * Remove Node
	 *
	 * @param {Tree} older
	 * @param {Node} parent
	 */
	function remove (older, parent) {
		if (older.cast > 0 && older.owner.componentWillUnmount !== void 0) {
			mountBoundary(older.owner, 2);
		}
	
		parent.removeChild(older.node);
	
		older.owner = null;
		older.node = null;
	}
	
	/**
	 * Node Replacer
	 *
	 * @param {Tree} newer
	 * @param {Tree} older
	 * @param {Node} parent
	 * @param {Node} node
	 */
	function replace (older, newer, parent, node) {
		if (older.cast > 0 && older.owner.componentWillUnmount !== void 0) {
			mountBoundary(older.owner, 2);
		}
	
		parent.replaceChild(node, older.node);
	
		older.owner = null;
		older.node = null;
	
		if (newer.cast > 0 && newer.owner.componentDidMount !== void 0) {
			mountBoundary(newer.owner, 1);
		}
	}
	
	/**
	 * Move Node
	 *
	 * @param {Node} node
	 * @param {Node} next
	 * @param {Node} sibling
	 */
	function move (node, older, sibling) {
		node.insertBefore(older.node, sibling);
	}
	
	/**
	 * Swap Node
	 *
	 * @param {Tree} newer
	 * @param {Tree} older
	 * @param {Boolean} deep
	 */
	function swap (older, newer, deep) {
		older.node.parentNode.replaceChild(create(newer, null, null), older.node);
	
		copy(older, newer, deep);
	}
	
	/**
	 * Empty Children
	 *
	 * @param  {Tree} older
	 * @param  {Tree} newer
	 */
	function empty (older, newer) {
		var parent = older.node;
		var children = older.children;
		var length = children.length;
	
		for (var i = 0, child; i < length; i++) {
			child = children[i];
	
			if (child.cast > 0 && child.owner.componentWillUnmount !== void 0) {
				mountBoundary(child.owner, 2);
			}
	
			child.owner = null;
			child.node = null;
		}
	
		older.children = newer.children;
		parent.textContent = null;
	}
	
	/**
	 * Populate Children
	 *
	 * @param  {Tree} older
	 * @param  {Tree} newer
	 */
	function populate (older, newer) {
		var parent = older.node;
		var children = newer.children;
		var length = children.length;
	
		for (var i = 0, child; i < length; i++) {
			append(child = children[i], parent, create(child, null, null));
		}
	
		older.children = children;
	}
	
	/**
	 * Update Text Content
	 *
	 * @param {Tree} older
	 * @param {Tree} newer
	 */
	function content (older, newer) {
		if (older.children !== newer.children) {
			older.node.nodeValue = older.children = newer.children;
		}
	}
	
	/**
	 * Render Tree
	 *
	 * @param  {Tree} _newer
	 * @param  {Node} _target
	 */
	function render (_newer, _target) {
		var newer = _newer;
		var target = _target;
	
		if (target === void 0 || target === document) {
			if (mount === null) {
				mount = document.body || document.documentElement;
			}
	
			target = mount;
		}
	
		if (newer === void 0 || newer === null) {
			newer = text('');
		} else if (newer.flag === void 0) {
			switch (typeof newer) {
				case 'function': {
					newer = element(newer);
					break;
				}
				case 'object': {
					newer = fragment(newer);
					break;
				}
				case 'number':
				case 'boolean':
				case 'string': {
					newer = text(newer);
					break;
				}
			}
		}
	
		var older = target._older;
	
		if (older !== void 0) {
			if (older.type === newer.type) {
				patch(older, newer, older.cast);
			} else {
				swap(older, newer, true);
			}
		} else {
			append(newer, target, create(newer, null, null));
			target._older = newer;
		}
	}
	
	/**
	 * Shallow Render
	 *
	 * @param  {Any} tree
	 * @return {Tree}
	 */
	function shallow (tree) {
		return shape(tree, null, true);
	}
	
	/**
	 * Patch Tree
	 *
	 * @param {Tree} older
	 * @param {Tree} newer
	 * @param {Number} cast
	 */
	function patch (older, _newer, cast) {
		var newer = _newer;
	
		if (cast > 0) {
			if ((newer = shouldUpdate(older, newer, cast)) === null) {
				return;
			}
	
			if (newer.tag !== older.tag) {
				return swap(older, newer, false);
			}
		}
	
		if (older.flag === 1) {
			return content(older, newer);
		}
	
		var newLength = newer.children.length;
		var oldLength = older.children.length;
	
		// append children
		if (oldLength === 0) {
			if (newLength !== 0) {
				populate(older, newer);
			}
			return;
		}
	
		// empty children
		if (newLength === 0) {
			if (oldLength !== 0) {
				empty(older, newer);
			}
			return;
		}
	
		// patch keyed children
		if (older.keyed === true) {
			keyed(older, newer);
		} else {
			nonkeyed(older, newer);
		}
	
		attributes(older, newer);
	}
	
	/**
	 * Reconcile Non-Keyed Children
	 *
	 * @param  {Tree} older
	 * @param  {Tree} newer
	 */
	function nonkeyed (older, newer) {
		var parent = older.node;
		var oldChildren = older.children;
		var newChildren = newer.children;
		var newLength = newChildren.length;
		var oldLength = oldChildren.length;
		var length = newLength > oldLength ? newLength : oldLength;
	
		// patch non-keyed children
		for (var i = 0, newChild, oldChild; i < length; i++) {
			if (i >= newLength) {
				remove(oldChild = oldChildren.pop(), parent);
				oldLength--;
			} else if (i >= oldLength) {
				append(newChild = oldChildren[i] = newChildren[i], parent, create(newChild, null, null));
				oldLength++;
			} else {
				newChild = newChildren[i];
				oldChild = oldChildren[i];
	
				if (newChild.flag === 1 && oldChild.flag === 1) {
					content(oldChild, newChild);
				} else if (newChild.type !== oldChild.type) {
					replace(oldChild, oldChildren[i] = newChild, parent, create(newChild, null, null));
				} else {
					patch(oldChild, newChild, oldChild.cast);
				}
			}
		}
	}
	
	/**
	 * Reconcile Keyed Children [Simple]
	 *
	 * @param {Tree} older
	 * @param {Tree} newer
	 */
	function keyed (older, newer) {
	 	var parent = older.node;
	 	var oldChildren = older.children;
	 	var newChildren = newer.children;
	 	var oldLength = oldChildren.length;
	 	var newLength = newChildren.length;
	
	 	var oldStart = 0;
	 	var newStart = 0;
	 	var oldEnd = oldLength - 1;
	 	var newEnd = newLength - 1;
	
	 	var oldStartNode = oldChildren[oldStart];
	 	var newStartNode = newChildren[newStart];
	 	var oldEndNode = oldChildren[oldEnd];
	 	var newEndNode = newChildren[newEnd];
	
	 	var nextPos;
	 	var nextNode;
	
	 	// step 1, sync leading [a, b ...], trailing [... c, d], opposites [a, b] [b, a] recursively
	 	outer: while (true) {
	 		// sync leading nodes
	 		while (oldStartNode.key === newStartNode.key) {
	 			newChildren[newStart] = oldStartNode;
	
	 			patch(oldStartNode, newStartNode, oldStartNode.cast);
	
	 			oldStart++;
	 			newStart++;
	
	 			if (oldStart > oldEnd || newStart > newEnd) {
	 				break outer;
	 			}
	
	 			oldStartNode = oldChildren[oldStart];
	 			newStartNode = newChildren[newStart];
	 		}
	
	 		// sync trailing nodes
	 		while (oldEndNode.key === newEndNode.key) {
	 			newChildren[newEnd] = oldEndNode;
	
	 			patch(oldEndNode, newEndNode, oldEndNode.cast);
	
	 			oldEnd--;
	 			newEnd--;
	
	 			if (oldStart > oldEnd || newStart > newEnd) {
	 				break outer;
	 			}
	
	 			oldEndNode = oldChildren[oldEnd];
	 			newEndNode = newChildren[newEnd];
	 		}
	
	 		// move and sync nodes from right to left
	 		if (oldEndNode.key === newStartNode.key) {
	 			newChildren[newStart] = oldEndNode;
	 			oldChildren[oldEnd] = oldStartNode;
	
	 			patch(oldEndNode, newStartNode, oldEndNode.cast);
	 			move(parent, oldEndNode, oldStartNode.node);
	
	 			oldEnd--;
	 			newStart++;
	
	 			oldEndNode = oldChildren[oldEnd];
	 			newStartNode = newChildren[newStart];
	
	 			continue;
	 		}
	
	 		// move and sync nodes from left to right
	 		if (oldStartNode.key === newEndNode.key) {
	 			newChildren[newEnd] = oldStartNode;
	 			oldChildren[oldStart] = oldEndNode;
	
	 			nextPos = newEnd + 1;
	 			nextNode = nextPos < newLength ? oldChildren[nextPos].node : null;
	
	 			patch(oldStartNode, newEndNode, oldStartNode.cast);
	 			move(parent, oldStartNode, nextNode);
	
	 			oldStart++;
	 			newEnd--;
	
	 			oldStartNode = oldChildren[oldStart];
	 			newEndNode = newChildren[newEnd];
	
	 			continue;
	 		}
	
	 		break;
	 	}
	
	 	// step 2, remove or insert
	 	if (oldStart > oldEnd) {
	 		// all nodes from old children are synced, insert the difference
	 		if (newStart <= newEnd) {
	 			nextPos = newEnd + 1;
	 			nextNode = nextPos < newLength ? newChildren[nextPos].node : null;
	
	 			do {
	 				insert (newStartNode = newChildren[newStart++], parent, create(newStartNode, null, null), nextNode);
	 			} while (newStart <= newEnd);
	 		}
	 	} else if (newStart > newEnd) {
	 		// all nodes from new children are synced, remove the difference
	 		do {
	 			remove(oldStartNode = oldChildren[oldStart++], parent);
	 		} while (oldStart <= oldEnd);
	 	} else {
	 		// could not completely sync children, move on the the next phase
	 		complex(older, newer, oldStart, newStart, oldEnd, newEnd)
	 	}
	
	 	older.children = newChildren;
	}
	
	/**
	 * Reconcile Keyed Children [Complex]
	 *
	 * @param {Tree} older
	 * @param {Tree} newer
	 * @param {Number} oldStart
	 * @param {Number} newStart
	 * @param {Number} oldEnd
	 * @param {Number} newEnd
	 */
	function complex (older, newer, oldStart, newStart, oldEnd, newEnd) {
		var parent = older.node;
		var oldChildren = older.children;
		var newChildren = newer.children;
		var oldKeys = {};
		var newKeys = {};
		var oldLength = oldEnd + 1;
		var newLength = newEnd + 1;
		var oldOffset = oldLength - oldStart;
		var newOffset = newLength - newStart;
		var oldIndex = oldStart;
		var newIndex = newStart;
		var childNodes = parent.childNodes;
		var oldChild;
		var newChild;
	
		// step 1, build a map of keys
		while (true) {
			if (oldIndex !== oldLength) {
				oldChild = oldChildren[oldIndex++];
				oldKeys[oldChild.key] = oldChild;
			}
	
			if (newIndex !== newLength) {
				newChild = newChildren[newIndex++];
				newKeys[newChild.key] = newChild;
			}
	
			if (oldIndex === oldLength && newIndex === newLength) {
				break;
			}
		}
	
		// step 2, insert and remove
		while (true) {
			// insert new children
			if (newIndex !== newStart) {
				newChild = newChildren[--newIndex];
				oldChild = oldKeys[newChild.key];
	
				// new child doesn't exist in old children, insert
				if (oldChild === void 0) {
					insert(newChild, parent, create(newChild, null, null), childNodes[newIndex]);
					newOffset--;
				} else {
					patch(oldChild, newChild, oldChild.cast);
					newChildren[newIndex] = oldChild;
				}
			}
	
			// remove old children
			if (oldIndex !== oldStart) {
				oldChild = oldChildren[--oldIndex];
				newChild = newKeys[oldChild.key];
	
				// old child doesn't exist in new children, remove
				if (newChild === void 0) {
					remove(oldChild, parent);
					oldOffset--;
				}
			}
	
			if (oldIndex === oldStart && newIndex === newStart) {
				break;
			}
		}
	
		// step 5, move remaining, when insert/remove does not sync indexes
		if ((oldOffset + newOffset) - 2 > 0) {
			for (var i = newStart; i < newLength; i++) {
				newChild = newChildren[i];
				oldChild = oldKeys[newChild.key];
	
				if (oldChild !== void 0) {
					move(parent, oldChild, childNodes[i+1]);
				}
			}
		}
	}
	
	
	if (global.window !== void 0) {
		global.h = element;
	}
	
	return {
		version: version,
		h: element,
		createElement: element,
		Component: Component,
		render: render,
		shallow: shallow
	}
	
}));
