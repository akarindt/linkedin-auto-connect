import { JsonDB } from 'node-json-db';
import Utils from './utils';
import Constants from './constants';
import BrowserInit from './browser';
import { Browser } from 'puppeteer-core';

export default class Connect {
    private _db: JsonDB;

    constructor(db: JsonDB) {
        this._db = db;
    }

    private async Go(browser: Browser, type: 'people' | 'recruiter' | 'both') {
        const userAgent: string = await this._db.getData('/common/default_user_agent');
        const keyword: string = await this._db.getData('/common/keyword');
        const endPage: number = parseInt(await this._db.getData('/common/step'));
        let currentPage: number = parseInt(await this._db.getData(`/common/current_pages/connect_${type}`));
        const geoUrn: number[] = await this._db.getData('/common/geo_urn');
        const linkedinBaseUrl: string = await this._db.getData('/common/linkedin_base_url');
        const messageTemplate: string = await this._db.getData('/common/message_template');
        const recruiterSynonyms: string[] = await this._db.getData('/common/recruiter_synonyms');
        let breakLoop = false;
        const limit = currentPage + endPage;

        const page = await browser.newPage();
        await page.setUserAgent(userAgent);

        while (currentPage < limit && !breakLoop) {
            const geo_urn = geoUrn.map((item) => `"${item}"`).join(',');
            const url = `${linkedinBaseUrl}/?geoUrn=[${geo_urn}]&keywords=${keyword}&page=${currentPage}`;
            await page.goto(url, { waitUntil: 'domcontentloaded' });

            const profiles = await Utils.waitForSelectors(page, Constants.PROFILE_SELECTOR);
            for (const profile of profiles) {
                try {
                    if (type !== 'both') {
                        const jobEl = await profile.$(Constants.JOB_SELECTOR);
                        if (!jobEl) continue;

                        const job = await jobEl.evaluate((node) => node.textContent?.trim().toLowerCase().replace(/ /g, ''));
                        if (!job) continue;

                        if (type === 'recruiter' && !Utils.containsSubstring(job, recruiterSynonyms)) continue;
                        if (type === 'people' && Utils.containsSubstring(job, recruiterSynonyms)) continue;
                    }

                    const connectButtonEl = await Utils.waitForSelector(page, Constants.CONNECT_BUTTON_SELECTOR);
                    if (!connectButtonEl) continue;

                    await Utils.sleep(Utils.randomArray(Constants.DELAY_TIME));
                    await connectButtonEl.click();

                    const addNoteButton = await Utils.waitForSelector(page, Constants.ADD_NOTE_SELECTOR);
                    if (!addNoteButton) continue;

                    await Utils.sleep(Utils.randomArray(Constants.DELAY_TIME));
                    await addNoteButton.click();

                    const modalUpsale = await Utils.waitForSelector(page, Constants.MODAL_UPSALE);
                    if (modalUpsale) {
                        console.log(Constants.OUT_OF_FREE_CONNECT_MSG);
                        breakLoop = true;
                        await this._db.push(`/common/current_pages/connect_${type}`, currentPage, false);
                        return;
                    }

                    const textarea = await Utils.waitForSelector(page, Constants.TEXTAREA_SELECTOR);
                    if (!textarea) continue;

                    await Utils.sleep(Utils.randomArray(Constants.DELAY_TIME));
                    await textarea.evaluate((node, messageTemplate) => {
                        node.value = messageTemplate;
                    }, messageTemplate);
                    await textarea.evaluate((node) => node.blur());

                    const sendButton = await Utils.waitForSelector(page, Constants.SEND_BUTTON_SELECTOR);
                    if (!sendButton) continue;

                    await Utils.sleep(Utils.randomArray(Constants.DELAY_TIME));
                    await sendButton.evaluate((node) => node.click());
                } catch (error) {
                    continue;
                }
            }
            await Utils.sleep(Utils.randomArray(Constants.DELAY_TIME));
            console.log(`Page ${currentPage} - done`);
            currentPage++;
        }
        await this._db.push(`/common/current_pages/connect_${type}`, currentPage, false);
        console.log(`[Connect ${type}] - Job done`);
    }

    private async Connect(type: 'people' | 'recruiter' | 'both') {
        const userAgent: string = await this._db.getData('/common/default_user_agent');

        const browserInit = new BrowserInit(this._db);
        const browser = await browserInit.InitBrowser();

        const newPage = await browser.newPage();
        await newPage.setUserAgent(userAgent);
        await newPage.goto('https://www.linkedin.com/checkpoint/lg/sign-in-another-account', { waitUntil: 'domcontentloaded' });

        const signIn = await newPage.$(Constants.SIGNIN_SELECTOR);
        if (signIn) {
            console.log('Not logged in - Please login and close the tab');
            browser.on('targetdestroyed', async (target) => {
                const pages = await browser.pages();
                if (pages.length === 1) {
                    await this.Go(browser, type);
                }
            });
        } else {
            await newPage.close();
            await this.Go(browser, type);
        }
        await browserInit.Close(browser);
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
