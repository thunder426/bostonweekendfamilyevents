document.addEventListener('DOMContentLoaded', async () => {
  let events = [];
  let activeCategory = 'all';
  let activeWhen = 'all';
  let activePrice = 'all';
  let searchQuery = '';

  // Load events
  try {
    const response = await fetch('data/events.json');
    events = await response.json();
  } catch (e) {
    console.error('Failed to load events:', e);
  }

  const grid = document.getElementById('eventsGrid');
  const noResults = document.getElementById('noResults');
  const eventCount = document.getElementById('eventCount');
  const eventsTitle = document.getElementById('eventsTitle');
  const searchInput = document.getElementById('searchInput');

  // --- Date helpers ---
  function getWeekendRange(offsetWeeks) {
    const now = new Date();
    const dayOfWeek = now.getDay();
    // Saturday of this week
    const daysUntilSat = (6 - dayOfWeek + 7) % 7 || (offsetWeeks === 0 ? 0 : 7);
    const saturday = new Date(now);
    saturday.setDate(now.getDate() + daysUntilSat + (offsetWeeks > 0 ? (offsetWeeks - (daysUntilSat === 0 ? 0 : 0)) * 7 : 0));

    if (offsetWeeks === 0) {
      // "This weekend" = coming Sat-Sun (or today if it's already Sat/Sun)
      const sat = new Date(now);
      if (dayOfWeek === 0) {
        // Sunday — this weekend is today
        sat.setDate(now.getDate() - 1);
      } else if (dayOfWeek === 6) {
        // Saturday — this weekend starts today
      } else {
        sat.setDate(now.getDate() + (6 - dayOfWeek));
      }
      const sun = new Date(sat);
      sun.setDate(sat.getDate() + 1);
      return { start: stripTime(sat), end: stripTime(sun) };
    } else {
      const sat = new Date(now);
      const baseDaysUntilSat = dayOfWeek === 0 ? 6 : (6 - dayOfWeek);
      sat.setDate(now.getDate() + baseDaysUntilSat + (offsetWeeks * 7));
      const sun = new Date(sat);
      sun.setDate(sat.getDate() + 1);
      return { start: stripTime(sat), end: stripTime(sun) };
    }
  }

  function getMonthRange() {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { start: stripTime(start), end: stripTime(end) };
  }

  function stripTime(d) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  function parseDate(str) {
    const [y, m, d] = str.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  function eventInRange(event, range) {
    const eventStart = parseDate(event.date);
    const eventEnd = event.endDate ? parseDate(event.endDate) : eventStart;
    return eventEnd >= range.start && eventStart <= range.end;
  }

  // --- Filtering ---
  function filterEvents() {
    return events.filter(event => {
      // Category
      if (activeCategory !== 'all' && event.category !== activeCategory) return false;

      // Date
      if (activeWhen !== 'all') {
        let range;
        if (activeWhen === 'this-weekend') range = getWeekendRange(0);
        else if (activeWhen === 'next-weekend') range = getWeekendRange(1);
        else if (activeWhen === 'this-month') range = getMonthRange();
        if (range && !eventInRange(event, range)) return false;
      }

      // Price
      if (activePrice === 'free') {
        if (!event.price.toLowerCase().includes('free')) return false;
      }

      // Search
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const haystack = [
          event.title, event.venue, event.location,
          event.description, event.category, ...(event.tags || [])
        ].join(' ').toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      return true;
    });
  }

  // --- Rendering ---
  function formatDate(dateStr) {
    const d = parseDate(dateStr);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }

  function formatDateRange(event) {
    const start = formatDate(event.date);
    if (event.endDate && event.endDate !== event.date) {
      const end = formatDate(event.endDate);
      return `${start} – ${end}`;
    }
    return start;
  }

  function getCategoryLabel(cat) {
    const labels = { farm: 'Farm', museum: 'Museum', outdoor: 'Outdoors' };
    return labels[cat] || cat;
  }

  function getCategoryIcon(cat) {
    const icons = { farm: '&#127806;', museum: '&#127963;', outdoor: '&#127795;' };
    return icons[cat] || '&#127775;';
  }

  function renderEvents() {
    const filtered = filterEvents();
    eventCount.textContent = `${filtered.length} event${filtered.length !== 1 ? 's' : ''}`;

    if (filtered.length === 0) {
      grid.style.display = 'none';
      noResults.style.display = 'flex';
      return;
    }

    grid.style.display = '';
    noResults.style.display = 'none';

    // Sort by date
    filtered.sort((a, b) => parseDate(a.date) - parseDate(b.date));

    grid.innerHTML = filtered.map(event => `
      <article class="event-card" data-category="${event.category}">
        <div class="event-image">
          <img src="${event.image}" alt="${event.title}" loading="lazy">
          <span class="event-badge badge-${event.category}">
            ${getCategoryIcon(event.category)} ${getCategoryLabel(event.category)}
          </span>
          ${event.recurring ? '<span class="event-recurring" title="Recurring event">&#128260; Recurring</span>' : ''}
        </div>
        <div class="event-body">
          <h3 class="event-title">${event.title}</h3>
          <div class="event-meta">
            <span class="meta-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
              </svg>
              ${formatDateRange(event)}
            </span>
            <span class="meta-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
              </svg>
              ${event.time}
            </span>
          </div>
          <div class="event-meta">
            <span class="meta-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              ${event.venue} &mdash; ${event.location}
            </span>
          </div>
          <p class="event-description">${event.description}</p>
          <div class="event-footer">
            <div class="event-details">
              <span class="price-tag">${event.price}</span>
              <span class="age-tag">${event.ageRange}</span>
            </div>
            <a href="${event.website}" class="event-link" target="_blank" rel="noopener">
              Visit Website
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                <path d="M7 17 17 7M7 7h10v10"/>
              </svg>
            </a>
          </div>
        </div>
      </article>
    `).join('');
  }

  // --- Filter event listeners ---
  function setupFilterPills(containerId, setter) {
    const container = document.getElementById(containerId);
    container.addEventListener('click', (e) => {
      const pill = e.target.closest('.pill');
      if (!pill) return;
      container.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      setter(pill);
      renderEvents();
    });
  }

  setupFilterPills('categoryFilters', (pill) => {
    activeCategory = pill.dataset.category;
    const labels = { all: 'All Events', farm: 'Farm Events', museum: 'Museum Events', outdoor: 'Outdoor Events' };
    eventsTitle.textContent = labels[activeCategory] || 'All Events';
  });

  setupFilterPills('dateFilters', (pill) => {
    activeWhen = pill.dataset.when;
  });

  setupFilterPills('priceFilters', (pill) => {
    activePrice = pill.dataset.price;
  });

  // Search
  let searchTimeout;
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      searchQuery = searchInput.value.trim();
      renderEvents();
    }, 200);
  });

  // --- Last Updated ---
  const lastUpdated = document.getElementById('lastUpdated');
  if (lastUpdated && events.length > 0) {
    // Find the earliest date among events to approximate when data was curated
    const dates = events.map(e => e.date).sort();
    const earliest = parseDate(dates[0]);
    const now = new Date();
    const diffDays = Math.floor((now - earliest) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) {
      lastUpdated.textContent = 'Updated recently';
    } else if (diffDays < 7) {
      lastUpdated.textContent = 'Updated this week';
    } else {
      lastUpdated.textContent = `Events from ${earliest.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;
    }
  }

  // Initial render
  renderEvents();
});
