const tabs = [];
const addressBar = document.getElementById('address-bar');
const suggestionBox = document.getElementById('suggestion-box');
const popLinks = [
  { url: 'https://uzebim.neu.edu.tr/', title: 'UZEBIM' },
  { url: 'https://www.neu.edu.tr/', title: 'NEU Website' },
  { url: 'https://www.instagram.com/', title: 'NEU Instagram' },
  { url: 'http://library.neu.edu.tr/cgi-bin/koha/opac-main.pl', title: 'NEU Library' },
  { url: 'https://permissions.gov.ct.tr/login', title: 'Student Permission' },
]
let tabCount = 0;
let currentWebView = null;
let currentTabId = null;

// Add a new tab
function createTab () {
  tabCount++;
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

  tabs.push({ id: tabId, history: [], content: homepageDiv, currentHistoryIndex: 0, addressBarValue: '' });
  currentWebView = null;
  const webviewContainer = document.querySelector('.webview-container')
  const parentDiv = webviewContainer.parentNode;
  parentDiv.insertBefore(homepageDiv, webviewContainer);
  addressBar.classList.remove("animated");


  const currentTab = tabs.find((tab) => tab.id === tabId);
  if (currentTab) {
    currentTab.history.push(homepageDiv)
  }
  let hasPlayed = false;
  if (!hasPlayed) {
    addressBar.classList.remove("animated"); 
    void addressBar.offsetWidth; 
    addressBar.classList.add("animated");
    hasPlayed = true;
  }
  addressBar.value = '';
  addressBar.focus();
  
  const searchHome = document.getElementById('search-home');
  searchHome.addEventListener('input', (event) => {
    addressBar.focus();
    addressBar.click();
    addressBar.value = event.target.value;
    searchHome.value = '';
  });
  updateAllHomePages();
  updateDOM();
}

function updateAllHomePages () {
  const homePages = document.querySelectorAll('.home');
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
      const label = document.createElement('span');
      popItem.className = 'pop-item';
      popItem.title = link.title;
      popImg.style.backgroundImage = `url(${getFavicon(link.url)})`;
      label.textContent = link.title;
      label.className = 'pop-label';
      popItem.appendChild(popImg);
      popItem.appendChild(label);
  
      popItem.addEventListener('click', () => {
        createWebView(currentTabId, link.url);
      });
      popList.appendChild(popItem);
    });
  });
}

function getFavicon (url) {
  return `https://www.google.com/s2/favicons?sz=64&domain=${url}`;
}

function updateAddressBar () {
  const currentTab = tabs.find(tab => tab.id === currentTabId);
  if (currentWebView == currentTab.content && currentWebView) {
    console.log('current webview:', currentWebView.src);
    currentTab.addressBarValue = currentWebView.src;
  } else {
    addressBar.value = '';
  }
}

// Switch tabs
function switchToTab (tabId) {
  console.log('Switching');
  addressBar.focus();
  if (currentTabId !== tabId) {
    currentTabId = tabId;
    const currentTab = tabs.find(tab => tab.id === tabId);
    if (currentTab) {
      if (currentTab.content instanceof HTMLElement && currentTab.content.tagName === 'WEBVIEW') {
        currentWebView = currentTab.content;
      } else {
        currentWebView = null;
        addressBar.focus();
      }
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
      console.log('tabCount for closing current tab:', tabCount);
      if (tabs.length > 0) {
        currentTabId = tabs[index] ? tabs[index].id : tabs[index - 1].id;
        const currentTab = tabs.find(tab => tab.id === currentTabId);
        if (currentTab.content instanceof HTMLElement && currentTab.content.tagName === 'WEBVIEW') {
          currentWebView = currentTab.content;
        }
      }
    } else {
      console.log('Remove not current tab from DOM');
      newCount = tabs.slice(-1)[0].id;
      tabCount = Number(newCount.split('-')[1]);
      console.log('tabCount for closing not current tab:', tabCount);
    }
    if (tabs.length === 0) {
      window.electronAPI.quitApp();
    }
    updateDOM();
  }
}

// Create the webview for each tab
function createWebView(tabId, url) {
  let webView = document.querySelector(`webview[data-tab-id="${tabId}"]`);
  const homePageDiv = document.querySelector(`#homepage-${tabId}`)
  const webviewContainer = document.querySelector('.webview-container');

  if (homePageDiv) {
    homePageDiv.style.visibility = 'hidden';
    homePageDiv.style.display = 'none';
  }
  
  if (!webView) {
    webView = document.createElement('webview');
    webView.setAttribute('src', url);
    webView.setAttribute('data-tab-id', tabId);
    webView.classList.add('webview');
    webviewContainer.appendChild(webView);
  } else {
    webView.setAttribute('src', url);
    // webView.style.display = 'block';
  }
  
  const currentTab = tabs.find(tab => tab.id === tabId);
  if (currentTab) {
    currentTab.content = webView;
  }
  currentTab.history.splice(1);
  currentWebView = webView;
  trackWebView();
}

