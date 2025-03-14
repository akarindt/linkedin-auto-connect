#!/usr/bin/env node

import inquirer from 'inquirer';
import { passion, cristal } from 'gradient-string';
import figlet from 'figlet';
import { JsonDB, Config } from 'node-json-db';
import { MenuItem } from './type';
import { fileURLToPath } from 'url';
import Connect from './connect';
import Follow from './follow';
import Excel from './excel';
import fs from 'fs';
import path from 'path';
import BrowserInit from './browser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const db = new JsonDB(new Config(path.join(__dirname, '../appsetting.json'), true, false, '/'));

const menu = async () => {
    const title: string = await db.getData('/common/title');
    await figlet(title, (_, data) => {
        console.log(passion.multiline(data || ''));
    });

    const browserInit = new BrowserInit(db);
    if (!(await browserInit.FindBrowser())) {
        const firstTimeSetupMenu: MenuItem[] = await db.getData('/common/first_time_setup_menu');

        const firstTimeSetupPrompt = await inquirer.prompt(
            firstTimeSetupMenu.map((item) => {
                return {
                    type: 'input',
                    message: item.message,
                    name: item.name,
                    validate: (input) => {
                        return fs.existsSync(input);
                    },
                };
            })
        );

        const installPath = firstTimeSetupPrompt['InstallationLocation'];
        await db.push('/browser', { path, default: path.parse(installPath).name });
    }

    const mainMenuItems: MenuItem[] = await db.getData('/common/menu');
    const mainMenuPrompt = await inquirer.prompt({
        type: 'list',
        name: 'action',
        message: 'Please select an action',
        choices: mainMenuItems.map((item) => {
            return {
                name: item.message,
                value: item.action,
            };
        }),
    });

    if (mainMenuPrompt['action'] !== 'C') {
        let name = '';

        switch (mainMenuPrompt['action']) {
            case 'R':
                name = 'connect_recruiter';
                break;
            case 'P':
                name = 'connect_people';
                break;
            case 'B':
                name = 'connect_both';
                break;
            case 'FR':
                name = 'follow_recruiter';
                break;
            case 'FP':
                name = 'follow_people';
                break;
            case 'FB':
                name = 'follow_both';
                break;
            case 'ER':
                name = 'excel_recruiter';
                break;
            case 'EP':
                name = 'excel_people';
                break;
        }

        const currentPage = await db.getData(`/common/current_pages/${name}`);
        const pagePrompt = await inquirer.prompt([
            {
                type: 'input',
                name: 'endPage',
                message: `Skip to page (current page is ${currentPage})`,
                default: '10',
                validate: (input) => {
                    return (input as unknown as number) > 0;
                },
            },
        ]);

        const endPage = pagePrompt['endPage'] as number;
        await Promise.all([await db.push('/common/step', endPage, false)]);
    }

    await startSection(mainMenuPrompt['action']);
    return;
};

const startSection = async (option: string) => {
    switch (option) {
        case 'R':
            await new Connect(db).Recruiters();
            break;
        case 'P':
            await new Connect(db).People();
            break;
        case 'B':
            await new Connect(db).Both();
            break;
        case 'FR':
            await new Follow(db).Recruiters();
            break;
        case 'FP':
            await new Follow(db).People();
            break;
        case 'FB':
            await new Follow(db).Both();
            break;
        case 'ER':
            await new Excel(db).Recruiter();
            break;
        case 'EP':
            await new Excel(db).People();
            break;
        case 'C':
            await clearSetting();
            break;
    }
};

const clearSetting = async () => {
    await Promise.all([
        await db.push('/browser', { path: '', default: '' }, false),
        await db.push(
            '/common/current_pages',
            {
                connect_recruiter: '1',
                connect_people: '1',
                connect_both: '1',
                follow_recruiter: '1',
                follow_people: '1',
                follow_both: '1',
                excel_recruiter: '1',
                excel_people: '1',
            },
            false
        ),
        await db.push('/common/step', '10', false),
    ]);
    console.clear();
    await menu();
};

try {
    menu();
} catch (error) {
    console.log(error);
}
