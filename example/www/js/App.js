(function () {
  function onDeviceReady() {
    document.removeEventListener('deviceready', onDeviceReady, false);

    casai
      .initialize({
        showConsentFormIfRequired: true,
        forceTestAds: true, // Disable Test ads for release build
        testDeviceIds: [
          // Add Your test device ID
        ],
      })
      .then(function (status) {
        if (status.error) {
          console.warn('CAS initialize failed:', status.error);
        } else {
          console.log('CAS initialized:', JSON.stringify(status, null, 2));
        }
      });

    if (!location.hash) location.hash = '#/menu';
    render();
  }
  document.addEventListener('deviceready', onDeviceReady, false);

  window.onExamplePageClosed = null;

  function renderTemplate(id, root) {
    const tpl = document.getElementById(id);
    root.innerHTML = '';
    if (tpl && tpl.content) root.appendChild(tpl.content.cloneNode(true));
  }

  const routes = {};
  function route(path, render) {
    routes[path] = render;
  }
  function go(path) {
    location.hash = path;
  }
  function render() {
    if (typeof window.onExamplePageClosed === 'function') {
      try {
        window.onExamplePageClosed();
      } catch (e) {
        console.warn('Example cleanup failed', e);
      }
      window.onExamplePageClosed = null;
    }

    const root = document.getElementById('root');
    const path = location.hash || '#/menu';
    (routes[path] || routes['#/menu'])(root);
  }
  window.addEventListener('hashchange', render);

  window.route = route;
  window.go = go;
  window.renderTemplate = renderTemplate;
})();
