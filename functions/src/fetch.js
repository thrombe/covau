
// import fetch, {
//   Blob,
//   blobFrom,
//   blobFromSync,
//   File,
//   fileFrom,
//   fileFromSync,
//   FormData,
//   Headers,
//   Request,
//   Response,
// } from 'node-fetch';
// let nf = require("node-fetch");
const nf = require("node-fetch-commonjs");
const fetch = require("node-fetch-commonjs");
let Blob = nf.Blob;
let blobFrom = nf.blobFrom;
let blobFromSync = nf.blobFromSync;
let File = nf.File;
let fileFrom = nf.fileFrom;
let fileFromSync = nf.fileFromSync;
let FormData = nf.FormData;
let Headers = nf.Headers;
let Request = nf.Request;
let Response = nf.Response;


function copyHeader(headerName, to, from) {
  const hdrVal = from.get(headerName);
  if (hdrVal) {
    to.set(headerName, hdrVal);
  }
}

exports.handler = async (event, context) => {
  // console.log(event);

  let resp = {
    body: "lol this be me fr",
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Methods": "*",
      "Access-Control-Allow-Credentials": "true",
    },
    // multiValueHeaders: ,
  };
  // return resp;

  // console.log(event.queryStringParameters.__url);
  // let request;
  // if ("__url" in event.queryStringParameters) {
  //     request = {
  //         method: event.httpMethod,
  //         url: event.queryStringParameters.__url,
  //         headers: new Headers(event.__headers),
  //         body: event.body,
  //         encoded: true,
  //     };
  //   console.log(request)
  //     let h = new Headers();
  //     h.set("range", request.headers.get("range"));
  //     h.set("user-agent", request.headers.get("user-agent"));
  //     h.set("origin", request.headers.get("origin"));
  //     request.headers = h;
  // } else if (event.body) {
      let data = JSON.parse(event.body);
      let request = {
          method: data.method,
          url: data.url,
          headers: new Headers(JSON.parse(data.headers)),
          body: data.body,
          encoded: false,
      };
  // } else {return {statusCode: 200}}
  // console.log(request)
  
  // let event_headers = new Headers(event.headers);

  // if (request.method === 'OPTIONS') {
  //   return {
  //     statusCode: 200,
  //     headers: {
  //       'Access-Control-Allow-Origin': request.headers.get('origin') || '*',
  //       'Access-Control-Allow-Methods': '*',
  //       'Access-Control-Allow-Headers':
  //         'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-goog-visitor-id, x-origin, x-youtube-client-version, Accept-Language, Range, Referer',
  //       'Access-Control-Max-Age': '86400',
  //       'Access-Control-Allow-Credentials': true,
  //     },
  //     body: "yaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaah",
  //   };
  // }

  // copyHeader('range', event_headers, request.headers);
  // !event_headers.has('user-agent') && copyHeader('user-agent', event_headers, request.headers);

  console.log("\nsending request\n", {
    url: new URL(request.url),
    method: request.method,
    headers: request.headers,
    body: request.body,
  });
  const fetchRes = await fetch(request.url, {
    method: request.method,
    headers: request.headers,
    body: request.body,
  });
  // console.log("\n\ngot response\n", fetchRes);
  // return fetchRes;
  // fetchRes.setEncoding("binary");
  let body = await fetchRes.buffer();
  // let body = await fetchRes.text();
  // console.log(body);
  if ((fetchRes.headers.get("content-type") || "UTF-8").includes("UTF-8")) {
    body = body.toString();
  } else {
    body = body.toString();
    // body = String.fromCharCode.apply(null, body);
  }

  // let headers = new Headers();
  // // copy content headers
  // copyHeader('content-length', headers, fetchRes.headers);
  // copyHeader('content-type', headers, fetchRes.headers);
  // copyHeader('content-disposition', headers, fetchRes.headers);
  // copyHeader('accept-ranges', headers, fetchRes.headers);
  // copyHeader('content-range', headers, fetchRes.headers);
  // copyHeader('sec-fetch-mode', headers, fetchRes.headers);
  // // copyHeader('connection', headers, fetchRes.headers);
  // // add cors headers
  // headers.set(
  //   'Access-Control-Allow-Origin',
  //   request.headers.get('origin') || '*',
  // );
  // headers.set('Access-Control-Allow-Headers', '*');
  // headers.set('Access-Control-Allow-Methods', '*');
  // headers.set('Access-Control-Allow-Credentials', true);
  // let m = new Map([...headers.entries()]);
  // m.set('access-control-allow-credentials', true);
  // m.set('access-control-allow-origin', "*");
  // let h = Object.fromEntries(m);
  // console.log("\n\nheaders sent\n", h);
  
  let res = {
    // isBase64Encoded: request.encoded,
    // isBase64Encoded: true,
    // body: body,
    body: body,
    // body: "play\ning\n\njoke",
    statusCode: fetchRes.status,
    // headers: headers,
    // headers: h,
    // multiValueHeaders: ,
  };
  console.log("\n\nsending response\n", res);
  return res;
};

