function MainFunction() {
  let token = "";
  let userId = "";
  let slackApp = SlackApp.create(token);

  var today = new Date(); // 今日の日付を取得
  Logger.log("今日の日付: " + today);

  // スプレッドシートのシートを開く
  var spreadsheetId = "";
  var ss = SpreadsheetApp.openById(spreadsheetId);
  var ssBandN = ss.getSheetByName("");
  Logger.log("sheetをOPENしました。");

  // シートに今日の日付があることを確認
  var gD = getDate(ssBandN, today);
  var row_date = gD.row_date;
  var data = gD.data;

  // 今日の日付があれば、titleとURLを取得し、メッセージを作成
  if (row_date.length > 0) {
    var initialMessage = "<!channel>\n【HP更新通知】\n";
    Logger.log(initialMessage);
    
    // 最初の通知をSlackに送信
    var initialResponse = slackApp.postMessage(userId, initialMessage);
    var threadTs = initialResponse.ts;

    var detailedMessage = "";
    if (threadTs) {
      for (var i = 0; i < row_date.length; i++) {
        var title = data[row_date[i]][2];
        var url = data[row_date[i]][3];
        Logger.log('title: ' + title + "\n" + 'URL: ' + url);
        detailedMessage += title + '\n' + url + '\n\n';
      }
      Logger.log(detailedMessage);
      // Slackへ通知
      SendMessageToSlack(slackApp, userId, threadTs, detailedMessage);
    } else {
      Logger.log("スレッドのタイムスタンプが取得できませんでした。");
    }
  } else {
    Logger.log("今日の日付はなかったため、処理を終了します。");
  }
}

function GetTableSize(sheet) {
  var rowCnt = sheet.getRange("B:B").getValues().filter(String).length;
  var columnCnt = sheet.getRange("1:1").getValues()[0].filter(String).length;
  Logger.log("(" + rowCnt + "," + columnCnt + ")" + "の表を取得しました。");

  return { rowCnt:rowCnt, columnCnt:columnCnt };
}

function getDate(sheet, today) {
  Logger.log("getDateの関数を開始します。");
  var tablesize = GetTableSize(sheet)
  var rowCnt = tablesize.rowCnt;
  var columnCnt = tablesize.columnCnt;
  var dataRange = sheet.getRange(1, 1, rowCnt, columnCnt);
  var data = dataRange.getValues();

  var row_date = [];
  for (var i = 0; i < rowCnt; i++) {
    var date = new Date(data[i][1]);
    // 日付を比較(Dateは時間単位のため、純粋な比較では一致しない)
    if (date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getYear() === today.getYear()) {
      row_date.push(i);
    } else {
        continue;
      }
  }

  Logger.log("getDateの関数を終了します。");
  return { row_date:row_date, data:data };
}

function SendMessageToSlack(slackApp, userId, threadTs, message) {
  let text = "昨日、HPのNewsまたはブログが更新されたため、お知らせします。\n\n" +
             message;

  slackApp.postMessage(userId, text, {thread_ts: threadTs});
}

