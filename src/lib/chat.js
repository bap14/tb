import tmi from 'tmi.js';
import {saveMessage, requestedRecently} from './store';

const chat = new tmi.client({connection: {reconnect: true}});

chat.on('action', saveAction);
chat.on('chat', saveChat);

async function saveAction(channel, user, message) {
  try {await saveMessage({type: 'action', channel, user, message})}
  catch(e) {console.warn(e)}
}

async function saveChat(channel, user, message) {
  try {await saveMessage({type: 'chat', channel, user, message})}
  catch(e) {console.warn(e)}
}

export default chat;

export async function startChatClient() {
  chat.connect();
  const recent = await requestedRecently();
  chat.once('connected', () => recent.forEach(chat.join.bind(chat)));
}