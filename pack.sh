#!/bin/sh
BASE_NAME="$(jq '.id' ccmod.json | sed 's/^"//;s/"$//')"
NAME="${BASE_NAME}-$(jq '.version' ccmod.json | sed 's/^"//;s/"$//').ccmod"
rm -rf "$BASE_NAME"*
pnpm install
pnpm run build
mkdir -p pack
cp -r assets icon json LICENSE plugin.js ./pack
cd ./pack
for file in $(find . -iname '*.json'); do
    jq '.' ../$file -c > $file
done
cp ../ccmod.json .
rm -rf icon/icon240.png icon/icon.kra icon/icon.png~
zip -r "../$NAME" .
cd ..
rm -rf pack
