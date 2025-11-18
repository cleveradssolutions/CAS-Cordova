(function () {
  const $root = () => document.getElementById("root");

  function log(...args) {
    const el = document.getElementById("log");
    const line = document.createElement("div");
    line.textContent = args
      .map(x => (typeof x === "object" ? JSON.stringify(x) : String(x)))
      .join(" ");
    el.prepend(line);
    console.log(...args);
  }

  const routes = {};
  function route(path, render) { routes[path] = render; }
  function go(path) { location.hash = path; }
  function render() {
    const path = location.hash || "#/setup";
    const fn = routes[path] || routes["#/setup"];
    $root().innerHTML = "";
    fn?.($root());
  }
  window.addEventListener("hashchange", render);

  document.addEventListener("deviceready", () => {
    [
      "casai_ad_loaded",
      "casai_ad_load_failed",
      "casai_ad_showed",
      "casai_ad_show_failed",
      "casai_ad_clicked",
      "casai_ad_impressions",
      "casai_ad_dismissed",
      "casai_ad_reward",
    ].forEach(name => {
      document.addEventListener(name, ev => {
        log("EVENT:", name, ev.detail || {});
      }, false);
    });

    log("Device ready. Cordova", cordova.platformId, cordova.version);
    if (!location.hash) location.hash = "#/setup";
    render();
  });

  window.route = route;
  window.go = go;
  window.log = log;
})();
