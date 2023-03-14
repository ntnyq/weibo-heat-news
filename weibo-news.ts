#!/usr/bin/env -S deno run --unstable --allow-net --allow-read --allow-write--allow-write
import { format } from "std/datetime/mod.ts";
import { join } from "std/path/mod.ts";
import { load } from "std/dotenv/mod.ts";

import type { Word } from "./types.ts";

import {
  createArchive4Weibo,
  createReadme4Weibo,
  mergeWords4Weibo,
} from "./utils.ts";

const ENV = await load();

if (!ENV.WEIBO_COOKIE) {
  console.error("WEIBO_COOKIE is required");
  Deno.exit(1);
}

// TODO: fix the regexp
const regexp = /<a href="(\/weibo\?q=[^"]+)".*?>([\s\S]*?)<\/a>/g;
const response = await fetch("https://s.weibo.com/top/summary", {
  headers: {
    cookie: ENV.WEIBO_COOKIE,
    "user-agent":
      "Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1",
  },
});

if (!response.ok) {
  console.error(response.statusText);
  Deno.exit(1);
}

const result: string = await response.text();
const matches = result.match(regexp);

const words: Word[] = Array.from(matches ?? []).map((x) => ({
  url: x[1],
  title: x[2],
}));

const yyyyMMdd = format(new Date(), "yyyy-MM-dd");
const fullPath = join("raw", `${yyyyMMdd}.json`);

let wordsAlreadyDownload: Word[] = [];

try {
  const content = await Deno.readTextFile(fullPath);
  wordsAlreadyDownload = JSON.parse(content);
} catch (error) {
  if (!(error instanceof Deno.errors.NotFound)) {
    throw error;
  }
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
