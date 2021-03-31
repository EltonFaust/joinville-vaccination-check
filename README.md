Add desktop launcher

```sh
echo -e "#"'!'"/usr/bin/env xdg-open\n[Desktop Entry]\nVersion=1.0\nType=Application\nTerminal=true\nIcon=$(pwd)/icon.png\nExec=$(pwd)/index.js\nName=Vaccination Check" > "$(xdg-user-dir DESKTOP)/vaccination-check.desktop" \
    && chmod +x "$(xdg-user-dir DESKTOP)/vaccination-check.desktop"
```