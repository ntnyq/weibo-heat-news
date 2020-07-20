const axios = require('axios')
const fs = require('fs-extra')
const cheerio = require('cheerio')
const width = require('string-width')
const table = require('markdown-table')
const dayjs = require('dayjs')
const UserAgent = require('user-agents')

const WEIBO_BASE_URL = 'https://s.weibo.com'
const WEIBO_HEAT_NEWS_URL = `${WEIBO_BASE_URL}/top/summary`
const ua = new UserAgent({ platform: 'Win32' })

async function fetchData() {
  const { status, data } = await axios.get(WEIBO_HEAT_NEWS_URL, {
    headers: { 'User-Agent': ua.toString() },
  })

  if (status !== 200) throw new Error('Cannot fetch data')

  const $ = cheerio.load(data)
  const list = [[`排序`, `标题`, `热度`, `标签`]]

  $('#pl_top_realtimehot')
    .find('tbody tr')
    .map((_, ele) => {
      const target = $(ele)
      const rank = target.find('.td-01').text()
      const title = target.find('.td-02 a').text()
      const url = target.find('.td-02 a').attr('href')
      const number = target.find('.td-02 span').text()
      const keyword = target.find('.td-03').text()
      const link = `[${title}](${WEIBO_BASE_URL + url})`

      if (rank == null || Number(rank) <= 0) {
        list.push([`置顶`, link, '', keyword])
      } else {
        list.push([rank, link, number, keyword])
      }
    })

  return list
}

async function main() {
  const list = await fetchData()
  const output = table(list, { stringLength: width })
  const content = [
    `<h1 align="center">微博热搜榜</h1>`,
    `> 更新于 ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`,
    output,
  ]

  await fs.ensureDir('dist')
  await fs.writeFile(`dist/README.md`, content.join('\n\n'))
}

try {
  main()
  console.log(`Write file successfully!`)
} catch (err) {
  console.error(`Oops, something went wrong`, err)
}
