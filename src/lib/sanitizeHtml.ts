// Minimal HTML sanitizer: strips disallowed tags/attributes to mitigate XSS
// For production-grade sanitization prefer DOMPurify. This is a lightweight fallback.

const ALLOWED_TAGS = new Set([
	'p','br','strong','b','em','i','u','ul','ol','li','blockquote','code','pre','h1','h2','h3','h4','h5','h6','a','img'
]);
const ALLOWED_ATTRS: Record<string, Set<string>> = {
	'a': new Set(['href','title','target','rel']),
	'img': new Set(['src','alt','title'])
};

export function sanitizeHtml(dirtyHtml: string): string {
	if (!dirtyHtml) return '';
	const parser = new DOMParser();
	const doc = parser.parseFromString(dirtyHtml, 'text/html');

	const cleanNode = (node: Element | ChildNode) => {
		// Remove script/style if any
		if ((node as Element).tagName) {
			const tag = (node as Element).tagName.toLowerCase();
			if (!ALLOWED_TAGS.has(tag)) {
				node.parentNode?.removeChild(node);
				return;
			}
			const el = node as Element;
			// Remove disallowed attributes
			for (const attr of Array.from(el.attributes)) {
				const allowed = ALLOWED_ATTRS[tag];
				if (!allowed || !allowed.has(attr.name.toLowerCase())) {
					el.removeAttribute(attr.name);
				}
				// Prevent javascript: URLs
				if ((attr.name === 'href' || attr.name === 'src') && /^\s*javascript:/i.test(attr.value)) {
					el.removeAttribute(attr.name);
				}
			}
		}
		for (const child of Array.from(node.childNodes)) {
			cleanNode(child);
		}
	};

	for (const child of Array.from(doc.body.childNodes)) {
		cleanNode(child);
	}

	return doc.body.innerHTML;
}


