/**
 * Resolve a whitespace-separated class list against one or more CSS Modules.
 * Tailwind utility classes are kept verbatim, including state and responsive variants.
 * Source-level style imports live with the relevant React components.
 */
export function mapClassNames(value, ...modules) {
  if (typeof value !== 'string') return value || '';
  return value.split(/\s+/).filter(Boolean).map(name => {
    for (const styles of modules) {
      if (styles && Object.prototype.hasOwnProperty.call(styles, name)) return styles[name];
    }
    return name;
  }).join(' ');
}
