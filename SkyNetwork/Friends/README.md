# MEMO
FriendManager.jsにFriendAPIを追加  
FriendAPIからフレンド一覧を取ったりユーザー登録したりする  
  
DatabaseのtableName: usersにidと名前が紐付けて保存してあるから必要な時はどうぞ  
`FriendAPI.getUser(プレイヤーID);` するとこんなオブジェクト受け取れます  
```ts
{
  id: string, // player id
  name: string // player name
}
``` 