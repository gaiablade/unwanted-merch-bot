const Twitter = require("twitter");
const fs =require("fs");
const path = require("path");
const Jimp = require("jimp");
const { resolve } = require("path");

// Setup Twitter Authorization Stuff:
const credentials = JSON.parse(fs.readFileSync(`${__dirname}/credentials.json`));

console.log(credentials);

const T = new Twitter({
    consumer_key: credentials.api_key,
    consumer_secret: credentials.api_key_secret,
    access_token_key: credentials.access_token,
    access_token_secret: credentials.access_token_secret
});

// Functions:
const createImage = function(logo_filename, callback) {
    Jimp.read(`${__dirname}/images/blank_shirt.jpg`, (e, shirt, coords) => {
        if (e) throw e;
        Jimp.read(`${__dirname}/images/${logo_filename}`, (e, logo, coords) => {
            logo.resize(300, 300, (e, resized_logo, coords) => {
                if (e) throw e;
                shirt.blit(resized_logo, 350, 200, (e, final, coords) => {
                    if (e) throw e;
                    final.write(`${__dirname}/images/shirt_${logo_filename}`, callback)
                });
            });
        });
    });
}

const postImage = function(image_filename, status) {
    const PATH = path.join(__dirname, `images/${image_filename}`);
    console.log(PATH);

    const image = fs.readFileSync(`${__dirname}/images/${image_filename}`);
    console.log("image: ", image, image.length);

    const INIT_params = {
        command: "INIT",
        total_bytes: image.length,
        media_type: "image/png"
    };

    const APPEND_params = {
        command: "APPEND",
        media: image,
        media_id: "",
        segment_index: 0
    };

    const FINALIZE_params = {
        command: "FINALIZE",
        media_id: ""
    };

    console.log(INIT_params);
    T.post("https://upload.twitter.com/1.1/media/upload.json", INIT_params, (e, data, res) => {
        if (e) {
            console.error("On INIT: ", e);
        } else {
            console.log(data);
            APPEND_params.media_id = data.media_id_string;
            FINALIZE_params.media_id = data.media_id_string;
            UPDATE_params = {
                status: status,
                media_ids: data.media_id_string
            };
            console.log(APPEND_params);
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
}

const getMostRecentTweets = function(callback) {
    const USER_TIMELINE_params = {
        include_rts: false,
        exclude_replies: true
    };
    T.get("https://api.twitter.com/1.1/statuses/user_timeline.json", USER_TIMELINE_params, (e, data, res) =>{
        if (e) throw e;
        callback(data[0]);
    });
}

const getReplies = function(id_str, callback) {

}

function main() {
    // Get twitter id:
    // Get most recent tweet
    // Get most liked comment(s)
    getMostRecentTweets((data) => { console.log(data); });
    // Google image search and save related images
    // Create shirt
    // Post shirt
}

setInterval(main, 14400 * 1000);