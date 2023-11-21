import * as net from '@minecraft/server-net';
import { world, system } from '@minecraft/server';
import type { RESTPostAPIWebhookWithTokenJSONBody as WebhookBody } from 'discord-api-types/v10';
import { WEBHOOK_URL } from './config';

system.afterEvents.scriptEventReceive.subscribe(ev => {
  const { message, id } = ev;
  if (id === 'net:sendHook') {
    if (!message) throw new TypeError('[net:sendHook] Please set a payload of webhook.');

    let data: WebhookBody = {}
    try {
      data = JSON.parse(message);
    } catch {
      throw Error('[net:sendHook] Failed to parse JSON');
    }
    if (!isObject(data) && typeof data !== 'string') throw new TypeError('[net:sendHook] The type of data is not an object.');

    sendHook(data).catch(e => console.error(e, e.stack));
  }
}, {
  namespaces: [ 'net' ]
});

async function sendHook(data: WebhookBody): Promise<void> {
  const request = new net.HttpRequest(WEBHOOK_URL);
  request.setHeaders([
    new net.HttpHeader('Content-Type', 'application/json')
  ]);
  request.setMethod(net.HttpRequestMethod.Post);
  request.setBody(JSON.stringify(data));

  const response = await net.http.request(request);
  if (response.status !== 200 && response.status !== 201) {
    console.error(`[DiscordAPIError] statusCode: ${response.status}, body: ${response.body}`);
  }
}

function isObject(item: any): boolean {
  return typeof item === 'object' && item !== null;
}