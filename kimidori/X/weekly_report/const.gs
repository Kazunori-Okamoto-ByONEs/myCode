const TODAY = new Date();

const X_ANALYSIS_SHEET = '';
const X_ANALYSIS_SHEET_NAME = ''; // シート名

const X_OPERATION = ''
const WEEKLY_REPORT1 = ''
const WEEKLY_REPORT2 = ''

const TOKEN = "";

const USER_ID = "";

const X_FETCH_DATA_OF_POSTS = `
function formatDateMMDD(daysAgo) {
    const TODAY = new Date();
    var date = new Date(TODAY);
    date.setDate(date.getDate() - daysAgo);
    var month = ('0' + (date.getMonth() + 1)).slice(-2);
    var day = ('0' + date.getDate()).slice(-2);
    return month + '/' + day;
}

function getButtonData(post, buttonSelector) {
    const button = post.querySelector(buttonSelector);
    if (!button) {
        console.error("button not found");
        return 0; // ボタンが見つからない場合、デフォルト値として0を返す
    }
    const label = button.getAttribute('aria-label');
    const match = label ? label.match(/\\d+/) : null;
    return match ? parseInt(match[0], 10) : 0; // 数字を抽出して整数に変換、見つからない場合は0を返す
}

(async () => {
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async function getData(post) {
        var getdata = [];

        const myRepostelement = post.querySelector('span[data-testid="socialContext"]');
        if (myRepostelement && myRepostelement.textContent.includes('あなたがリポストしました')) {
            console.log('この投稿はスキップします');
            return getdata;
        }

        const timeElement = post.querySelector('time');
        if (!timeElement) {
            console.error('timeElement not found');
            return getdata; // エラー処理や空の配列を返すなど
        }
        const datetime = timeElement.getAttribute('datetime')
        if (!datetime) {
            console.error('datetime attribute not found');
            return getdata; // エラー処理や空の配列を返すなど
        }
        const jstDate = new Date(new Date(datetime).getTime() + 9 * 60 * 60 * 1000); // JST is UTC+9
        const month = ('0' + (jstDate.getMonth() + 1)).slice(-2);
        const day = ('0' + jstDate.getDate()).slice(-2);
        const formattedDate = month + '/' + day;
        console.log('DATE(JST):', formattedDate);
        getdata.push(formattedDate);

        getdata.push(formatDateMMDD(0));

        const impressElement = post.querySelector('a[aria-label*="件の表示"]');
        console.log('impressElement:', impressElement);
        if (impressElement) {
            const impressLabel = impressElement.getAttribute('aria-label');
            console.log('impressLabel:', impressLabel);
            const impressMatch = impressLabel.match(/\\d+/);
            console.log('impressMatch:', impressMatch);
            if (impressMatch) {
                const impress = parseInt(impressMatch[0], 10);
                console.log('impress:', impress);
                getdata.push(impress);
            }
        }

        getdata.push(getButtonData(post, 'button[data-testid="retweet"]')); // リポスト数の取得
        getdata.push(getButtonData(post, 'button[data-testid="reply"]')); // 返信数の取得
        getdata.push(getButtonData(post, 'button[data-testid="like"]')); // いいね数の取得

        const bookmark = 0;
        console.log('bookmark:', bookmark);
        getdata.push(bookmark);

        return getdata;
    }

    async function getNewPosts (posts) {
        await sleep(2000);
        let newPosts = Array.from(document.querySelectorAll('article'));
        newPosts.forEach(newPost => {
            if (!posts.includes(newPost)) {
                posts.push(newPost);
            }
        });
        return posts;
    }

    async function processPosts() {
        var posts = [];
        var allData = [];
        var start_date = formatDateMMDD(11);
        var end_date = formatDateMMDD(5);
        console.log('start_date:', start_date);
        console.log('end_date:', end_date);

        for (let i = 0; i <= posts.length; i++) {
          if (i === posts.length) {
            posts = await getNewPosts(posts);
          }
          posts[i].scrollIntoView();
          await sleep(500);
          var data = await getData(posts[i]);
          console.log('data:', data[0]);
          if (start_date <= data[0] && data[0] <= end_date) {
            allData.unshift(data);
          }
          else if (end_date < data[0]) {
            continue;
          }
          else if (data[0] < start_date && allData.length === 0) {
            continue;
          }
          else if (data.length === 0) {
            continue;
          } else {
            break;
          }
        }

        return allData;
    }

    var data = await processPosts();

    // 日付（1列目）を基準に昇順にソートする
    data.sort((a, b) => {
        // 日付を比較するために文字列を日付型に変換して比較
        const dateA = new Date(a[0]);
        const dateB = new Date(b[0]);
        return dateA - dateB;
    });

    // データを整形して一度にコンソールに出力
    const formattedData = data.map(row => [row[0], row[1], '', '', ...row.slice(2)].join('\\t')).join('\\n');
    console.log(formattedData);

})();
`;
