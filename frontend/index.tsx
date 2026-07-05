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

// Using Millennium's window creation hook to inject UI
Millennium.AddWindowCreateHook?.((context: any) => {
    try {
      if (!context.m_strName?.startsWith('SP ')) return;
      const win = context.m_popup;
      const doc = win.document as Document;

      const checkPage = async () => {
        try {
          const divsCount = doc.querySelectorAll('div').length;
          if (divsCount < 100) return;

          let appId = null;
          
          // Try to get appId from global window object
          const mng = (window as any).MainWindowBrowserManager;
          const path = mng?.m_lastLocation?.pathname || '';
          const match = path.match(/\/app\/(\d+)/);
          if (match) {
             appId = match[1];
          } else {
             // Fallback: check images
             const images = doc.querySelectorAll('img');
             for (const img of Array.from(images)) {
                const src = img.src || '';
                const m2 = src.match(/librarycache\/(\d+)_(?:library_hero|logo|header|icon)/i) || 
                           src.match(/\/(?:apps|assets)\/(\d+)\//i) ||
                           src.match(/steamloopback\.host\/images\/(?:\w+\/)?(\d+)\//i);
                if (m2) {
                    appId = m2[1];
                    break;
                }
             }
          }

          // Remove old badges from other games
          const existingBadges = doc.querySelectorAll('.steam-online-premium-badge');
          existingBadges.forEach(b => {
              if (b.id !== 'steam-online-badge-' + appId) {
                  b.remove();
              }
          });

          if (!appId) return;

          let badge = doc.getElementById('steam-online-badge-' + appId);
          if (!badge) {
            // Find the hero image (usually the largest image on the page)
            const heroImg = Array.from(doc.querySelectorAll('img')).find(img => img.src.includes(appId!) && img.clientWidth > 200);
            if (!heroImg) return;
            
            const container = heroImg.parentElement;
            if (!container) return;
            
            if (window.getComputedStyle(container).position === 'static') {
                container.style.position = 'relative';
            }

            badge = doc.createElement('div');
            badge.id = 'steam-online-badge-' + appId;
            badge.className = 'steam-online-premium-badge';
            badge.style.position = 'absolute';
            badge.style.bottom = '20px';
            badge.style.right = '20px';
            badge.style.zIndex = '100';
            badge.style.display = 'flex';
            badge.style.alignItems = 'center';
            badge.style.gap = '8px';
            badge.style.padding = '8px 16px';
            badge.style.background = 'rgba(0, 0, 0, 0.6)';
            badge.style.backdropFilter = 'blur(10px)';
            badge.style.border = '1px solid rgba(255, 255, 255, 0.1)';
            badge.style.borderRadius = '6px';
            badge.style.color = '#fff';
            badge.style.fontWeight = '500';
            badge.style.fontSize = '14px';
            badge.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';
            badge.style.transition = 'all 0.2s ease';
            
            badge.onmouseenter = () => { badge!.style.background = 'rgba(0, 0, 0, 0.8)'; };
            badge.onmouseleave = () => { badge!.style.background = 'rgba(0, 0, 0, 0.6)'; };

            container.appendChild(badge);
          }
          
          if (badge.getAttribute('data-loaded') !== 'true') {
            badge.innerHTML = `
              <div style="width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 1s linear infinite;"></div>
              Загрузка...
            `;
            
            // Add keyframes if not exists
            if (!doc.getElementById('steam-online-spinner-style')) {
                const style = doc.createElement('style');
                style.id = 'steam-online-spinner-style';
                style.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
                doc.head.appendChild(style);
            }

            const count = await fetchOnlinePlayers(appId);
            if (count !== null) {
              badge.setAttribute('data-loaded', 'true');
              badge.innerHTML = `
                  <div style="width: 8px; height: 8px; background: #16c60c; border-radius: 50%; box-shadow: 0 0 8px #16c60c;"></div>
                  В игре: ${formatNumber(count)}
              `;
            } else {
              badge.innerHTML = `Ошибка`;
            }
          }
        } catch (e: any) {
        }
      };

      setInterval(checkPage, 1000);

    } catch (err: any) {
    }
});
