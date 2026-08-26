(function () {
  function reportHeight() {
    var container = document.querySelector('.container');
    var contentHeight = container
      ? Math.ceil(container.getBoundingClientRect().bottom + window.scrollY)
      : document.documentElement.scrollHeight;

    window.parent.postMessage(
      { type: 'ethan-tarot-height', height: Math.max(1040, contentHeight) },
      window.location.origin
    );
  }

  window.addEventListener('load', reportHeight);
  window.addEventListener('resize', reportHeight);

  var observer = new ResizeObserver(reportHeight);
  observer.observe(document.documentElement);

  var mutationObserver = new MutationObserver(reportHeight);
  mutationObserver.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    characterData: true,
  });
})();
