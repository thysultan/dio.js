/**
 * @name Readable
 * @constructor
 * @type {function}
 */
var Readable = require('stream').Readable

/**
 * @param {function?} callback
 * @return {Stream}
 */
function toStream (callback) {
	var container = new Stream(this, this.host || createElementSnapshot(this))

	if (typeof callback === 'function')
		container.on('end', callback)

	return container.setEncoding('utf8')
}

/**
 * @name Stream
 * @constructor
 * @property {Element} host
 * @property {Array<Element>} queue
 * @param {Element} element
 * @param {Element} host
 */
function Stream (element, host) {
	this.host = host
	this.queue = [element]
	Readable.call(this)
}
/**
 * @alias Stream#prototype
 * @memberof Stream
 * @type {object}
 */
Stream.prototype = Object.create(Readable.prototype, {
	/**
	 * @alias Stream#_read
	 * @memberof Stream
	 * @private
	 * @type {function}
	 */
	_read: {
		value: function () {
			if (this.queue.length > 0)
				read(this.queue.pop(), this.host, this.queue, this)
			else
				this.push(null)
		}
	}
})

/**
 * @param {string} payload
 * @param {Readable} container
 */
function write (payload, container) {
	if ((container.push(payload, 'utf8'), !payload))
		container.read(0)
}

/**
 * @param {Element} element
 * @param {Element} host
 * @param {Array<Element>} queue
 * @param {Readable} container
 */
function read (element, host, queue, container) {
	var payload = ''
	var children = element.children

	switch (element.host = host, element.id) {
		case SharedElementText:
		case SharedElementEmpty:
			return write(getTextEscape(children), container)
		case SharedElementComment:
			return write(getStringComment(element), container)
		case SharedElementCustom:
			return read(getCustomElement(element), host, queue, container)
		case SharedElementComponent:
			return read((container.host = element).active ? children : getComponentChildren(element, host), element, queue, container)
		case SharedElementPromise:
			return element.context = element.type.then(function (value, done) {
				if (done !== false)
					read(getElementDefinition(value), host, queue, container)
			}, function (err) {
				read(getElementDefinition(getErrorBoundary(host, err)), host, queue, container)
			})
		case SharedElementNode:
			if (element.context)
				return element.context = write(element.context, container)
			else
				payload += '<' + element.type + getStringProps(element, element.props) + '>'

			if (isVoidType(element.type))
				return write(payload, container)
			else
				queue.push((element.context = (element.context || '') + '</' + element.type + '>', element))
		default:
			for (var length = children.length; length > 0 ; --length)
				queue.push(children = children.prev)
	}

	write(payload, container)
}
