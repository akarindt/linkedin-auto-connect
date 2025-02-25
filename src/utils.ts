export default class Utils {
    public static containsSubstring(text: string, keywords: string[]): boolean {
        return [...new Set(keywords)].some((keyword) => text.toLowerCase().includes(keyword.toLowerCase()));
    }

    public static async sleep(ms: number = 2000) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    public static randomArray<T>(array: T[]) {
        return array[Math.random() * array.length];
    }
}
