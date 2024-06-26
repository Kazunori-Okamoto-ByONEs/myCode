function MainFunction() {
  var today = new Date(); // 今日の日付を取得
  Logger.log("今日の日付: " + today);

  // スプレッドシートを開く
  var spreadsheetId = "";
  var ss = SpreadsheetApp.openById(spreadsheetId);
  //シートを開く
  var sheetName = "";
  var sheet = ss.getSheetByName(sheetName);
  Logger.log("sheetをOPENしました。");
  //シートから、イベント日を取得
  var ged = GetEventDate(sheet)
  var fromcolumn = ged.fromcolumn;
  var rowCnt = ged.rowCnt
  var columnCnt = ged.columnCnt;
  Logger.log("fromcolumn: " + fromcolumn + ", rowCnt: " + rowCnt + ", columnCnt: " + columnCnt);

  //リマインド日が今日かどうかを調査
  Logger.log("リマインド日=今日の調査");
  var remind_list = ['0', '1', '3', '7', '14', '30']; 
  var processedEmails = []; // 既に処理されたメールアドレスを記録する配列 
  for (var j = fromcolumn; j < columnCnt; j++) {
    Logger.log("j: " + j);
    for (var i = 0; i < remind_list.length; i++) {
      Logger.log("i: " + i + ", remind list: " + remind_list[i]);
      var rc = ReminderConditions(sheet, j, remind_list[i], today)
      var event_date = rc.event_date;
      if (rc.remind_flag == 1) {
        Logger.log("今日はリマインド日です。");
        var gs = GetSubject(ss, event_date)
        var eventName = gs.eventName;
        var eventDateTime = gs.eventDateTime;
        var getDate = gs.getDate;
        var getMonth = gs.getMonth;
        var gea = GetEmailAddress(sheet, today, rowCnt, columnCnt, j, event_date, remind_list[i], eventName, eventDateTime, getDate, getMonth, processedEmails)
        processedEmails = gea;
        Logger.log("processedEmails: " + processedEmails);
        break;
      }
      else if (rc.remind_flag == 0) {
        Logger.log("今日はリマインド日ではありません。");
        continue;
      }
    }
  }

  Logger.log("MainFunctionを終了します。");
}

function GetTableSize(sheet) {
  Logger.log("GetTableSizeを開始します。");
  var rowCnt = sheet.getRange("A:A").getValues().filter(String).length;
  var columnCnt = sheet.getRange("1:1").getValues()[0].filter(String).length;
  Logger.log("(" + rowCnt + "," + columnCnt + ")" + "の表を取得しました。");

  return { rowCnt:rowCnt, columnCnt:columnCnt };
}

function isDate(cell) {
  Logger.log("isDateを開始します。");
  return Object.prototype.toString.call(cell) === '[object Date]' && !isNaN(cell);
}

function GetEventDate(sheet) {
  Logger.log("GetEventDateを開始します。");
  var tablesize = GetTableSize(sheet)
  var rowCnt = tablesize.rowCnt;
  var columnCnt = tablesize.columnCnt;
  var dataRange = sheet.getRange(1, 1, rowCnt+1, columnCnt+1);
  var data = dataRange.getValues();

  var fromcolumn; //列のインデックスを格納する変数

  for (var j = 0; j < columnCnt+1; j++) {
    var data_title = data[0][j];
    if (isDate(data_title)) {
      Logger.log(data_title + "のカラムを取得します。");
      Logger.log("イベント日が入っているのは、" + j + "番目のカラムから");
      fromcolumn = j;
      break;
    }
    else {
      continue;
    }
  }

  return { fromcolumn:fromcolumn, rowCnt:rowCnt, columnCnt:columnCnt };
}

