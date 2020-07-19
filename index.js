const axios = require('axios')
const fs = require('fs-extra')
const cheerio = require('cheerio')
const width = require('string-width')
const table = require('markdown-table')
const UserAgent = require('user-agents')

const ua = new UserAgent({ platform: 'Win32' })

const fetch = () =>
  axios
    .get('https://s.weibo.com/top/summary', {
      headers: { 'User-Agent': ua.toString() },
    })
    .then(res => {
      if (res.status !== 200) throw new Error('Cannot fetch data')

      const $ = cheerio.load(res.data)
      const list = [[`排序`, `标题`, `热度`, `标签`]]

      $('#pl_top_realtimehot')
        .find('tbody tr')
        .map(function () {
          const target = $(this)
          const rank = target.find('.td-01').text()
          const title = target.find('.td-02 a').text()
          const number = target.find('.td-02 span').text()
          const keyword = target.find('.td-03').text()

          if (rank == null || Number(rank) <= 0) {
            list.push([`置顶`, title, '', keyword])
          } else {
            list.push([rank, title, number, keyword])
          }
        })

      return list
    })
    .catch(err => {
      throw err
    })

;(async () => {
  const list = await fetch()
  const output = table(list, { stringLength: width })
  const content = `
<h1 align="center">微博热搜榜</h1>

${output}
  `

  fs.ensureDirSync('dist')
  fs.writeFile('dist/README.md', content)
    .then(() => {
      console.log(`Write file successfully!`)
    })
    .catch(err => {
      console.error(`Oops, something went wrong`, err)
    })
})()
