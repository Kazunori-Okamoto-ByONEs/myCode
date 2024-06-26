function MainFunction() {
  var today_real = new Date(); // 今日の日付を取得
  var today = new Date(today_real.getTime() + parseInt(24 * 60 * 60 * 1000)); //翌日の日付をtodayとする
  Logger.log("今日の日付: " + today);
  var Months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  // スプレッドシートのシートを開く
  var spreadsheetId = "";
  var ss = SpreadsheetApp.openById(spreadsheetId);
  var ssKES = ss.getSheetByName("");
  var ssDWS = ss.getSheetByName("");
  Logger.log("sheetをOPENしました。");

  //今日の開店時間を取得
  var sheet = ss.getSheetByName(Months[today.getMonth()]);
  var opentime = getOpenTime(sheet, today)
  Logger.log('opentime: ' + opentime);

  // リマインダー処理が完了したかどうかを示すフラグ
  var flag = false;

  //リマインドする日を検索
  var remind_list = ['0', '1', '3', '7', '14'];  
  for (var i = 0; i < remind_list.length; i++) {
    var remind_date = new Date(today.getTime() + parseInt(remind_list[i]) * 24 * 60 * 60 * 1000);
    var remind_month = remind_date.getMonth();
    var remind_day = remind_date.getDate();
    Logger.log("今日リマインドする" + remind_list[i] + "日後のイベントを検索: " + remind_day + " " + Months[remind_month]);
    var sheet = ss.getSheetByName(Months[remind_month]);
    //今日、kimidoriイベントのリマインド日かどうかを調査
    var ke_func = KimidoriEvent(sheet, ssKES, remind_day, remind_list[i])
    var contents = ke_func.kimidori_event_contents;
    var gdriveURL = ke_func.gdriveURL;
    Logger.log(contents + '\n\n' + gdriveURL);

    if (contents !== 0) {
      Logger.log('リマインドする時のメッセージ');
      SendMessageToSlack(today, opentime, contents, gdriveURL)
      flag = true;
      break;
    } else {
      Logger.log('リマインド日: ' + remind_day + ' ' + Months[remind_month] + 'にイベントはありませんでした。');
    }
  }

  if (!flag) {
    //今日が恒例行事の投稿かどうかを調査
    var sheet = ss.getSheetByName(Months[today.getMonth()]);
    var ye_func = YearEvent(sheet, today)
    var year_event = ye_func.year_event;
    var gdriveURL = ye_func.gdriveURL;
    if (year_event !== 0) {
      Logger.log("恒例行事があった時のメッセージ");
      Logger.log('opentime: ' + opentime + "\n" + year_event + '\n\n' + gdriveURL);
      SendMessageToSlack(today, opentime, year_event, gdriveURL)
      flag = true;
    } else {
      Logger.log("恒例行事はないため、曜日ごとの投稿へ移行します。");
    }
  }

  if (!flag) {
    //曜日毎に決まったジャンルの投稿を選択
    var dayOfWeek = GetDayOfWeek(today)
    Logger.log("今日は " + dayOfWeek + ".");
    var dw_func = DayofWeekFunction(ssDWS, dayOfWeek)
    var contents = dw_func.contents;
    var gdriveURL = dw_func.gdriveURL;
    Logger.log("「曜日投稿メッセージ」\n" + contents + "\n\n" + gdriveURL);
    SendMessageToSlack(today, opentime, contents, gdriveURL)
  }

}

function GetTableSize(sheet) {
  var rowCnt = sheet.getRange("A:A").getValues().filter(String).length;
  var columnCnt = sheet.getRange("1:1").getValues()[0].filter(String).length;
  Logger.log("(" + rowCnt + "," + columnCnt + ")" + "の表を取得しました。");

  return { rowCnt:rowCnt, columnCnt:columnCnt };
}

function getOpenTime(sheet, today) {
  Logger.log("getOpenTimeの関数を開始します。");
  var tablesize = GetTableSize(sheet)
  var rowCnt = tablesize.rowCnt;
  var columnCnt = tablesize.columnCnt;
  var dataRange = sheet.getRange(2, 1, rowCnt, columnCnt); // 2行目以降データを取得
  var data = dataRange.getValues();
  Logger.log((rowCnt-1) + "日分のデータを検索");

  for (var i = 0; i < rowCnt-1; i++) { //titleを除く
    var date = data[i][0];
    var open = data[i][2];
    // 日付を比較(Dateは時間単位のため、純粋な比較では一致しない)
    if (date.getDate() === today.getDate()) {
      break;
    } else {
      continue;
    }
  }

  Logger.log("getOpenTimeの関数を終了します。");
  return open;
}

