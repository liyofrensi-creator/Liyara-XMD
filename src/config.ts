interface BotConfig {
    botName: string;
    ownerName: string;
    version: string;
    menuImage: string;
    geminiApiKey: string;
}

const config: BotConfig = {
    botName: "LIYARA XMD",
    ownerName: "Liyo",
    version: "1.0.0",
    menuImage: "https://i.postimg.cc/BvV0MGJ8/Whats-App-Image-2026-09-08-at-4-44-57-PM.jpg",
    geminiApiKey: process.env.GEMINI_API_KEY || ""
};

export default config;
