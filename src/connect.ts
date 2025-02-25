import { JsonDB } from 'node-json-db';
import puppeteer, { Browser } from 'puppeteer-core';
import { ChromeJson } from './type';
import Utils from './utils';
import Constants from './constants';

export default class Connect {
    private _db: JsonDB;

    constructor(db: JsonDB) {
        this._db = db;
    }

    private async Init() {
        const chromeJSON: ChromeJson = await this._db.getData('/chromeBrowser');

        const browser = await puppeteer.launch({
            headless: false,
            executablePath: chromeJSON.path,
            browser: 'chrome',
            defaultViewport: null,
            ignoreDefaultArgs: ['--disable-extensions'],
            args: [
                '--start-maximized',
                '--no-sandbox',
                '--disable-setuid-sandbox',
                `--user-data-dir=${chromeJSON.profile}`,
                '--disable-blink-features=AutomationControlled',
            ],
        });

        return browser;
    }

    private async Close(browser: Browser) {
        const pages = await browser.pages();
        for (let i = 0; i < pages.length; i++) {
            await pages[i].close();
        }
        await browser.close();
        return;
    }

    public async Recuiters() {
        const userAgent: string = await this._db.getData('/common/default_user_agent');
        const linkedinBaseUrl: string = await this._db.getData('/common/linkedin_base_url');
        const keyword: string = await this._db.getData('/common/keyword');
        const messageTemplate: string = await this._db.getData('/common/message_template');
        const geoUrn: number[] = await this._db.getData('/common/geo_urn');
        const recruiterSynonyms: string[] = await this._db.getData('/common/recruiter_synonyms');
        let currentPage: number = await this._db.getData('/common/default_start_page');
        const endPage: number = await this._db.getData('/common/default_end_page');

        while (currentPage <= endPage) {
            const url = `${linkedinBaseUrl}/?geoUrn=[${geoUrn.map((item) => `"${item}"`).join(',')}]&keywords=${keyword}&page=${currentPage}`;

            const browser = await this.Init();
            const page = await browser.newPage();
            await page.setUserAgent(userAgent);
            await page.goto(url, { waitUntil: 'domcontentloaded' });

            const selector = Constants.PROFILE_SELECTOR;

            await page.waitForSelector(selector);

            const profiles = await page.$$(selector);
            for (let profile of profiles) {
                const jobEl = await profile.$(Constants.JOB_SELECTOR);
                if (!jobEl) continue;

                const job = await jobEl.evaluate((node) => node.textContent?.trim().toLowerCase().replace(/ /g, ''));
                if (!job) continue;
                if (!Utils.containsSubstring(job, recruiterSynonyms)) continue;

                const connectButtonSelector = Constants.CONNECT_BUTTON_SELECTOR;
                await page.waitForSelector(connectButtonSelector, { visible: true });

                const connectButtonEl = await profile.$(connectButtonSelector);
                if (!connectButtonEl) continue;

                const connectButton = await connectButtonEl.evaluate((node) => node.textContent?.trim().toLowerCase());
                if (connectButton == 'follow') continue;

                await Utils.sleep(2000);

                await connectButtonEl.click();

                const addNoteSelector = Constants.ADD_NOTE_SELECTOR;
                await page.waitForSelector(addNoteSelector, { visible: true });

                const addNoteButton = await page.$(addNoteSelector);
                if (!addNoteButton) continue;

                await Utils.sleep(2000);
                await addNoteButton.click();

                const textAreaSelector = Constants.TEXTAREA_SELECTOR;
                await page.waitForSelector(textAreaSelector, { visible: true });

                const textarea = await page.$(textAreaSelector);
                if (!textarea) continue;

                await Utils.sleep(2000);
                await textarea.evaluate((node, messageTemplate) => {
                    node.value = messageTemplate;
                }, messageTemplate);
                await textarea.evaluate((node) => node.blur());

                const sendButtonSelector = Constants.SEND_BUTTON_SELECTOR;
                await page.waitForSelector(sendButtonSelector, { visible: true });

                const sendButton = await page.$(sendButtonSelector);
                if (!sendButton) continue;

                await Utils.sleep(2000);
                await sendButton.evaluate((node) => node.click());
            }

            await Utils.sleep(2000);
            await this.Close(browser);
            currentPage++;
        }
        return;
    }

    public async People() {
        
    }

    public async Both() {}
}
