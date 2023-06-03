<script lang="ts" context='module'>
    import Innertube, { UniversalCache } from "youtubei.js/agnostic";

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

    // this component is just to export 'tube' as a singleton across the app
    // a svelte component's module='context' script runs async code without problems
    // i don't know of a better way to achieve similar results :P
    export const tube: Innertube = await new_innertube_instance();
</script>
