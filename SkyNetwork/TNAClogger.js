import { system, world } from '@minecraft/server';

system.afterEvents.scriptEventReceive.subscribe(ev => {
  if (ev.id === 'logs:tnac') {
    const message = JSON.stringify(ev.message.replace(/§./, ''));
    world.getDimension('overworld').runCommandAsync(
      `dbchat sendchat sub 255 112 67 TN-AntiCheat ${message} true`
    );
  }
}, {
  namespaces: [ "logs" ]
});
