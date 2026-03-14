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
    console.log(`Checking PUBG ID: ${uidStr} (Length: ${uidStr.length})`);

    // Validation: numeric only - NO length restriction
    if (!/^\d+$/.test(uidStr)) {
        console.log(`Validation failed: ${uidStr} is not numeric`);
        return { success: false, error: 'INVALID_ID' };
    }

    // List of alternative API endpoints - updated for 2026 resilience
    const endpoints = [
        `https://pubgm.isan.eu.org/nickname/pubgm?uid=${uidStr}`,
        `https://v3.api.isanserver.xyz/nickname/pubgm?uid=${uidStr}`,
        `https://nickname.isan.eu.org/nickname/pubgm?uid=${uidStr}`,
        `https://v2.api.isanserver.xyz/nickname/pubgm?uid=${uidStr}`,
        `https://razer.isan.eu.org/nickname/pubgm?uid=${uidStr}`,
        `https://unipin.isan.eu.org/nickname/pubgm?uid=${uidStr}`
    ];

    let lastError = 'API_ERROR';

    for (const url of endpoints) {
        try {
            console.log(`Trying PUBG API: ${url}`);
            const response = await axios.get(url, {
                timeout: 8000, // Increased timeout to 8 seconds
                headers: {
                    'Accept': 'application/json, text/plain, */*',
                    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
                    'Origin': 'https://www.midasbuy.com',
                    'Referer': 'https://www.midasbuy.com/'
                }
            });
            
            if (response.data && response.data.nickname) {
                console.log(`Successfully fetched nickname: ${response.data.nickname}`);
                return {
                    success: true,
                    nickname: response.data.nickname
                };
            }
            
            if (response.data && (response.data.error === 'NOT_FOUND' || response.data.nickname === "")) {
                lastError = 'NOT_FOUND';
            }
        } catch (error) {
            if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
                lastError = 'TIMEOUT';
            } else if (error.response && error.response.status === 429) {
                lastError = 'RATE_LIMIT';
            } else {
                lastError = 'API_ERROR';
            }
            console.error(`PUBG API (${url}) Error:`, error.message);
            // Optionally add a small delay before next source
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }

    return { success: false, error: lastError };
}

module.exports = { checkPubgID };
