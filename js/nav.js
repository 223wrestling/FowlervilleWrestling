/**
 * Site-wide navigation component for Fowlerville Wrestling.
 * Include this script on every page. Set window.NAV_BASE before loading
 * to configure the base path (e.g., '../' for pages in subdirectories).
 */
(function() {
  const base = window.NAV_BASE || '';

  const nav = document.createElement('nav');
  nav.className = 'site-nav';
  nav.innerHTML = `
    <a href="${base}index.html" class="nav-brand">
      <img src="${base}img/logo.png" alt="Fowlerville Wrestling">
      <span>Fowlerville Wrestling</span>
    </a>
    <button class="nav-toggle" aria-label="Menu">&#9776;</button>
    <ul class="nav-links">
      <li>
        <a href="#">Wrestling Library <span class="dropdown-arrow">&#9662;</span></a>
        <ul class="nav-dropdown">
          <li><a href="${base}techniques.html">Techniques</a></li>
          <li><a href="${base}checklist.html">Checklist</a></li>
          <li><a href="${base}flowcharts/index.html">Flowcharts</a></li>
          <li><a href="${base}flowcharts/builder.html">Build Your Own</a></li>
        </ul>
      </li>
      <li>
        <a href="#">Youth Club <span class="dropdown-arrow">&#9662;</span></a>
        <ul class="nav-dropdown">
          <li><a href="${base}youth/index.html">Program Info</a></li>
          <li><a href="${base}youth/schedule.html">Schedule</a></li>
        </ul>
      </li>
      <li>
        <a href="#">High School <span class="dropdown-arrow">&#9662;</span></a>
        <ul class="nav-dropdown">
          <li><a href="${base}hs/index.html">Team & Roster</a></li>
          <li><a href="${base}hs/schedule.html">Schedule</a></li>
          <li><a href="${base}hs/coaches/index.html">Coaches Area</a></li>
        </ul>
      </li>
      <li><a href="${base}news/index.html">News</a></li>
      <li><a href="${base}galleries/index.html">Galleries</a></li>
      <li><a href="${base}sponsors.html">Sponsors</a></li>
      <li><a href="${base}about.html">About</a></li>
    </ul>
  `;

  // Insert at the very top of body
  document.body.insertBefore(nav, document.body.firstChild);

  // Hamburger toggle
  const toggle = nav.querySelector('.nav-toggle');
  const links = nav.querySelector('.nav-links');
  toggle.addEventListener('click', () => {
    links.classList.toggle('open');
  });

  // Mobile dropdown toggles
  nav.querySelectorAll('.nav-links > li').forEach(li => {
    const dropdown = li.querySelector('.nav-dropdown');
    if (!dropdown) return;

    li.querySelector(':scope > a').addEventListener('click', (e) => {
      // Only handle on mobile
      if (window.innerWidth <= 768) {
        e.preventDefault();
        li.classList.toggle('dropdown-open');
      }
    });
  });

  // Close nav on link click (mobile)
  nav.querySelectorAll('.nav-dropdown a').forEach(a => {
    a.addEventListener('click', () => {
      links.classList.remove('open');
    });
  });
})();
