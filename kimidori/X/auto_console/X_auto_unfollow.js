(async () => {
    // Parameters
    const COUNT_OF_UNFOLLOWED = 3;
    const SCROLL_LINES = 5;
    const SCROLL_SPEED = 100;
    const MIN_TIMEOUT = 4000;
    const MAX_TIMEOUT = 6000;
    const FOLLOWER_TEXT = 'フォローされています';
    const CONTINUOUS_FOLLOWER_COUNT = 3;

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function getRandomTimeout(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    async function getnewcellInnerDivs(cellInnerDivs) {
        let newcellInnerDivs = Array.from(document.querySelectorAll('div[data-testid="cellInnerDiv"]'));
        newcellInnerDivs.forEach(cellInnerDiv => {
            if (!cellInnerDivs.includes(cellInnerDiv)) {
                cellInnerDivs.push(cellInnerDiv);
            }
        });
      return cellInnerDivs;
    }

    async function findFollower(cellInnerDiv) {
        try {
            if (!cellInnerDiv) {
                throw new Error('cellInnerDivが見つかりませんでした。');
            }
            const spans = cellInnerDiv.querySelectorAll('span');
            if (!spans) {
                throw new Error('spans要素が見つかりませんでした。');
            }
            for (let span of spans) {
                if (span.textContent === FOLLOWER_TEXT) {
                    console.log('フォロワーを見つけました。');
                    return true;
                }
            }
        } catch (e) {
            console.error('フォロワーチェック中にエラーが発生しました:', e);
            return false;
        }
        return false;
    }

    async function processFollows(index, cellInnerDivs, followerCount) {
        cellInnerDivs = await getnewcellInnerDivs(cellInnerDivs)
        cellInnerDivs[index].scrollIntoView();
        console.log('index:', index +1);
        console.log('フォロー済アカウントの個数:', cellInnerDivs.length);

        if (index >= cellInnerDivs.length -1) { //lengthは配列数を取得するため、indexよりも1多くなるため-1で調整
            console.log('indexは', cellInnerDivs.length, 'を超えました。');
            console.log('Now Loading...');
            await sleep(2000);
            cellInnerDivs = await getnewcellInnerDivs(cellInnerDivs)
            if (index >= cellInnerDivs.length -1) {
                console.log('indexは', cellInnerDivs.length, 'を超えました。');
                return false;
            } else {
                console.log('indexは', cellInnerDivs.length, 'をまだ超えていません。');
            }
        } else {
            console.log('indexは', cellInnerDivs.length, 'をまだ超えていません。');
        }

        if (await findFollower(cellInnerDivs[index])) {
          followerCount++;
          console.log('フォロワーアカウントは', followerCount, '件連続で出現しています。');
          if (followerCount >= CONTINUOUS_FOLLOWER_COUNT) {
              console.log('フォロワーアカウントは指定の連続回数出現しました。');
              console.log('次の処理に移行します。');
              return true;
          }
        } else {
          followerCount = 0;
          console.log('フォロワーアカウントの連続出現数を0にリセットします。');
        }

        return await processFollows(index + 1, cellInnerDivs, followerCount);
    }

    async function upScrollLines(lines) {
        return new Promise((resolve) => {
            let linesScrolled = 0;
            const distance = 20;
            const timer = setInterval(() => {
                window.scrollBy(0, -distance);
                linesScrolled++;
                if (linesScrolled >= lines) {
                    clearInterval(timer);
                    resolve();
                }
            }, SCROLL_SPEED);
        });
    }

    async function unFollow(cellInnerDiv) {
        try {
            if (!cellInnerDiv) {
                throw new Error('cellInnerDivが見つかりませんでした。');
            }
            const buttons = cellInnerDiv.querySelectorAll('button');
            if (!buttons) {
                throw new Error('buttons要素が見つかりませんでした。');
            }
            for (let button of buttons) {
                const ariaLabel = button.getAttribute('aria-label');
                if (ariaLabel && /フォロー中 @\w+/.test(ariaLabel)) {
                    console.log('フォロー返しがない、フォロー中のアカウントを見つけました。');
                    button.click();
                    await sleep(10000);
                    console.log('10秒待機');
                    return true;
                }
            }
        } catch (e) {
            console.error('フォロー外しのチェック中にエラーが発生しました:', e);
            return false;
        }
        return false;
    }

    async function processUnFollows(index, cellInnerDivs, unfollowedCount) {
        if (unfollowedCount >= COUNT_OF_UNFOLLOWED) {
            console.log('フォロー外しが', COUNT_OF_UNFOLLOWED, 'を超えたので終了します。');
            return;
        } else {
          console.log('フォローを外した数:', unfollowedCount);
        }

        cellInnerDivs = await getnewcellInnerDivs(cellInnerDivs);
        cellInnerDivs.reverse();
        await cellInnerDivs[index].scrollIntoView();
        cellInnerDivs.reverse();
        await sleep(200);
        console.log('index:', index +1);
        console.log('cellInnerDiv', cellInnerDivs[index]);

        if (index >= cellInnerDivs.length -1) { //lengthは配列数を取得するため、indexよりも1多くなるため-1で調整
            console.log('indexは', cellInnerDivs.length, 'を超えました。');
            console.log('Now Loading...');
            await sleep(2000);
            cellInnerDivs = await getnewcellInnerDivs(cellInnerDivs)
            if (index >= cellInnerDivs.length -1) {
                console.log('indexは', cellInnerDivs.length, 'を超えました。');
                return false;
            } else {
                console.log('indexは', cellInnerDivs.length, 'をまだ超えていません。');
            }
        } else {
            console.log('indexは', cellInnerDivs.length, 'をまだ超えていません。');
        }

        if (!await findFollower(cellInnerDivs[index])) {
            console.log('フォロワーではありません。探索を終了します。');
            return;
            if (await unFollow(cellInnerDivs[index])) {
              unfollowedCount++;
              await getRandomTimeout(MIN_TIMEOUT, MAX_TIMEOUT);
              console.log('ランダム待機');
              await upScrollLines(SCROLL_LINES);
            }
        } else {
          console.log('フォローを外しません。');
          await sleep(2000);
          console.log('2秒待機');
        }

        await processUnFollows(index +1, cellInnerDivs, unfollowedCount);
    }

    let initialcellInnerDivs = Array.from(document.querySelectorAll('div[data-testid="cellInnerDiv"]'));
    let followerCount = 0;
    let processFollowsResult = await processFollows(0, initialcellInnerDivs, followerCount);

    let unfollowedCount = 0;
    if (processFollowsResult) {
      let initialcellInnerDivs = Array.from(document.querySelectorAll('div[data-testid="cellInnerDiv"]'));
      await processUnFollows(0, initialcellInnerDivs, unfollowedCount)
    } else {
      console.log('processFollowsResultがfalseだったので処理を終了します。');
    }

    console.log('全ての処理を終了します。');
})();