function KimidoriEvent(sheet, ssKES, remind_day, remind_list) {
  Logger.log("KimidoriEventの関数を開始します。");
  var tablesize = GetTableSize(sheet)
  var rowCnt = tablesize.rowCnt;
  var columnCnt = tablesize.columnCnt;
  var dataRange = sheet.getRange(2, 1, rowCnt, columnCnt); // 2行目以降データを取得
  var data = dataRange.getValues();
  Logger.log((rowCnt-1) + "日分のデータを検索");

  for (var i = 0; i < rowCnt-1; i++) { //titleを除く
    var date = data[i][0];
    var kimidori_event = data[i][3];
    // 日付を比較(Dateは時間単位のため、純粋な比較では一致しない)
    if (date.getDate() === remind_day) {
      if (kimidori_event !== "") {
        Logger.log("日付： " + date + ", kimidoriイベント: " + kimidori_event);
        var kec = KimidoriEventContents(ssKES, kimidori_event, remind_list)
        var kimidori_event_contents = kec.contents;
        var gdriveURL = kec.gdriveURL;
        break;
      } else {
          Logger.log("日付： " + date + "\n" + "kimidoriイベントの登録はありませんでした。");
          var kimidori_event_contents = 0;
          var gdriveURL = 0;
          break;
        }
    } else {
        continue;
      }
  }

  Logger.log("KimidoriEventの関数を終了します。");
  return { kimidori_event_contents:kimidori_event_contents, gdriveURL:gdriveURL };
}

function KimidoriEventContents(sheet, kimidori_event, Num) {
  Logger.log("KimidoriEventContentsの関数を開始します。");
  var tablesize = GetTableSize(sheet)
  var rowCnt = tablesize.rowCnt;
  var columnCnt = tablesize.columnCnt;
  var dataRange = sheet.getRange(1, 1, rowCnt+1, columnCnt+1); // 全データを取得
  var data = dataRange.getValues();
  Logger.log("kimidori_event: " + kimidori_event)

  for (var j = 1; j < columnCnt+1; j++) {
    var title = data[0][j];
    Logger.log("j: " + j + ", title: " + title);
    if (title == kimidori_event) {
      Logger.log("title: "+ title + ", kimidori_event: " + kimidori_event)
      Logger.log("kimidoriイベント投稿 j:" + j);
      var column = j;
      Logger.log("kimidoriイベント投稿 Column:" + column);
      break;
    }
    else {
      continue;
    }
  }
  for (var i = 1; i < rowCnt+1; i+=3) {
    Logger.log("kimidoriイベント投稿 row:" + i + "column:" + column);
    var ago = data[i][column];
    Logger.log("ago:" + ago + ", Num:" + Num);
    if (ago == Num) {
      Logger.log("ago=Num");
      var contents = data[i+1][column];
      var gdriveURL = data[i+2][column];
      break;
    }
    else {
      var contents = 0;
      var gdriveURL = 0;
      continue;
    }
  }

  Logger.log("KimidoriEventContentsの関数を終了します。");
  return { contents:contents, gdriveURL:gdriveURL};
}

function YearEvent(sheet, today) {
  Logger.log("YearEventの関数を開始します。");
  var tablesize = GetTableSize(sheet)
  var rowCnt = tablesize.rowCnt;
  var columnCnt = tablesize.columnCnt;
  var dataRange = sheet.getRange(2, 1, rowCnt, columnCnt); // 2行目以降データを取得
  var data = dataRange.getValues();
  Logger.log((rowCnt-1) + "日分のデータを検索");

  for (var i = 0; i < rowCnt-1; i++) { //titleを除く
    var date = data[i][0];
    var open = data[i][2];
    var year_event = data[i][4];
    var gdriveURL = data[i][5];

    // 日付を比較(Dateは時間単位のため、純粋な比較では一致しない)
    if (date.getDate() === today.getDate()) {
      if (year_event !== "") {
        Logger.log("恒例行事： " + year_event);
        break;
      } else {
          Logger.log("日付： " + date + "\n" + "恒例行事の登録はありませんでした。");
          year_event = 0;
          gdriveURL = 0;
          break;
        }
    } else {
        continue;
      }
  }

  Logger.log("YearEventの関数を終了します。");
  return { open:open, year_event:year_event, gdriveURL:gdriveURL };
}

