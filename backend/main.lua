local millennium = require("millennium")
local http = require("http")

function get_online_players(params)
    local appId = type(params) == "table" and params.appId or params

    -- 1. СТРОГАЯ ВАЛИДАЦИЯ (Security Sanitization)
    if type(appId) ~= "string" and type(appId) ~= "number" then 
        return '{"error": "Security: Invalid AppID"}' 
    end
    appId = tostring(appId)
    if not appId:match("^%d+$") then
        return '{"error": "Security: Invalid AppID format"}'
    end

    local url = "https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=" .. appId

    -- 2. НАТИВНЫЙ HTTP-ЗАПРОС БЕЗ CONSOLE FLASH И ВНЕШНИХ ПРОЦЕССОВ
    local success, res = pcall(function()
        return http.get(url)
    end)

    if success and type(res) == "table" and res.status == 200 then
        return res.body
    end

    return '{"error": "Failed to fetch players"}'
end

-- Регистрация методов для фронтенда
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
