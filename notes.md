
- setup
  - npm create svelte@latest
  - npm install

- names considered:
  - bvibin
    - boys be vibin
  - melodeez
    - nuts
  - musimongus
  - vau
    - vibe among us
  - cvau covau
    - come vibe amongst us

- cors
  - [Circumventing CORS with Netlify Functions](https://medium.com/@kamry.bowman/circumventing-cors-with-netlify-functions-nodejs-65aa6ec69a65)
  - [Guides & Tutorials | Netlify Blog](https://www.netlify.com/blog/tutorials/)
  - [CORS proxy - Support - Netlify Support Forums](https://answers.netlify.com/t/cors-proxy-works-on-netlify-dev-but-not-when-deployed/43263)
  - [cors-binary.js · GitHub](https://gist.github.com/vincens2005/98a5a732488d57e86dbc2aa67fe1485c)
  - [server - How to enable CORS on a Netlify deployment? - Stack Overflow](https://stackoverflow.com/questions/62507022/how-to-enable-cors-on-a-netlify-deployment)

- http
  - [CORS - HTTP | MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
  - [adaptive streaming media sources | MDN](https://developer.mozilla.org/en-US/docs/Web/Guide/Audio_and_video_delivery/Setting_up_adaptive_streaming_media_sources)

- netlify functions
  - [Build functions | Netlify Docs](https://docs.netlify.com/functions/build/?fn-language=ts)
  - [Netlify Functions](https://functions.netlify.com/)
  - [Tutorials - Netlify Functions](https://functions.netlify.com/tutorials/)
  - [File-based configuration | Netlify Docs](https://docs.netlify.com/configure-builds/file-based-configuration/#deploy-contexts)

- [supabase](https://supabase.com/pricing)!!!!

- firebase
  - [Firebase  |  Google Developers](https://developers.google.com/learn/topics/firebase)
  - [Firebase Documentation](https://firebase.google.com/docs)
  - [Firestore  |  Firebase](https://firebase.google.com/docs/firestore)
  - [Firebase web codelab](https://firebase.google.com/codelabs/firebase-web#0)
  - [Installation & Setup in JavaScript  |  Firebase Realtime Database](https://firebase.google.com/docs/database/web/start#web-version-9)
  - [Cloud Firestore Web Codelab  |  Firebase](https://firebase.google.com/codelabs/firestore-web#0)
  - [API Reference  |  Firebase JavaScript API reference](https://firebase.google.com/docs/reference/js)
  - [Firebase Realtime Database](https://firebase.google.com/docs/database)
  - [How to Build a Real-time Chat App with ReactJS and Firebase](https://www.freecodecamp.org/news/building-a-real-time-chat-app-with-reactjs-and-firebase/)

- embed youtube vid
  - [YouTube Player API Reference for iframe Embeds](https://developers.google.com/youtube/iframe_api_reference#Loading_a_Video_Player)
  - [YouTube Embedded Players and Player Parameters](https://developers.google.com/youtube/player_parameters)
  - [plyr - npm](https://www.npmjs.com/package/plyr)
  - [youtube-player - npm](https://www.npmjs.com/package/youtube-player)
  - [yt-player - npm](https://www.npmjs.com/package/yt-player)
  - [svelte-youtube - npm](https://www.npmjs.com/package/svelte-youtube)

- youtubei.js
  - [dashjs player](https://www.npmjs.com/package/youtubei.js#Streaming)
  - [online working example](https://ytjsexample.pages.dev/)

- things to try for fetching audio using some kinda proxy
  - [x] netlify functions
    - no worky. returns string. no binary data
  - netlify [edge functions](https://docs.netlify.com/edge-functions/api/)
    - supports deno. returns the standard Response object from deno (which is the same~ as browser's Response object).
      (so hopefully it can return binary data)
  - [vercel](https://vercel.com/pricing) [docs](https://vercel.com/docs)
    - lambda [functions](https://vercel.com/docs/concepts/functions/serverless-functions/quickstart)
    - [edge functions](https://vercel.com/docs/concepts/functions/edge-functions)
    - [edge middleware](https://vercel.com/docs/concepts/functions/edge-middleware)
  - aws lambda
    - other aws thingies (i read a lot of words that i do not understand. maybe one of em is useful)
    - [Using AWS Lambda as Proxy](https://blog.notmet.net/2021/04/using-aws-lambda-as-proxy/)
    - [Create proxy AWS Lambda - Stack Overflow](https://stackoverflow.com/questions/45919464/create-proxy-solution-using-aws-lambda)
    - [Serverless Proxy AWS Lambda](https://medium.com/betclic-tech/serverless-proxy-with-aws-api-gateway-and-aws-lambda-c09bd1c20c84)
  - [railway.app](https://railway.app/)
    - host a server. more control
  - [supabase edge functions](https://supabase.com/edge-functions)

- group synced music player
  - go to a site and play a song somehow
  - anyone can play songs, pause, each can control the volume level for them (ofc)
  - maybe have different priviledge levels too
  - have a website for this
    - single page application hosted on github pages
      - svelte + rust wasm + firebase
      - [Svelte svelte-spa-router - LogRocket Blog](https://blog.logrocket.com/build-spa-svelte-svelte-spa-router/)
      - [svelte-spa-router - npm](https://www.npmjs.com/package/svelte-spa-router)
      - [Single-page apps • Docs • SvelteKit](https://kit.svelte.dev/docs/single-page-apps)
      - [Single Page Applications Rust yew](https://www.sheshbabu.com/posts/rust-wasm-yew-single-page-application/)
    - firebase for syncing
    - but [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) won't allow this
      - cors proxies
      - a server thing running on someone's pc that responds to requests on firebase or some db
    - maybe have a seperate server
      - webserver?
        - where host it?
        - [Netlify Pricing and Plans](https://www.netlify.com/pricing/)
      - hosting it is a problem, tho an alternative could be to have a "psuedoserver"
        like a seperate binary that only one client or whatever runs when a group is using
        the service. and then the entire group can tune in to that using some unique id
        - discord again?
          - ain't this slow? maybe not too slow
        - dweep?
          - how do polling?
