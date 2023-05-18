// @ts-check

import { Player } from '@minecraft/server';
import * as UI from '@minecraft/server-ui';
import { ActionForm } from './ActionForm';
import { confirmForm, getPlayerById, randomValue } from './util';

const icons = {
  add: 'textures/ui/color_plus',
  back: 'textures/ui/icon_import',
  invite: 'textures/ui/invite_base',
  confirm: 'textures/ui/realms_slot_check',
  cancel: 'textures/ui/realms_red_x',
  player1: 'textures/ui/Friend1',
  player2: 'textures/ui/Friend2',
  player3: 'textures/ui/icon_deals',
}
const playerIcons = [ icons.player1, icons.player2, icons.player3 ];

/** @typedef {import('./FriendManager').User} User */

export class FriendMenu {
  /**
   * @param {Player} player
   * @param {import('./FriendManager').FriendManager} friends
   */
  constructor(player, friends) {
    this.friends = friends;
    this.player = player;
    
    this.main().catch(e => console.error(e, e.stack));
  }
  
  async main() {
    const { error, message, data: list } = this.friends.getFriends(this.player.id);
    if (error || !list) return this.player.sendMessage(`§c${message}`);
    const requests = this.friends.fetchRequest(this.player.id);
    if (requests.error) return this.player.sendMessage(`§c${requests.message}`);
    // @ts-ignore
    list.sort((a,b) => (b.online ?? 0) - (a.online ?? 0)); // sort online
    
    const form = new ActionForm();
    for (const user of list) form.button(`${user.online ? '§2':''}${user.name}`, randomValue(playerIcons), user.id);
    form.button('フレンドを追加', icons.add, 'request')
      .button(`フレンド申請 (${color(requests.got?.length)})`, icons.invite, 'got')
      .button(`送信した申請を管理 (${color(requests.sent?.length)})`, icons.invite, 'sent')
      .title(`§lフレンド §r§2${list.filter(u => u.online).length} オンライン §7| §c${list.filter(u => !u.online).length} オフライン§r`);
    const max = this.friends.getMaxFriends(this.player.id);
    if (list.length === 0) {
      form.body('§oまだフレンドはいないようです...');
    } else if (max === -1) { // 無制限の時
      form.body(`フレンド数: ${list.length}/§o§p無制限§r`);
    } else {
      form.body(`フレンド数: ${list.length >= max ? '§c' : ''}${list.length}/${max}`);
    }
    
    const { canceled, button } = await form.show(this.player);
    if (canceled) return;
    if (button?.id === 'request') return await this.sendRequest();
    if (button?.id === 'got') return await this.gotRequests(requests.got ?? []);
    if (button?.id === 'sent') return await this.sentRequests(requests.sent ?? []);
    if (button?.id) {
      const user = list.find(u => u.id === button.id);
      if (!user) return this.player.sendMessage('§c選択したユーザーの読み込みに失敗しました');
      return await this.friendInfo(user);
    }
  }
  
  /**
   * @param {User} user
   */
  async friendInfo(user) {
    const form = new ActionForm();
    form.title(`フレンド > ${user.name}`)
      .body(`${user.name} §7(ID: ${user.id})§r`)
      .button('フレンド登録を削除', icons.cancel)
      .button('戻る', icons.back)
      
    const { selection } = await form.show(this.player);
    if (selection === 0) {
      try {
        const res = await confirmForm(this.player, {
          body: `本当に ${user.name} とのフレンド登録を削除しますか？`,
          yes: '§cフレンド登録を削除する'
        });
        if (res) {
          this.friends.deleteFriend(this.player.id, user.id);
          return this.player.sendMessage(`§a${user.name} とのフレンド登録を削除しました`);
        } else {
          return await this.friendInfo(user);
        }
      } catch {
        return this.player.sendMessage('§cデータベースの操作に失敗しました');
      }
    }
    if (selection === 1) return await this.main();
  }
  
