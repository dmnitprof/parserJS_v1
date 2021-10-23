const puppeteer = require('puppeteer')
const express = require('express')
const fs = require('fs')
require('dotenv').config()
const app = express()

const login = process.env.LOGIN
const pass = process.env.PASS
const url = process.env.BASE_URL
const urlAll = process.env.BASE_URL_ALL;

(async () => {
    let counter = 1
    let result = []
    const browser = await puppeteer.launch({
        headless: true,
        slowMo: 100,
        devtools: true
    })
    const page = await browser.newPage()
    await page.setViewport({
        width: 1280, height: 768
    })

    await page.goto('https://gradus-nik.ru')
    await page.$eval('#USER_LOGIN', (el, login) => (el.value = login), login)
    await page.$eval('#USER_PASSWORD', (el, pass) => (el.value = pass), pass)
    await page.click('#authorize-form-container > div.authorize-form > div > div > form > div > div:nth-child(4) > div > input')
    await page.waitForTimeout(3000)

    await page.goto(`${url}${counter}`)

    let html = await page.evaluate(async () => {
        const pageUrl = []
        let listItems = document.querySelectorAll('#main > div > div > div.col-md-10.col-sm-8.content > div.claim-list > table > tbody > tr')
        listItems.forEach(item => {
            let date = item.querySelector('td.cell.cell--date')
            let id = item.querySelector('td.cell.cell--num')
            let link = item.querySelector('td.cell.cell--num > a').href
            let address = item.querySelector('td.cell.cell--adres')
            let department = item.querySelector('td.cell.cell--department')
            let text = item.querySelector('td.cell.cell--text')
            let type = item.querySelector('td.cell.cell--type')

            let obj = {
                date: date.innerText,
                id: +id.innerText.slice(0, -5),
                link: link,
                address: address.innerText,
                department: department.innerText,
                text: text.innerText,
                type: type.innerText ? type.innerText = '' : type.innerText = 'не обработано'
            }
            pageUrl.push(obj)
        })
        return pageUrl
    })
    await browser.close()
    result.push(html)
    return result.flat()

})()
    .then(data => {
        fs.writeFile('public/applications.json', JSON.stringify({...data}, null, ' '), err => {
            if (err) throw err
            console.log('applications.json saved')
            console.log('Заявок :', data.length)
        })
                    const toHtml = data.map((el) => {
                        return `<div>
                <strong>Всего заявок: ${data.length}</strong>
                <hr>
                    <p><small>${el.date}</small></p>
                    <p>ID:&nbsp;<b>${el.id}</b></p>
                    <span><a href="${el.link}">редактировать</a></span>
                    <p>${el.address}</p>
                    <p>${el.department}</p>
                    <p>${el.text}</p>
                    <p>${el.type}</p>
            </div>`
                    })

            async function sendHtml() {
                await app.get('/', (req, res) => {
                    res.send(`
            
               <html lang="ru">
    <head>
        <meta charSet="UTF-8"/>
        <link rel="icon" type="image/svg+xml" href="favicon.svg"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>Заявки</title>
    </head>
    <body>
  ${toHtml.toString()}
    <hr>
    </body>
    </html>
            `)
                })
                await app.listen(3333, () => {
                    console.log('Запущен сервер на http://localhost:3333/')
                })
            }
            sendHtml()
    })

