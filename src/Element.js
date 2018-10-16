import * as Enum from './Enum.js'
import * as Utility from './Utility.js'
import * as Children from './Children.js'
import * as Assert from './Assert.js'
import * as Event from './Event.js'

/**
 * @param {*} key
 * @param {*} type
 * @param {object} props
 * @param {object} children
 * @param {number} constructor
 */
export function struct (key, type, props, children, constructor) {
	return {
		key: key,
		type: type,
		props: props,
		children: children,
		constructor: constructor,
		handleEvent: Event.handle,
		0: ''
	}
}

/**
 * @param {*} key
 * @return {object}
 */
export function empty (key) {
	return struct(key, '#empty', null, '', Enum.empty)
}

/**
 * @param {(number|string)} value
 * @param {*} key
 * @return {object}
 */
export function text (value, key) {
	return struct(key, '#text', null, value, Enum.text)
}

/**
 * @param {(number|string)} value
 * @param {*} key
 * @return {object}
 */
export function comment (value, key) {
	return struct(key, '#comment', null, value, Enum.comment)
}

/**
 * @param {object} value
 * @param {*} key
 * @return {object}
 */
export function fragment (value, key) {
	return struct(key, '#fragment', null, (value.push(empty(Enum.key)), value), Enum.fragment)
}

/**
 * @param {*} value
 * @param {*} target
 * @param {*} props
 * @return {object}
 */
export function portal (value, target, props) {
	return struct(props && props.key, target, props, [root([value])], Enum.portal)
}

/**
 * @param {object} value
 * @return {object}
 */
export function root (value) {
	return from(value, 0)
}

/**
 * @param {object} value
 * @return {object}
 */
export function resolve (value) {
	return [root(value !== null && typeof value === 'object' && 'default' in value ? value.default : value), empty(Enum.key)]
}

/**
 * @param {*} value
 * @param {number} index
 * @return {object}
 */
export function from (value, index) {
	if (value != null) {
		switch (typeof value) {
			case 'boolean':
				break
			case 'number':
			case 'string':
				return text(value, Utility.hash(index))
			default:
				switch (value.constructor) {
					case Enum.thenable:
					case Enum.fragment:
					case Enum.component:
					case Enum.node:
					case Enum.comment:
						return value
					case Enum.portal:
						return fragment([empty(Utility.hash(Enum.key)), value], value.key)
					case Utility.array:
						return fragment(value.map(from), Utility.hash(index))
					default:
						if (Utility.iterable(value)) {
							return fragment(Children.map(value, from), Utility.hash(index))
						} else {
							return create(value)
						}
				}
		}
	}

	return empty(Utility.hash(index))
}

/**
 * @param {*} a
 * @param {(object|*)?} b
 * @param {...*?}
 * @return {object}
 * @public
 */
export function create (a, b) {
	var index = 0
	var length = arguments.length
	var i = b == null || b.constructor === Utility.object ? 2 : 1
	var size = length - i
	var constructor = identity(a)
	var type = a
	var props = i === 2 && b || {}
	var children = []
	var element = struct(props.key, type, props, children, constructor)

	if (constructor === Enum.component) {
		if (size > 0) {
			for (props.children = size === 1 ? arguments[i++] : children = []; i < length; ++i) {
				children.push(arguments[i])
			}
		}

		if (type[Enum.defaultProps]) {
			defaults(element, type[Enum.defaultProps])
		}

		Assert.types(element, props, Enum.propTypes)
	} else {
		if (size > 0) {
			for (; i < length; ++i) {
				children[index] = from(arguments[i], index++)
			}
		}
		if (constructor < Enum.node) {
			children.push(empty(Enum.key))
		}
	}

	return element
}

/**
 * @param {*} value
 * @return {number}
 */
export function identity (value) {
	switch (typeof value) {
		case 'function':
			return Enum.component
		case 'number':
			return Enum.fragment
		case 'object':
			if (Utility.thenable(value)) {
				return Enum.thenable
			}
	}

	return Enum.node
}

/**
 * @param {*} value
 * @return {string}
 */
export function display (value) {
	switch (typeof value) {
		case 'function':
			return display(value[Enum.displayName] || value.name)
		case 'object':
			return display(value.type)
		case 'number':
			return display('Fragment')
	}

	return value
}

/**
 * @param {object} element
 * @param {object?} value
 * @return {object}
 */
export function defaults (element, value) {
	if (value) {
		if (typeof value === 'function') {
			defaults(element, value.call(element.type, element.props))
		} else {
			Utility.defaults(element.props, value)
		}
	}

	return element
}

/**
 * @param {object} value
 * @param {...*?}
 * @return {object}
 */
export function clone (element) {
	return defaults(create.apply(null, [element.type].concat([].slice.call(arguments, 1))), element.props)
}

/**
 * @param {*} element
 * @return {boolean}
 */
export function valid (element) {
	return element != null && typeof element.constructor === 'number'
}

/**
 * @param {object} element
 * @return {object}
 */
export function node (element) {
	return element.constructor < Enum.node ? node(pick(element)) : element
}

/**
 * @param {object} element
 * @return {object}
 */
export function parent (element) {
	return element.constructor < Enum.portal ? parent(get(element, Enum.parent)) : element
}

/**
 * @param {object} element
 * @param {*} key
 * @return {object}
 */
export function get (element, key) {
	return element[key]
}

/**
 * @param {object} element
 * @param {*} key
 * @param {*} value
 * @return {object}
 */
export function set (element, key, value) {
	return element[key] = value
}

/**
 * @param {object} element
 * @param {*} key
 * @return {boolean}
 */
export function has (element, key) {
	return !!get(element, key)
}

/**
 * @param {object} element
 * @return {object}
 */
export function pick (element) {
	return element.children[0]
}

/**
 * @param {object} element
 * @param {object} value
 * @return {object}
 */
export function put (element, value) {
	return element.children[0] = value
}
