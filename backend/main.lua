local millennium = require("millennium")

function get_online_players(params)
    -- Извлекаем appId в зависимости от формата (иногда приходит как объект, иногда как строка)
    local appId = type(params) == "table" and params.appId or params

    -- 1. ЖЕСТКАЯ ВАЛИДАЦИЯ
    if type(appId) ~= "string" and type(appId) ~= "number" then return '{"error": "Security: Invalid AppID"}' end
    appId = tostring(appId)
    if not appId:match("^%d+$") then
        return '{"error": "Security: Invalid AppID format"}'
    end

    local url = "https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=" .. appId

    -- 2. ПОПЫТКА НАТИВНОГО HTTP
    local has_ssl, https = pcall(require, "ssl.https")
    if has_ssl then
        local body, code = https.request(url)
        if code == 200 and body then
            return body
        end
    end

    -- 3. БЕЗОПАСНЫЙ ФОЛБЭК
    local handle = io.popen('curl.exe -s "' .. url .. '"')
    if handle then
        local result = handle:read("*a")
        handle:close()
        return result
    end

    return '{"error": "Failed to fetch"}'
end

-- Регистрация функции для вызова с фронтенда
_G.get_online_players = get_online_players
if not _G.Plugin then _G.Plugin = {} end
_G.Plugin.get_online_players = get_online_players

local function on_load()
    millennium.ready()
end

return {
    on_load = on_load,
    get_online_players = get_online_players
}
