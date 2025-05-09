import os
import json
import server
from aiohttp import web

PLUGIN_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONFIG_DIR = os.path.join(PLUGIN_DIR, "config")
PRESET_FILE = os.path.join(CONFIG_DIR, "default-color-preset.json")

os.makedirs(CONFIG_DIR, exist_ok=True)

def ensure_preset_file():
    if not os.path.exists(PRESET_FILE):
        default_presets = {"presets": []}
        with open(PRESET_FILE, 'w', encoding='utf-8') as f:
            json.dump(default_presets, f, ensure_ascii=False, indent=2)

def read_presets():
    ensure_preset_file()
    try:
        with open(PRESET_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
            return data.get("presets", [])
    except Exception as e:
        print(f"Failed to read preset file: {e}")
        return []

def write_presets(presets):
    try:
        with open(PRESET_FILE, 'w', encoding='utf-8') as f:
            json.dump({"presets": presets}, f, ensure_ascii=False, indent=2)
        return True
    except Exception as e:
        print(f"Failed to write preset file: {e}")
        return False

@server.PromptServer.instance.routes.get("/align/color-presets")
async def get_color_presets(request):
    presets = read_presets()
    unique_presets = []
    preset_names = set()

    for preset in presets:
        if preset and "name" in preset and preset["name"] not in preset_names:
            preset_names.add(preset["name"])
            unique_presets.append(preset)
    return web.json_response(unique_presets)

@server.PromptServer.instance.routes.post("/align/color-presets")
async def save_color_presets(request):
    try:
        data = await request.json()
        if write_presets(data):
            return web.json_response({"success": True})
        else:
            return web.json_response({"success": False, "error": "Failed to write preset file"}, status=500)
    except Exception as e:
        return web.json_response({"success": False, "error": str(e)}, status=500)

ensure_preset_file()
