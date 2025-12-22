import os
import re
import shutil
from pathlib import Path

_PLUGIN_VERSION = "4.5.4"
_CAS_VERSION = "4.5.4"

# Plugin publishing flow (from the project root):
# $ python3 update.py
# $ cd example
# $ npm run test:android
# $ npm run test:ios
# $ cd ../cordova-plugin-casai
# add to ~/.npmrc file access token: //registry.npmjs.org/:_authToken=
# $ npm login
# $ npm run release

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
        print("Updated " + file_path + ":\n   " + stripPrefix + suffix)
    else:
        raise RuntimeError(f"Prefix {prefix} not found in file: {file_path}")


def update_source_files_from_platform(source: str, target: str, files: list):
    source_dir = Path(source)
    target_dir = Path(target)

    for filename in files:
        src = source_dir / filename
        dst = target_dir / filename

        if not src.exists():
            print(f"[!] Файл {src} не існує, пропускаю.")
            continue

        if not dst.exists():
            shutil.copy2(src, dst)
            continue

        src_mtime = os.path.getmtime(src)
        dst_mtime = os.path.getmtime(dst)

        if src_mtime > dst_mtime:
            shutil.copy2(src, dst)


plugin_dir = 'cordova-plugin-casai'
update_version_in_file(
    file_path=os.path.join(plugin_dir, "package.json"),
    prefix='  "version": "',
    suffix=_PLUGIN_VERSION + '",'
)
update_version_in_file(
    file_path=os.path.join(plugin_dir, "plugin.xml"),
    prefix='    version="',
    suffix=_PLUGIN_VERSION + '">'
)
update_version_in_file(
    file_path=os.path.join(plugin_dir, "plugin.xml"),
    prefix='        <framework src="com.cleveradssolutions:cas-sdk:',
    suffix=_CAS_VERSION + '" />'
)
update_version_in_file(
    file_path=os.path.join(plugin_dir, "plugin.xml"),
    prefix='                <pod name="CleverAdsSolutions-Base" spec="',
    suffix=_CAS_VERSION + '" swift-version="5.0" />'
)
update_version_in_file(
    file_path=os.path.join(plugin_dir, 'scripts', 'helper.js'),
    prefix="const CAS_VERSION = '",
    suffix=_CAS_VERSION + "';"
)
update_version_in_file(
    file_path=os.path.join(plugin_dir, 'scripts', 'helper.js'),
    prefix="const CAS_ANDROID_FIX = '",
    suffix="';"
)
update_source_files_from_platform(
    source="example/platforms/android/app/src/main/java/com/cleveradssolutions/plugin/cordova",
    target="cordova-plugin-casai/src/android",
    files=[
        "CASMobileAds.kt",
        "ScreenAdManager.kt",
        "ViewAdManager.kt"
    ]
)
