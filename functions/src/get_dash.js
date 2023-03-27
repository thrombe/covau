// import { Innertube, UniversalCache } from "youtubei.js";

// const yt = new Innertube({ cache: new UniversalCache(false), generate_session_locally: true });

let yti = require("youtubei.js");
let Innertube = yti.Innertube;
let UniversalCache = yti.UniversalCache;

const run = async (yt_id) => {
  let yt = await Innertube.create({ cache: new UniversalCache(false), generate_session_locally: true });
  let k = await yt.getInfo(yt_id);
  let to_dash = (url) => {
    let u = new URL("http://localhost:8888/fetch");
    // let u = new URL("https://covau.netlify.app/fetch");
    u.searchParams.set("__url", url.toString());
    console.log(url.toString());
    console.log(u.toString());
    return u;
    // return "http://localhost:8888/fetch?__url=" + url.toString();
  };
  let filter_formats = (format) => {
    console.log(format);
    return !format.mime_type.includes("audio") ;
    if (format.mime_type.includes("audio")) {
      return false;
    }
    return true;
  };
  let d = k.toDash(to_dash, filter_formats);
  return d;
  // let uri = k.streaming_data?.adaptive_formats[k.streaming_data?.adaptive_formats.length - 1].decipher(yt.session.player);
  // console.log(k.streaming_data?.adaptive_formats,  uri);
  // return uri;
};

exports.handler =  async (event, context) => {
  if (!event.body) {return {statusCode: 200}}
  let data = JSON.parse(event.body);
  let r = await run(data.yt_id);
  return {
    statusCode: 200,
    body: JSON.stringify({ dash: r }),
  };
};

