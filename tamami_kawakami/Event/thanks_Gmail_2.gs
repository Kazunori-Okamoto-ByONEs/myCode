function MainFunction() {
  //TODO 送信したいイベントの年月日を入力してください。例: yyyy/MM/dd
  //TODO 送信したいGooglePhotoのリンクを入力してください。

  var event_date_str = "";
  Logger.log("お礼メールを送りたいイベント日: " + event_date_str);

  var gphotoURL = "";
  Logger.log("お礼メールに添付するGoogle Photoリンク: " + gphotoURL);

  // スプレッドシートを開く
  var spreadsheetId = "";
  var ss = SpreadsheetApp.openById(spreadsheetId);

  //イベントのタイトルを取得
  var event_date = new Date(event_date_str);
  var gs = GetSubject(ss, event_date)
  var event_title = gs;

  //シートを開き、参加済の人へメールを送信
  ThankYouMail(ss, event_date, event_title, gphotoURL)

  Logger.log("MainFunctionを終了します。");
}

function GetSubject(ss, event_date) {
  var sheetName = "";
  var sheet = ss.getSheetByName(sheetName);

  //event_dateと同じ日のタイトルを検索
  var tablesize = GetTableSize(sheet)
  var rowCnt = tablesize.rowCnt;
  var columnCnt = tablesize.columnCnt;
  var dataRange = sheet.getRange(1, 1, rowCnt, columnCnt);
  var data = dataRange.getValues();
  for (var i = 0; i < data.length; i++) {
    var date = new Date(data[i][0]);
    if (date.getDate() === event_date.getDate() &&
        date.getMonth() === event_date.getMonth() &&
        date.getFullYear() === event_date.getFullYear()) {
      var row = i;
      break;
    } else {
        continue;
    }
  }
  Logger.log("Positive_Event_Nameシートの日付: " + date);
  Logger.log("row: " + row);
  var event_title = data[row][1];

  return event_title;
}

function GetTableSize(sheet) {
  Logger.log("GetTableSizeを開始します。");
  var rowCnt = sheet.getRange("A:A").getValues().filter(String).length;
  var columnCnt = sheet.getRange("1:1").getValues()[0].filter(String).length;
  Logger.log("(" + rowCnt + "," + columnCnt + ")" + "の表を取得しました。");

  return { rowCnt:rowCnt, columnCnt:columnCnt };
}

function ThankYouMail(ss, event_date, event_title, gphotoURL) {
  Logger.log("ThankYouMailを開始します。");
  var sheetName = "";
  var sheet = ss.getSheetByName(sheetName);
  //シートから、イベント日を取得
  var tablesize = GetTableSize(sheet)
  var rowCnt = tablesize.rowCnt;
  var columnCnt = tablesize.columnCnt;
  var dataRange = sheet.getRange(1, 1, rowCnt, columnCnt);
  var data = dataRange.getValues();

  for (var j = 0; j < columnCnt; j++) {
    var data_title = new Date(data[0][j]);
    // 日付を比較(Dateは時間単位のため、純粋な比較では一致しない)
    if (data_title.getDate() === event_date.getDate() &&
        data_title.getMonth() === event_date.getMonth() &&
        data_title.getFullYear() === event_date.getFullYear()) {
      Logger.log(data_title + "のカラムを取得します。");
      var event_column = j;
      break;
    }
    else {
      continue;
    }
  }
  Logger.log("event_column: " + event_column);

  var processedEmails = []  // 既に処理されたメールアドレスを記録する配列 

  for (var i = 0; i < rowCnt; i++) {
    var name = data[i][1];
    var email = data[i][3];
    var status = data[i][event_column];
    Logger.log("name: " + name + ", email: " + email + ", status: " + status);

    // メールアドレスが既に処理されたものであれば、スキップ
    if (processedEmails.indexOf(email) !== -1) {
      Logger.log("メールアドレスが既に処理されたものなのでスキップしました。");
      continue;
    }

    if (status == "参加済") {
      try {
        // メールアドレスの正規表現パターンを使用して、正しい形式かどうかを確認
        if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        // メールを送信する処理を実行
        SendMessageToGmail(email, event_title, name, gphotoURL)
        // 処理されたメールアドレスを記録
        processedEmails.push(email);
        } else {
          // メールアドレスが正しい形式でない場合、スキップ
          Logger.log("不正なEmail: " + email + "のため送信出来ませんでした。");
          continue;
        }
      } catch (error) {
        Logger.log("エラー: " + error);
        continue; // エラーが発生した場合もスキップ
      }
    }
    else {
      Logger.log("このイベントに参加していません。");
      continue;
    }

    // 最終連絡日を今日の日付に更新
    sheet.getRange(i + 1, 6).setValue(new Date());
  }

  Logger.log("最終連絡日を今日の日付に更新しました。");
  Logger.log("メールを" + processedEmails.length + "件、送信しました。");
}

function SendMessageToGmail(email, event_title, name, gphotoURL) {
  Logger.log("SendMessageToGmailを開始します。");

  // メールを送信する処理を実行
  var message = GenerateMessage(event_title, name, gphotoURL);
  var subject = message.subject;
  var body = message.body;

  // メールを送信
  MailApp.sendEmail({
    to: email,
    subject: subject,
    body: body
  });

  Logger.log("SendMessageToGmailを終了します。");
}

function GenerateMessage(event_title, name, gphotoURL) {
  Logger.log("GenerateMessageを開始します。");
  var subject;
  var body;

  subject = "「" + event_title + "」ご参加のお礼";
  body = name + "さん\n\n" +
        "こんにちは！\n" +
        "本日は、「" + event_title + "」に\n" +
        "ご参加頂き誠にありがとうございました。";

  Logger.log("件名\n" + subject);
  Logger.log("メッセージ内容\n" + body);
  Logger.log("GenerateMessageを終了します。");
  return { subject: subject, body: body };
}