  async sendRequest() {
    const form = new UI.ModalFormData();
    form.title('フレンド > フレンド申請')
      .textField('フレンド名', 'name');
    const { canceled, formValues } = await form.show(this.player);
    if (canceled || !formValues?.[0]) return;
    
    const { error, message, targetId } = this.friends.sendRequest(this.player.id, formValues[0]);
    if (error) return this.player.sendMessage(`§c${message}`);
    this.player.sendMessage(`§a${formValues[0]} にフレンド申請を送信しました`);
    
    const target = getPlayerById(targetId);
    target?.sendMessage(`§e${this.player.name} さんからフレンド申請が届いています！\n/friend でフレンドメニューを開いてみましょう`);
  }
  
  /**
   * @param {User[]} users
   */
  async gotRequests(users) {
    const form = new ActionForm();
    for (const user of users) form.button(String(user.name), undefined, user.id);
    form.title('フレンド > フレンド申請')
      .button('戻る', icons.back, 'back');
    
    const { canceled, button } = await form.show(this.player);
    if (canceled || !button) return;
    if (button.id === 'back') return this.main();
    
    const user = users.find(u => u.id === button.id);
    if (!user) return this.player.sendMessage('§c選択したユーザーの読み込みに失敗しました');
    await this.manageGot(user);
  }
  
  /** @param {User} user */
  async manageGot(user) {
    const form = new ActionForm();
    form.title(`${user.name} からのフレンド申請`)
      .body('どうしますか？')
      .button('§l§2受け入れる', icons.confirm)
      .button('§l§c拒否', icons.cancel)
      .button('戻る', icons.back);
    const { canceled, selection } = await form.show(this.player);
    if (canceled) return;
    if (selection === 0) {
      const { error, message } = this.friends.acceptRequest(this.player.id, user.id);
      if (error) return this.player.sendMessage(`§c${message}`);
      this.player.sendMessage(`§a${user.name} とフレンドになりました！`);
      getPlayerById(user.id)?.sendMessage(`§a${this.player.name} とフレンドになりました！`);
    }
    if (selection === 1) {
      const { error, message } = this.friends.cancelRequest(user.id, this.player.id);
      if (error) return this.player.sendMessage(`§c${message}`);
      this.player.sendMessage(`§a${user.name} からのフレンド申請を拒否しました`);
      getPlayerById(user.id)?.sendMessage(`§a${this.player.name} にフレンド申請を拒否されてしまいました...`);
    }
    if (selection === 2) return await this.main();
  }
  
  /**
   * @param {User[]} users
   */
  async sentRequests(users) {
    const form = new ActionForm();
    for (const user of users) form.button(String(user.name), undefined, user.id);
    form.title('フレンド > 送信済み')
      .button('戻る', icons.back, 'back');
    
    const { canceled, button } = await form.show(this.player);
    if (canceled || !button) return;
    if (button.id === 'back') return this.main();
    
    const user = users.find(u => u.id === button.id);
    if (!user) return this.player.sendMessage('§c選択したユーザーの読み込みに失敗しました');
    await this.manageSent(user);
  }
  
  /** @param {User} user */
  async manageSent(user) {
    const form = new ActionForm();
    form.title(`${user.name} へのフレンド申請`)
      .body('どうしますか？')
      .button('§l§c取り下げる', icons.cancel)
      .button('戻る', icons.back);
    const { canceled, selection } = await form.show(this.player);
    if (canceled) return;
    if (selection === 0) {
      const { error, message } = this.friends.cancelRequest(this.player.id, user.id);
      if (error) return this.player.sendMessage(`§c${message}`);
      this.player.sendMessage(`§a${user.name} へのフレンド申請を取り下げました`);
      getPlayerById(user.id)?.sendMessage(`§a${this.player.name} がフレンド申請を取り下げました`);
    }
    if (selection === 1) return await this.main();
  }
}

  /**
   * @param {any} n
   */
function color(n) {
  return n ? `§e${n}§r` : `§7${n}§r`;
}

