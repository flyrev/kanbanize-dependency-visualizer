function injectJs(link, callback) {
  console.log(link);
  console.log(callback);
  var s = document.createElement('script');
  s.src = chrome.runtime.getURL(link);
  s.onload = function () {
    if (callback) callback()
    this.remove();
  };
  console.log(s);
  console.log(document.head);
  console.log(document.documentElement);
  (document.head || document.documentElement).appendChild(s);
}

(function fireKanbanizer() {
  const canvas = document.getElementById("#kanbanizer-canvas");

  if (!canvas) {
    console.log("Injecting!")

    injectJs('js/lib/d3.v5.min.js', () => {
      console.log("Injected!")
      injectJs('js/kanbanizer.js');
    });
  }
})();
