const axios = require("axios").default;
const fs    = require("fs");

const query = async function(q) {
    const credentials = JSON.parse(fs.readFileSync(`${__dirname}/bing_cred.json`));

    const endpoint = "https://api.cognitive.microsoft.com/bing/v7.0/images/search";
    const results = await axios({
        url: endpoint,
        params: {
            q: q,
            safeSearch: "Strict"
        },
        headers: {
            "Ocp-Apim-Subscription-Key": credentials.key_1
        }
    }).catch((err) => {
        console.log(err);
    });
    return results.data.value.map(value => value.contentUrl);
}

module.exports = {
    query: query
};