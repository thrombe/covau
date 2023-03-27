import type { Request, Context } from "https://edge.netlify.com";

export const config: Config = {
  path: "/fetch"
};

export default async function handler(req: Request, ctx: Context) {
  console.log(req);
  let u = new URL(req.url);
  let url = u.searchParams.get("__url");
  if (!url) {return new Response("eror", { status: 200, headers: { "content-type": "text/html" } });}
  console.log(url);
  let h = new Headers();
  copyHeader("range", h, req.headers);
  copyHeader("user-agent", h, req.headers);
  // if (url.startsWith("https://rr")) {
  //   h.set("origin", "https://youtube.com");
  // }
  // h.set("origin", "https://youtube.com");
  // h.set("referer", "https://youtube.com");

  if (req.method === 'OPTIONS') {
    return new Response("", {
      status: 200,
      headers: {
        // 'Access-Control-Allow-Origin': req.headers.get('origin') || '*',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': '*',
        'Access-Control-Allow-Headers':
          'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-goog-visitor-id, x-origin, x-youtube-client-version, Accept-Language, Range, Referer',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Credentials': 'true',
      },
    });
  }

  console.log("requesting this", url);
  console.log(h);
  let fetchRes = await fetch(url, {
    method: req.method,
    headers: h,
    body: req.body,
  });
  console.log(fetchRes);

  // Construct the return headers
  const headers = new Headers();

  // copy content headers
  copyHeader('content-length', headers, fetchRes.headers);
  copyHeader('content-type', headers, fetchRes.headers);
  copyHeader('content-disposition', headers, fetchRes.headers);
  copyHeader('accept-ranges', headers, fetchRes.headers);
  copyHeader('content-range', headers, fetchRes.headers);
  copyHeader('connection', headers, fetchRes.headers);

  // add cors headers
  headers.set(
    'Access-Control-Allow-Origin',
    // req.headers.get('origin') || '*',
    '*',
  );
  headers.set('Access-Control-Allow-Headers', '*');
  headers.set('Access-Control-Allow-Methods', '*');
  headers.set('Access-Control-Allow-Credentials', 'true');

  // Return the proxied response
  let res = new Response(fetchRes.body, {
    status: fetchRes.status,
    headers: headers,
  });
  console.log("\nreturning response\n", res);
  return res;
}



function copyHeader(headerName: string, to: Headers, from: Headers) {
  const hdrVal = from.get(headerName);
  if (hdrVal) {
    to.set(headerName, hdrVal);
  }
}
