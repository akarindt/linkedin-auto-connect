#!/usr/bin/env node

import inquirer from 'inquirer';
import { passion } from 'gradient-string';
import figlet from 'figlet';
import { JsonDB, Config } from 'node-json-db';
import { ChromeJson, MenuItem } from './type';
import Connect from './connect.action';
import Follow from './follow.action';
import Utils from './utils';

const db = new JsonDB(new Config('appsetting', true, false, '/'));

const menu = async () => {
    const title: string = await db.getData('/common/title');

    figlet(title, (_, data) => {
        console.log(passion.multiline(data || ''));
    });

    await Utils.sleep(1000);

    const firstTimeSetupMenu: MenuItem[] = await db.getData('/common/first_time_setup_menu');

    const chromeJson: ChromeJson = await db.getData('/chromeBrowser');
    if (chromeJson.path == '' || chromeJson.profile == '') {
        const firstTimeSetupPrompt = await inquirer.prompt(
            firstTimeSetupMenu.map((item) => {
                return {
                    type: 'input',
                    message: item.message,
                    name: item.name,
                };
            })
        );

        const path = firstTimeSetupPrompt['InstallationLocation'];
        const profilePath = firstTimeSetupPrompt['ChromeProfile'];

        await db.push('/chromeBrowser', { path, profile: profilePath });
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

    startSection(mainMenuPrompt['action']);
    return;
};

const startSection = async (option: string) => {
    switch (option) {
        case 'R':
            await new Connect(db).Recuiters();
            break;
        case 'P':
            await new Connect(db).People();
            break;
        case 'B':
            await new Connect(db).Both();
            break;
        case 'FR':
            await new Follow(db).Recuiters();
            break;
        case 'FP':
            await new Follow(db).People();
            break;
        case 'FB':
            await new Follow(db).Both();
            break;
        case 'C':
            await clearSetting();
            break;
    }
};

const clearSetting = async () => {
    await db.push('/chromeBrowser', { path: '', profile: '' });
    console.clear();
    await menu();
};

const main = async () => {
    await menu();
};

await main();
