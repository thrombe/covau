import Innertube, { UniversalCache } from "youtubei.js/web";

export async function new_innertube_instance() {
    let yt = await Innertube.create({
        // TODO: make this cache work. it imporoves performance
        // cache: new UniversalCache(false),
        generate_session_locally: true,
        fetch: async (input, init) => {
            let url: string;
            if (typeof input === 'string') {
                url = input;
            } else if (input instanceof URL) {
                url = input.toString();
            } else {
                url = input.url;
            }

            let headers = init?.headers
                ? new Headers(init.headers)
                : input instanceof Request
                    ? input.headers
                    : new Headers();
            let headers_copy = JSON.stringify([...headers]);

            headers.delete('user-agent');

            if (input instanceof Request) {
                // idk why the it shows an error
                // - [Fetch Standard](https://fetch.spec.whatwg.org/#dom-requestinit-duplex)
                (input as any).duplex = 'half';
            }

            const request = new Request(
                url,
                input instanceof Request ? input : undefined
            );
            let req = {
                url: url,
                headers: headers_copy,
                body: init?.body,
                method: request.method
            };
            let res = await fetch('/.netlify/functions/fetch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(req)
            });
            return res;
        }
    });
    return yt;
}
