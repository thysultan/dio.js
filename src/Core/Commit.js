/**
 * @param {*} element
 * @return {Element}
 */
function commitElement (element) {
	if (element != null)
		switch (element.constructor) {
			case Element:
				return element
			case Array:
				return elementFragment(element)
			case String:
			case Number:
				return elementText(element)
			case Function:
			case Promise:
				return createElement(element)
			case Boolean:
				break
			default:
				return elementUnknown(element)
		}

	return elementText('')
}

/**
 * @param {Element} element
 * @param {number} signature
 * @return {Element}
 */
function commitSibling (element, signature) {
	if (!isValidElement(element))
		return elementEmpty(DOM(null))

	if (signature < SharedElementEmpty)
		return element.id < SharedElementEmpty ? commitSibling(element, SharedSiblingChildren) : element

	if (signature === SharedSiblingElement)
		return commitSibling(element.next, -SharedSiblingElement)

	if (!getHostChildren(element).length)
		return commitSibling(element.next, SharedSiblingChildren)

	return commitSibling(getHostChildren(element).next, -SharedSiblingChildren)
}

/**
 * @param {Element} element
 * @param {Element} snapshot
 */
function commitPromise (element, snapshot) {
	snapshot.type.then(function (value) {
		if (!element.DOM)
			return

		if (element.id === SharedElementPromise)
			reconcileChildren(element, elementFragment(commitElement(value)))
		else
			reconcileElement(element, commitElement(value))
	}).catch(function (e) {
		errorBoundary(element, e, SharedSiteAsync+':'+SharedSiteRender, SharedErrorActive)
	})
}

/**
 * @param {Element} element
 * @param {List} children
 * @param {Element} host
 * @param {number} signature
 * @param {number} mode
 */
function commitChildren (element, children, host, signature, mode) {
	var length = children.length
	var next = children.next
	var sibling = next

	while (length-- > 0) {
		if (next.DOM) {
			children.insert(next = merge(new Element(SharedElementNode), sibling = next), sibling)
			children.remove(sibling)		
		}

		commitMount(next, element, element, host, signature, mode)
		next = next.next
	}
}

/**
 * @param {Element} element
 * @param {Element} sibling
 * @param {Element} parent
 * @param {Element} host
 * @param {number} signature
 * @param {number} mode
 */
function commitMount (element, sibling, parent, host, signature, mode) {
	element.host = host
	element.parent = parent
	element.context = host.context

 	switch (element.id) {
 		case SharedElementComponent:
 			element.work = SharedWorkTask
 			
 			commitMount(componentMount(element), sibling, parent, element, signature, mode)
 			element.DOM = getHostChildren(element).DOM

 			if (element.ref)
 				commitReference(element, element.ref, SharedReferenceAssign)
 			
 			if (element.owner[SharedComponentDidMount])
 				getLifecycleMount(element, SharedComponentDidMount)

 			element.work = SharedWorkSync
 			return
 		case SharedElementPortal:
 			element.DOM = DOM(element.type)
 			break
 		case SharedElementPromise:
 			commitPromise(element, element)
 		case SharedElementFragment:
 			element.DOM = DOM(DOMTarget(parent))
 			break
 		case SharedElementNode:
 			element.xmlns = DOMType(element.type, parent.xmlns)
 		case SharedElementText:
 			switch (mode) {
 				case SharedMountClone:
 					if (element.DOM = DOMFind(element, parent))
	 					break
 				default:
 					element.DOM = commitDOM(element)
 					
 					if (signature < SharedMountInsert)
 						commitAppend(element, parent)
 					else
 						commitInsert(element, sibling, parent)
 			}

 			if (element.id === SharedElementText)
 				return
 	}

 	commitChildren(element, element.children, host, SharedMountAppend, mode)
 	commitProperties(element, element.props, SharedPropsMount)
}

/**
 * @param {Element} element
 * @param {Element} parent
 * @param {number} signature
 * @return {(Promise|void)}
 */
function commitUnmount (element, parent, signature) {
	if (signature > SharedElementEmpty)
		commitDemount(element, signature)

	if (element.id !== SharedElementComponent)
		return commitRemove(element, parent)

	if (queue > 0)
		return Promise.all(stack).then(function () {			
			commitUnmount(getHostChildren(element), parent, queue = stack.length = SharedElementEmpty)
		})

	commitUnmount(getHostChildren(element), parent, SharedElementEmpty)
}

/**
 * @param {Element} element
 * @param {number} signature
 * @param {boolean}
 */
