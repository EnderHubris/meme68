#!/bin/bash
echo '[*] Clearing metadata from images. . .'
exiftool -all= -overwrite_original images/
echo '[*] metadata removed!'

echo '[*] Collecting meme images. . .'
mapfile -t memes < <(find images/ -type f | awk -F/ '{ print $2 }')
echo '[*] Generating JSON file. . .'

total=${#memes[@]}
echo "[" > images.json

for i in "${!memes[@]}"; do
    meme="${memes[$i]}"

    # display progress bar
    percent=$(( (i+1) * 100 / total ))
    printf "\rGenerating JSON: %d%%" "$percent"

    # ensure no trailing comma in JSON file
    if [ "$i" -eq $((total - 1)) ]; then
        echo "  \"${meme}\"" >> images.json
        echo '' # fix cursor from printf above
    else
        echo "  \"${meme}\"," >> images.json
    fi
done
echo "]" >> images.json
echo '[+] JSON file generated!'