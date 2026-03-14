const { checkPubgID } = require('./utils/pubg');

async function testID() {
    const id = '51743025707';
    console.log(`Checking PUBG ID: ${id}...`);
    const result = await checkPubgID(id);
    console.log('Result:', JSON.stringify(result, null, 2));
}

testID();
