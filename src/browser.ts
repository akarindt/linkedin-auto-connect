import { JsonDB } from 'node-json-db';
import fs from 'fs';
import process from 'process';
import path from 'path';
import { BrowserJson, DefaultInstallation, ProfileName } from './type';
import puppeteer, { SupportedBrowser, Browser } from 'puppeteer-core';
import { fileURLToPath } from 'url';

export default class BrowserInit {
    private _db: JsonDB;
    private _filename: any;
    private _dirname: string;

    constructor(db: JsonDB) {
        this._db = db;
        this._filename = fileURLToPath(import.meta.url);
        this._dirname = path.dirname(this._filename);
    }

    public async FindBrowser() {
        const defaultPaths = (await this._db.getData('/common/default_browser_installation_path')) as DefaultInstallation;
        const currentOS: string = process.platform;
        if (currentOS !== 'win32' && currentOS !== 'linux' && currentOS !== 'darwin') throw new Error('Unsupported OS!');

        const browserPaths = [...defaultPaths.chrome[currentOS], ...defaultPaths.firefox[currentOS]];
        for (let i = 0; i < browserPaths.length; i++) {
            if (fs.existsSync(browserPaths[i])) {
                await Promise.all([
                    await this._db.push('/browser/default', path.parse(browserPaths[i]).name, false),
                    await this._db.push('/browser/path', browserPaths[i], false),
                ]);
                return true;
            }
        }
        return false;
    }

    public async InitBrowser() {
        const browserSetting = (await this._db.getData('/browser')) as BrowserJson;
        const profileName = (await this._db.getData('/common/profile_name')) as ProfileName;
        let args: string[] = [];
        let extra: any = null;

        switch (browserSetting.default) {
            case 'chrome':
                args = [
                    '--start-maximized',
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    `--user-data-dir=${path.join(this._dirname, '../profiles', profileName[browserSetting.default])}`,
                    '--disable-blink-features=AutomationControlled',
                ];
                break;
            case 'firefox':
                args = [
                    `--profile=${path.join(this._dirname, '../profiles', profileName[browserSetting.default])}`,
                    `--start-maximized`,
                    `--disable-setuid-sandbox`,
                    '--no-sandbox',
                    '--disable-blink-features=AutomationControlled',
                ];

                extra = {
                    'security.enterprise_roots.enabled': true,
                };
                break;
        }

        const browser = await puppeteer.launch({
            headless: false,
            executablePath: browserSetting.path,
            browser: browserSetting.default as SupportedBrowser,
            defaultViewport: null,
            ignoreDefaultArgs: ['--disable-extensions'],
            args: args,
            extraPrefsFirefox: extra,
        });

        return browser;
    }

    public async Close(browser: Browser) {
        const pages = await browser.pages();
        for (let i = 0; i < pages.length; i++) {
            await pages[i].close();
        }
        await browser.close();
        return;
    }
}
