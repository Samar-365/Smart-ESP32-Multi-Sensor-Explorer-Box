/**
 * Submodule 7.1: Client SPA Hash Router
 * Manages client navigation between the 5 core views (#dashboard, #analytics, #weather, #alerts, #about).
 * Fulfills SRS Section 23 (Website Structure).
 */

export class Router {
  constructor(routes = {}, options = {}) {
    this.routes = routes; // routeName -> viewHandler
    this.currentRoute = null;
    this.container = options.container || document.getElementById('view-container');
    this.onNavigate = options.onNavigate || (() => {});

    window.addEventListener('hashchange', () => this.handleRoute());
  }

  registerRoute(name, viewHandler) {
    this.routes[name] = viewHandler;
  }

  init() {
    this.handleRoute();
  }

  handleRoute() {
    let hash = window.location.hash.slice(1).toLowerCase();
    if (!hash || !this.routes[hash]) {
      hash = 'dashboard';
      window.location.hash = '#dashboard';
    }

    this.navigate(hash);
  }

  navigate(routeName) {
    if (this.currentRoute === routeName && this.container?.firstChild) {
      return;
    }

    const handler = this.routes[routeName];
    if (!handler) {
      console.warn(`Route ${routeName} not found, redirecting to #dashboard`);
      this.navigate('dashboard');
      return;
    }

    this.currentRoute = routeName;

    // Update active class on sidebar navigation links
    document.querySelectorAll('.nav-item').forEach(el => {
      const target = el.getAttribute('href')?.slice(1);
      if (target === routeName) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });

    // Close mobile drawer if open
    document.querySelector('.app-sidebar')?.classList.remove('open');

    // Render new view
    if (this.container) {
      this.container.innerHTML = '';
      if (typeof handler.render === 'function') {
        const viewEl = handler.render();
        if (viewEl instanceof HTMLElement) {
          this.container.appendChild(viewEl);
        } else if (typeof viewEl === 'string') {
          this.container.innerHTML = viewEl;
        }
        if (typeof handler.mount === 'function') {
          handler.mount();
        }
      }
    }

    // Update header title
    const titles = {
      dashboard: 'Explorer Dashboard',
      analytics: 'Advanced Analytics',
      weather: 'Live Weather',
      alerts: 'Alerts & Safety Thresholds',
      about: 'About Explorer Box'
    };
    const titleEl = document.getElementById('current-page-title');
    if (titleEl) {
      titleEl.textContent = titles[routeName] || 'Smart Explorer Box';
    }

    this.onNavigate(routeName);
  }

  getCurrentRoute() {
    return this.currentRoute;
  }
}
