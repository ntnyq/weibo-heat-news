import type { Word } from "./types.ts";

/**
 *
 * @param words
 * @param anothor
 */
export function mergeWords4Weibo(words: Word[], anothor: Word[]): Word[] {
  const obj: Record<string, string> = {};

  for (const w of words.concat(anothor)) {
    obj[w.url] = w.title;
  }

  return Object.entries(obj).map(([url, title]) => ({ url, title }));
}

/**
 *
 * @param words
 */
export function createWeiboList(words: Word[]): string {
  const list = [
    `<!-- BEGIN WEIBO -->`,
    `<!-- Updated at: ${Date()} -->`,
    words.map((x, i) => `${i + 1}. [${x.title}](${x.realUrl})`).join("\n"),
    `<!-- END WEIBO -->`,
  ];

  return list.join("\n");
}

/**
 *
 * @param words
 */
export async function createReadme4Weibo(words: Word[]): Promise<string> {
  const readme = await Deno.readTextFile("./README.md");
  return readme.replace(
    /<!-- BEGIN WEIBO -->[\W\w]*<!-- END WEIBO -->/,
    createWeiboList(words)
  );
}

/**
 *
 * @param words
 * @param date
 */
export function createArchive4Weibo(words: Word[], date: string): string {
  const archive = [
    `# ${date}`,
    `> 共 ${words.length} 条`,
    createWeiboList(words),
  ].join("\n\n");

  return archive;
}
