echo -n Put module version: @minecraft/server@
read version
echo installing @minecraft/server@$version ...
npm i @minecraft/server@$version
cp ./node_modules/@minecraft/server/index.d.ts ./Types/$version.d.ts
echo saved typing file as ./Types/$version.d.ts