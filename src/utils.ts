export default class Utils {
    public static containsSubstring(text: string, keywords: string[]): boolean {
        return keywords.some((keyword) => text.toLowerCase().includes(keyword.toLowerCase()));
    }

    public static async sleep(ms: number = 2000) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
