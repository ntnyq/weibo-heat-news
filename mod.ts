import { weiboSearch } from "./weibo-news.ts";

export async function main() {
  await weiboSearch();
}

try {
  main();
  console.log("Write file successfully!");
} catch (err) {
  console.error("Oops, something went wrong", err);
}
