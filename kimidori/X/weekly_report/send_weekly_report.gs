function sendSlackMessage(slackApp, text, threadTs) {
    slackApp.postMessage(USER_ID, text, {thread_ts: threadTs});
}

function readSpreadsheetData(ssheet, sheetName) {
  let spreadsheet = SpreadsheetApp.openById(ssheet);
  let sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    Logger.log('指定されたシートが見つかりません: ' + sheetName);
    return null;
  }

  let header = sheet.getRange('B2:B3').getValues().flat().join('\n');
  let body = sheet.getRange('B4:B25').getValues().flat().join('\n');
  return { header: header, body: body };
}

function send_weekly_report() {
  let slackApp = SlackApp.create(TOKEN);
  let data = readSpreadsheetData(X_OPERATION, WEEKLY_REPORT2);

  if (data) {
    let initialmessage = "@週報担当者\n【要確認】X部隊週報\n" +
                         "今週の数値結果を確認してください。\n" +
                         "今週のシェア・気付き・来週の作業を追記してください。";
    // 最初の通知をSlackに送信
    var initialResponse = slackApp.postMessage(USER_ID, initialmessage);
    var threadTs = initialResponse.ts;

    if (threadTs) {
      sendSlackMessage(slackApp, data.header, threadTs);
      let message = data.body + "\n\n" +
                    "●今週のシェア\n\n" +
                    "●今週の気付き\n\n" +
                    "●来週の作業";
      sendSlackMessage(slackApp, message, threadTs);
    } else {
      Logger.log("スレッドのタイムスタンプが取得できませんでした。");
    }
  } else {
    Logger.log('スプレッドシートのデータが読み取れませんでした。');
  }
}
