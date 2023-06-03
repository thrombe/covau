
const fetch = require("node-fetch-commonjs");

exports.handler = async (event, context) => {
    let data = JSON.parse(event.body);

    let headers = {};
    for (const header of JSON.parse(data.headers)) {
        headers[header[0]] = header[1];
    }
    console.log(headers);
    
    let request = {
        method: data.method,
        url: data.url,
        headers,
        body: data.body,
        encoded: false,
    };

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

    let body = (await fetchRes.buffer()).toString();

    let res = {
        body: body,
        statusCode: fetchRes.status,
    };
    console.log("\n\nsending response\n", res);
    return res;
};

