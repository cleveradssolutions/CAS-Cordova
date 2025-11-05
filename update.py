import os
import re
from pathlib import Path

_PLUGIN_VERSION = "4.4.2"
_CAS_VERSION = "4.4.2"

# https://cordova.apache.org/docs/en/12.x-2025.01/guide/hybrid/plugins/index.html#publishing-plugins

# Plugin publishing flow (from the project root):

def update_version_in_file(file_path, prefix, suffix):
    with open(file_path, 'r', encoding='utf-8') as file:
        lines = file.readlines()

    success = False
    stripPrefix = prefix.lstrip()
    with open(file_path, 'w', encoding='utf-8') as file:
        for line in lines:
            if line.lstrip().startswith(stripPrefix):
                file.write(prefix + suffix + '\n')
                success = True
            else:
                file.write(line)
    
    if success:
        print("Updated " + file_path + ": " + stripPrefix + suffix)
    else:
        raise RuntimeError(f"Prefix {prefix} not found in file: {file_path}")

def find_js_functions(content):
     # funcName: function (...) { ... }
    func_pattern = re.compile(
        r"(\w+)\s*:\s*function\s*\([^)]*\)\s*\{([^}]*)\}", re.DOTALL
    )

    return func_pattern.findall(content)

def check_js_file(content):
    matches = find_js_functions(content)
    success = True
    print(f"Check www/casai.js")
    for func_name, body in matches:
        body_clean = body.strip()

        has_promise = re.search(rf"return\s+nativePromise\s*\(\s*['\"]{func_name}['\"]", body_clean)
        has_call = re.search(rf"nativeCall\s*\(\s*['\"]{func_name}['\"]", body_clean)

        if not (has_promise or has_call):
            print("⚠️ In JS invalid function: " + func_name)
            success = False

    if success:
        print(f"✅ www/casai.js")

def update_kotlin_file(js_funcs):
    kotlin_file = Path('cordova-plugin-casai/src/android/CASMobileAds.kt')
    text = kotlin_file.read_text(encoding="utf-8")

    pattern = r"(// -- Autogeneration mark begin)(.*?)(// -- Autogeneration mark end)"
    match = re.search(pattern, text, flags=re.S)

    if not match:
        raise ValueError("⚠️ Kotlin generation markers not found")

    before, block, after = match.groups()

    # === Витягуємо існуючі дії у when ===
    existing_actions = re.findall(r'"([^"]+)"\s*->', block)
    existing_set = set(existing_actions)

    # === Формуємо нові рядки, додаючи тільки відсутні ===
    lines = []
    for key, value in js_funcs:
        if key not in existing_set:
            lines.append(f'            "{key}" -> {{')
            for data in value[value.find(' native'):].split("\n"):
                if data.strip():
                    lines.append(f'                // {data.strip()}')
            lines.append(f'                {key}(data, callbackContext)')
            lines.append(f'            }}')

    if lines:
        new_block = block + "\n" + "\n".join(lines) + "\n            "

        new_text = re.sub(pattern, f"\\1{new_block}\\3", text, flags=re.S)

        kotlin_file.write_text(new_text, encoding="utf-8")

    print("✅ CASMobileAds.kt")
    
    
def check_types_file(ts_content, js_content):
    ts_func_names = set(re.findall(r'^\s+([A-Za-z_]\w*)\s*\(', ts_content, flags=re.MULTILINE))
    js_funcs = find_js_functions(js_content)
    js_func_names = set([m[0] for m in js_funcs])

    ts_func_names.remove("addEventListener")
    ts_func_names.remove("removeEventListener")

    missing_in_js = ts_func_names - js_func_names
    extra_in_js = js_func_names - ts_func_names

    print(f"Check www/casai.js")
    if missing_in_js:
        for f in sorted(missing_in_js):
            print("⚠️ In JS missing function: " + f)

    print(f"Check types/index.d.ts")
    if extra_in_js:
        for f in sorted(extra_in_js):
            print("⚠️ In TS Missing function: " + f)

    if not missing_in_js and not extra_in_js:
        print(f"✅ index.d.ts {len(js_func_names)} functions")
        
    update_kotlin_file(js_funcs)


ts_file = Path('cordova-plugin-casai/types/index.d.ts').read_text()
js_file = Path('cordova-plugin-casai/www/casai.js').read_text()
check_types_file(ts_file, js_file)
check_js_file(js_file)

update_version_in_file(
    file_path=os.path.join('cordova-plugin-casai', "package.json"),
    prefix='  "version": "',
    suffix=_PLUGIN_VERSION + '",'
)
update_version_in_file(
    file_path=os.path.join('cordova-plugin-casai', "plugin.xml"),
    prefix='    version="',
    suffix=_PLUGIN_VERSION + '">'
)
update_version_in_file(
    file_path=os.path.join('cordova-plugin-casai', "plugin.xml"),
    prefix='        <framework src="com.cleveradssolutions:cas-sdk:',
    suffix=_CAS_VERSION + '" />'
)
update_version_in_file(
    file_path=os.path.join('cordova-plugin-casai', "plugin.xml"),
    prefix='                <pod name="CleverAdsSolutions-Base" spec="',
    suffix=_CAS_VERSION + '" swift-version="5.0" />'
)