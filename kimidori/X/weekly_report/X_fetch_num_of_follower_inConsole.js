//モジュール定義
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

//ソース定義
const KIMIDORI_X_URL = '';
const CHROME_PATH = '';
const WEBHOOK_URL = ''; //deploy URL

//関数
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getXFollower(html) {
    try {
        const $ = cheerio.load(html);

        const ahrefs = $('a[href="/~/verified_followers"]');
        if (!ahrefs.length) {
            throw new Error('a href 要素が見つかりませんでした。');
        }

        for (let i = 0; i < ahrefs.length; i++) {
            const ahref = ahrefs[i];
            const followerElements = $(ahref).find('span');

            if (!followerElements.length) {
                throw new Error('followerElements要素が見つかりませんでした。');
            }

            for (let j = 0; j < followerElements.length; j++) {
                const followerElement = followerElements[j];
                const follower = $(followerElement).text().trim();

                if (!isNaN(follower.replace(/,/g, '')) && follower !== '') {
                    console.log('フォロワー数:', follower);
                    return follower;
                }
            }
        }
    } catch (e) {
        console.error('フォロワーチェック中にエラーが発生しました:', e);
        return false;
    }
    return false;
}

async function sendToGoogleSheet(follower) {
    try {
        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            mode: 'no-cors', // CORSポリシーを無視する
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ follower: follower }),
        });
    } catch (error) {
        console.error('データ送信時にエラーが発生しました:', error);
    }
}

(async () => {
    console.log('処理を開始します。');

    console.log('Xのアカウントメインページにアクセスします。');
    const browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: false // ヘッドレスモードを無効にする
    });
    const page = await browser.newPage();
    await page.goto(KIMIDORI_X_URL);
    await sleep(10000);
    const html = await page.content();
    await browser.close();
    console.log('Xのアカウントメインページから離脱します。');

    console.log('Xのフォロワー数の取得処理を開始します。');
    let follower = await getXFollower(html);
    console.log('フォロワー数の取得処理を終了します。');

    console.log('データの送信を開始します。');
    const followerInt = parseInt(follower.replace(/,/g, ''), 10);
    await sendToGoogleSheet(followerInt);
    console.log('データの送信を終了します。');

    console.log('処理を終了します。');
})();