function ReminderConditions(sheet, j, num, today) {
  Logger.log("ReminderConditionsを開始します。");
  var dataRange = sheet.getRange(1, j+1, 1, 1);
  var event_date = dataRange.getValues()[0][0];
  Logger.log("event_date: " + event_date);
  var remind = new Date(event_date.getTime() - num * (24 * 60 * 60 * 1000));
  Logger.log("リマインドをする日付: " + remind);

  var remind_flag = 0;

  // 日付を比較(Dateは時間単位のため、純粋な比較では一致しない)
  if (remind.getDate() === today.getDate() &&
      remind.getMonth() === today.getMonth() &&
      remind.getFullYear() === today.getFullYear()) {
    Logger.log("今日はイベントの" + num + "日前です！");
    remind_flag = 1;
    Logger.log("remind_flag: " + remind_flag);
    return { remind_flag:remind_flag, event_date:event_date };
  }
  else {
    Logger.log("remind_flag: " + remind_flag);
    return { remind_flag:remind_flag, event_date:event_date };
  }
}

function GetEmailAddress(sheet, today, rowCnt, columnCnt, jcolumn, event_date, number, eventName, eventDateTime, getDate, getMonth, processedEmails) {
  Logger.log("GetEmailAddressを開始します。");
  Logger.log("メーリングリストには" + rowCnt + "件データが入っています。");
  var dataRange = sheet.getRange(2, 1, rowCnt-1, columnCnt); // 2行目からデータを取得
  var data = dataRange.getValues();

  for (var i = 0; i < data.length; i++) {
    Logger.log("processedEmails: " + processedEmails);
    var id = data[i][0];
    var name = data[i][1];
    var birthday = data[i][2];
    var email = data[i][3];
    var event = data[i][4];
    var lastContactDate = data[i][5];
    var status = data[i][jcolumn];
    Logger.log("ID: " + id + ", Name: " + name + ", birthday: " + birthday + ", Email: " + email+ ", Event: " + event + ", LastContactDate: " + lastContactDate + ", Status: " + status);

    Logger.log("processedEmails.indexOf(email): " + processedEmails.indexOf(email));

    // 最終連絡日が空欄なら次の処理を、今日であれば、スキップ
    if (lastContactDate === "") {
      //何もしない
    }
    else if (Object.prototype.toString.call(lastContactDate) === '[object Date]') {
      lastContactDate = new Date(lastContactDate); // 文字列からDateオブジェクトに変換
      if (lastContactDate.getDate() === today.getDate() &&
          lastContactDate.getMonth() === today.getMonth() &&
          lastContactDate.getFullYear() === today.getFullYear()) {
        Logger.log("最終連絡日が今日なのでスキップしました。");
        continue;
      }
    }
    else {
      Logger.log("最終連絡日の形式が正しくありません。");
      continue;
    }

    // メールアドレスが既に処理されたものであれば、スキップ
    if (processedEmails.indexOf(email) !== -1) {
      Logger.log("メールアドレスが既に処理されたものなのでスキップしました。");
      continue;
    }

    // 不参加と記載がある場合スキップする
    if (status === "不参加") {
      Logger.log("不参加のためスキップしました。");
      continue;
    }

    try {
      // メールアドレスの正規表現パターンを使用して、正しい形式かどうかを確認
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        // メールを送信する処理を実行
        SendMessageToGmail(event_date, status, number, name, email, eventName, eventDateTime, getDate, getMonth)
        // 処理されたメールアドレスを記録
        processedEmails.push(email);
        Logger.log("メールを送信しました。");
      } else {
        // メールアドレスが正しい形式でない場合、スキップ
        Logger.log("不正なEmail: " + email + "のため送信出来ませんでした。");
        continue;
      }
    } catch (error) {
      Logger.log("エラー: " + error);
      continue; // エラーが発生した場合もスキップ
    }
  
  // 最終連絡日を今日の日付に更新
  sheet.getRange(i + 2, 6).setValue(new Date());
  }
  Logger.log("最終連絡日を今日の日付に更新しました。");
  Logger.log("メールを" + processedEmails.length + "件、送信しました。");
  return processedEmails;
}

