const url = '';
const blogUrl = '';
const webhookUrl = '';


async function fetchDataAndSend() {
  // 昨日の日付を "YYYY-MM-DD" 形式で取得
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayString = yesterday.getFullYear() + '-' + 
                          String(yesterday.getMonth() + 1).padStart(2, '0') + '-' + 
                          String(yesterday.getDate()).padStart(2, '0');
  Logger.log('昨日：' + yesterdayString);

  let collectedData = [];

  // ニュースの調査
  const document = await fetchHTML(url);
  compareNewsDates(document, yesterdayString, collectedData);

  // ブログ記事の調査
  const blogDocument = await fetchHTML(blogUrl);
  comparePostDates(blogDocument, yesterdayString, collectedData);

  // データの送信
if (collectedData.length > 0) {
  processCollectedData(collectedData, webhookUrl);
  } else {
    Logger.log('昨日のニュースは見つかりませんでした。');
  }
}

async function fetchHTML(url) {
  const response = await UrlFetchApp.fetch(url);
  return response.getContentText();
}

function compareNewsDates(document, yesterdayString, collectedData) {
  const newsItems = document.match(/<dl>[\s\S]*?<\/dl>/gs);
  if (newsItems && newsItems.length > 0) {
    newsItems.forEach(item => {
      const postDateMatch = item.match(/<dt>\s*(.*?)\s*<\/dt>/);
      Logger.log('postDateMatch: ' + postDateMatch);
      if (postDateMatch && postDateMatch[1].trim() === yesterdayString) {
        const titleMatch = item.match(/<dd>\s*([\s\S]*?)\s*<\/dd>/);
        const urlMatch = item.match(/<a href="(.*?)">/);
        if (titleMatch && urlMatch) {
          const title = titleMatch[1].replace(/<[^>]+>/g, '').replace(/[\r\n\t]+/g, '').trim();
          const url = urlMatch[1];
          collectedData.push({ title, url });
          Logger.log('title: ' + title);
          Logger.log('url: ' + url);
        }
      }
    });
  } else {
    Logger.log('ニュース項目が見つかりませんでした。');
  }
}

function comparePostDates(document, yesterdayString, collectedData) {
  const postElements = document.match(/<article[^>]*>[\s\S]*?<\/article>/g);
  if (postElements && postElements.length > 0) {
    postElements.forEach(item => {
      const postDateMatch = item.match(/<span class="postdate kt-post-date">\s*(.*?)\s*<\/span>/);
      if (postDateMatch) {
        const postDateString = postDateMatch[1].trim();
        Logger.log('postDateString: ' + postDateString);
        if (postDateString === yesterdayString) {
          const titleMatch = item.match(/<h5 class="entry-title">([\s\S]*?)<\/h5>/);
          const urlMatch = item.match(/<a href="([\s\S]*?)".*?>/);
          if (titleMatch && urlMatch) {
            const title = titleMatch[1].trim();
            const url = urlMatch[1];
            collectedData.push({ title, url });
            Logger.log('title: ' + title);
            Logger.log('url: ' + url);
          }
        }
      }
    });
  } else {
    Logger.log('ブログ記事が見つかりませんでした。');
  }
}

function processCollectedData(collectedData, webhookUrl) {
  for (const item of collectedData) {
    sendToGoogleSheet(item.url, item.title, webhookUrl);
  }
}

function sendToGoogleSheet(url, title, webhookUrl) {
  const data = { title, url };

  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(data),
  };

  UrlFetchApp.fetch(webhookUrl, options);
}

