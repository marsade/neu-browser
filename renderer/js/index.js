const tabs = [];
const addressBar = document.getElementById('address-bar');
const suggestionBox = document.getElementById('suggestion-box');
const popLinks = [
  { url: 'https://uzebim.neu.edu.tr/', title: 'UZEBIM' },
  { url: 'https://www.neu.edu.tr/', title: 'NEU Website' },
  { url: 'https://www.instagram.com/', title: 'NEU Instagram' },
  { url: 'http://library.neu.edu.tr/cgi-bin/koha/opac-main.pl', title: 'NEU Library' },
  { url: 'https://permissions.gov.ct.tr/', title: 'Student Permission' },
]
let tabCount = 0;
let currentWebView = null;
let currentTabId = null;

// Add a new tab
function createTab () {
  tabCount++;
  console.log('tabCount:', tabCount);
  const tabId = `tab-${tabCount}`;
  currentTabId = tabId;
  
  const homepageDiv = document.createElement('div');
  homepageDiv.setAttribute('class', 'home')
  homepageDiv.setAttribute('id', `homepage-${tabId}`);
  homepageDiv.innerHTML = `
  <div class="logo-container">
    <div class="logo-img"></div>
    <div class="logo-text"></div>
  </div>
  <div class="search-main">
      <input type="text" class="search-home" id="search-home" placeholder="Search">
  </div>
  <div class="popular">
      <p>Popular</p>
      <div class="pop-list"></div>
  </div>
  `;

  const webviewContainer = document.querySelector('.webview-container')
  tabs.push({ id: tabId, history: [], content: homepageDiv });
  currentWebView = null;
  const parentDiv = webviewContainer.parentNode;
  parentDiv.insertBefore(homepageDiv, webviewContainer);
  addressBar.value = '';
  addressBar.focus();
  
  const searchHome = document.getElementById('search-home');
  searchHome.addEventListener('input', (event) => {
    addressBar.focus();
    addressBar.click();
    addressBar.value = event.target.value;
    searchHome.value = '';
  });
  console.log('Called by createTab');
  updateAllHomePages();
  updateDOM();
}

function updateAllHomePages () {
  const homePages = document.querySelectorAll('.home');
  console.log(homePages);
  homePages.forEach((homePage) => {
    
    let popList = homePage.querySelector('.pop-list');
    if (!popList) {
      popList = document.createElement('div');
      popList.className = 'pop-list';
      homePage.appendChild(popList);
    }
    popList.innerHTML = '';

    popLinks.forEach((link) => {
      const popItem = document.createElement('div');
      const popImg = document.createElement('div');
      popImg.style.backgroundImage = `url(${getFavicon(link.url)})`;
      popItem.appendChild(popImg);

      const label = document.createElement('span');
      label.textContent = link.title;
      label.className = 'pop-label';
      popItem.appendChild(label);
      popItem.className = 'pop-item';
      popItem.title = link.title;
  
      popItem.addEventListener('click', () => {
        createWebView(currentTabId, link.url);
      });
      popList.appendChild(popItem);
    });
  });
}

function getFavicon (url) {
  return `https://www.google.com/s2/favicons?sz=128&domain=${url}`;
}

function updateAddressBar () {
  if (currentWebView && currentWebView !== null) {
    console.log('current webview:', currentWebView.src);
    addressBar.value = currentWebView.src;
  } else {
    addressBar.value = '';
  }
}

// Switch tabs
function switchToTab (tabId) {
  if (currentTabId !== tabId) {
    currentTabId = tabId;
    const currentTab = tabs.find(tab => tab.id === tabId);
    addressBar.focus();
    if (currentTab) {
      if (currentTab.content instanceof HTMLElement && currentTab.content.tagName === 'WEBVIEW') {
        currentWebView = currentTab.content;
      } else {
        currentWebView = null;
      }
      updateAddressBar();
    }
    updateDOM();
  }
}

// Retrieve the tab to close
function closeTab (event) {
  event.stopPropagation();
  const button = event.target;
  const tabDiv = button.closest('.tab');
  const tabId = tabDiv.getAttribute('data-tab-id');
  tabCount--;
  console.log('tabCount:', tabCount);

  removeTab(tabId);
  updateAddressBar();
  removeWebView(tabId);
}

