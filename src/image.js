const axios = require("axios");
const fs    = require("fs");
const Jimp  = require("jimp");

// Setup JIMP
const font = Promise.resolve(Jimp.loadFont(Jimp.FONT_SANS_64_BLACK));

const downloadImage = async function(url) {
    // Define list of extensions:
    const extensions = [ "", ".png", ".jpg", ".jpeg" ];

    const download = async function(i) {
        const fullUrl = url + extensions[i];
        const res = await axios({ method: "GET", url: fullUrl, responseType: "arraybuffer" }).catch((err) => {});
        if (res == undefined || res.status != 200) {
            return false;
        }
        const filename = fullUrl.substring(fullUrl.lastIndexOf("/") + 1);
        fs.writeFile(`${__dirname}/images/output/${filename}`, res.data, { encoding: "binary" }, (err) => {
            if (err) throw (err);
        });

        return filename;
    }

    for (let i = 0; i < extensions.length; i++) {
        const filename = await download(i);
        if (filename != false) {
            return filename;
        }
    }
}

/**
 * 
 * @param {String} logo_filename 
 * @param {Object} str 
 * @param {Function} callback 
 */
const createImage = async function(logo_filename, output_filename, str, callback) {
    // Load image to be put on the shirt
    console.log(logo_filename);
    let image = await Jimp.read(logo_filename);

    // Load the shirt template
    let shirt = await Jimp.read(`${__dirname}/images/blank_shirt.jpg`);

    // Resize image to be put on the shirt to fit within available space
    image = await image.resize(300, 300);

    // Put image on shirt and print url onto the image
    const final = await shirt.blit(image, 350, 200, (e, shirt, coords) => {
        if (e) throw e;
        if (str) {
            font.then((f) => {
                shirt.print(f, 0, 600, str.url);
            })
        }
    });

    // Write generated shirt to file
    final.write(output_filename, callback);
}

module.exports = {
    downloadImage: downloadImage,
    createImage: createImage
};