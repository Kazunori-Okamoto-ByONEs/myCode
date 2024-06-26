async function doPost(e) {
  var output = ContentService.createTextOutput(JSON.stringify({ message: 'Success' }))
    .setMimeType(ContentService.MimeType.JSON);

  // オプションリクエストに対応
  if (e.parameter.method == 'OPTIONS') {
    var headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    };
    for (var key in headers) {
      output.setHeader(key, headers[key]);
    }
    return output;
  }

  try {
    // 通常のリクエストに対応
    var spreadsheetId = ''; // ここにスプレッドシートのIDを指定
    var sheet = SpreadsheetApp.openById(spreadsheetId).getActiveSheet();
    var data = JSON.parse(e.postData.contents);

    // ログを追加してデータの内容を確認
    Logger.log('Received data: ' + JSON.stringify(data));

    // データがオブジェクトであることを確認
    if (typeof data === 'object' && data !== null) {
      // 最終行の次の行にデータを追加
      var lastRow = sheet.getLastRow() + 1;
      Logger.log('Appending data to row ' + lastRow);
      Logger.log('Date: ' + new Date() + ', Title: ' + data.title + ', URL: ' + data.url);

      sheet.getRange('B' + lastRow).setValue(new Date());
      sheet.getRange('C' + lastRow).setValue(data.title);
      sheet.getRange('D' + lastRow).setValue(data.url);

      // ログをフラッシュしてデバッグ情報を保存
      Logger.flush();

      return output;
    } else {
      // データがオブジェクトでない場合のエラーハンドリング
      Logger.log('Invalid data format: data is not an object');
      return ContentService.createTextOutput(JSON.stringify({ message: 'Invalid data format' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    // エラーハンドリングとログ
    Logger.log('Error: ' + error.message);
    return ContentService.createTextOutput(JSON.stringify({ message: 'Error', details: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

