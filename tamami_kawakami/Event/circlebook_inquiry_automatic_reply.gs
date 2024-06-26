// メールアドレスの検索と返信の処理
function processEmails() {
  var threads = GmailApp.search('from:noreply@circle-book.com');
  threads.forEach(function(thread) {
    var messages = thread.getMessages();
    messages.forEach(function(message) {
      if (shouldProcessMessage(message)) {
        processMessage(message);
      }
    });
  });
}

// メールの処理対象かどうかを確認する関数
function shouldProcessMessage(message) {
  return message.isUnread() && !message.isStarred();
}

// メールの処理を行う関数
function processMessage(message) {
  var emailBody = message.getPlainBody();
  //var subject = message.getSubject(); //件名は新規作成するため削除
  
  if (emailBody.includes("料理")) {
    var replyMessage = generatePositiveReply();
    var subjectPositive = "料理教室";
    sendReply(message, subjectPositive, replyMessage);
  } else if (emailBody.includes("イベント") && emailBody.includes("サークルブック")) {
    var replyMessage = generateCookingReply();
    var subjectCookingLabo = "イベント";
    sendReply(message, subjectCookingLabo, replyMessage);
  }
  // メールを処理した後、既読にしてスターを付ける
  message.markRead();
  message.star();
}

// 返信メールを送信する関数
function sendReply(message, subject, replyMessage) {
  var extractedEmails = extractEmail(message.getPlainBody());
  var extractedName = extractName(message.getPlainBody());
  
  if (extractedEmails) {
    var replySubject = "【サークルブック】" + subject + "のご応募ありがとうございます！";
    var replyBody = (extractedName ? extractedName + "さん\n" : "") + replyMessage;
    sendEmail(extractedEmails, replySubject, replyBody);
  } else {
    Logger.log("メールアドレスが見つかりませんでした。");
  }
}

// メールアドレスを抽出する関数
function extractEmail(text) {
  var emailPattern = /メールアドレス：([\w\.-]+@[\w\.-]+)/;
  var match = text.match(emailPattern);
  return match ? match[1] : null;
}

// 名前を抽出する関数
function extractName(text) {
  var namePattern = /名前：([^\s]+)/;
  var match = text.match(namePattern);
  return match ? match[1] : null;
}

// メールを送信する関数
function sendEmail(toEmail, subject, body) {
  // 送信元のメールアドレス
  var fromEmail = "xxxx@gmail.com";
  
  // メールを作成
  var email = {
    to: toEmail,
    subject: subject,
    body: body,
    from: fromEmail
  };

  // メール送信
  GmailApp.sendEmail(email.to, email.subject, email.body, email.fromEmail);
}

// 返信メッセージを生成する関数
function generatePositiveReply() {
  var replyMessage = "ご応募頂きましてありがとうございます！"
  return replyMessage;
}

function generateCookingReply() {
  var replyMessage = "ご応募頂きましてありがとうございます！\n" +
                     "料理教室です。"
  return replyMessage;
}

