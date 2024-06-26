function copyData() {
  var spreadsheetId = X_OPERATION; // スプレッドシートのID
  var sheetName = WEEKLY_REPORT1; // シート名

  Logger.log("スプレッドシートとシートを取得");
  var sheet = SpreadsheetApp.openById(spreadsheetId).getSheetByName(sheetName);

  Logger.log("B3~J9の範囲のデータを取得してB19~J25にコピー");
  var sourceRange1 = sheet.getRange('B3:J9');
  var targetRange1 = sheet.getRange('B19:J25');
  sourceRange1.copyTo(targetRange1);

  Logger.log("C10のデータをC26にコピー");
  var sourceRange2 = sheet.getRange('C10');
  var targetRange2 = sheet.getRange('C26');
  sourceRange2.copyTo(targetRange2);
}

