
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
      - [Firebase  |  Google Developers](https://developers.google.com/learn/topics/firebase)
      - [Firebase Pricing](https://firebase.google.com/pricing/)
      - [Firebase Documentation](https://firebase.google.com/docs)
      - [Send notifications using Cloud Messaging and Cloud Functions](https://firebase.google.com/codelabs/firebase-cloud-functions#0)
      - resources or something
        - [Firebase Realtime Database](https://firebase.google.com/docs/database)
    - but [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) won't allow this
      - cors proxies
      - [firebase cloud functions](https://firebase.google.com/docs/functions)
        - is it possible to get yt audio uris using scraping?
      - aws lambda
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
