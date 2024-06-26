(async () => {
    // Parameters
    const COUNT_OF_LIKE = 100;
    const SCROLL_LINES = 25;
    const MIN_TIMEOUT = 40000;
    const MAX_TIMEOUT = 60000;
    const MIN_LIKE_COUNT = 0;
    const MAX_LIKE_COUNT = 200;
    const PROMOTION_TEXT = '広告';
    const LIKED_COUNT_TEXT = /いいね！\d+件/;
    const SCROLL_SPEED = 100;

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function getRandomTimeout(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    async function scrollLines(lines) {
        return new Promise((resolve) => {
            let linesScrolled = 0;
            const distance = 20;
            const timer = setInterval(() => {
                window.scrollBy(0, distance);
                linesScrolled++;
                if (linesScrolled >= lines) {
                    clearInterval(timer);
                    resolve();
                }
            }, SCROLL_SPEED);
        });
    }

    function promotionalCheck(feed) {
        try {
            if (!feed) {
                throw new Error('feedが見つかりませんでした。');
            }
            const spans = feed.querySelectorAll('span');
            if (!spans) {
                throw new Error('spans要素が見つかりませんでした。');
            }
            for (let span of spans) {
                if (span.textContent.includes(PROMOTION_TEXT)) {
                    console.log('プロモーションなのでスキップしました。');
                    return true;
                }
            }
        } catch (e) {
            console.error('プロモーションチェック中にエラーが発生しました:', e);
        }
        return false;
    }

    function likeCount(feed) {
        try {
            if (!feed) {
                throw new Error('feedが見つかりませんでした。');
            }
            const spans = feed.querySelectorAll('span');
            if (!spans) {
                throw new Error('spans要素が見つかりませんでした。');
            }

            for (let span of spans) {
                const spanText = span.textContent.trim();

                if (LIKED_COUNT_TEXT.test(spanText)) {
                    const matched = spanText.match(/\d+/);

                    if (matched) {
                        likedCount = parseInt(matched[0], 10);
                        console.log('likedCount:', likedCount);

                        if (MIN_LIKE_COUNT < likedCount && likedCount < MAX_LIKE_COUNT) {
                          console.log('いいね数の最小値、最大値の条件に当てはまりました。');
                          return true;
                        } else {
                            console.log('いいねの条件から外れました。');
                        }
                    }
                }
            }
            console.log('LIKED_COUNT_TEXTの条件から外れました。');
        } catch (e) {
            console.error('いいねカウントチェック中にエラーが発生しました:', e);
        }

        return false;
    }

    function likedOrUnlike(section) {
        try {
            const ariaLabelElement = section.querySelector('svg[aria-label="「いいね！」を取り消す"]');
            if (!ariaLabelElement) return false;
            const ariaLabel = ariaLabelElement.getAttribute('aria-label');
            return ariaLabel === '「いいね！」を取り消す';
        } catch (e) {
            console.error('いいね済みチェック中にエラーが発生しました:', e);
            return false;
        }
    }

    async function like(feed, mylikedCount) {
        try {
            if (!feed) {
                throw new Error('feedが見つかりませんでした。');
            }
            const section = feed.querySelector('section');
            if (!section) {
                throw new Error('section要素が見つかりませんでした。');
            }
            const likeButton = section.querySelector('div[role="button"]');
            if (!likeButton) {
                throw new Error('likeButton要素が見つかりませんでした。');
            }
            if (!likedOrUnlike(section)) {
                likeButton.click();
                mylikedCount++;
                const randomTimeout = getRandomTimeout(MIN_TIMEOUT, MAX_TIMEOUT);
                await sleep(randomTimeout);
            } else {
            console.log('いいね済みなのでスキップします。');
            }
        } catch (e) {
            console.error('いいねボタンの操作中にエラーが発生しました:', e);
        }

        return mylikedCount;
    }


    async function processFeeds(index, feeds, mylikedCount) {
        let newFeeds = Array.from(document.querySelectorAll('article'));
        newFeeds.forEach(newFeed => {
            if (!feeds.includes(newFeed)) {
                feeds.push(newFeed);
            }
        });
        await sleep(2000);
        feeds[index].scrollIntoView();

        console.log('index:', index + 1);
        console.log('feedsの個数:', feeds.length + 1);
        console.log('いいねした総数:', mylikedCount);
        if (mylikedCount >= COUNT_OF_LIKE) {
            console.log('いいねした総数が', COUNT_OF_LIKE, 'を超えたので終了します。');
            return;
        }
        if (index >= feeds.length) {
            console.log('indexはfeedsの個数を超えました。処理を終了します。');
            return;
        } else {
            console.log('indexはfeedsの個数を超えていません。');
        }

        if (!promotionalCheck(feeds[index]) && likeCount(feeds[index])) {
            mylikedCount = await like(feeds[index], mylikedCount);
            await scrollLines(SCROLL_LINES);
            console.log('スクロールが完了しました。次の処理に移行します。');
        } else {
            const randomTimeout = getRandomTimeout(1000, 2000);
            await sleep(randomTimeout);
        }
        await processFeeds(index + 1, feeds, mylikedCount);
    }

    let initialFeeds = Array.from(document.querySelectorAll('article'));
    let mylikedCount = 0;
    processFeeds(0, initialFeeds, mylikedCount);

})();