function GetDayOfWeek(today) {
  var days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var dayOfWeek = days[today.getDay()];
  return dayOfWeek;
}

function DayofWeekFunction(sheet, dayOfWeek) {
  Logger.log("DayofWeekFunctionを開始します。");
  var tablesize = GetTableSize(sheet)
  var rowCnt = tablesize.rowCnt;
  var columnCnt = tablesize.columnCnt;
  var dataRange = sheet.getRange(1, 1, rowCnt+1, columnCnt+1);
  var data = dataRange.getValues();

  for (var j = 1; j < columnCnt+1; j++) {
    var data_dayOfWeek = data[0][j];
    Logger.log("data_dayOfWeek: " + data_dayOfWeek);
    if (data_dayOfWeek === dayOfWeek) {
      Logger.log(dayOfWeek + "のカラムを取得します。");
      Logger.log("kimidoriイベント投稿 Column:" + j);
      var column = j;
      break;
    }
    else {
      continue;
    }
  }

  var allclear = false;
  for (var i = 1; i < rowCnt+1; i+=3) {
    Logger.log("row:" + i + "column:" + column);
    var cell = data[i][column];
    var contents = data[i+1][column];
    var gdriveURL = data[i+2][column];
    Logger.log("cell:" + cell);
    Logger.log("contents:" + contents);
    Logger.log("gdriveURL:" + gdriveURL);
    if (cell === "" & contents === "" & gdriveURL === "") {
      allclear = true;
      break;
    }
    else if (cell === "") {
      Logger.log("今日はこの投稿にします。");
      sheet.getRange(i+1,column+1).setValue(new Date());
      break;
    }
    else {
      continue;
    }
  }
  if (allclear) {
    Logger.log("全ての投稿を使用したので、投稿日をallclearします。");
    for (var i = 1; i < rowCnt+1; i+=3) {
      sheet.getRange(i+1,column+1).setValue("");
    }
    Logger.log("All clearしました。");
    Logger.log("これから再度曜日投稿を取得します。");
    var dwf = DayofWeekFunction(sheet, dayOfWeek)
    Logger.log("再取得が完了しました。");
    contents = dwf.contents;
    gdriveURL = dwf.gdriveURL;
  }

  Logger.log("DayofWeekFunctionを終了します。");
  return { contents:contents, gdriveURL: gdriveURL};
}

function SendMessageToSlack(today, opentime, contents, gdriveURL) {
  let token = "";
  let slackApp = SlackApp.create(token);
  let userId = "";

  // 最初の通知をSlackに送信
  var date = today.getDate();
  var month = today.getMonth()+1;
  var initialMessage = "<!channel>\n【" + month + "/" + date + "のおすすめ投稿をお知らせ】";
  Logger.log(initialMessage);
  var initialResponse = slackApp.postMessage(userId, initialMessage);
  var threadTs = initialResponse.ts;

  // 投稿内容を最初の通知先のスレッドに送信
  if (threadTs) {
    if (opentime == "定休日") {
      var goodmorning = "おはようございます！\n" +
                        "本日は、定休日です。"
    }
    else if (opentime == "臨時休業日") {
      var goodmorning = "おはようございます！\n" +
                        "本日は、臨時休業日です。"
    }
    else {
      var goodmorning = "おはようございます！\n" +
                        "本日は、" + opentime + "で営業します。"
    }
    let message = goodmorning + "\n\n" + 
                  contents
    // 投稿内容をSlackへ通知
    slackApp.postMessage(userId, message, {thread_ts: threadTs});

    // 最後の通知を最初の通知先のスレッドに送信
    let lastMessage = "【使用する写真は以下のURLを参照】\n" +
                      gdriveURL + "\n\n" +
    // 投稿内容をSlackへ通知
    slackApp.postMessage(userId, lastMessage, {thread_ts: threadTs});
    } else {
      Logger.log("スレッドのタイムスタンプが取得できませんでした。");
    }
}

