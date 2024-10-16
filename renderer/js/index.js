let tabCount = 0;
let tabs = [];
let currentTabId = null;
let currentWebView = null;


// Insert a new tab
function addTab() {
  if (currentWebView) {
    currentWebView.remove();
  }
  tabCount++;
  const tabId = `tab-${tabCount}`;
  const webView = createWebView(tabId);
  const tabContent = webView;
  currentWebView = webView;
  currentTabId = tabId;
  tabs.push({ id: tabId, content: tabContent });
  console.log(tabs);
  updateDOM();
}

// Switch tabs
function switchToTab(tabId) {
  if (tabId) {
    currentTabId = tabId;
    currentWebView = document.querySelector(`webview[data-tab-id="${tabId}"]`);
  }
  updateDOM();
}

// Retrieve the tab to close
function closeTab(event) {
  event.stopPropagation();
  const button = event.target;
  const tabDiv = button.closest('.tab');
  const tabId = tabDiv.getAttribute('data-tab-id');
  removeTab(tabId);
  removeWebView(tabId);
}

//Remove tab from the DOM
function removeTab(tabId) {
  // Find the tab index
  const index = tabs.findIndex(tab => tab.id === tabId);
  if (index !== -1) {
    tabs.splice(index, 1);
    
    // If the current tab is removed, set the current tab to the next available tab
    if (currentTabId === tabId) {
      if (tabs.length > 0) {
        currentTabId = tabs[index] ? tabs[index].id : tabs[index - 1].id;
      }
    }
  if (tabs.length === 0) {
    window.electronAPI.quitApp();
  }
  updateDOM();
  }
}

// Create the webview for each tab
function createWebView(tabId, url='https://www.google.com') {
  const webView = document.createElement('webview');
  webView.setAttribute('src', url);
  webView.setAttribute('data-tab-id', tabId);
  webView.classList.add('webview');
  return webView;
}

// Remove the webview for the given tab
function removeWebView(tabId) {
  const webView = document.querySelector(`webview[data-tab-id="${tabId}"]`);
  if (webView) {
    webView.remove();
  }
}

function collectSearch(){

}
// Adjust the tab widths based on the number of tabs
function adjustTabWidths() {
  const tabContainer = document.querySelector('.tabs-container');
  const tabElements = tabContainer.querySelectorAll('.tab');
  const containerWidth = tabContainer.clientWidth;
  if (tabs.length > 5) {
    const tabWidth = Math.max(containerWidth / tabs.length, 160); // Minimum width of 100px per tab
    tabElements.forEach(tab => {
      tab.style.width = `${tabWidth}px`;
    });
  }
}

// Update the DOM if changes
function updateDOM() {
  const tabContainer = document.querySelector('.tabs-container');
  const webviewContainer = document.querySelector('.webview-container');
  tabContainer.innerHTML = '';
  tabs.forEach(tab => {
    const tabDiv = document.createElement('div');
    tabDiv.className = 'tab';
    tabDiv.setAttribute('data-tab-id', tab.id);
    tabDiv.innerHTML = `
    <div class="tab-left">
      <div class="tab-icon"></div>
        <p>New Tab</p>
    </div>
    <button class="close-tab">
      <img src="imgs/icons/close_line.svg" width="15">
    </button>
    `;
    webview = tab.content;
    webviewContainer.appendChild(webview);    
    tabContainer.appendChild(tabDiv);
    tabDiv.addEventListener('mousedown', () => switchToTab(tab.id));
    tabDiv.querySelector('.close-tab').addEventListener('click', closeTab);
    tabDiv.querySelector('.close-tab').addEventListener('mousedown', (e) => {
      e.stopPropagation();
    });
    adjustTabWidths();

    if (tab.id === currentTabId) {
      webview.style.visibility = 'visible';
      webview.style.position = 'relative';
      webview.style.zIndex = 1; 
    } else {
      webview.style.visibility = 'hidden';
      webview.style.position = 'absolute';
      webview.style.zIndex = -1;
    }
  });

  // Highlight the current tab
  if (currentTabId) {
    const currentTabDiv = document.querySelector(`[data-tab-id="${currentTabId}"]`);
    const currentWebView = document.querySelector(`webview[data-tab-id="${currentTabId}"]`);
    if (currentTabDiv && currentWebView) {
      currentTabDiv.classList.add('active');
    }
  }
}

//Load a tab on intitial window load
window.onload = () => {
  addTab();
  document.getElementById('add-tab').addEventListener('click', addTab);
}
