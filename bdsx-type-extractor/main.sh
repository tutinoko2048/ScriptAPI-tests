rm -r bdsx-src
rm -r bdsx/bdsx
cp -r ../bdsx/bdsx ./bdsx-src
npm run build

zip bdsx-types.zip -r bdsx