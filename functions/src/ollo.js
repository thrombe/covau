// import { Innertube, UniversalCache } from "youtubei.js";
// import play from 'play-dl'; // Everything

let yti = require("youtubei.js");
let Innertube = yti.Innertube;
let UniversalCache = yti.UniversalCache;

exports.handler =  async (event, context) => {
  let yt = await Innertube.create({ cache: new UniversalCache(false), generate_session_locally: true });
  // let r = await play.search("aimer", { source: { youtube: "video" }});
  // console.log(r);

  let k = await yt.getInfo("AjesoBGztF8");
  let uri = k.streaming_data?.adaptive_formats[k.streaming_data?.adaptive_formats.length - 1].decipher(yt.session.player);
  console.log(k.streaming_data?.adaptive_formats,  uri);

  return {
    statusCode: 200,
    body: JSON.stringify({ message: uri }),
  };
};
