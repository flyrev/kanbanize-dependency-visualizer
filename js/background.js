var activeTabId;

function tabActivated(activeInfo) {
  activeTabId = activeInfo.tabId;
};

function getCurrentTab(callback) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    callback(tabs[0]);
  });
}

function isKanbanizerableTab(tab) {
  return tab.status === 'complete' && tab.url && tab.url.match(/kanbanize\.com/);
}

function tabUpdated(tabId, changeInfo, tab) {
  checkKanbanizerStatus((status) => {
    if (status && isKanbanizerableTab(tab)) {
      activateKanbanizer(tabId)
    }
  });
}

function checkKanbanizerStatus(callback) {
  chrome.storage.local.get(["kanbanizerActive"], (result) => {
    callback(result.kanbanizerActive);
  });
}

function toggleKanbanizer() {
  checkKanbanizerStatus((status) => {
    status = !status;

    chrome.storage.local.set({ "kanbanizerActive": status });
    setIcon(status ? 'active' : 'inactive');

    chrome.tabs.query({}, (tabs) => {
      tabs.forEach((tab) => {
        if (isKanbanizerableTab(tab)) {
          if (status) {
            activateKanbanizer(tab.id);
          } else {
            chrome.tabs.executeScript(tab.id, { code: 'window.location.reload()' });
          }
        }
      });
    });
  });
}

function activateKanbanizer(tabId) {
  chrome.tabs.insertCSS(tabId, { file: "css/kanbanizer.css" });
  chrome.tabs.executeScript(tabId, { file: "js/content.js" });
}

function setIcon(status) {
  /*
  chrome.browserAction.setIcon({
    path: {
      '16': `icons/kanbanizer_${status}_16.png`,
      '32': `icons/kanbanizer_${status}_32.png`,
      '48': `icons/kanbanizer_${status}_48.png`,
      '128': `icons/kanbanizer_${status}_128.png`
    }
  });
  */
}

/*
checkKanbanizerStatus((status) => {
  setIcon(status ? 'active' : 'inactive');
});
*/
/*

chrome.tabs.onUpdated.addListener(tabUpdated);

chrome.tabs.onActivated.addListener(tabActivated);
chrome.browserAction.onClicked.addListener(toggleKanbanizer);
*/
