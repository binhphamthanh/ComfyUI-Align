import os

from .server import color_preset_api

NODE_CLASS_MAPPINGS = {}

NODE_DISPLAY_NAME_MAPPINGS = {}

__all__ = [
    "NODE_CLASS_MAPPINGS",
    "NODE_DISPLAY_NAME_MAPPINGS",
    "WEB_DIRECTORY",
    "JS_ENTRY_POINT",
]

current_directory = os.path.dirname(os.path.abspath(__file__))
WEB_DIRECTORY = os.path.join(current_directory, "web", "js")
JS_ENTRY_POINT = "index.js"

CONFIG_DIR = os.path.join(current_directory, "config")
os.makedirs(CONFIG_DIR, exist_ok=True)