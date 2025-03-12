import { ElementHandle, NodeFor, Page } from 'puppeteer-core';
import Constants from './constants';

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

    public static async waitForSelector<Selector extends string>(page: Page, selector: Selector): Promise<ElementHandle<NodeFor<Selector>> | null> {
        try {
            await page.waitForSelector(selector, { timeout: Constants.WAIT_SELECTOR_TIMEOUT, visible: true });
            return await page.$(selector);
        } catch (error) {
            return null;
        }
    }

    public static async waitForSelectors<Selector extends string>(page: Page, selector: Selector): Promise<Array<ElementHandle<NodeFor<Selector>>>> {
        try {
            await page.waitForSelector(selector, { timeout: Constants.WAIT_SELECTOR_TIMEOUT, visible: true });
            return await page.$$(selector);
        } catch (error) {
            return [];
        }
    }
}
