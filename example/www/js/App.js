(function () {
  function renderTemplate(id, root) {
    const tpl = document.getElementById(id);
    root.innerHTML = '';
    if (tpl && tpl.content) root.appendChild(tpl.content.cloneNode(true));
  }

  const routes = {};
  function route(path, render) { routes[path] = render; }
  function go(path) { location.hash = path; }
  function render() {
    const root = document.getElementById('root');
    const path = location.hash || '#/menu';
    (routes[path] || routes['#/menu'])(root);
  }
  window.addEventListener('hashchange', render);

  function onDeviceReady() {
    document.removeEventListener('deviceready', onDeviceReady, false);

    const cas = window.casai;
    try {
      cas.initialize({
        targetAudience: 'notchildren',
        showConsentFormIfRequired: true,
        forceTestAds: true,
        testDeviceIds: [],
        debugGeography: 'eea',
        mediationExtras: {}
      }).catch(function (e) {
        console.warn('CAS initialize warning', e);
      });
    } catch (e) {
      console.warn('CAS initialize error', e);
    }

    if (!location.hash) location.hash = '#/menu';
    render();
  }
  document.addEventListener('deviceready', onDeviceReady, false);

  window.route = route;
  window.go = go;
  window.renderTemplate = renderTemplate;
})();
