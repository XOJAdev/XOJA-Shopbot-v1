const axios = require('axios');

/**
 * Checks a PUBG Mobile Player ID and returns the nickname.
 * Tries multiple API sources for resilience.
 * @param {string|number} uid - The player ID to check.
 * @returns {Promise<{success: boolean, nickname?: string, error?: string}>}
 */
async function checkPubgID(uid) {
    if (!uid) return { success: false, error: 'INVALID_ID' };

    const uidStr = uid.toString().trim();

    // Validation: 8 digits minimum and numeric only
    if (uidStr.length < 8 || !/^\d+$/.test(uidStr)) {
        return { success: false, error: 'INVALID_ID' };
    }

    // List of alternative API endpoints
    const endpoints = [
        `https://v2.api.isanserver.xyz/nickname/pubgm?uid=${uidStr}`,
        `https://nickname.isan.eu.org/nickname/pubgm?uid=${uidStr}`,
        `https://razer.isan.eu.org/nickname/pubgm?uid=${uidStr}`,
        `https://unipin.isan.eu.org/nickname/pubgm?uid=${uidStr}`
    ];

    let lastError = 'API_ERROR';

    for (const url of endpoints) {
        try {
            console.log(`Trying PUBG API: ${url}`);
            const response = await axios.get(url, {
                timeout: 5000, // 5 seconds per source
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });
            
            if (response.data && response.data.nickname) {
                return {
                    success: true,
                    nickname: response.data.nickname
                };
            }
            
            // If the API returns success but no nickname, it might be an invalid ID
            // We check other sources just in case, but if multiple return empty, it's likely NOT_FOUND
            lastError = 'NOT_FOUND';
        } catch (error) {
            if (error.code === 'ECONNABORTED') {
                lastError = 'TIMEOUT';
            } else if (error.response && error.response.status === 429) {
                lastError = 'RATE_LIMIT';
            } else {
                lastError = 'API_ERROR';
            }
            console.error(`PUBG API (${url}) Error:`, error.message);
            // Continue to next endpoint
        }
    }

    return { success: false, error: lastError };
}

module.exports = { checkPubgID };
