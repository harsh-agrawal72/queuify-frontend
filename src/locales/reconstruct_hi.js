import fs from 'fs';
const enPath = 'src/locales/en/translation.json';
const hiPath = 'src/locales/hi/translation.json';

try {
    const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
    let hiText = fs.readFileSync(hiPath, 'utf8');

    // Preliminary manual fixes for major corruption patterns
    // 1. Line 661 merge error
    hiText = hiText.replace(/(\"upi_placeholder\": \".*?\")\s*(\},¤¾ à¤•à¤° à¤°à¤¹à¥‡ à¤¹à¥ˆà¤‚\",?)/g, '$1,\n      },');
    hiText = hiText.replace(/(\"upi_placeholder\": \".*?\")\s*(\},¤¾करा रहे हैं\",?)/g, '$1,\n      },');
    
    // 2. Merged lines near end of file
    hiText = hiText.replace(/}(\s*\"withdraw_failed\")/g, '},$1');
    hiText = hiText.replace(/}(\s*\"wallet\")/g, '},$1');

    // Strategy: Extract all key-value pairs from the corrupted file
    let hiData = {};
    const lines = hiText.split('\n');
    lines.forEach(line => {
        const match = line.match(/"(.*?)"\s*:\s*"(.*?)"(?=,?\s*$)/);
        if (match) {
            const key = match[1];
            const val = match[2];
            if (!hiData[key]) {
                hiData[key] = val;
            }
        }
    });

    // Strategy: Reconstruct using English template for structure
    function merge(template, data) {
        let result = {};
        for (const key in template) {
            if (typeof template[key] === 'object' && template[key] !== null) {
                result[key] = merge(template[key], data);
            } else {
                result[key] = data[key] || template[key];
            }
        }
        return result;
    }

    const fixed = merge(en, hiData);
    fs.writeFileSync(hiPath, JSON.stringify(fixed, null, 2), 'utf8');
    console.log('Reconstruction Complete: hi/translation.json has been restored to valid structure.');

} catch (err) {
    console.error('Error during reconstruction:', err);
    process.exit(1);
}
