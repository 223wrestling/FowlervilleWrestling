/**
 * Site-wide footer component for 223 Wrestling.
 * Relies on window.NAV_BASE being set before nav.js loads (same value used here).
 * All href values are constructed from the trusted NAV_BASE constant, not user input.
 */
(function() {
  const base = window.NAV_BASE || '';

  const links = [
    ['Youth Club',       base + 'youth/index.html'],
    ['High School',      base + 'hs/index.html'],
    ['News',             base + 'news/index.html'],
    ['Galleries',        base + 'galleries/index.html'],
    ['Sponsors',         base + 'sponsors.html'],
    ['About & Contact',  base + 'about.html'],
  ];

  const footer = document.createElement('footer');
  footer.className = 'site-footer';

  const linksDiv = document.createElement('div');
  linksDiv.className = 'footer-links';
  links.forEach(([label, href]) => {
    const a = document.createElement('a');
    a.href = href;
    a.textContent = label;
    linksDiv.appendChild(a);
  });

  const copy = document.createElement('div');
  copy.className = 'footer-copy';
  copy.textContent = '223 Wrestling. Fowlerville, Michigan';

  footer.appendChild(linksDiv);
  footer.appendChild(copy);
  document.body.appendChild(footer);
})();