function GetSubject(ss, event_date) {
  var sheetName = "";
  var sheet = ss.getSheetByName(sheetName);

  // A列のIDが入っている個数をカウントして、その行を取得する
  var tablesize = GetTableSize(sheet)
  var rowCnt = tablesize.rowCnt;
  var columnCnt = tablesize.columnCnt;
  var dataRange = sheet.getRange(1, 1, rowCnt, columnCnt);
  var data = dataRange.getValues();
  for (var i = 0; i < data.length; i++) {
    var date = data[i][0];
    if (date.getDate() == event_date.getDate() &&
        date.getMonth() == event_date.getMonth() &&
        date.getFullYear() == event_date.getFullYear()) {
      var row = i;
      break;
    } else {
        continue;
    }
  }
  Logger.log("シートの日付: " + date);
  Logger.log("row: " + row);
  var eventName = data[row][1];
  var eventDateTime = data[row][2];
  var getDate = event_date.getDate();
  var getMonth = event_date.getMonth()+1;
  return { eventName:eventName, eventDateTime:eventDateTime, getDate:getDate, getMonth:getMonth };
}

function GenerateMessage(status, number, name, eventName, eventDateTime, getDate, getMonth) {
  Logger.log("GenerateMessageを開始します。");
  var subject;
  var body;
  Logger.log("eventName: " + eventName + "eventDateTime: " + eventDateTime);

  if (status == "参加") {
    Logger.log("参加");
    if (number == 30) {
      Logger.log("number: " + number);
      subject = "「" + eventName + "」の1ヶ月前のご連絡です！";
      body = name + "さん\n\n" +
            "こんにちは！"
    }
    else if (number == 14) {
      subject = "「" + eventName + "」の2週間前のご連絡です！";
      body = name + "さん\n\n" +
            "こんにちは！"
    }
    else if (number == 7) {
      subject = "「" + eventName + "」が1週間後に開催いたします！";
      body = name + "さん\n\n" +
            "こんにちは！"
    }
    else if (number == 3) {
      subject = "「" + eventName + "」" + number + "日前のご連絡です！";
      body = name + "さん\n\n" +
            "こんにちは！"
    }
    else if (number == 1) {
      subject = "「" + eventName + "」前日のご連絡です！";
      body = name + "さん\n\n" +
            "こんにちは！"
    }
    else if (number == 0) {
      subject = "「" + eventName + "」の開催当日";
        body = name + "さん\n\n" +
            "こんにちは！"
    } else{
        Logger.log("条件に一致しなかったため、NULLを返します。");
        return null;
    }
  }
  else if (status === "") {
    if (number == 30) {
      subject = "「" + eventName + "」を1ヶ月後に開催いたします！";
      body = name + "さん\n\n" +
            "こんにちは！"
    }
    else if (number == 14) {
      subject = "「" + eventName + "」開催まで2週間となりました！";
      body = name + "さん\n\n" +
            "こんにちは！"
    }
    else if (number == 7) {
      subject = "「" + eventName + "」が1週間後に開催いたします！";
      body = name + "さん\n\n" +
            "こんにちは！"
    } else{
        Logger.log("条件に一致しなかったため、NULLを返します。");
        return null;
    }
  } else {
      Logger.log("ID: " + id + ", Name: " + name + ", Email: " + email);
      Logger.log("意図しないstatus設定のため、NULLを返します。");
      return null;
  }

  Logger.log("GenerateMessageを終了します。");
  return { subject: subject, body: body };
}

function SendMessageToGmail(event_date, status, number, name, email, eventName, eventDateTime, getDate, getMonth) {
  Logger.log("SendMessageToGmailを開始します。");
  Logger.log("イベントの日付: " + event_date);

  // メールを送信する処理を実行
  var reminder = GenerateMessage(status, number, name, eventName, eventDateTime, getDate, getMonth);
  var subject = reminder.subject;
  var body = reminder.body;

  // メールを送信
  MailApp.sendEmail({
    to: email,
    subject: subject,
    body: body
  });

  Logger.log("メール送信関数を通過しました。");
}
