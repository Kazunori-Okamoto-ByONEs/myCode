function formatDateMMDD(daysAgo) {
    const TODAY = new Date();
    var date = new Date(TODAY);
    date.setDate(date.getDate() - daysAgo);
    var month = ('0' + (date.getMonth() + 1)).slice(-2);
    var day = ('0' + date.getDate()).slice(-2);
    return month + '/' + day;
}

function SendMessageToSlack(slackApp, threadTs) {
  var start_date = formatDateMMDD(11);
  var end_date = formatDateMMDD(5);
  let text = "https://xxxxxx\n" + "へアクセスし、\n" +
             start_date + "～" + end_date + "の投稿から、データを取得し\n" +
              "今日の昼12:00までに、以下のシートに追加してください。\n\n" +
             "https://docs.google.com/spreadsheets/d/xxxxx\n\n" +
             "PCを使用し、以下のコードをコンソールにコピペすると、データ取得が簡単です。";
  slackApp.postMessage(USER_ID, text, {thread_ts: threadTs});

  let text2 = X_FETCH_DATA_OF_POSTS;
  slackApp.postMessage(USER_ID, text2, {thread_ts: threadTs});

}

function preNotification() {
    let slackApp = SlackApp.create(TOKEN);
    var initialMessage = `@週報担当者\n【X週報事前通知】\n`;
    Logger.log(initialMessage);

    // 最初の通知をSlackに送信
    var initialResponse = slackApp.postMessage(USER_ID, initialMessage);
    var threadTs = initialResponse.ts;

    if (threadTs) {
        // Slackへ通知
        SendMessageToSlack(slackApp, threadTs);
    } else {
      Logger.log("スレッドのタイムスタンプが取得できませんでした。");
    }
}
