import { JsonDB } from 'node-json-db';
import { ChromeJson, ExcelData } from './type';
import puppeteer, { Browser } from 'puppeteer-core';
import ExcelJS from 'exceljs';
import os from 'os';
import path from 'path';
import fs from 'fs';
import openLib from 'open';
import Constants from './constants';
import Utils from './utils';

export default class Excel {
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

    private async CreateXlsx(type: 'recruiter' | 'people', data: ExcelData[]) {
        const workbook = new ExcelJS.Workbook();
        const fileName = `${type.toUpperCase()}_${Date.now()}.xlsx`;
        let exportDir = path.join(os.tmpdir(), `./linkedin-auto-connect`);

        workbook.creator = 'linkedin-auto-connect';
        workbook.created = new Date();
        workbook.modified = new Date();

        const worksheet = workbook.addWorksheet(type.toUpperCase());
        worksheet.columns = [
            {
                header: 'No',
                key: 'no',
                width: 10,
            },
            {
                header: 'Profile name',
                key: 'fullname',
                width: 40,
            },
            {
                header: 'Job description',
                key: 'job',
                width: 200,
            },
            {
                header: 'Profile url',
                key: 'link',
                width: 200,
            },
        ];

        const cols = [worksheet.getColumn('A'), worksheet.getColumn('B'), worksheet.getColumn('C'), worksheet.getColumn('D')];
        const cels = [worksheet.getCell('A1'), worksheet.getCell('B1'), worksheet.getCell('C1'), worksheet.getCell('D1')];

        for (const col of cols) {
            col.alignment = {
                vertical: 'middle',
                horizontal: 'left',
            };

            col.font = {
                name: 'Times New Roman',
            };
        }

        for (const cel of cels) {
            cel.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: Constants.PRIMARY_COLOR },
            };

            cel.font = {
                color: { argb: Constants.FONT_COLOR, theme: 1 },
                bold: true,
                size: 14,
                name: 'Times New Roman',
            };
        }

        worksheet.getRow(1).height = 20;

        worksheet.views = [{ state: 'frozen', xSplit: 1, ySplit: 1 }];

        worksheet.addRows(
            data.map((value, idx) => {
                return {
                    no: idx + 1,
                    fullname: value.fullname,
                    job: value.job,
                    link: { text: value.link, hyperlink: value.link },
                };
            })
        );

        worksheet.eachRow((row) => {
            row.eachCell((cell) => {
                if (cell.value) {
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' },
                    };
                }
            });
        });

        if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir);
        exportDir = path.join(exportDir, fileName);
        await workbook.xlsx.writeFile(exportDir);
        console.log(`File saved at: ${exportDir}`);
        await openLib(exportDir, {});
    }

    private async ExportData(type: 'recruiter' | 'people') {
        const userAgent: string = await this._db.getData('/common/default_user_agent');
        const keyword: string = await this._db.getData('/common/keyword');
        const endPage: number = parseInt(await this._db.getData('/common/default_end_page'));
        const geoUrn: number[] = await this._db.getData('/common/geo_urn');
        let currentPage: number = parseInt(await this._db.getData('/common/default_start_page'));
        const linkedinBaseUrl: string = await this._db.getData('/common/linkedin_base_url');
        const recruiterSynonyms: string[] = await this._db.getData('/common/recruiter_synonyms');

        const browser = await this.Init();
        const page = await browser.newPage();
        await page.setUserAgent(userAgent);

        const data: ExcelData[] = [];
        try {
            while (currentPage <= endPage) {
                const url = `${linkedinBaseUrl}/?geoUrn=[${geoUrn.map((item) => `"${item}"`).join(',')}]&keywords=${keyword}&page=${currentPage}`;
                await page.goto(url, { waitUntil: 'domcontentloaded' });

                const selector = Constants.PROFILE_SELECTOR;
                await page.waitForSelector(selector);

                const profiles = await page.$$(selector);
                for (const profile of profiles) {
                    const linkEl = await profile.$(Constants.LINK_SELECTOR);
                    if (!linkEl) continue;

                    const profileLinkName = await linkEl.evaluate((node) => node.textContent?.trim());
                    if (profileLinkName == '' || profileLinkName == Constants.NAME_FILTER || !profileLinkName) continue;

                    const profileLink = await linkEl.evaluate((node) => node.getAttribute('href'));
                    if (!profileLink) continue;

                    const nameEl = await profile.$(Constants.NAME_SELECTOR);
                    if (!nameEl) continue;

                    const profileName = await nameEl.evaluate((node) => node.textContent?.trim());
                    if (!profileName) continue;

                    const jobEl = await profile.$(Constants.JOB_SELECTOR);
                    if (!jobEl) continue;

                    const job = await jobEl.evaluate((node) => node.textContent?.trim());
                    if (!job) continue;
                    if (type === 'recruiter' && !Utils.containsSubstring(job, recruiterSynonyms)) continue;
                    if (type === 'people' && Utils.containsSubstring(job, recruiterSynonyms)) continue;

                    data.push({
                        fullname: profileName,
                        job: job,
                        link: profileLink,
                    });
                }
                await Utils.sleep(Utils.randomArray(Constants.DELAY_TIME));
                currentPage++;
            }
        } catch (error) {
            console.log(error);
        } finally {
            await this.CreateXlsx(type, data);
            await this.Close(browser);
            return;
        }
    }

    public async Recruiter() {
        return await this.ExportData('recruiter');
    }

    public async People() {
        return await this.ExportData('people');
    }
}
