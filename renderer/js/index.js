let tabCount = 0;
let tabs = [];
let currentTabId = null;

function addTab() {
  tabCount++;
  const tabId = `tab-${tabCount}`;
  const tabContent = `Tab ${tabCount}`;
  
  // Add the new tab to the array
  tabs.push({ id: tabId, content: tabContent });
  
  // Set the newly added tab as the current tab
  currentTabId = tabId;
  
  // Update the DOM
  updateDOM();
}

// Switch tabs
function switchToTab(tabId) {
  if (tabId) {
    currentTabId = tabId;
  }
  updateDOM();
}

function removeTab(tabId) {

  // Send signal to close app if tabs array is empty
  if (tabs.length === 0) {
    window.electronAPI.quitApp();
  }
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
    // Update the DOM
    updateDOM();

  }
}


function closeTab(event) {
  event.stopPropagation();
  const button = event.target;
  const tabDiv = button.closest('.tab');
  const tabId = tabDiv.getAttribute('data-tab-id');
  removeTab(tabId);
}


function updateDOM() {
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
    tabContainer.appendChild(tabDiv);

    // Attach event listeners to the close buttons
    tabDiv.querySelector('.close-tab').addEventListener('click', closeTab);
    // Attach event listeners to the tabs to listen for when they're clicked
    tabDiv.addEventListener('click', () => switchToTab(tab.id));
    // adjustTabWidths();
  });
  
  // Highlight the current tab
  if (currentTabId) {
    const currentTabDiv = document.querySelector(`[data-tab-id="${currentTabId}"]`);
    if (currentTabDiv) {
      currentTabDiv.classList.add('active');
    }
  }
}

// function adjustTabWidths() {
//   const tabContainer = document.querySelector('.tabs-container');
//   const tabElements = tabContainer.querySelectorAll('.tab');
//   const containerWidth = tabContainer.clientWidth;
//   const tabWidth = Math.max(containerWidth / tabs.length, 100); // Minimum width of 100px per tab
//   tabElements.forEach(tab => {
//     tab.style.width = `${tabWidth}px`;
//   });
// }


//Load a tab on intitial window load
window.onload = () => {
  addTab();
};

//Add tab when a add tab button is clicked
document.getElementById('add-tab').addEventListener('click', addTab);
