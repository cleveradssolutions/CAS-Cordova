(function () {
  // DOM helpers
  function getRootElement() {
    return /** @type {HTMLElement} */ (document.getElementById('root'));
  }
  function getLogContainer() {
    return /** @type {HTMLElement} */ (document.getElementById('log'));
  }

  // Logging 
  function stringify(value) {
    return typeof value === 'object' ? JSON.stringify(value) : String(value);
  }

  function writeLogLine() {
    var args = Array.prototype.slice.call(arguments);

    var clean = [];
    for (var i = 0; i < args.length; i++) {
      var v = args[i];
      if (v !== null && v !== undefined) clean.push(v);
    }

    var logContainer = getLogContainer();
    if (logContainer) {
      var line = document.createElement('div');
      line.textContent = 'CAS: ' + clean.map(stringify).join(' ');
      logContainer.prepend(line);
    }

    var con = console || {};
    (con.log || function(){}).apply(con, ['CAS:'].concat(clean));
  }

  function log() {
    writeLogLine.apply(null, arguments);
  }

  // Templates 
  function renderTemplate(templateId, root) {
    var template = /** @type {HTMLTemplateElement} */ (document.getElementById(templateId));
    if (!template) {
      log('Template not found', templateId);
      root.innerHTML = '';
      return;
    }
    root.innerHTML = '';
    root.appendChild(template.content.cloneNode(true));
  }

  // Router
  var routes = /** @type {Record<string,(root:HTMLElement)=>void>} */ ({});

  function route(path, render) { routes[path] = render; }
  function go(path) { location.hash = path; }

  function render() {
    var path = location.hash || '#/setup';
    var renderFn = routes[path] || routes['#/setup'];
    var root = getRootElement();
    root.innerHTML = '';
    if (renderFn) renderFn(root);
  }
  window.addEventListener('hashchange', render);

  // Event helpers
  function addEvent(eventName, handler) {
    document.addEventListener(
      eventName,
      /** @param {CustomEvent<any>} ev */ function (ev) {
        try {
          var hasDetail = ev && Object.prototype.hasOwnProperty.call(ev, 'detail');
          var detail = hasDetail ? ev.detail : undefined;
          handler(detail);
        } catch (e) {
          log('Event handler error for ' + eventName, e);
        }
      },
      false
    );
  }

  function addFormatEvent(eventName, expectedFormat, handler) {
    addEvent(eventName, function (detail) {
      if (!expectedFormat) { handler(detail); return; }
      if (!detail || !detail.format) { handler(detail); return; }
      if (detail.format === expectedFormat) handler(detail);
    });
  }


  function getCAS() {
    var cas = /** @type {any} */ (window).casai;
    if (!cas) throw new Error('casai is not ready yet');
    return cas;
  }

  document.addEventListener('deviceready', function () {
    [
      'casai_ad_loaded',
      'casai_ad_load_failed',
      'casai_ad_showed',
      'casai_ad_show_failed',
      'casai_ad_clicked',
      'casai_ad_impressions',
      'casai_ad_dismissed',
      'casai_ad_reward'
    ].forEach(function (eventName) {
      addEvent(eventName, function (detail) {
        log(eventName, detail);
      });
    });

    log('Device ready. Cordova', cordova.platformId, cordova.version);
    if (!location.hash) location.hash = '#/setup';
    render();
  });

  window.route = route;
  window.go = go;
  window.renderTemplate = renderTemplate;
  window.getCAS = getCAS;
  window.log = log;
  window.addEvent = addEvent;
  window.addFormatEvent = addFormatEvent;
})();

