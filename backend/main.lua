function get_online_players(args)
    local appId = args.appId

    -- 1. ЖЕСТКАЯ ВАЛИДАЦИЯ (Sanitization)
    -- Пропускаем ТОЛЬКО строку, состоящую исключительно из цифр (от 1 до 7+ символов)
    if type(appId) ~= "string" or not appId:match("^%d+$") then
        return '{"error": "Security: Invalid AppID format"}'
    end

    local url = "https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=" .. appId

    -- 2. ПОПЫТКА НАТИВНОГО HTTP (без внешних процессов)
    local has_ssl, https = pcall(require, "ssl.https")
    if has_ssl then
        local body, code = https.request(url)
        if code == 200 and body then
            return body
        end
    end

    -- 3. БЕЗОПАСНЫЙ ФОЛБЭК (io.popen)
    -- Поскольку appId прошел жесткую валидацию (^%d+$), command injection здесь математически невозможен.
    -- Вызов curl.exe в фоне без оберток VBScript.
    local handle = io.popen('curl.exe -s "' .. url .. '"')
    if handle then
        local result = handle:read("*a")
        handle:close()
        return result
    end

    return '{"error": "Failed to fetch"}'
end

_G.Plugin = {
    get_online_players = get_online_players
}
