const axios = require('axios');

/**
 * Checks a PUBG Mobile Player ID and returns the nickname.
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

    try {
        const response = await axios.get(`https://api.isan.eu.org/nickname/pubgm?uid=${uidStr}`, {
            timeout: 7000 // 7 seconds timeout
        });
        
        if (response.data && response.data.nickname) {
            return {
                success: true,
                nickname: response.data.nickname
            };
        }
        
        // If the API returns ok but no nickname, it's usually an invalid ID
        return { success: false, error: 'NOT_FOUND' };
    } catch (error) {
        if (error.code === 'ECONNABORTED') {
            return { success: false, error: 'TIMEOUT' };
        }
        if (error.response && error.response.status === 429) {
            return { success: false, error: 'RATE_LIMIT' };
        }
        console.error('PUBG API Error:', error.message);
        return { success: false, error: 'API_ERROR' };
    }
}

module.exports = { checkPubgID };
