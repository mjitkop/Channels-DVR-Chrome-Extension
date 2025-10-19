console.log('✅ content-monitor_sources.js loaded');

const observer = new MutationObserver(() => {
  const small = document.querySelector('div.page-header h4 small');
  if (small && !document.querySelector('#monitor-button')) {
    console.log('✅ Found target <small> inside .page-header');

    const button = document.createElement('button');
    button.id = 'monitor-button';
    button.textContent = 'Recent Changes';
    button.className = 'btn btn-warning';
    button.style.marginLeft = '10px';

    small.insertAdjacentElement('afterend', button);
    console.log('✅ Button inserted after <small>');

    button.addEventListener('click', () => {
      console.log('🟡 Monitoring started...');
      const popup = window.open(
        chrome.runtime.getURL('monitor_popup.html'),
        'MonitorSetup',
        'width=400,height=600'
      );
    });

    observer.disconnect(); // Stop observing once inserted
  }
});

observer.observe(document.body, { childList: true, subtree: true });
