local millennium = require("millennium")

local function on_load()
    -- Просто сообщаем движку, что плагин готов. 
    -- Вся сетевая логика теперь безопасно работает прямо во фронтенде (React).
    millennium.ready()
end

return {
    on_load = on_load
}
