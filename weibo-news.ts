#!/usr/bin/env -S deno run --unstable --allow-net --allow-read --allow-write--allow-write
import { format } from "std/datetime/mod.ts";
import { join } from "std/path/mod.ts";
import { exists } from "std/fs/mod.ts";

import type { Word } from "./types.ts";

import {
  createArchive4Weibo,
  createReadme4Weibo,
  mergeWords4Weibo,
} from "./utils.ts";

const regexp = /<a href="(\/weibo\?q=[^"]+)".*?>(.+)<\/a>/g;
const response = await fetch("https://s.weibo.com/top/summary");

if (!response.ok) {
  console.error(response.statusText);
  Deno.exit(1);
}

const result: string = await response.text();
const matches = result.matchAll(regexp);

const words: Word[] = Array.from(matches).map((x) => ({
  url: x[1],
  title: x[2],
}));

const yyyyMMdd = format(new Date(), "yyyy-MM-dd");
const fullPath = join("raw", `${yyyyMMdd}.json`);

let wordsAlreadyDownload: Word[] = [];

if (await exists(fullPath)) {
  const content = await Deno.readTextFile(fullPath);
  wordsAlreadyDownload = JSON.parse(content);
}

const queswordsAll = mergeWords4Weibo(words, wordsAlreadyDownload);

export const weiboNewsData = queswordsAll.map((x) => {
  x.realUrl = `https://s.weibo.com/${x.url}`;
  return x;
});

export async function weiboSearch() {
  await Deno.writeTextFile(fullPath, JSON.stringify(queswordsAll));

  const readme = await createReadme4Weibo(queswordsAll);
  await Deno.writeTextFile("./README.md", readme);

  const archiveText = createArchive4Weibo(queswordsAll, yyyyMMdd);
  const archivePath = join("archives", `${yyyyMMdd}.md`);
  await Deno.writeTextFile(archivePath, archiveText);
}
