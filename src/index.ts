#!/usr/bin/env node
import chalk from "chalk";
import inquirer from "inquirer";
import { cristal } from "gradient-string";
import chalkAnimation from "chalk-animation";
import figlet from "figlet";
import { createSpinner } from "nanospinner";
import { JsonDB, Config } from "node-json-db";

let displayTime = 0;

const db = new JsonDB(new Config("appsetting", true, false, "/"));

const sleep = (ms: number = 2000) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const menu = async () => {
  if (displayTime === 0) {
    const title: string = await db.getData("/common/title");

    figlet(title, (err, data) => {
      console.log(cristal.multiline(data || ""));
    });
  }
  await sleep();
  displayTime++;
};

while (true) {
  await menu();
}
