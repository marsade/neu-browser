const tabs = [];
const addressBar = document.getElementById('address-bar');
const searchHome = document.getElementById('search-home');
const suggestionBox = document.getElementById('suggestion-box');
let tabCount = 0;
let currentWebView = null;
let currentTabId = null;

// Insert a new tab
function createTab () {
  tabCount++;
  const tabId = `tab-${tabCount}`;
  const history = [];
  history.push(`file://${window.electronAPI.getHomePath()}`);
  currentTabId = tabId;
  tabs.push({ id: tabId, history });
  if (tabCount > 1) {
    const webview = createWebView(tabId);
  }
  console.log(tabs);
  updateDOM();
}

// Switch tabs
function switchToTab (tabId) {
  if (tabId) {
    currentTabId = tabId;
    currentWebView = document.querySelector(`webview[data-tab-id="${tabId}"]`);
  }
  updateDOM();
}

// Retrieve the tab to close
function closeTab (event) {
  event.stopPropagation();
  const button = event.target;
  const tabDiv = button.closest('.tab');
  const tabId = tabDiv.getAttribute('data-tab-id');
  removeTab(tabId);
  removeWebView(tabId);
}

// Remove tab from the DOM
function removeTab (tabId) {
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
function createWebView(tabId, url = `file://${window.electronAPI.getHomePath()}`) {
  const webView = document.createElement('webview');
  const homepage = document.querySelector('.home');
  const webviewContainer = document.querySelector('.webview-container');
  webView.setAttribute('src', url);
  webView.setAttribute('data-tab-id', tabId);
  webView.classList.add('webview');
  homepage.style.display = 'none';
  webviewContainer.appendChild(webView);
  currentWebView = webView;
  currentWebView.addEventListener('did-finish-load', () => {
    let tabsMap = new Map(tabs.map(tab => [tab.id, tab]));
    const currentTab = tabsMap.get(currentTabId);
    currentTab.history.push(currentWebView.src);
    console.log(currentTab.history);
  });
  return webView;
}

// Remove the webview for the given tab
function removeWebView(tabId) {
  const webView = document.querySelector(`webview[data-tab-id="${tabId}"]`);
  if (webView) {
    webView.remove();
  }
}

// Adjust the tab widths based on the number of tabs
function adjustTabWidths () {
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
function updateDOM () {
  const tabContainer = document.querySelector('.tabs-container');
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
    // webview = tab.content;
    tabContainer.appendChild(tabDiv);
    tabDiv.addEventListener('mousedown', () => switchToTab(tab.id));
    tabDiv.querySelector('.close-tab').addEventListener('click', closeTab);
    tabDiv.querySelector('.close-tab').addEventListener('mousedown', (e) => {
      e.stopPropagation();
    });
    //   adjustTabWidths();

  //   if (tab.id === currentTabId) {
  //     webview.style.visibility = 'visible';
  //     webview.style.position = 'relative';
  //     webview.style.zIndex = 1;
  //   } else {
  //     webview.style.visibility = 'hidden';
  //     webview.style.position = 'absolute';
  //     webview.style.zIndex = -1;
  //   }
  });

  // Highlight the current tab
  if (currentTabId) {
    const currentTabDiv = document.querySelector(`[data-tab-id="${currentTabId}"]`);
    const currentWebView = document.querySelector(`webview[data-tab-id="${currentTabId}"]`);
    // currentTabDiv.classList.add('active');
  }
}

const fetchSuggestions = window.electronAPI.debounce(async (query) => {
  if (!query.trim()) {
    suggestionBox.innerHTML = '';
    return;
  }

  try {
    const response = await fetch(`https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(query)}`);
    const suggestions = await response.json();
    displaySuggestions(suggestions[1]);
  } catch (error) {
    console.error('Error fetching suggestions:', error);
  }
}, 300);

searchHome.addEventListener('input', (event) => {
  addressBar.focus();
  addressBar.click();
  addressBar.value = event.target.value;
  searchHome.value = '';
});

addressBar.addEventListener('input', (event) => {
  const query = event.target.value;
  fetchSuggestions(query);
});
addressBar.addEventListener('click', function () {
  this.classList.add('clicked');
  this.select();
});

function displaySuggestions (suggestions) {
  suggestionBox.innerHTML = '';
  suggestions.forEach((suggestion) => {
    const suggestionItem = document.createElement('div');
    suggestionItem.className = 'suggestion-item';
    suggestionItem.textContent = suggestion;

    suggestionItem.addEventListener('click', () => {
      addressBar.value = suggestion;
      suggestionBox.innerHTML = '';
      sendQuery(suggestion);
    });

    suggestionBox.appendChild(suggestionItem);
  });
}

// Send the search query to the current webview or create a new tab if none is open
function sendQuery (userInput) {
  const searchQuery = encodeURIComponent(userInput);
  const searchURL = `https://www.google.com/search?q=${searchQuery}`;
  addressBar.value = searchURL;
  if (currentWebView) {
    currentWebView.setAttribute('src', searchURL);
  } else {
    createWebView(currentTabId, searchURL);
  }
}

// Load a tab on intitial window load
window.onload = () => {
  createTab();
  const lockButton = document.querySelector('.lock');
  const searchInput = document.getElementById('search-input');

  const backButton = document.querySelector('.nav-prev');
  const forwardButton = document.querySelector('.nav-next');
  const reloadButton = document.querySelector('.nav-rel');
  document.getElementById('add-tab').addEventListener('click', createTab);
  lockButton.addEventListener('click', () => {
    lockButton.classList.toggle('unlocked');
    if (lockButton.classList.contains('unlocked')) {
      window.electronAPI.toggleLock(false);
    } else {
      window.electronAPI.toggleLock(true);
    }
  });

  searchInput.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(searchInput);
    searchURL = data.get('search-box');
    addressBar.blur();
    suggestionBox.innerHTML = '';
    sendQuery(searchURL);
  });

  backButton.addEventListener('click', () => {
    console.log(currentWebView.canGoBack());
  });
};
