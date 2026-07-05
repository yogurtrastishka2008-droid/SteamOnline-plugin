import Millennium
import urllib.request
import re
import json

class Plugin:
    def _front_end_loaded(self):
        # Called when the frontend is ready
        pass

    def get_online_players(self, params):
        try:
            # Извлекаем appId, обрабатываем как словарь (dict) или строку
            app_id = str(params.get('appId', '')) if isinstance(params, dict) else str(params)
            
            # 1. ЖЕСТКАЯ ВАЛИДАЦИЯ
            # Гарантируем, что внутри только цифры
            if not re.match(r"^\d+$", app_id):
                return '{"error": "Security: Invalid AppID format"}'
                
            url = f"https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid={app_id}"
            
            # 2. НАТИВНЫЙ HTTPS ВНУТРИ ПРОЦЕССА (Без curl.exe и окон!)
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
            with urllib.request.urlopen(req, timeout=5) as response:
                return response.read().decode('utf-8')
                
        except Exception as e:
            return '{"error": "Failed to fetch"}'
