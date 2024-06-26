(async () => {
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async function follow(followButton, myFollowedCount) {
        followButton.click();
        myFollowedCount++;
        console.log('myFollowedCount:', myFollowedCount);
        return myFollowedCount;
    }

    function followerAndfollowCondition(followButton) {
      const ariaLabel = followButton.getAttribute('aria-label');
      if (ariaLabel && /フォロー @\w+/.test(ariaLabel)) {
          console.log('フォローしているユーザー');
          return true;
      } else {
        console.log('フォローしていないユーザー');
        return false;
      }
    }

    // プロモーションのチェック
    function promotionalCheck(tweet) {
        const promotionText = 'プロモーション';
        const spans = tweet.querySelectorAll('span');
        for (let span of spans) {
            if (span.textContent === promotionText) {
                console.log('プロモーション投稿をスキップします。');
                const randomTimeout = Math.floor(Math.random() * (4000 - 3000 + 1)) + 3000; // 3-4秒のランダムな時間
                sleep(randomTimeout); // ランダムな時間待つ
                return true;
            }
        }
        return false;
    }

    // Function to scroll a specified number of lines
    async function scrollLines(lines) {
        return new Promise((resolve, reject) => {
            let linesScrolled = 0;
            let distance = 20; // Adjust as needed
            let timer = setInterval(() => {
                window.scrollBy(0, distance);
                linesScrolled++;
                if (linesScrolled >= lines) {
                    clearInterval(timer);
                    resolve();
                }
            }, 100); // Adjust scroll speed if needed
        });
    }

    async function toURL(tweet) {
        // リンク先のURLを取得
        const link = tweet.querySelector('a[href]');
        console.log('link', link);
        const href = link.getAttribute('href');
        console.log('href', href);
        // 絶対URLに変換
        const absoluteURL = new URL(href, window.location.origin);
        console.log('absoluteURL', absoluteURL.href);
        // 新しいタブを開く
        const newWindow = window.open(absoluteURL.href);
        console.log('新しいページをタブで開く');
        // 新しいウィンドウが開かれたかどうかを確認
        await sleep(5000);
        console.log('新しいウィンドウが開くまで5秒待っています。');
        if (newWindow && !newWindow.closed) {
            console.log('新しいウィンドウを開きました。');
            return newWindow;
        } else {
            console.log('新しいウィンドウが開けませんでした。');
            return false;
        }
    }

   // Function to follow a user in a new tab
    async function followInNewTab(newWindow, followButtonSelector, myFollowedCount) {
        console.log('followInNewTabの処理を開始します。');
        return new Promise((resolve, reject) => {
            const interval = setInterval(async () => {
              try{
                console.log('新しいウィンドウの処理を開始します。');
                // 正規表現でdata-testidが"unfollow"を含む最初のボタンを取得
                const unfollowButton = newWindow.document.querySelector(`${followButtonSelector}[data-testid*="unfollow"]`);
                console.log('unfollowButton', unfollowButton);
                // 正規表現でdata-testidが"follow"を含む最初のボタンを取得
                const followButton = newWindow.document.querySelector(`${followButtonSelector}[data-testid*="follow"]`);
                console.log('followButton', followButton);
                if (unfollowButton) {
                    console.log('unfollowButtonが入りました。');
                    clearInterval(interval);
                    const randomTimeout = Math.floor(Math.random() * (5000 - 2000 + 1)) + 2000; // 0.2-0.5秒のランダムな時間
                    await sleep(randomTimeout); // ランダムな時間待つ
                    newWindow.close();
                    resolve(myFollowedCount);
                    return;
                }
                else if (followButton) {
                    console.log('followButtonが入りました。');
                    myFollowedCount = await follow(followButton, myFollowedCount);
                    console.log('follow関数が戻りました。');
                    clearInterval(interval);
                    const randomTimeout = Math.floor(Math.random() * (60000 - 40000 + 1)) + 40000; // 40-60秒のランダムな時間
                    await sleep(randomTimeout); // ランダムな時間待つ
                    newWindow.close();
                    resolve(myFollowedCount);
                    return;
                } else {
                    clearInterval(interval);
                    newWindow.close();
                    resolve(myFollowedCount);
                    console.log('followButtonが見つかりませんでした。');
                }
              } catch (error) {
                    clearInterval(interval);
                    console.error('新しいウィンドウ内でエラーが発生しました:', error);
                    newWindow.close();
                    reject(error);
              }
            }, 1000);
        });
    }

    async function processTweets(index, tweets, myFollowedCount) {
        const followButtonSelector = 'button[data-testid]';
        console.log('processTweetsを開始します。');
        let newTweets = Array.from(document.querySelectorAll('article')); // 最新のarticle要素を配列に変換して取得
        newTweets.forEach(newTweet => {
            if (!tweets.includes(newTweet)) {
                tweets.push(newTweet); // 既存のtweets配列に追加
            }
        });
        console.log('index:', index);
        console.log('articleの個数:', tweets.length);
        if (myFollowedCount >= 20) {
            console.log('myFollowedCountが20を超えたので終了します。');
            return;
        } else {
          console.log('フォローした総数:', myFollowedCount);
        }
        if (index >= tweets.length) {
            console.log('indexはtweets.lengthを超えました。');
            return;
        } else {
          console.log('indexはtweets.lengthをまだ超えていません。');
        }
        // Process each tweet one by one
        if (!promotionalCheck(tweets[index])) {
          newWindow = await toURL(tweets[index]);
          console.log('newWindowから、mainに戻りました。');
          if (newWindow) {
            console.log('newWindowはtrueです。');
            // 新しいウィンドウでの処理を行う
              myFollowedCount = await followInNewTab(newWindow, followButtonSelector, myFollowedCount);
              console.log('myFollowedCountが戻りました。');
            }
            await scrollLines(35);
            console.log('スクロールが完了しました。');
        }
        await processTweets(index + 1, tweets, myFollowedCount);
    }

    // NodeListのtweetsは直接pushメソッドを使用できないため、配列に変換
    let initialTweets = Array.from(document.querySelectorAll('article'));
    let myFollowedCount = 0;
    processTweets(0, initialTweets, myFollowedCount);
})();

