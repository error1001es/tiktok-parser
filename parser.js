require('dotenv').config()

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function average(nums) {
    return nums.reduce((a, b) => (a + b)) / nums.length;
}

const TikTokScraper = require('tiktok-scraper')

const { GoogleSpreadsheet } = require('google-spreadsheet')
const credentials = require('./credentials') // the file saved above

async function initialize() {
    // Initialize the sheet - doc ID is the long id in the sheets URL
    const doc = new GoogleSpreadsheet(process.env.GOOGLE_TABLE_ID)

    // Initialize Auth - see more available options at https://theoephraim.github.io/node-google-spreadsheet/#/getting-started/authentication
    await doc.useServiceAccountAuth(credentials)

    await doc.loadInfo() // loads document properties and worksheets
    console.log(doc.title)

    const sheet = doc.sheetsByIndex[0]

    const rows = await sheet.getRows()

    for (row of rows){
        try {
            const posts = await TikTokScraper.user(row['Название \nаккаунта'], {
                number: 12,
                sessionList: [process.env.SID_TT]
            })

            if(posts.collector[0]){
                row['Ссылка на \nаккаунт \nTik-Tok'] = `https://www.tiktok.com/@${row['Название \nаккаунта']}`
                row['Кол-во\nподписчиков\nTik-Tok'] = posts.collector[0].authorMeta.fans

                let videos = posts.collector

                let playCounts = []
                let shareCounts = []
                let diggCounts = []

                for(let i=2;i<12;i++){
                    playCounts.push(videos[i].playCount)
                    shareCounts.push(videos[i].shareCount)
                    diggCounts.push(videos[i].diggCount)
                }

                row['Изменение просмотры'] = average(playCounts) - parseInt(row['Средние просмотры'].trim())
                row['Средние просмотры'] = average(playCounts)

                row['Изменение лайки'] = average(diggCounts) - parseInt(row['Средние лайки'].trim())
                row['Средние лайки'] = average(diggCounts)

                row['Изменение репосты'] = average(shareCounts) - parseInt(row['Средние репосты'].trim())
                row['Средние репосты'] = average(shareCounts)
            }else{
                row['Ссылка на \nаккаунт \nTik-Tok'] = 'Аккаунт не найден'
                row['Средние просмотры'] = '-'
                row['Средние лайки'] = '-'
                row['Средние репосты'] = '-'
            }

            let date = new Date(Date.now())
            row['Дата обновления'] = date.toLocaleString('ru-RU')

            row.save()

        } catch (error) {
            console.log(error)
        }
        
        sleep(2000)
    }
}

initialize()