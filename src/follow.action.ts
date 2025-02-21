import { JsonDB } from 'node-json-db';
import puppeteer from 'puppeteer-core';

export default class Follow {
    private _db: JsonDB;

    constructor(db: JsonDB) {
        this._db = db;
    }

    public async Recuiters() {}

    public async People() {}

    public async Both() {}
}
