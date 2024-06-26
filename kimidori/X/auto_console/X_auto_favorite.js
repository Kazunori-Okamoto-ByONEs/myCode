(async () => {
    // Parameters
    const COUNT_OF_LIKE = 100;
    const SCROLL_LINES = 35;
    const MIN_TIMEOUT = 40000;
    const MAX_TIMEOUT = 60000;
    const MIN_LIKE_COUNT = 0;
    const MAX_LIKE_COUNT = 100;
    const LIKE_BUTTON_SELECTOR = 'button[data-testid="like"]';
    const PROMOTION_TEXT = 'プロモーション';
    const SCROLL_SPEED = 100;

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function getRandomTimeout(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function getLikeCount(button) {
        if (!button) {
            console.log('Like button not found.');
            return 0;
        }
        const ariaLabel = button.getAttribute('aria-label');
        console.log('aria-label:', ariaLabel);
        const match = ariaLabel ? ariaLabel.match(/\d+/) : null;
        console.log('match:', match);
        if (match) {
            console.log('整数:', parseInt(match[0], 10));
            return parseInt(match[0], 10);
        }
        return 0;
    }

    async function like(likeButton, likeCount, mylikedCount) {
        if (likeCount >= MIN_LIKE_COUNT && likeCount < MAX_LIKE_COUNT) {
            likeButton.click();
            mylikedCount++;
            const randomTimeout = getRandomTimeout(MIN_TIMEOUT, MAX_TIMEOUT);
            await sleep(randomTimeout);
        } else {
            console.log('いいね数が条件から外れているためスキップします。');
            const randomTimeout = getRandomTimeout(500, 1000);
            await sleep(randomTimeout);
        }
        return mylikedCount;
    }

    function likedOrUnlike(likeButton) {
        if (!likeButton) return true;
        const ariaLabel = likeButton.getAttribute('aria-label');
        return ariaLabel && ariaLabel.includes('いいねしました');
    }

    function promotionalCheck(tweet) {
        const spans = tweet.querySelectorAll('span');
        for (let span of spans) {
            if (span.textContent.includes(PROMOTION_TEXT)) {
                console.log('Skipped promotional tweet:', tweet);
                const randomTimeout = getRandomTimeout(3000, 4000);
                sleep(randomTimeout);
                return true;
            }
        }
        return false;
    }

    function retweetCheck(tweet) {
        const retweetLabel = tweet.querySelector('svg[aria-label="リツイート済み"]');
        if (retweetLabel) {
            console.log('Skipped retweet:', tweet);
            return true;
        }
        return false;
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

    async function scrollToTweetAndCountLikes(tweet, likeButtonSelector, mylikedCount) {
        const likeButton = tweet.querySelector(likeButtonSelector);
        tweet.scrollIntoView();
        await sleep(2000);
        if (!likedOrUnlike(likeButton)) {
            const likeCount = getLikeCount(likeButton);
            mylikedCount = await like(likeButton, likeCount, mylikedCount);
        } else {
            console.log('いいね済みなのでスキップします。');
        }

        return mylikedCount;
    }

    async function processTweets(index, tweets, mylikedCount) {
        let newTweets = Array.from(document.querySelectorAll('article'));
        newTweets.forEach(newTweet => {
            if (!tweets.includes(newTweet)) {
                tweets.push(newTweet);
            }
        });
        console.log('index:', index);
        console.log('articleの個数:', tweets.length);
        if (mylikedCount >= COUNT_OF_LIKE) {
            console.log('mylikedCountが100を超えたので終了します。');
            return;
        } else {
            console.log('いいねした総数:', mylikedCount);
        }
        if (index >= tweets.length) {
            console.log('indexはtweets.lengthを超えました。');
            return;
        } else {
            console.log('indexはtweets.lengthをまだ超えていません。');
            console.log('tweets.length:', tweets.length);
        }
        if (!promotionalCheck(tweets[index]) && !retweetCheck(tweets[index])) {
            mylikedCount = await scrollToTweetAndCountLikes(tweets[index], LIKE_BUTTON_SELECTOR, mylikedCount);
            await scrollLines(SCROLL_LINES);
            console.log('スクロールが完了しました。');
        }
        await processTweets(index + 1, tweets, mylikedCount);
    }

    let initialTweets = Array.from(document.querySelectorAll('article'));
    let mylikedCount = 0;
    processTweets(0, initialTweets, mylikedCount);
})();

