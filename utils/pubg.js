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
        `https://pubgm.isan.pro/nickname/pubgm?uid=${uidStr}`, // New mirror
        `https://v2.api.isanserver.xyz/nickname/pubgm?uid=${uidStr}`,
        `https://razer.isan.eu.org/nickname/pubgm?uid=${uidStr}`,
        `https://unipin.isan.eu.org/nickname/pubgm?uid=${uidStr}`,
        `https://smile-one.isan.eu.org/nickname/pubgm?uid=${uidStr}` // New source
    ];

    let lastError = 'API_ERROR';

    for (const url of endpoints) {
        try {
            console.log(`Trying PUBG API: ${url}`);
            const response = await axios.get(url, {
                timeout: 7000, 
                headers: {
                    'Accept': 'application/json, text/plain, */*',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
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
                console.warn(`Rate limit hit on: ${url}`);
            } else {
                lastError = 'API_ERROR';
            }
            console.error(`PUBG API (${url}) Error:`, error.message);
            // Small delay to avoid hammering
            await new Promise(resolve => setTimeout(resolve, 300));
        }
    }

    return { success: false, error: lastError };
}

module.exports = { checkPubgID };
