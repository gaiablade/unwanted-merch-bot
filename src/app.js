const Twitter = require("twitter");
const fs =require("fs");
const path = require("path");
const Jimp = require("jimp");
const image = require("./image.js");
const bing = require("./bing.js");

// scraping
const pup = require("puppeteer");
const request = require("request");

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

const postImage = async function(image_filename, status) {
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

const getMostRecentTweets = async function(callback) {
    const USER_TIMELINE_params = {
        include_rts: false,
        exclude_replies: true
    };
    T.get("https://api.twitter.com/1.1/statuses/user_timeline.json", USER_TIMELINE_params, (e, data, res) =>{
        if (e) throw e;
        callback(data[0]);
    });
}

const getReplies = async function(id_str, callback) {
    const replies = [];

    const SEARCH_params = {
        q: "to:BotUnwanted"
    };
    T.get("https://api.twitter.com/1.1/search/tweets.json", SEARCH_params, (e, data, res) => {
        if (e) throw e;
        for (const reply of data.statuses) {
            if (reply.in_reply_to_status_id_str == id_str) {
                replies.push(reply);
            }
        }
        callback(replies);
    });
}

const getFirstImageURL_Options = async function(idea) {
    idea = idea.replace(/ /g, "%20");
    const url = `https://bing.com/images/search?q=${idea}`;

    const browser = await pup.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto(url);
    await page.waitFor(2500);
    await page.screenshot({ path: `${__dirname}/images/screenshots/1.png` });

    await page.click("ul.dgControl_list:nth-child(1) > li:nth-child(1) > div:nth-child(1) > div:nth-child(1) > a:nth-child(1) > div:nth-child(1)");
    await page.waitFor(2500);
    await page.screenshot({ path: `${__dirname}/images/screenshots/2.png` });

    for (const frame of page.frames()) {
        if (frame.url().includes("mode=overlay")) {
            page.goto(frame.url());
            break;
        }
    }

    await page.waitFor(2500);
    await page.screenshot({ path: `${__dirname}/images/screenshots/3.png` });
    const image_url = await page.evaluate(() => {
        const images = document.querySelectorAll("img");
        return Array.from(images).map(v => v.src)[0];
    });
    console.log(image_url);

    await browser.close();

    return { url: image_url.replace(/http:/g, "https:"), dest: `${__dirname}/images/downloaded`};
}

const main = async function() {
    // Get most liked comment(s) and add new ideas to list
    /*
    getMostRecentTweets((data) => {
        getReplies(data.id_str, (replies) => {
            const list = JSON.parse(fs.readFileSync(`${__dirname}/list.json`));
            const pastPosts = JSON.parse(fs.readFileSync(`${__dirname}/pastPosts.json`));
            const rejectedPosts = JSON.parse(fs.readFileSync(`${__dirname}/rejectedPosts.json`));
            replies.forEach((reply, index) => {
                if (pastPosts.hasOwnProperty(reply.text)) {
                } else if (rejectedPosts.hasOwnProperty(reply.text)) {
                } else if (list.find(element => element.name == reply.text) == undefined) {
                    list.push({
                        name: reply.text,
                        approved: "false"
                    });
                }
            });
            fs.writeFileSync(`${__dirname}/list.json`, JSON.stringify(list, null, 2));
        });
    });
    */

    // Check list for candidate:
    let list = JSON.parse(fs.readFileSync(`${__dirname}/list.json`));
    list = list.filter(element => element.approved == "true");
    console.log(list);

    // Google image search and save related images
    if (list.length > 0) {
        let idea = list[0].name;
        const search_results = await bing.query(idea);

        const filename = await image.downloadImage(search_results[0]);

        // Create shirt
        const file_location = `src/images/output/${filename}`;
        const output_location = `src/images/output/shirt_${filename}`;
        await image.createImage(file_location, output_location, { url: "" }, () => {});
    }
}

main();

// Constants:
const secondsPerDay = 86400;
const postsPerDay = 6;
setInterval(main, secondsPerDay / postsPerDay * 1000);