const Twitter = require("twitter");
const fs =require("fs");
const path = require("path");

const credentials = JSON.parse(fs.readFileSync("credentials.json"));

console.log(credentials);

const T = new Twitter({
    consumer_key: credentials.api_key,
    consumer_secret: credentials.api_key_secret,
    access_token_key: credentials.access_token,
    access_token_secret: credentials.access_token_secret
});

const PATH = path.join(__dirname, "images/kirby.png");
console.log(PATH);

const kirby_data = fs.readFileSync(`${PATH}`);

const INIT_params = {
    command: "INIT",
    total_bytes: kirby_data.length,
    media_type: "image/png"
};

const APPEND_params = {
    command: "APPEND",
    media: kirby_data,
    media_id: "",
    segment_index: 0
};

const FINALIZE_params = {
    command: "FINALIZE",
    media_id: ""
};

T.post("https://upload.twitter.com/1.1/media/upload.json", INIT_params, (e, data, res) => {
    if (e) {
        console.error("On INIT: ", e);
    } else {
        console.log(data);
        APPEND_params.media_id = data.media_id_string;
        FINALIZE_params.media_id = data.media_id_string;
        UPDATE_params = {
            status: "This is a test as well, hopefully there's a picture here! :)",
            media_ids: data.media_id_string
        };
        T.post("https://upload.twitter.com/1.1/media/upload.json", APPEND_params, (e, data, res) => {
            if (e) {
                console.error("On APPEND: ", e);
            } else {
                T.post("https://upload.twitter.com/1.1/media/upload.json", FINALIZE_params, (e, data, res) => {
                    if (e) {
                        console.error("On FINALIZE: ", e);
                    } else {
                        console.log(data);
                        T.post("https://api.twitter.com/1.1/statuses/update.json", UPDATE_params, (e, data, res) => {
                            if (e) {
                                console.error(e);
                            } else {
                                console.log(data);
                            }
                        });
                    }
                });
            }
        });
    }
});