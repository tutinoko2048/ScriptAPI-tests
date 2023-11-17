import { system, world } from '@minecraft/server';

system.afterEvents.scriptEventReceive.subscribe(ev => {
  if (ev.id === 'logs:tnac') {
    world.getDimension('overworld').runCommandAsync(
      `dbchat sendchat sub 255 112 67 TN-AntiCheat ${ev.message} true`
    );
  }
}, {
  namespaces: [ "logs" ]
})