function trackWebView() {
  const currentTab = tabs.find(tab => tab.id === currentTabId);
  if (!currentTab) return;
  if (!currentWebView) return;
  let lastURL = '';

  currentWebView.addEventListener('did-navigate', (event) => {
    if (currentWebView) {
      lastURL = event.url;
      if (!currentTab.history.includes(event.url)) {
        currentTab.history.push(event.url);
        currentTab.currentHistoryIndex = currentTab.history.length - 1;
        updateDOM();
        console.log('Navigate');
      }
    }
  });

  currentWebView.addEventListener('did-navigate-in-page', (event) => {
    if (currentWebView && event.url !== lastURL) {
      if (!currentTab.history.includes(event.url)) {
        currentTab.history.push(event.url);
        currentTab.currentHistoryIndex++;
        updateDOM();
        console.log('Navigate in page');
        lastURL = event.url;
      }
    }
    console.log('Last URL visited ' + lastURL);

  });

  currentWebView.addEventListener('page-title-updated', (event) => {
    if (currentTab) {
      currentTab.title = event.title;
      updateDOM();
    }
  });
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
    
    updateAddressBar();
    let content = tab.content;
    if (tab.id === currentTabId) {
      content.style.visibility = 'visible';
      content.style.zIndex = 1;
      addressBar.value = tab.addressBarValue;
    } else {
      content.style.visibility = 'hidden';
      content.style.position = 'absolute';
      content.style.zIndex = -1;
    }
  });

  // Highlight the current tab
  if (currentTabId) {
    const currentTabDiv = document.querySelector(`[data-tab-id="${currentTabId}"]`);
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

function isValidURL(input) {
  try {
    const url = new URL(input);
    return url.protocol === 'http:' || url.protocol === 'https:'; 
  } catch (e) {
    return false; 
  }
}

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
  let searchURL;
  if (isValidURL(userInput)) {
    searchURL = userInput;
  } else {
    const searchQuery = encodeURIComponent(userInput);
    searchURL = `https://www.google.com/search?q=${searchQuery}`;
  }
  
  const currentTab = tabs.find(tab => tab.id === currentTabId);
  if (currentTab && currentTab.content instanceof HTMLElement && currentTab.content.tagName === 'WEBVIEW') {
    currentWebView.setAttribute('src', searchURL);
  } else {
    createWebView(currentTabId, searchURL);
  }
}

function goBackInTab(tabId){
  const currentTab = tabs.find(tab => tab.id === tabId);
  if (!currentTab) return;
  if (currentTab.currentHistoryIndex <= 0) return;
  currentTab.currentHistoryIndex--;
  
  const prevEntry = currentTab.history[currentTab.currentHistoryIndex];
  const webview = document.querySelector(`webview[data-tab-id="${tabId}"]`);
  const homePageDiv = document.querySelector(`#homepage-${tabId}`);

  if (prevEntry instanceof HTMLElement && prevEntry.classList.contains('home')) {
    if (webview){
      webview.remove();
      currentWebView = null;
    }
    if (homePageDiv) {
      homePageDiv.style.display = 'block';
      homePageDiv.style.visibility = 'visible';
      currentTab.title = 'New Tab';
      currentTab.addressBarValue = '';
      currentTab.content = homePageDiv;
    }
  } else {
    webview.setAttribute('src', prevEntry);
    if (homePageDiv) homePageDiv.style.display = 'none';
  }
  updateDOM();
}

function goForwardInTab(tabId){
  const currentTab = tabs.find(tab => tab.id === tabId);
  if (!currentTab) return;
  if (currentTab.currentHistoryIndex >= currentTab.history.length - 1) return;
  currentTab.currentHistoryIndex++;
  console.log('Forward tab index', currentTab.currentHistoryIndex);

  const nextEntry = currentTab.history[currentTab.currentHistoryIndex];
  const prevEntry = currentTab.history[currentTab.currentHistoryIndex - 1];
  const webview = document.querySelector(`webview[data-tab-id="${tabId}"]`);
  if (prevEntry instanceof HTMLElement && prevEntry.classList.contains('home')) {
    createWebView(tabId, nextEntry);
  } else {
    webview.setAttribute('src', nextEntry);
  }
  updateDOM();
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
    goBackInTab(currentTabId); 
  });

  forwardButton.addEventListener('click', () => {
    goForwardInTab(currentTabId);
  });
  
  reloadButton.addEventListener('click', () => {
    const currentTab = tabs.find(tab => tab.id === currentTabId);
    if (currentTab && currentTab.content instanceof HTMLElement && currentTab.content.tagName === 'WEBVIEW') {
      currentWebView.reload();
    }
    updateDOM();
  }); 

  addressBar.addEventListener('input', (event) => {
    const query = event.target.value;
    fetchSuggestions(query);
  });
  
  addressBar.addEventListener('click', function () {
    this.classList.add('animated');
    this.select();
  });
};