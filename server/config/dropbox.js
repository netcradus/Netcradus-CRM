const { Dropbox } = require('dropbox');
require('isomorphic-fetch'); // required for dropbox

/**
 * Initializes the Dropbox API client using a long-lived app access token.
 * Token should be stored in DROPBOX_ACCESS_TOKEN.
 */
const initDropbox = () => {
    try {
        if (!process.env.DROPBOX_ACCESS_TOKEN) {
            return null;
        }
        
        const dbx = new Dropbox({ accessToken: process.env.DROPBOX_ACCESS_TOKEN });
        return dbx;
    } catch (error) {
        console.error('Dropbox Initialization Error:', error.message);
        return null;
    }
};

module.exports = initDropbox();
