local millennium = require("millennium")

function get_online_players(params)
    local appId = type(params) == "table" and params.appId or params
    local url = "https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=" .. tostring(appId)
    
    local source = debug.getinfo(1, "S").source
    local plugin_dir = source:match("@?(.*)[/\\]backend[/\\]main.lua")
    if not plugin_dir then
        -- Fallback if debug.getinfo fails
        plugin_dir = "C:\\Program Files (x86)\\Steam\\millennium\\plugins\\SteamOnline-plugin"
    end
    
    local vbs_path = plugin_dir .. "\\backend\\silent_curl.vbs"
    local out_path = plugin_dir .. "\\backend\\out_" .. tostring(appId) .. ".txt"
    
    -- Delete old out file if exists
    os.remove(out_path)
    
    -- Run silently using wscript
    local cmd = 'wscript.exe //nologo "' .. vbs_path .. '" "' .. url .. '" "' .. out_path .. '"'
    os.execute(cmd)
    
    -- Read the result
    local file = io.open(out_path, "r")
    if not file then return "{}" end
    local result = file:read("*a")
    file:close()
    
    -- Cleanup
    os.remove(out_path)
    
    return result
end

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

