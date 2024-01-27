import { events } from 'bdsx/bdsx/event'
events.serverOpen.on(() => {
  console.log('Hello world')
});