const handler = async (request) => {
  // if options send do CORS preflight
  if (request.method === 'OPTIONS') {
    const response = new Response('', {
      status: 200,
      headers: new Headers({
        'Access-Control-Allow-Origin': request.headers.get('origin') || '*',
        'Access-Control-Allow-Methods': '*',
        'Access-Control-Allow-Headers':
          'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-goog-visitor-id, x-origin, x-youtube-client-version, Accept-Language, Range, Referer',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Credentials': 'true',
      }),
    });
    return response;
  }

  const url = new URL(request.url, `http://localhost/`);
  if (!url.searchParams.has('__host')) {
    return new Response(
      'Request is formatted incorrectly. Please include __host in the query string.',
      { status: 400 },
    );
  }

  // Set the URL host to the __host parameter
  url.host = url.searchParams.get('__host');
  url.protocol = 'https';
  url.port = '443';
  url.searchParams.delete('__host');

  // Copy headers from the request to the new request
  const request_headers = new Headers(
    JSON.parse(url.searchParams.get('__headers') || '{}'),
  );
  copyHeader('range', request_headers, request.headers);
  !request_headers.has('user-agent') && copyHeader('user-agent', request_headers, request.headers);
  url.searchParams.delete('__headers');

  // Make the request to YouTube
  const fetchRes = await fetch(url, {
    method: request.method,
    headers: request_headers,
    body: request.body,
  });

  // Construct the return headers
  const headers = new Headers();

  // copy content headers
  copyHeader('content-length', headers, fetchRes.headers);
  copyHeader('content-type', headers, fetchRes.headers);
  copyHeader('content-disposition', headers, fetchRes.headers);
  copyHeader('accept-ranges', headers, fetchRes.headers);
  copyHeader('content-range', headers, fetchRes.headers);

  // add cors headers
  headers.set(
    'Access-Control-Allow-Origin',
    request.headers.get('origin') || '*',
  );
  headers.set('Access-Control-Allow-Headers', '*');
  headers.set('Access-Control-Allow-Methods', '*');
  headers.set('Access-Control-Allow-Credentials', 'true');

  // Return the proxied response
  return new Response(fetchRes.body, {
    status: fetchRes.status,
    headers: headers,
  });
};


// exports.handler = async (event, context) => {
const handbler = async (event, context) => {
  console.log(event);
  if (!event.body) {return {statusCode: 200}}
  let data = JSON.parse(event.body);
  console.log(data);

  let request = {
    headers: new Headers(event.headers),
    body: "",
    method: event.httpMethod,
  };
  
  let url = new URL(data.url);
  url.host = url.searchParams.get('__host');
  url.protocol = 'https';
  url.port = '443';
  url.searchParams.delete('__host');
  const request_headers = new Headers(
    JSON.parse(data.headers || '{}'),
  );
  copyHeader('range', request_headers, request.headers);
  !request_headers.has('user-agent') && copyHeader('user-agent', request_headers, request.headers);
  url.searchParams.delete('__headers');

  // Make the request to YouTube
  const fetchRes = await fetch(url, {
    method: request.method,
    headers: request_headers,
    // body: request.body,
  });
  console.log(fetchRes);
  console.log("bodyyyyyyy", fetchRes.body);
  // console.log("bodyyyyyyy", JSON.stringify(fetchRes.body));
  console.log("headerssssssss", fetchRes.headers);
  console.log("statussssss", fetchRes.status);

  // Construct the return headers
  const headers = new Headers();

  // copy content headers
  copyHeader('content-length', headers, fetchRes.headers);
  copyHeader('content-type', headers, fetchRes.headers);
  copyHeader('content-disposition', headers, fetchRes.headers);
  copyHeader('accept-ranges', headers, fetchRes.headers);
  copyHeader('content-range', headers, fetchRes.headers);

  // add cors headers
  headers.set(
    'Access-Control-Allow-Origin',
    request.headers.get('origin') || '*',
  );
  headers.set('Access-Control-Allow-Headers', '*');
  headers.set('Access-Control-Allow-Methods', '*');
  headers.set('Access-Control-Allow-Credentials', 'true');

  // Return the proxied response
  // return new Response(fetchRes.body, {
  //   status: fetchRes.status,
  //   headers: headers,
  // });

  return {
    statusCode: fetchRes.status,
    body: JSON.stringify({
      body: fetchRes.body,
      headers: headers,
    })
  }
};


