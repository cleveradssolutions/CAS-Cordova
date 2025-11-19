route('#/menu', function (root) {
  renderTemplate('tmpl-menu', root);

  var menuButtons = /** @type {NodeListOf<HTMLButtonElement>} */ (root.querySelectorAll('[data-go]'));
  menuButtons.forEach(function (button) {
    button.onclick = function () { go(button.dataset.go); };
  });
});
