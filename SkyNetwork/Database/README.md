# SkyDBのつかいかた
`Database/index`から`db`をインポートする(SkyDBではない)  
SkyDBクラスで複数のDatabaseを管理する仕組みになってます

EX:
```js
import { db } from './Database/index';

db.set('table名', 'キー', 'hi!');
const value = db.get('table名', 'キー');
console.warn(value); // hi!
```
他のメソッドはindex.d.tsの型定義を読んでみてね  
SkyDB本体を編集する時はindex.**ts**の方をいじるとTypeScriptに助けてもらえるから良いかも  
書けたら`cd Database`で場所移動して`npx tsc`を実行してjsにトランスパイルすること。  
※エラーの行数表示はindex.**js**の行数が出てきます  
  
アプデ来た時はここから更新できます(迷ったけどJaylyDBを使うことにした)  
https://github.com/JaylyDev/ScriptAPI/tree/main/scripts/jaylydb