// Remove tab from the DOM
function removeTab (tabId) {
  const index = tabs.findIndex(tab => tab.id === tabId);
  const homePageDiv = document.querySelector(`#homepage-${tabId}`)

  if (homePageDiv) {
    homePageDiv.remove();
  }
  if (index !== -1) {
    tabs.splice(index, 1);

    // If the current tab is removed, set the current tab to the next available tab
    if (currentTabId === tabId) {
      if (tabs.length > 0) {
        currentTabId = tabs[index] ? tabs[index].id : tabs[index - 1].id;
        const currentTab = tabs.find(tab => tab.id === currentTabId);
        if (currentTab) {
          currentWebView = currentTab.content;
        }
      }
    } else {
      newCount = tabs.slice(-1)[0].id;
      tabCount = Number(newCount.split('-')[1]);
    }
    if (tabs.length === 0) {
      window.electronAPI.quitApp();
    }
    updateDOM();
  }
}

// Create the webview for each tab
function createWebView(tabId, url) {
  const webView = document.createElement('webview');
  const homepage = document.querySelector('.home');
  const homePageDiv = document.querySelector(`#homepage-${tabId}`)
  const webviewContainer = document.querySelector('.webview-container');

  if (homePageDiv) {
    homePageDiv.remove();
  }
  
  webView.setAttribute('src', url);
  webView.setAttribute('data-tab-id', tabId);
  webView.classList.add('webview');
  webviewContainer.appendChild(webView);
  
  const currentTab = tabs.find(tab => tab.id === tabId);
  if (currentTab) {
    currentTab.content = webView;
  }
  currentWebView = webView;
  console.log('Current Tab Info', currentTab);

  currentWebView.addEventListener('did-finish-load', () => {
    if (currentTab && currentWebView) {
      currentTab.history.push(currentWebView.src);
    }
  });
  currentWebView.addEventListener('page-title-updated', (event) => {
    if (currentTab) {
      currentTab.title = event.title;
      updateDOM();
    }
  });
  console.log('Called by createWebView');
  updateDOM();
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
    const tabWidth = Math.max(containerWidth / tabs.length, 160); 
    tabElements.forEach(tab => {
      tab.style.width = `${tabWidth}px`;
    });
  }
}

// Update the DOM if changes
function updateDOM () {
  console.log('Tabs array', tabs);
  const tabContainer = document.querySelector('.tabs-container');
  tabContainer.innerHTML = '';
  tabs.forEach(tab => {
    const tabDiv = document.createElement('div');
    tabDiv.className = 'tab';
    tabDiv.setAttribute('data-tab-id', tab.id);

    content = tab.content;
    tabDiv.innerHTML = `
    <div class="tab-left">
    <div class="tab-icon"></div>
    <p>${tab.title || 'New Tab'}</p>
    </div>
    <button class="close-tab">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 512 512"><path fill="none" stroke="#000" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M368 368L144 144m224 0L144 368"/></svg>
    </button>
    `;
    
    tabContainer.appendChild(tabDiv);
    tabDiv.addEventListener('mousedown', () => switchToTab(tab.id));
    tabDiv.querySelector('.close-tab').addEventListener('click', closeTab);
    tabDiv.querySelector('.close-tab').addEventListener('mousedown', (e) => {
      e.stopPropagation();
    });
    //   adjustTabWidths();
    
    if (tab.id === currentTabId) {
      content.style.visibility = 'visible';
      content.style.zIndex = 1;
    } else {
      content.style.visibility = 'hidden';
      content.style.position = 'absolute';
      content.style.zIndex = -1;
    }

  });

  // Highlight the current tab
  if (currentTabId) {
    const currentTabDiv = document.querySelector(`[data-tab-id="${currentTabId}"]`);
    const currentWebView = document.querySelector(`webview[data-tab-id="${currentTabId}"]`);
    currentTabDiv.classList.add('active');
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
  suggestionBox.style.zIndex = 9999;
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
  
  const currentTab = tabs.find(tab => tab.content === currentTabId);
  if (currentTab && currentTab.content instanceof HTMLElement && currentTab.content.tagName === 'WEBVIEW') {
    
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