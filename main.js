require('dotenv').config()
const Twit = require('twitter-v2')
const { Client, Intents } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS] });


var T = new Twit({
  consumer_key:         process.env.TWITTER_CONSUMER_KEY,
  consumer_secret:      process.env.TWITTER_CONSUMER_SECRET,
  // access_token_key:         process.env.TWITTER_ACCESS_TOKEN,
  // access_token_secret:  process.env.TWITTER_ACCESS_TOKEN_SECRET,
  timeout_ms:           60*1000,  // optional HTTP request timeout to apply to all requests.
  // strictSSL:            true,     // optional - requires SSL certificates to be valid.
  bearer_token:  process.env.BEARER_TOKEN
})

//   //only show owner tweets
async function sendMessage (tweet, client){
  const url = "https://twitter.com/user/status/" + tweet.id;
  try {
    const channel = await client.channels.fetch(process.env.DISCORD_CHANNEL_ID)
    channel.send(`${process.env.CHANNEL_MESSAGE} ${url}`)
  } catch (error) {
        console.error(error);
  }
}

async function listenForever(streamFactory, dataConsumer) {
  try {
    for await (const { data } of streamFactory()) {
      dataConsumer(data);
    }
    // The stream has been closed by Twitter. It is usually safe to reconnect.
    console.log('Stream disconnected healthily. Reconnecting.');
    listenForever(streamFactory, dataConsumer);
  } catch (error) {
    // An error occurred so we reconnect to the stream. Note that we should
    // probably have retry logic here to prevent reconnection after a number of
    // closely timed failures (may indicate a problem that is not downstream).
    console.warn('Stream disconnected with error. Retrying.', error);
    listenForever(streamFactory, dataConsumer);
  }
}

async function  setup () {
  const endpointParameters = {
      'tweet.fields': [ 'author_id', 'conversation_id' ],
      'expansions': [ 'author_id', 'referenced_tweets.id' ],
      'media.fields': [ 'url' ]
  }
  try {
    console.log('Setting up Twitter....')
    const body = {
      "add": [
        {"value": "from:"+ process.env.NEWO_USER_NAME, "tag": "from Me!!"},
        {"value": "from:"+ process.env.YAYA_USER_NAME, "tag": "from Me!!"},
        {"value": "from:"+ process.env.MLTY_USER_NAME, "tag": "from Me!!"}
      ]
    }
    const r = await T.post("tweets/search/stream/rules", body);
    console.log(r);

  } catch (err) {
    console.log(err)
  }

  listenForever(
    () => T.stream('tweets/search/stream', endpointParameters),
    (data) => sendMessage(data, client)
  );
}
// Add above rule

client.login(process.env.BOT_TOKEN)
// client.login("MzM2Mzk4MDc3NTQxODc1NzE0.GVrVvq.H25Ij8Pwx9XbVfsV4CAnwYOMDrHJkDlQK0USuU")

client.on('ready', () => {
   console.log('Discord ready')
   setup()

 })
