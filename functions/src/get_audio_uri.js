// import { Innertube, UniversalCache } from "youtubei.js";

// const yt = new Innertube({ cache: new UniversalCache(false), generate_session_locally: true });

let yti = require("youtubei.js");
let Innertube = yti.Innertube;
let UniversalCache = yti.UniversalCache;

const run = async (yt_id) => {
  let yt = await Innertube.create({ cache: new UniversalCache(false), generate_session_locally: true });
  let k = await yt.getInfo(yt_id);
  let uri = k.streaming_data?.adaptive_formats[k.streaming_data?.adaptive_formats.length - 1].decipher(yt.session.player);
  console.log(k.streaming_data?.adaptive_formats,  uri);
  return uri;
};

exports.handler =  async (event, context) => {
  if (!event.body) {return {statusCode: 200}}
  let data = JSON.parse(event.body);
  let r = await run(data.yt_id);
  return {
    statusCode: 200,
    body: JSON.stringify({ uri: r }),
  };
};

