import { JsonDB } from 'node-json-db';
import Constants from './constants';
import Utils from './utils';
import BrowserInit from './browser';
import { Browser } from 'puppeteer-core';

export default class Follow {
    private _db: JsonDB;

    constructor(db: JsonDB) {
        this._db = db;
    }

    private async Go(browser: Browser, type: 'people' | 'recruiter' | 'both') {
        const userAgent: string = await this._db.getData('/common/default_user_agent');
        const keyword: string = await this._db.getData('/common/keyword');
        const geoUrn: number[] = await this._db.getData('/common/geo_urn');
        const endPage: number = parseInt(await this._db.getData('/common/step'));
        const linkedinBaseUrl: string = await this._db.getData('/common/linkedin_base_url');
        const recruiterSynonyms: string[] = await this._db.getData('/common/recruiter_synonyms');
        let currentPage: number = parseInt(await this._db.getData(`/common/current_pages/follow_${type}`));
        const limit = currentPage + endPage;

        const page = await browser.newPage();
        await page.setUserAgent(userAgent);

        while (currentPage < limit) {
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
                    const followButtonEl = await Utils.waitForSelector(page, Constants.FOLLOW_BUTTON_SELECTOR);
                    if (!followButtonEl) continue;

                    await Utils.sleep(Utils.randomArray(Constants.DELAY_TIME));
                    await followButtonEl.click();
                } catch (error) {
                    continue;
                }
            }

            await Utils.sleep(Utils.randomArray(Constants.DELAY_TIME));
            console.log(`Page ${currentPage} - done`);
            currentPage++;
        }
        await this._db.push(`/common/current_pages/follow_${type}`, currentPage, false);
        console.log(`[Follow ${type}] - Job done`);
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
                    await browserInit.Close(browser);
                }
            });
        } else {
            await newPage.close();
            await this.Go(browser, type);
            await browserInit.Close(browser);
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
