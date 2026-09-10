(function () {
  // Đệm thêm để tránh hụt vài px do font/ảnh tải xong sau lần đo đầu — không còn
  // cuộn nội bộ (tarot-section.tsx set scrolling="no" + overflow: hidden) nên hụt
  // chiều cao là bị cắt nội dung, không có scrollbar dự phòng như trước nữa.
  var HEIGHT_BUFFER = 80;

  function reportHeight() {
    var container = document.querySelector('.container');
    var contentHeight = container
      ? Math.ceil(container.getBoundingClientRect().bottom + window.scrollY)
      : document.documentElement.scrollHeight;

    window.parent.postMessage(
      { type: 'ethan-tarot-height', height: Math.max(1040, contentHeight + HEIGHT_BUFFER) },
      window.location.origin
    );
  }

  window.addEventListener('load', reportHeight);
  window.addEventListener('resize', reportHeight);

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(reportHeight);
  }

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
