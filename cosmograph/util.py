"""Utils for cosmograph"""

from importlib.resources import files

proj_files = files('cosmograph')
static_files = proj_files / 'static'
static_files_path = str(static_files)


from ju import json_schema_to_signature
from pathlib import Path
import json
from i2 import Sig



config_schema = json.loads((static_files / 'config-schema.json').read_text())

config_schema_sig = json_schema_to_signature(
    config_schema['definitions']['configSchema'],
    default_default=None,
)
config_schema_sig = config_schema_sig.ch_kinds(
    **{name: Sig.KEYWORD_ONLY for name in config_schema_sig.names}
)




# TODO: (for TW) evolve this to be a extendible config to json converter
#       (with complex types support)
def config_to_json(config, *, converter=None):
    if converter is None:
        import json

        return json.dumps(config)
    else:
        return converter(config)
