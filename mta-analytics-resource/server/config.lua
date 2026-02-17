
Config = {}

-- Backend API Configuration
Config.API_URL = "http://127.0.0.1:3000/api/mta"
Config.API_KEY = "mta-server-key-1" 
Config.API_SECRET = "your-super-secret-hmac-key-change-this-in-production" 

Config.BATCH_SIZE = 10
Config.BATCH_INTERVAL = 5000 
Config.POSITION_TRACK_INTERVAL = 30000 

Config.COLLECT_EVENTS = {
    PLAYER_JOIN = true,
    PLAYER_QUIT = true,
    PLAYER_SPAWN = true,
    PLAYER_WASTED = true,
    PLAYER_DAMAGE = true,
    PLAYER_CHAT = true,
    MONEY_CHANGE = true,
    VEHICLE_ENTER = true,
    VEHICLE_EXIT = true,
    PLAYER_STATUS_SYNC = true,
}

Config.STATUS_SYNC_INTERVAL = 60000 

Config.DEBUG = true
Config.MAX_API_FAILURES = 5
