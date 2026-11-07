module.exports = async (req, res) => {
    const key = process.env.GEMINI_API_KEY || '';
    const model = process.env.GEMINI_MODEL || '(not set)';
    const info = { model, keyLooksValid: key.startsWith('AIza'), keyLength: key.length };
    try {
        const r = await fetch(
            'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent',
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
                body: JSON.stringify({ contents: [{ parts: [{ text: 'Say hello in one word.' }] }] })
            }
        );
        const text = await r.text();
        res.status(200).json({ ...info, geminiStatus: r.status, geminiResponse: text.slice(0, 800) });
    } catch (e) {
        res.status(200).json({ ...info, error: String(e) });
    }
};