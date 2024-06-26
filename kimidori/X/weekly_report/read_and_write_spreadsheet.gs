var start_date = new Date(TODAY);
start_date.setDate(start_date.getDate() - 11);
start_date.setHours(0, 0, 0, 0);
Logger.log('start_date: ' + start_date);
var end_date = new Date(TODAY);
end_date.setDate(end_date.getDate() - 5);
end_date.setHours(0, 0, 0, 0);
Logger.log('end_date: ' + end_date);

function readAndCalculateData(spreadsheetId, sheetName) {
  var sheet = SpreadsheetApp.openById(spreadsheetId).getSheetByName(sheetName);
    
  // 取得したいデータ範囲を確定させる
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const dateColumnIndex = headers.indexOf("日時");
  const lastRow = sheet.getLastRow();

  for (var i = 0; i < lastRow; i++) {
    var dateValue = sheet.getRange(lastRow - i, dateColumnIndex + 1).getValue();
    var date = new Date(dateValue);
    date.setHours(0, 0, 0, 0);
    if (start_date <= date && date <= end_date) {
      continue;
    }
    else if (end_date < date) {
      continue;
    } else {
      var startRow = lastRow - i + 1;
      Logger.log('startRow: ' +startRow);
      break;
    }
  }

  // データを取得する範囲を指定
  var dataRange = sheet.getRange(startRow, 1, lastRow - startRow + 1, sheet.getLastColumn());
  var values = dataRange.getValues();

  // 出力用のデータを初期化
  var outputData = [];
  var postNum = [];

  for (var i = 0; i < values.length; i++) {
    var row = values[i];
    var date = new Date(row[dateColumnIndex]);
    date.setHours(0, 0, 0, 0);

    var existingRow = outputData.find(r => {
      var existingDate = new Date(r[dateColumnIndex]);
      existingDate.setHours(0, 0, 0, 0);
      return existingDate.getTime() === date.getTime();
    });

    if (existingRow) {
      for (var j = 6; j < row.length; j++) {
        existingRow[j] += row[j];
      }
      var index = outputData.indexOf(existingRow);
      postNum[index] += 1;
    } else {
      outputData.push(Array.from(row));
      postNum.push(1);
    }
  }

  for (var k = 0; k < outputData.length; k++) {
    outputData[k].unshift(postNum[k]);
  }

  // 指定日付範囲のすべての日付を確認し、データが欠けている日付を補完
  for (var d = new Date(start_date); d <= end_date; d.setDate(d.getDate() + 1)) {
    d.setHours(0, 0, 0, 0);
    var exists = outputData.some(row => {
      var existingDate = new Date(row[dateColumnIndex+1]);
      existingDate.setHours(0, 0, 0, 0);
      return existingDate.getTime() === d.getTime();
    });
    if (!exists) {
      var emptyRow = new Array(sheet.getLastColumn()+1).fill(0);
      emptyRow[dateColumnIndex+1] = new Date(d);
      emptyRow[dateColumnIndex+2] = new Date(TODAY);
      outputData.push(emptyRow);
    }
  }

  // 日付の昇順でソート
  outputData.sort((a, b) => {
    var dateA = new Date(a[dateColumnIndex+1]);
    var dateB = new Date(b[dateColumnIndex+1]);
    return dateA - dateB;
  });

Logger.log('outputData: ' + JSON.stringify(outputData));

  // 出力データのフォーマット調整
  for (var k = 0; k < outputData.length; k++) {
    outputData[k] = outputData[k].slice(0, 1).concat(outputData[k].slice(7));
  }

  Logger.log('outputData: ' + JSON.stringify(outputData));
  return outputData;
}

function copyDataToWeeklyReport1(targetSheetId, targetSheetName, postData) {
  try {
    const targetSheet = SpreadsheetApp.openById(targetSheetId).getSheetByName(targetSheetName);

    const postDateColumn = targetSheet.getRange('B3:B9');
    const dates = [];
    for (var d = new Date(start_date); d <= end_date; d.setDate(d.getDate() + 1)) {
      dates.push([Utilities.formatDate(d, Session.getScriptTimeZone(), 'MM/dd')]);
    }
    postDateColumn.setValues(dates);

    const todayColumn = targetSheet.getRange('C3:C9');
    const todayValues = Array(7).fill([Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'MM/dd')]);
    todayColumn.setValues(todayValues);

    const targetRange = targetSheet.getRange('E3:J9');
    targetRange.setValues(postData);

  } catch (e) {
    Logger.log('Error copying data: ' + e.message);
  }
}

function read_and_write_spreadsheet() {
  var outputData = readAndCalculateData(X_ANALYSIS_SHEET, X_ANALYSIS_SHEET_NAME);

  copyDataToWeeklyReport1(X_OPERATION, WEEKLY_REPORT1, outputData);
}

