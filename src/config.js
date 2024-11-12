const path = require('path');
const Config = {
    BASE_URL: 'https://brightershoreswiki.org/', // Replace with actual wiki URL
    CACHE_DIR: path.join(__dirname, 'cache')
};

module.exports = { Config }; 