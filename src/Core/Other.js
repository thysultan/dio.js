/**
 * @param {(Component|Element|Node)} element
 * @return {Node}
 */
function findDOMNode (element) {
	if (!element)
		invariant(LifecycleFindDOMNode, 'Expected to receive a component')

	if (isValidElement(element[SymbolElement]))
		return findDOMNode(element[SymbolElement])

	if (isValidElement(element)) {
		if (element.flag < ElementPortal)
			return findDOMNode(elementNext(element, MountInsert))
		else if (element.DOM)
			return DOMTarget(element)
	}

	if (DOMValid(element))
		return element

	invariant(LifecycleFindDOMNode, 'Called on an unmounted component')
}
