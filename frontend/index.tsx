import React from 'react';
import { definePlugin, Millennium, callable } from '@steambrew/client';

const onlineCache = new Map<string, { count: number, timestamp: number }>();

async function fetchOnlinePlayers(appId: string): Promise<number | null> {
  if (onlineCache.has(appId)) {
    const cached = onlineCache.get(appId)!;
    if (Date.now() - cached.timestamp < 5 * 60 * 1000) {
      return cached.count;
    }
  }

  return new Promise<number | null>((resolve) => {
    const cbName = 'steam_online_' + appId + '_' + Math.floor(Math.random() * 100000);
    
    const timeout = setTimeout(() => {
      cleanup();
      resolve(null);
    }, 5000);

    const cleanup = () => {
      delete (window as any)[cbName];
      document.getElementById(cbName)?.remove();
      clearTimeout(timeout);
    };

    (window as any)[cbName] = (data: any) => {
      cleanup();
      if (data?.response?.result === 1) {
        const count = data.response.player_count;
        onlineCache.set(appId, { count, timestamp: Date.now() });
        resolve(count);
      } else {
        resolve(null);
      }
    };

    const script = document.createElement('script');
    script.id = cbName;
    script.src = `https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=${appId}&jsonp=${cbName}`;
    script.onerror = () => {
      cleanup();
      
      const getOnline = callable<[{ appId: string }], string>("get_online_players");
      getOnline({ appId }).then(resultStr => {
        if (resultStr && resultStr !== "{}") {
           const data = JSON.parse(resultStr);
           if (data?.response?.result === 1) {
              const count = data.response.player_count;
              onlineCache.set(appId, { count, timestamp: Date.now() });
              resolve(count);
              return;
           }
        }
        resolve(null);
      }).catch(e => {
        resolve(null);
      });
    };
    document.head.appendChild(script);
  });
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat('ru-RU').format(num);
}

export default definePlugin(() => {
  return {
    name: 'Steam Online Players',
    version: '1.0.0',
    icon: <div />,
    alwaysRender: true,
    
    onDismount() {
      // Cleanup if needed
    },
  };
});

// Helper to extract AppID from the page
function getAppIdFromPage(doc: Document): string | null {
  const mng = (window as any).MainWindowBrowserManager;
  const path = mng?.m_lastLocation?.pathname || '';
  const match = path.match(/\/app\/(\d+)/);
  if (match) return match[1];

  const images = Array.from(doc.querySelectorAll('img')) as HTMLImageElement[];
  for (const img of images) {
    const src = img.src || '';
    const m2 = src.match(/librarycache\/(\d+)_(?:library_hero|logo|header|icon)/i) || 
               src.match(/\/(?:apps|assets)\/(\d+)\//i) ||
               src.match(/steamloopback\.host\/images\/(?:\w+\/)?(\d+)\//i);
    if (m2) return m2[1];
  }
  return null;
}

// Helper to remove badges from other games
function cleanupOldBadges(doc: Document, currentAppId: string) {
  const badges = Array.from(doc.querySelectorAll('.steam-online-premium-badge'));
  badges.forEach(b => {
      if (b.id !== 'steam-online-badge-' + currentAppId) {
          b.remove();
      }
  });
}

// Helper to find the hero banner image
function findHeroImage(doc: Document, appId: string): HTMLImageElement | undefined {
  const images = Array.from(doc.querySelectorAll('img')) as HTMLImageElement[];
  return images.find(img => img.src.includes(appId) && img.clientWidth > 200);
}

// Helper to inject the CSS keyframes for the spinner
function injectGlobalStyles(doc: Document) {
  if (!doc.getElementById('steam-online-spinner-style')) {
      const style = doc.createElement('style');
      style.id = 'steam-online-spinner-style';
      style.textContent = `@keyframes steam-online-spin { to { transform: rotate(360deg); } }`;
      doc.head.appendChild(style);
  }
}

// Helper to create the badge element with styling
function createBadge(doc: Document, appId: string): HTMLDivElement {
  const badge = doc.createElement('div');
  badge.id = 'steam-online-badge-' + appId;
  badge.className = 'steam-online-premium-badge';
  
  Object.assign(badge.style, {
    position: 'absolute',
    bottom: '20px',
    right: '20px',
    zIndex: '100',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    background: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '6px',
    color: '#fff',
    fontWeight: '500',
    fontSize: '14px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
    transition: 'all 0.2s ease'
  });
  
  badge.onmouseenter = () => { badge.style.background = 'rgba(0, 0, 0, 0.8)'; };
  badge.onmouseleave = () => { badge.style.background = 'rgba(0, 0, 0, 0.6)'; };
  
  return badge;
}

// Helper to update badge states
function setBadgeState(badge: HTMLElement, state: 'loading' | 'loaded' | 'error', count?: number) {
  if (state === 'loading') {
    badge.innerHTML = `
      <div style="width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: steam-online-spin 1s linear infinite;"></div>
      Загрузка...
    `;
  } else if (state === 'loaded' && count !== undefined) {
    badge.innerHTML = `
        <div style="width: 8px; height: 8px; background: #16c60c; border-radius: 50%; box-shadow: 0 0 8px #16c60c;"></div>
        В игре: ${formatNumber(count)}
    `;
  } else if (state === 'error') {
    badge.innerHTML = `Ошибка`;
  }
}

// Using Millennium's window creation hook to inject UI
Millennium.AddWindowCreateHook?.((context: any) => {
    try {
      if (!context.m_strName?.startsWith('SP ')) return;
      const win = context.m_popup;
      const doc = win.document as Document;

      const checkPage = async () => {
        try {
          // Wait for React to hydrate the page
          if (doc.querySelectorAll('div').length < 100) return;

          const appId = getAppIdFromPage(doc);
          if (!appId) return;

          cleanupOldBadges(doc, appId);

          let badge = doc.getElementById('steam-online-badge-' + appId);
          if (!badge) {
            const heroImg = findHeroImage(doc, appId);
            const container = heroImg?.parentElement;
            if (!container) return;
            
            if (win.getComputedStyle(container).position === 'static') {
                container.style.position = 'relative';
            }

            badge = createBadge(doc, appId);
            container.appendChild(badge);
          }
          
          if (badge.getAttribute('data-loaded') !== 'true') {
            badge.setAttribute('data-loaded', 'true'); // Set immediately to prevent duplicate fetches
            
            injectGlobalStyles(doc);
            setBadgeState(badge, 'loading');

            const count = await fetchOnlinePlayers(appId);
            if (count !== null) {
              setBadgeState(badge, 'loaded', count);
            } else {
              setBadgeState(badge, 'error');
            }
          }
        } catch (e) {
          // Ignore DOM/network errors to prevent console spam
        }
      };

      win.setInterval(checkPage, 1000);

    } catch (err) {
      // Ignore hook setup errors
    }
});
