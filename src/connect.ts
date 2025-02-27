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

    private async Connect(type: 'people' | 'recruiter' | 'both') {
        const userAgent: string = await this._db.getData('/common/default_user_agent');
        const keyword: string = await this._db.getData('/common/keyword');
        const endPage: number = parseInt(await this._db.getData('/common/default_end_page'));
        let currentPage: number = parseInt(await this._db.getData('/common/default_start_page'));
        const geoUrn: number[] = await this._db.getData('/common/geo_urn');
        const linkedinBaseUrl: string = await this._db.getData('/common/linkedin_base_url');
        const messageTemplate: string = await this._db.getData('/common/message_template');
        const recruiterSynonyms: string[] = await this._db.getData('/common/recruiter_synonyms');
        let breakLoop = false;

        const browser = await this.Init();
        const page = await browser.newPage();
        await page.setUserAgent(userAgent);

        try {
            while (currentPage <= endPage && !breakLoop) {
                const url = `${linkedinBaseUrl}/?geoUrn=[${geoUrn.map((item) => `"${item}"`).join(',')}]&keywords=${keyword}&page=${currentPage}`;
                await page.goto(url, { waitUntil: 'domcontentloaded' });

                const selector = Constants.PROFILE_SELECTOR;
                await page.waitForSelector(selector);

                const profiles = await page.$$(selector);
                for (const profile of profiles) {
                    if (type !== 'both') {
                        const jobEl = await profile.$(Constants.JOB_SELECTOR);
                        if (!jobEl) continue;

                        const job = await jobEl.evaluate((node) => node.textContent?.trim().toLowerCase().replace(/ /g, ''));
                        if (!job) continue;

                        if (type === 'recruiter' && !Utils.containsSubstring(job, recruiterSynonyms)) continue;
                        if (type === 'people' && Utils.containsSubstring(job, recruiterSynonyms)) continue;
                    }

                    await page.waitForSelector(Constants.CONNECT_BUTTON_SELECTOR, { visible: true });

                    const connectButtonEl = await profile.$(Constants.CONNECT_BUTTON_SELECTOR);
                    if (!connectButtonEl) continue;

                    await Utils.sleep(Utils.randomArray(Constants.DELAY_TIME));
                    await connectButtonEl.click();

                    await page.waitForSelector(Constants.ADD_NOTE_SELECTOR, { visible: true });
                    const addNoteButton = await page.$(Constants.ADD_NOTE_SELECTOR);
                    if (!addNoteButton) continue;

                    await Utils.sleep(Utils.randomArray(Constants.DELAY_TIME));
                    await addNoteButton.click();

                    await page.waitForSelector(Constants.MODAL_UPSALE, { visible: true });
                    const modalUpsale = await page.$(Constants.MODAL_UPSALE);
                    if (modalUpsale) {
                        console.log(Constants.OUT_OF_FREE_CONNECT_MSG);
                        breakLoop = true;
                        return;
                    }

                    await page.waitForSelector(Constants.TEXTAREA_SELECTOR, { visible: true });
                    const textarea = await page.$(Constants.TEXTAREA_SELECTOR);
                    if (!textarea) continue;

                    await Utils.sleep(Utils.randomArray(Constants.DELAY_TIME));
                    await textarea.evaluate((node, messageTemplate) => {
                        node.value = messageTemplate;
                    }, messageTemplate);
                    await textarea.evaluate((node) => node.blur());

                    await page.waitForSelector(Constants.SEND_BUTTON_SELECTOR, { visible: true });
                    const sendButton = await page.$(Constants.SEND_BUTTON_SELECTOR);
                    if (!sendButton) continue;

                    await Utils.sleep(Utils.randomArray(Constants.DELAY_TIME));
                    await sendButton.evaluate((node) => node.click());
                }

                await Utils.sleep(Utils.randomArray(Constants.DELAY_TIME));
                currentPage++;
            }
        } catch (error) {
            console.log(error);
        } finally {
            await this.Close(browser);
        }
        return;
    }

    public async Recruiters() {
        return await this.Connect('recruiter');
    }

    public async People() {
        return await this.Connect('people');
    }

    public async Both() {
        return await this.Connect('both');
    }
}
