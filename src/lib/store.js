import {MongoClient} from 'mongodb';
import {daysToMs} from './helpers';

let db = Promise.reject('Database not yet connected');
let counter = 0;
const options = {server: {reconnectTries: Infinity}};

setInterval(() => {
  console.log('New messsages: ' + counter);
  counter = 0;
}, 30000);
createIndex();

async function createIndex() {
  (await requests()).createIndex({channel: 1}, {unique: true});
}

async function messages() {
  return (await db).collection('messages');
}

async function requests() {
  return (await db).collection('requests');
}

export async function connectToDatabase(host) {
  db = MongoClient.connect(host, options);
  try {await db}
  catch(e) {
    console.warn('Could not connect to database.');
    setTimeout(() => connectToDatabase(host), 5000);
  }
}

export async function saveMessage(msgObject) {
  counter++;
  const collection = await messages();
  return collection.insertOne(Object.assign(msgObject, {at: Date.now()}));
}

export async function getMessages(channel, startTime, endTime, limit) {
  const coll = await messages();
  const query = {channel, at: {$gt: startTime, $lt: endTime}};
  const c = coll.find(query).sort({at: -1}).limit(limit);
  return await c.toArray();
}

export async function saveChannelRequest(channel) {
  return (await requests()).updateOne(
    {channel},
    {channel, at: Date.now()},
    {upsert: true}
  )
}

export async function requestedRecently() {
  const query = {at: {$gt: Date.now() - daysToMs(2)}};
  const arrayPromise = await (await requests()).find(query).toArray();
  return (await arrayPromise).map((c) => c.channel);
}

export async function deleteOldMessages() {
  const twoDaysAgo = Date.now() - daysToMs(2);
  const coll = await messages();
  const arr = await coll.deleteMany({at: {$lt: twoDaysAgo}}).toArray();
  return arr.length? arr[0].at : false;
}