function commitDemount (element, signature) {
	switch (element.id) {
		case SharedElementComponent:
			componentUnmount(element)
			commitDemount(getHostChildren(element), -signature)
		case SharedElementText:
			break
		default:
			var children = element.children
			var length = children.length

			while (length-- > 0)
				commitDemount(children = children.next, -signature)
	}

	if (element.ref)
		commitReference(element, element.ref, SharedReferenceRemove)
}

/**
 * @param {Element} element
 * @param {Element} snapshot
 * @param {number} signature
 */
function commitReplace (element, snapshot, parent, signature) {
	if (signature === SharedMountReplace)
		if (element.state = commitUnmount(element, parent, signature))
			return void element.state.then(function () {
				commitReplace(element, snapshot, parent, -signature)
			})

	commitMount(
		snapshot, 
		commitSibling(element, SharedSiblingElement), 
		parent, 
		element.host, 
		SharedMountInsert, 
		SharedMountCommit
	)

	for (var key in snapshot)
		switch (key) {
			case 'DOM':
				merge(element[key], snapshot[key])
			case 'next':
			case 'prev':
				break
			default:
				element[key] = snapshot[key]	
		}
}

/**
 * @param {Element} element
 * @param {(function|string)?} callback
 * @param {number} signature
 * @param {*} key
 */
function commitReference (element, callback, signature, key) {
	switch (typeof callback) {
		case 'string':
			return commitReference(element, componentReference, signature, callback)			
		case 'function':
			switch (signature) {
				case SharedReferenceRemove:
					return getLifecycleCallback(element.host, callback, element.ref = null, key, element)
				case SharedReferenceAssign:
					element.ref = callback
				case SharedReferenceDispatch:
					return getLifecycleCallback(element.host, callback, element.instance || DOMTarget(element), key, element)
				case SharedReferenceReplace:
					commitReference(element, callback, SharedReferenceRemove, key)
					commitReference(element, callback, SharedReferenceAssign, key)
			}
			break
		default:
			commitReference(element, element.ref || noop, SharedReferenceRemove, key)
	}
}

/**
 * @param {Element} element
 * @param {string} type
 * @param {(function|EventListener)} callback
 */
function commitEvent (element, type, callback) {
	if (!element.event)
		element.event = {}

	if (!element.event[type])
		DOMEvent(element, type)

	element.event[type] = callback
}

/**
 * @param {Element} element
 * @param {number} props
 * @param {number} signature
 */
function commitProperties (element, props, signature) {
	for (var key in props)
		switch (key) {
			case 'ref':
				commitReference(element, props[key], signature)
			case 'key':
			case 'xmlns':
			case 'children':
				break
			default:
				if (key.charCodeAt(0) === 111 && key.charCodeAt(1) === 110)
					commitEvent(element, key.substring(2).toLowerCase(), props[key])
				else
					DOMProperties(element, key, props[key], element.xmlns)
		}
}

/**
 * @param {Element} element
 * @return {Object}
 */
function commitDOM (element) {
	try {
		return element.id === SharedElementNode ? DOMElement(element) : DOMText(element)
	} catch (e) {
		return commitDOM(commitElement(errorBoundary(element, e, SharedSiteRender, SharedErrorActive)))
	}
}

/**
 * @param {Element} element
 * @param {(string|number)} value
 */
function commitValue (element, value) {
	DOMValue(element, value)
}

/**
 * @param {Element} element
 */
function commitContent (element) {
	DOMContent(element)
}

/**
 * @param {Element} element
 * @param {Element} parent
 */
function commitRemove (element, parent) {
	if (element.id > SharedElementEmpty)
		DOMRemove(element, parent)
	else
		getHostChildren(element).forEach(function (children) {
			commitRemove(children, element.id < SharedElementPortal ? parent : element)
		})
}

/**
 * @param {Element} element
 * @param {Element} sibling
 * @param {Element} parent
 */
function commitInsert (element, sibling, parent) {
	if (sibling.id < SharedElementEmpty)
		return commitInsert(element, commitSibling(sibling, SharedSiblingChildren), parent)

	if (element.id > SharedElementEmpty)
		DOMInsert(element, sibling, parent)
	else if (element.id < SharedElementPortal)
		getHostChildren(element).forEach(function (children) {
			commitInsert(children, sibling, parent)
		})
}

/**
 * @param {Element} element
 * @param {Element} parent
 */
function commitAppend (element, parent) {
	if (parent.id < SharedElementPortal)
		return commitInsert(element, commitSibling(parent, SharedSiblingElement), parent)

	if (element.id > SharedElementEmpty)
		DOMAppend(element, parent)
	else if (element.id < SharedElementPortal)
		getHostChildren(element).forEach(function (children) {
			commitAppend(children, parent)
		})
}
