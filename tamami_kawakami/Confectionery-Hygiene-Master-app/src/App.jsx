import React, { useState, useEffect, useMemo } from 'react';
import { 
  BookOpen, 
  User, 
  Award, 
  LogOut, 
  ChevronRight, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Database, 
  Lock, 
  Unlock, 
  TrendingUp, 
  ChevronDown, 
  RefreshCw,
  Info,
  HelpCircle,
  Calendar,
  Check,
  ArrowRight,
  ListFilter
} from 'lucide-react';

// ==========================================
// スプレッドシートIDおよびGASの接続設定
// ==========================================
const SPREADSHEET_IDS = {
  PAST_QUESTIONS: "18MLceOQ7o2Fb-tQurcj21LZNYaVsahJbOMwp9S6S3W0", // 過去問マスター
  CLASSROOM_QUESTIONS: "1KpjFsbH91hAXeN7MNEOOFaWeqON0g-3-MKPxIgaNTK4", // 授業用データ (授業用_*)
  ACCOUNTS: "18gKCZXacZ2tObqGhK0HqlclyOj1hF4T2eYz5lONvR-c", // アカウントマスター
  HISTORY: "1PyUNVZ5dq7qCSLeLfSq6Vc9XDxGNB3o0Oal2j-7SesI", // 解答履歴
  PORTAL_DATA: "1pmvYQ-4NuCDeE2RpCQXbwX3r815_q-gx0Ks9FcBZWn8" // 過去問ポータル出力用
};

// 指定された本番用 GAS Web App URL
const DEFAULT_GAS_URL = "https://script.google.com/macros/s/AKfycbwbQZreiwk24bA6k5DD_x0wyXS5RZSk6B5Wz1ktGs-kHFeomGXIj23a12lgR-QzHtSTRg/exec";

// ==========================================
// 起動前のモック/フォールバックデータ
// ==========================================
const INITIAL_ACCOUNTS = [
  { studentId: "S202601", name: "鈴木 結衣", furigana: "すずき ゆい", lastName: "鈴木", firstName: "結衣", lastFurigana: "すずき", firstFurigana: "ゆい", passwordHash: "yui123", role: "student" },
  { studentId: "S202602", name: "佐藤 健太", furigana: "さとう けんた", lastName: "佐藤", firstName: "健太", lastFurigana: "さとう", firstFurigana: "けんた", passwordHash: "kenta456", role: "student" },
  { studentId: "admin", name: "管理者 菓子太郎", furigana: "かんりしゃ かしたろう", lastName: "管理者", firstName: "菓子太郎", lastFurigana: "かんりしゃ", firstFurigana: "かしたろう", passwordHash: "admin", role: "admin" }
];

const INITIAL_PAST_QUESTIONS = [
  { region: "東京都", year: "令和7年度", subject: "食品衛生学", questionNo: 1, question: "食中毒を引き起こす細菌のうち、感染型に分類されるものはどれか。", options: "1: 黄色ブドウ球菌, 2: サルモネラ属菌, 3: ボツリヌス菌, 4: テトロドトキシン", answerNo: 2, explanation: "サルモネラ属菌は代表的な感染型食中毒原因菌です。黄色ブドウ球菌やボツリヌス菌は食品内毒素型に分類されます。" },
  { region: "東京都", year: "令和7年度", subject: "製菓理論", questionNo: 2, question: "小麦粉 of グルテン形成において、主要な2つのタンパク質はどれか。", options: "1: グリアジンとグルテニン, 2: アルブミンとグロブリン, 3: ゼインとオリゼニン, 4: カゼインとホエイ", answerNo: 1, explanation: "小麦粉に含まれるグリアジン（粘性）とグルテニン（弾性）が水と結合してこねられることでグルテンが形成されます。" },
  { region: "東京都", year: "令和7年度", subject: "公衆衛生学", questionNo: 3, question: "我が国の現在の主要な死亡原因の第1位はどれか。", options: "1: 心疾患, 2: 老衰, 3: 悪性新生物（がん）, 4: 脳血管疾患", answerNo: 3, explanation: "日本の死亡原因の第1位は悪性新生物（がん）です。第2位は心疾患、第3位は老衰となっています。" },
  { region: "東京都", year: "令和7年度", subject: "食品学", questionNo: 4, question: "牛乳に含まれる主要な糖質（二糖類）はどれか。", options: "1: 麦芽糖, 2: 乳糖（ラクトース）, 3: ショ糖, 4: 果糖", answerNo: 2, explanation: "牛乳には約4.5％の乳糖（ラクトース）が含まれており、これが特有 of 甘味を与えます。" },
  { region: "東京都", year: "令和7年度", subject: "製菓実技", questionNo: 5, question: "スポンジ生地（ジェノワーズ）の気泡を安定させるために加えるのに適した材料はどれか。", options: "1: 油脂, 2: レモン汁, 3: 砂糖, 4: ココアパウダー", answerNo: 3, explanation: "砂糖は卵 of 気泡性を保ち、泡の安定性を高める重要な役割を持っています。油脂やココアは泡を消す作用があります。" },
  { region: "東京都", year: "令和6年度", subject: "食品衛生学", questionNo: 1, question: "ノロウイルス食中毒 of 予防法として、最も適切な加熱条件はどれか。", options: "1: 中心部 60℃・10分間, 2: 中心部 75℃・1分間, 3: 中心部 85〜90℃・90秒間以上, 4: 沸騰水で10秒間", answerNo: 3, explanation: "ノロウイルスを不活化するには、食品の中心部を85〜90℃で90秒間以上加熱する必要があります。" },
  { region: "栃木県", year: "令和7年度", subject: "食品衛生学", questionNo: 1, question: "腸管出血性大腸菌（O157等）が産生する、重篤な症状を引き起こす毒素はどれか。", options: "1: ベロ毒素, 2: エンテロトキシン, 3: テトロドトキシン, 4: アフラトキシン", answerNo: 1, explanation: "腸管出血性大腸菌は強力なベロ毒素を産生し、溶血性尿毒症症候群（HUS）などを引き起こします。" }
];

const INITIAL_PORTAL_REGIONS_YEARS = [
  { region: "東京都", year: "令和7年度" },
  { region: "東京都", year: "令和6年度" },
  { region: "栃木県", year: "令和7年度" }
];

const INITIAL_PORTAL_FILTER_OPTIONS = [
  { region: "東京都", year: "令和7年度", subject: "食品衛生学" },
  { region: "東京都", year: "令和7年度", subject: "製菓理論" },
  { region: "東京都", year: "令和7年度", subject: "公衆衛生学" },
  { region: "東京都", year: "令和7年度", subject: "食品学" },
  { region: "東京都", year: "令和7年度", subject: "製菓実技" },
  { region: "東京都", year: "令和6年度", subject: "食品衛生学" },
  { region: "栃木県", year: "令和7年度", subject: "食品衛生学" }
];

const INITIAL_CLASSROOM_QUESTIONS = {
  "授業用_20260601": [
    { region: "学校オリジナル", year: "2026年", subject: "製菓実技", questionNo: 1, question: "【授業用】カスタードクリームのデンプンの糊化（コ化）温度として正しいものはどれか。", options: "1: 50〜60℃, 2: 65〜70℃, 3: 80〜85℃（沸騰近く）, 4: 120℃以上", answerNo: 3, explanation: "薄力粉（小麦デンプン）を完全に糊化させ、コシがあり口当たりの良いクリームにするためにはしっかり沸騰（80〜85℃以上）させる必要があります。" }
  ]
};

const INITIAL_CLASSROOM_STATUS = {
  "授業用_20260601": "publish"
};

const INITIAL_HISTORY = [
  { historyId: "H001", studentId: "S202601", questionKey: "東京都_令和7年度_食品衛生学_1", category: "食品衛生学", userAns: 1, isCorrect: false, date: "2026-06-01" },
  { historyId: "H002", studentId: "S202601", questionKey: "東京都_令和7年度_食品衛生学_1", category: "食品衛生学", userAns: 2, isCorrect: true, date: "2026-06-02" },
  { historyId: "H003", studentId: "S202601", questionKey: "東京都_令和7年度_製菓理論_2", category: "製菓理論", userAns: 3, isCorrect: false, date: "2026-06-03" },
  { historyId: "H004", studentId: "S202601", questionKey: "東京都_令和7年度_公衆衛生学_3", category: "公衆衛生学", userAns: 3, isCorrect: true, date: "2026-06-04" },
  { historyId: "H005", studentId: "S202601", questionKey: "東京都_令和7年度_食品学_4", category: "食品学", userAns: 1, isCorrect: false, date: "2026-06-05" }
];

export default function App() {
  // --- GAS URL & 接続状態 ---
  const [gasUrl] = useState(DEFAULT_GAS_URL);
  const [connectionState, setConnectionState] = useState('unconnected'); // 'unconnected' | 'syncing' | 'connected' | 'error'
  const [syncStatusMsg, setSyncStatusMsg] = useState('');

  // --- スプレッドシート連動データベース状態 ---
  const [accounts, setAccounts] = useState(INITIAL_ACCOUNTS);
  const [questions, setQuestions] = useState(INITIAL_PAST_QUESTIONS);
  const [classroomQuestions, setClassroomQuestions] = useState(INITIAL_CLASSROOM_QUESTIONS);
  const [classroomStatus, setClassroomStatus] = useState(INITIAL_CLASSROOM_STATUS);
  const [history, setHistory] = useState(INITIAL_HISTORY);
  
  // ポータルマスタデータ
  const [portalRegionsYears, setPortalRegionsYears] = useState(INITIAL_PORTAL_REGIONS_YEARS);
  const [portalFilterOptions, setPortalFilterOptions] = useState(INITIAL_PORTAL_FILTER_OPTIONS);

  // --- アプリUI状態 ---
  const [currentUser, setCurrentUser] = useState(null);
  const [currentScreen, setCurrentScreen] = useState('LOGIN'); // LOGIN, HOME, PORTAL_SELECT, REPORT_CARD, CLASSROOM, EXAM_SESSION, FORGOT_PASSWORD
  const [activeAccordion, setActiveAccordion] = useState(null); // 'region-year', 'specific', 'wrong'

  // ログインフォーム用
  const [loginStudentId, setLoginStudentId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // パスワード変更フォーム用
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotStudentId, setForgotStudentId] = useState('');
  const [forgotFullName, setForgotFullName] = useState('');
  const [forgotFurigana, setForgotFurigana] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');

  // 過去問選択 フィルター状態 (複数チェックボックス指定)
  const [portalRandomize, setPortalRandomize] = useState(false);
  const [selectedRegions, setSelectedRegions] = useState([]);
  const [selectedYears, setSelectedYears] = useState([]);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [specificQuestionCount, setSpecificQuestionCount] = useState(10);

  // 間違えた問題 フィルター状態
  const [selectedWrongRegions, setSelectedWrongRegions] = useState([]);
  const [selectedWrongYears, setSelectedWrongYears] = useState([]);
  const [selectedWrongSubjects, setSelectedWrongSubjects] = useState([]);
  const [wrongQuestionCount, setWrongQuestionCount] = useState(10);

  // 演習セッション
  const [examSession, setExamSession] = useState(null);

  // モーダル
  const [customModal, setCustomModal] = useState(null);

  // ==========================================
  // スプレッドシート自動接続・同期コアロジック
  // ==========================================

  const syncDataWithGAS = async () => {
    if (!gasUrl) {
      setConnectionState('error');
      return;
    }

    setConnectionState('syncing');
    
    try {
      // 1. アカウントマスターの同期
      setSyncStatusMsg('アカウントの同期中...');
      const accRes = await fetch(`${gasUrl}?spreadsheetId=${SPREADSHEET_IDS.ACCOUNTS}&sheetName=アカウントマスター`);
      if (!accRes.ok) throw new Error("アカウントマスターの通信に失敗しました。");
      const accJson = await accRes.json();
      if (accJson.data) {
        setAccounts(accJson.data.map(row => ({
          studentId: String(row["学籍番号"] || ""),
          name: String(row["フルネーム"] || ""),
          furigana: String(row["ふるねーむ"] || ""),
          lastName: String(row["姓"] || ""),
          firstName: String(row["名"] || ""),
          lastFurigana: String(row["せい"] || ""),
          firstFurigana: String(row["めい"] || ""),
          passwordHash: String(row["password_hash"] || ""),
          role: String(row["学籍番号"]) === 'admin' ? 'admin' : 'student'
        })));
      }

      // 2. 過去問マスターの同期
      setSyncStatusMsg('過去問の同期中...');
      const qRes = await fetch(`${gasUrl}?spreadsheetId=${SPREADSHEET_IDS.PAST_QUESTIONS}&sheetName=all_製菓実技の不要問題除外`);
      if (!qRes.ok) throw new Error("過去問マスターの通信に失敗しました。");
      const qJson = await qRes.json();
      if (qJson.data) {
        setQuestions(qJson.data.map(row => ({
          region: String(row["地域"] || ""),
          year: String(row["年度"] || ""),
          subject: String(row["科目"] || ""),
          questionNo: Number(row["問題番号"] || 1),
          question: String(row["問題"] || ""),
          options: String(row["選択肢"] || ""),
          answerNo: Number(row["解答番号"] || 1),
          explanation: String(row["解説"] || "")
        })));
      }

      // 3. 解答履歴の同期
      setSyncStatusMsg('履歴の読み込み中...');
      const hRes = await fetch(`${gasUrl}?spreadsheetId=${SPREADSHEET_IDS.HISTORY}&sheetName=history`);
      if (!hRes.ok) throw new Error("履歴の通信に失敗しました。");
      const hJson = await hRes.json();
      if (hJson.data) {
        setHistory(hJson.data.map(row => ({
          historyId: String(row["履歴ID"] || ""),
          studentId: String(row["学籍番号"] || ""),
          questionKey: String(row["問題キー"] || ""),
          category: String(row["出題区分"] || ""),
          userAns: Number(row["ユーザー解答"] || 0),
          isCorrect: String(row["正誤フラグ"]).toUpperCase() === "TRUE" || String(row["正誤フラグ"]) === "⭕" || String(row["正誤フラグ"]) === "1",
          date: String(row["回答日時"] || "")
        })));
      }

      // 4. ポータル出力用「地域＆年度」
      setSyncStatusMsg('ポータル情報の取得中...');
      const pRes1 = await fetch(`${gasUrl}?spreadsheetId=${SPREADSHEET_IDS.PORTAL_DATA}&sheetName=地域＆年度`);
      if (pRes1.ok) {
        const pJson1 = await pRes1.json();
        if (pJson1.data) {
          setPortalRegionsYears(pJson1.data.map(row => ({
            region: String(row["地域"] || row["地域列"] || ""),
            year: String(row["年度"] || row["年度列"] || "")
          })).filter(x => x.region && x.year));
        }
      }

      // 5. ポータル出力用「地域＆年度&科目」
      const pRes2 = await fetch(`${gasUrl}?spreadsheetId=${SPREADSHEET_IDS.PORTAL_DATA}&sheetName=地域＆年度＆科目`);
      if (pRes2.ok) {
        const pJson2 = await pRes2.json();
        if (pJson2.data) {
          setPortalFilterOptions(pJson2.data.map(row => ({
            region: String(row["地域"] || ""),
            year: String(row["年度"] || ""),
            subject: String(row["科目"] || "")
          })));
        }
      }

      // 6. 授業用データ（複数シートの走査）
      setSyncStatusMsg('授業問題の検索中...');
      const cListRes = await fetch(`${gasUrl}?spreadsheetId=${SPREADSHEET_IDS.CLASSROOM_QUESTIONS}&action=listSheets`);
      if (cListRes.ok) {
        const cListJson = await cListRes.json();
        if (cListJson.sheets) {
          const classroomSheets = cListJson.sheets.filter(name => name.startsWith("授業用_"));
          const tempClassQuestions = {};

          for (const sheetName of classroomSheets) {
            setSyncStatusMsg(`${sheetName} を取得中...`);
            const csRes = await fetch(`${gasUrl}?spreadsheetId=${SPREADSHEET_IDS.CLASSROOM_QUESTIONS}&sheetName=${sheetName}`);
            if (csRes.ok) {
              const csJson = await csRes.json();
              if (csJson.data) {
                tempClassQuestions[sheetName] = csJson.data.map(row => ({
                  region: String(row["地域"] || "学校オリジナル"),
                  year: String(row["年度"] || ""),
                  subject: String(row["科目"] || ""),
                  questionNo: Number(row["問題番号"] || 1),
                  question: String(row["問題"] || ""),
                  options: String(row["選択肢"] || ""),
                  answerNo: Number(row["解答番号"] || 1),
                  explanation: String(row["解説"] || "")
                }));
              }
            }
          }
          setClassroomQuestions(tempClassQuestions);
        }
      }

      // 7. 授業用公開status
      setSyncStatusMsg('公開状況を同期中...');
      const sRes = await fetch(`${gasUrl}?spreadsheetId=${SPREADSHEET_IDS.CLASSROOM_QUESTIONS}&sheetName=status`);
      if (sRes.ok) {
        const sJson = await sRes.json();
        if (sJson.data) {
          const tempStatus = {};
          sJson.data.forEach(row => {
            const sheetKey = String(row["A"] || row["シート名"] || Object.values(row)[0] || "");
            const statusVal = String(row["B"] || row["ステータス"] || Object.values(row)[1] || "unpublish");
            if (sheetKey) {
              tempStatus[sheetKey] = statusVal;
            }
          });
          setClassroomStatus(tempStatus);
        }
      }

      setConnectionState('connected');
    } catch (err) {
      console.error(err);
      setConnectionState('error');
    } finally {
      setSyncStatusMsg('');
    }
  };

  // アプリ起動時に自動接続・初回同期
  useEffect(() => {
    syncDataWithGAS();
  }, []);

  // スプレッドシートへの解答履歴追加
  const postHistoryToGAS = async (newHistoryRecords) => {
    if (connectionState !== 'connected') return;
    try {
      await fetch(gasUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spreadsheetId: SPREADSHEET_IDS.HISTORY,
          sheetName: 'history',
          action: 'appendHistory',
          records: newHistoryRecords
        })
      });
    } catch (err) {
      console.warn("履歴スプレッドシートへの書き込みに失敗しました。", err);
    }
  };

  // スプレッドシートの授業用公開ステータスの更新
  const postStatusToGAS = async (sheetName, status) => {
    if (connectionState !== 'connected') return;
    try {
      await fetch(gasUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spreadsheetId: SPREADSHEET_IDS.CLASSROOM_QUESTIONS,
          sheetName: 'status',
          action: 'updateStatus',
          targetSheet: sheetName,
          status: status
        })
      });
    } catch (err) {
      console.warn("ステータススプレッドシートの更新に失敗しました。", err);
    }
  };

  // 【追加】パスワード再設定を本番スプレッドシートに反映させる処理
  const postPasswordResetToGAS = async (studentId, newPassword) => {
    if (connectionState !== 'connected') return;
    try {
      await fetch(gasUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spreadsheetId: SPREADSHEET_IDS.ACCOUNTS,
          sheetName: 'アカウントマスター',
          action: 'updatePassword',
          studentId: studentId,
          newPassword: newPassword
        })
      });
    } catch (err) {
      console.warn("パスワードスプレッドシートの更新に失敗しました。", err);
    }
  };

  // ==========================================
  // 認証 & セーフティガード遷移
  // ==========================================
  
  const handleLogin = (e) => {
    e.preventDefault();
    const user = accounts.find(acc => acc.studentId === loginStudentId && acc.passwordHash === loginPassword);
    if (user) {
      setCurrentUser(user);
      setCurrentScreen('HOME');
      setLoginError('');
      setLoginStudentId('');
      setLoginPassword('');
    } else {
      setLoginError('学籍番号、またはパスワードが正しくありません。');
    }
  };

  const handleLogoutClick = () => {
    setCustomModal({
      title: "ログアウト確認",
      message: "ログアウトしますが、よろしいですか？",
      cancelText: "キャンセル",
      confirmText: "はい",
      onConfirm: () => {
        setCurrentUser(null);
        setCurrentScreen('LOGIN');
        setCustomModal(null);
      },
      onCancel: () => setCustomModal(null)
    });
  };

  const navigateWithGuard = (targetScreen, onConfirmExtra = null) => {
    if (examSession && !examSession.isFinished) {
      setCustomModal({
        title: "離脱確認",
        message: "別の画面に切り替わります。今の回答状況は全て破棄されますが、よろしいですか？",
        cancelText: "キャンセル",
        confirmText: "はい",
        onConfirm: () => {
          setExamSession(null);
          setCurrentScreen(targetScreen);
          setCustomModal(null);
          if (onConfirmExtra) onConfirmExtra();
        },
        onCancel: () => setCustomModal(null)
      });
    } else {
      setCurrentScreen(targetScreen);
      if (onConfirmExtra) onConfirmExtra();
    }
  };

  // 【修正点】文字列比較用に全角・半角スペースや改行などの空白をすべて除去するクリーン関数
  const cleanString = (str) => {
    if (!str) return '';
    return String(str).replace(/\s+/g, '');
  };

  const handlePasswordResetStep1 = (e) => {
    e.preventDefault();
    // スプレッドシート由来のアカウントマスター側のフルネーム、ふるねーむに含まれるスペースと、
    // ユーザーが入力した氏名、ひらがなからすべてのスペースを除去して完全に同一か判定
    const found = accounts.find(acc => 
      acc.studentId === forgotStudentId && 
      cleanString(acc.name) === cleanString(forgotFullName) && 
      cleanString(acc.furigana) === cleanString(forgotFurigana)
    );

    if (found) {
      setForgotError('');
      setForgotStep(2);
    } else {
      setForgotError('本人確認データと一致しません。学籍番号、フルネームおよび「ふりがな」をスペースなしで正しく入力してください。');
    }
  };

  const handlePasswordResetStep2 = (e) => {
    e.preventDefault();
    if (!forgotNewPassword || forgotNewPassword.length < 4) {
      setForgotError('新しいパスワードは4文字以上で設定してください。');
      return;
    }

    setAccounts(prev => prev.map(acc => {
      if (acc.studentId === forgotStudentId) {
        return { ...acc, passwordHash: forgotNewPassword };
      }
      return acc;
    }));

    // 【追加】GASを通じて本番スプレッドシートの「password_hash」列へ新しいパスワードを書き込み保存
    postPasswordResetToGAS(forgotStudentId, forgotNewPassword);

    setForgotSuccess('パスワードが新しく変更されました。');
    setForgotStep(1);
    setForgotStudentId('');
    setForgotFullName('');
    setForgotFurigana('');
    setForgotNewPassword('');
    setTimeout(() => {
      setForgotSuccess('');
      setCurrentScreen('LOGIN');
    }, 2000);
  };

  // ==========================================
  // 解析: 履歴・成績算出
  // ==========================================

  const userHistoryMap = useMemo(() => {
    if (!currentUser) return {};
    const userHistory = history.filter(h => h.studentId === currentUser.studentId);
    // 日付に空白やエラー値があっても落ちないようデフォルトフォールバックを施す
    const sorted = [...userHistory].sort((a, b) => new Date(a.date || '2026-01-01') - new Date(b.date || '2026-01-01'));
    const map = {};
    sorted.forEach(h => {
      map[h.questionKey] = {
        isCorrect: h.isCorrect,
        userAns: h.userAns,
        date: h.date,
        history: sorted.filter(sh => sh.questionKey === h.questionKey)
      };
    });
    return map;
  }, [history, currentUser]);

  const categoryStats = useMemo(() => {
    const stats = {
      "食品衛生学": { total: 0, correct: 0 },
      "製菓理論": { total: 0, correct: 0 },
      "公衆衛生学": { total: 0, correct: 0 },
      "食品学": { total: 0, correct: 0 },
      "製菓実技": { total: 0, correct: 0 },
      "衛生法規": { total: 0, correct: 0 }
    };

    if (!currentUser) return stats;

    Object.keys(userHistoryMap).forEach(key => {
      const parts = key.split('_'); 
      const subject = parts[2];
      if (stats[subject] !== undefined) {
        stats[subject].total += 1;
        if (userHistoryMap[key].isCorrect) {
          stats[subject].correct += 1;
        }
      }
    });
    return stats;
  }, [userHistoryMap, currentUser]);

  const weakestCategory = useMemo(() => {
    let weakest = null;
    let minRate = 1.01;

    Object.keys(categoryStats).forEach(subj => {
      const s = categoryStats[subj];
      if (s.total > 0) {
        const rate = s.correct / s.total;
        if (rate < 1.0 && rate < minRate) {
          minRate = rate;
          weakest = subj;
        }
      }
    });

    const hasAnyWrong = Object.values(userHistoryMap).some(h => !h.isCorrect);
    if (!hasAnyWrong) {
      return null; 
    }
    return weakest;
  }, [categoryStats, userHistoryMap]);

  // ==========================================
  // フィルター処理＆演習実行
  // ==========================================

  // B: 特定の問題の抽出
  const filteredSpecificQuestions = useMemo(() => {
    if (selectedRegions.length === 0 && selectedYears.length === 0 && selectedSubjects.length === 0) {
      return [];
    }
    return questions.filter(q => {
      const rMatch = selectedRegions.length === 0 || selectedRegions.includes(q.region);
      const yMatch = selectedYears.length === 0 || selectedYears.includes(q.year);
      const sMatch = selectedSubjects.length === 0 || selectedSubjects.includes(q.subject);
      return rMatch && yMatch && sMatch;
    });
  }, [questions, selectedRegions, selectedYears, selectedSubjects]);

  const maxSpecificCount = filteredSpecificQuestions.length;

  useEffect(() => {
    if (maxSpecificCount === 0) {
      setSpecificQuestionCount(0);
    } else {
      const defaultVal = maxSpecificCount >= 10 ? 10 : maxSpecificCount;
      setSpecificQuestionCount(defaultVal);
    }
  }, [maxSpecificCount]);

  // C: 間違えた問題のみ
  const wrongQuestionsFiltered = useMemo(() => {
    if (!currentUser) return [];
    const wrongKeys = Object.keys(userHistoryMap).filter(key => !userHistoryMap[key].isCorrect);

    if (selectedWrongRegions.length === 0 && selectedWrongYears.length === 0 && selectedWrongSubjects.length === 0) {
      return [];
    }

    return questions.filter(q => {
      const key = `${q.region}_${q.year}_${q.subject}_${q.questionNo}`;
      const isWrong = wrongKeys.includes(key);
      if (!isWrong) return false;

      const rMatch = selectedWrongRegions.length === 0 || selectedWrongRegions.includes(q.region);
      const yMatch = selectedWrongYears.length === 0 || selectedWrongYears.includes(q.year);
      const sMatch = selectedWrongSubjects.length === 0 || selectedWrongSubjects.includes(q.subject);
      return rMatch && yMatch && sMatch;
    });
  }, [questions, userHistoryMap, selectedWrongRegions, selectedWrongYears, selectedWrongSubjects, currentUser]);

  const maxWrongCount = wrongQuestionsFiltered.length;

  useEffect(() => {
    if (maxWrongCount === 0) {
      setWrongQuestionCount(0);
    } else {
      const defaultVal = maxWrongCount >= 10 ? 10 : maxWrongCount;
      setWrongQuestionCount(defaultVal);
    }
  }, [maxWrongCount]);

  // シャッフル
  const performShuffle = (arr) => {
    const list = [...arr];
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  };

  // 選択肢列の動的パース（改行またはカンマの両方に対応）
  const getOptionsArray = (optionsStr) => {
    if (!optionsStr) return [];
    let arr = optionsStr.split(/\r?\n/);
    if (arr.length <= 1 && optionsStr.includes(',')) {
      arr = optionsStr.split(',');
    }
    return arr.map(o => o.trim()).filter(Boolean);
  };

  // A: 地域＆年度
  const startRegionYearExam = (region, year, mode) => {
    let pool = questions.filter(q => q.region === region && q.year === year);
    if (portalRandomize) {
      pool = performShuffle(pool);
    } else {
      pool.sort((a, b) => a.questionNo - b.questionNo);
    }

    if (pool.length === 0) {
      alert("条件に合う過去問が見つかりませんでした。再読み込みしてください。");
      return;
    }

    setExamSession({
      type: 'portal-region-year',
      mode: mode, 
      questions: pool,
      currentIndex: 0,
      answers: {},
      isFinished: false,
      title: `${region} ${year} 過去問 (${mode === 'qa' ? '一問一答' : '一括振り返り'})`,
      originalConfig: { region, year, mode }
    });
    setCurrentScreen('EXAM_SESSION');
  };

  // B: 特定条件
  const startSpecificExam = () => {
    let pool = performShuffle(filteredSpecificQuestions);
    const limit = Math.min(specificQuestionCount, pool.length);
    const selectedList = pool.slice(0, limit);

    if (selectedList.length === 0) {
      alert("問題が見つかりません。条件を変えてください。");
      return;
    }

    setExamSession({
      type: 'specific',
      mode: 'qa',
      questions: selectedList,
      currentIndex: 0,
      answers: {},
      isFinished: false,
      title: `特定問題セレクト (${selectedList.length}問)`,
      originalConfig: {}
    });
    setCurrentScreen('EXAM_SESSION');
  };

  // C: 過去の間違い
  const startWrongExam = () => {
    let pool = performShuffle(wrongQuestionsFiltered);
    const limit = Math.min(wrongQuestionCount, pool.length);
    const selectedList = pool.slice(0, limit);

    if (selectedList.length === 0) return;

    setExamSession({
      type: 'wrong',
      mode: 'qa',
      questions: selectedList,
      currentIndex: 0,
      answers: {},
      isFinished: false,
      title: `過去の間違い復習 (${selectedList.length}問)`,
      originalConfig: {}
    });
    setCurrentScreen('EXAM_SESSION');
  };

  // D: 授業用問題
  const startClassroomExam = (sheetName) => {
    const pool = classroomQuestions[sheetName] || [];
    if (pool.length === 0) {
      alert("授業用問題の取得に失敗しました。");
      return;
    }

    setExamSession({
      type: 'classroom',
      mode: 'qa',
      questions: pool,
      currentIndex: 0,
      answers: {},
      isFinished: false,
      title: `${sheetName.replace('授業用_', '授業用問題 ')}`,
      originalConfig: { sheetName }
    });
    setCurrentScreen('EXAM_SESSION');
  };

  // E: 苦手克服10問
  const startWeaknessExam = (subject) => {
    let pool = questions.filter(q => q.subject === subject);
    pool = performShuffle(pool).slice(0, 10);

    setExamSession({
      type: 'weakness',
      mode: 'qa',
      questions: pool,
      currentIndex: 0,
      answers: {},
      isFinished: false,
      title: `苦手克服: 【${subject}】(一問一答10問)`,
      originalConfig: { subject }
    });
    setCurrentScreen('EXAM_SESSION');
  };

  // F: 苦手確認5問
  const startWeaknessTest = (subject) => {
    let pool = questions.filter(q => q.subject === subject);
    pool = performShuffle(pool).slice(0, 5);

    setExamSession({
      type: 'weakness-test',
      mode: 'review-after',
      questions: pool,
      currentIndex: 0,
      answers: {},
      isFinished: false,
      title: `確認テスト: 【${subject}】(振り返り5問)`,
      originalConfig: { subject }
    });
    setCurrentScreen('EXAM_SESSION');
  };

  // 解答タップ処理
  const handleSelectAnswer = (chosenOptIndex) => {
    if (!examSession || examSession.isFinished) return;

    const currentQ = examSession.questions[examSession.currentIndex];
    const isCorrect = chosenOptIndex === currentQ.answerNo;

    setExamSession(prev => ({
      ...prev,
      answers: { ...prev.answers, [prev.currentIndex]: chosenOptIndex }
    }));

    if (examSession.mode === 'qa' && currentUser) {
      const qKey = `${currentQ.region}_${currentQ.year}_${currentQ.subject}_${currentQ.questionNo}`;
      const record = {
        historyId: `H${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        studentId: currentUser.studentId,
        questionKey: qKey,
        category: currentQ.subject,
        userAns: chosenOptIndex === 'dont-know' ? 0 : chosenOptIndex,
        isCorrect: isCorrect,
        date: new Date().toISOString().split('T')[0]
      };
      setHistory(prev => [...prev, record]);
      postHistoryToGAS([record]);
    }
  };

  // 次へ ＆ 終了確認
  const handleNextQuestion = () => {
    if (!examSession) return;
    const isLast = examSession.currentIndex === examSession.questions.length - 1;

    if (!isLast) {
      setExamSession(prev => ({ ...prev, currentIndex: prev.currentIndex + 1 }));
    } else {
      if (examSession.mode === 'review-after') {
        setCustomModal({
          title: "回答完了の確認",
          message: "回答を終了しますがよろしいですか？",
          cancelText: "キャンセル",
          confirmText: "はい",
          onConfirm: () => {
            if (currentUser) {
              const newRecords = examSession.questions.map((q, idx) => {
                const userAns = examSession.answers[idx];
                const isCorrect = userAns === q.answerNo;
                const qKey = `${q.region}_${q.year}_${q.subject}_${q.questionNo}`;
                return {
                  historyId: `H${Date.now()}_${idx}_${Math.floor(Math.random() * 100)}`,
                  studentId: currentUser.studentId,
                  questionKey: qKey,
                  category: q.subject,
                  userAns: userAns === 'dont-know' ? 0 : (userAns || 0),
                  isCorrect: isCorrect,
                  date: new Date().toISOString().split('T')[0]
                };
              });
              setHistory(prev => [...prev, ...newRecords]);
              postHistoryToGAS(newRecords);
            }
            setExamSession(prev => ({ ...prev, isFinished: true }));
            setCustomModal(null);
          },
          onCancel: () => setCustomModal(null)
        });
      } else {
        setExamSession(prev => ({ ...prev, isFinished: true }));
      }
    }
  };

  // 単独解き直し
  const handleRetakeSingleQuestion = (q) => {
    setExamSession({
      type: 'specific',
      mode: 'qa',
      questions: [q],
      currentIndex: 0,
      answers: {},
      isFinished: false,
      title: `${q.year} ${q.region} 解き直し`,
      originalConfig: {}
    });
    setCurrentScreen('EXAM_SESSION');
  };

  // 管理者：授業公開ステータス変更
  const handleToggleClassroomPublish = (sheetName, currentStatus) => {
    const isPublishing = currentStatus !== 'publish';
    setCustomModal({
      title: isPublishing ? "授業用問題の公開" : "授業用問題の非公開化",
      message: isPublishing ? "この問題を公開しますか？" : "この問題を非公開に戻しますか？",
      cancelText: "キャンセル",
      confirmText: "はい",
      onConfirm: () => {
        const nextStatus = isPublishing ? 'publish' : 'unpublish';
        setClassroomStatus(prev => ({ ...prev, [sheetName]: nextStatus }));
        postStatusToGAS(sheetName, nextStatus);
        setCustomModal(null);
      },
      onCancel: () => setCustomModal(null)
    });
  };

  const activeClassroomSheet = useMemo(() => {
    return Object.keys(classroomStatus).find(key => classroomStatus[key] === 'publish');
  }, [classroomStatus]);

  // ==========================================
  // 便利選択ヘルパー
  // ==========================================
  const uniqueRegions = useMemo(() => [...new Set(questions.map(q => q.region))], [questions]);
  const uniqueYears = useMemo(() => [...new Set(questions.map(q => q.year))], [questions]);
  const uniqueSubjects = useMemo(() => [...new Set(questions.map(q => q.subject))], [questions]);

  const selectAllSpecific = () => {
    setSelectedRegions(uniqueRegions);
    setSelectedYears(uniqueYears);
    setSelectedSubjects(uniqueSubjects);
  };
  const clearAllSpecific = () => {
    setSelectedRegions([]);
    setSelectedYears([]);
    setSelectedSubjects([]);
  };
  const selectAllWrong = () => {
    setSelectedWrongRegions(uniqueRegions);
    setSelectedWrongYears(uniqueYears);
    setSelectedWrongSubjects(uniqueSubjects);
  };
  const clearAllWrong = () => {
    setSelectedWrongRegions([]);
    setSelectedWrongYears([]);
    setSelectedWrongSubjects([]);
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#4A3225] font-sans antialiased flex flex-col selection:bg-[#EBD8C1] selection:text-[#5C3D2E]">
      
      {/* プレミアム・ヘッダー */}
      <header className="sticky top-0 z-40 bg-[#5C3D2E] text-[#FFFDF9] py-3.5 px-4 shadow-md border-b-4 border-[#C89B7B] flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-[#FFFDF9] text-[#5C3D2E] p-1.5 rounded-full shadow-inner border border-[#C89B7B]">
            <BookOpen className="w-5.5 h-5.5 text-[#C89B7B]" />
          </div>
          <div>
            <h1 className="text-base font-black tracking-wider leading-none">ハッピー製菓調理専門学校</h1>
            <p className="text-[10px] text-[#EBD8C1] mt-1 font-medium">製菓衛生師 過去問システム</p>
          </div>
        </div>

        {/* 接続インジケータ ＆ 再接続データベースボタン */}
        <div className="flex items-center space-x-2">
          
          {connectionState === 'syncing' ? (
            <span className="text-[10px] bg-[#442C21] text-[#EBD8C1] py-1 px-2.5 rounded-full border border-[#7D5640] flex items-center space-x-1">
              <RefreshCw className="w-3 h-3 animate-spin text-[#C89B7B]" />
              <span>同期中...</span>
            </span>
          ) : (
            <button
              onClick={syncDataWithGAS}
              title="スプレッドシートからデータを最新化（再読み込み）"
              className="p-1.5 bg-[#442C21] hover:bg-[#C89B7B] active:scale-95 transition rounded-lg text-[#EBD8C1] hover:text-[#5C3D2E] flex items-center space-x-1.5 border border-[#7D5640]"
            >
              <Database className="w-4 h-4 text-[#C89B7B]" />
              <span className="text-[10px] font-bold">データ再読込</span>
            </button>
          )}

          {/* 状態ステータスライト */}
          <div className="flex items-center" title={connectionState === 'connected' ? 'スプレッドシートと接続中' : 'デモモードで動作中'}>
            <span className={`h-2.5 w-2.5 rounded-full block ${
              connectionState === 'connected' ? 'bg-emerald-500 animate-pulse' : 
              connectionState === 'syncing' ? 'bg-amber-400 animate-bounce' : 'bg-rose-500'
            }`} />
          </div>
        </div>
      </header>

      {/* スプレッドシート同期進行表示パネル */}
      {connectionState === 'syncing' && (
        <div className="bg-[#FFF6F0] border-b border-[#EBD8C1] py-2 px-4 text-center text-xs text-[#5C3D2E] font-medium animate-pulse flex justify-center items-center space-x-2">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          <span>{syncStatusMsg}</span>
        </div>
      )}

      {/* メインコンテンツ */}
      <main className="flex-grow max-w-md w-full mx-auto px-4 py-5 flex flex-col justify-start">
        
        {/* ==========================================
            SCREEN: LOGIN (ログイン画面)
           ========================================== */}
        {currentScreen === 'LOGIN' && (
          <div className="my-auto bg-white rounded-2xl p-6 shadow-xl border border-[#EBD8C1] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#C89B7B] via-[#EBD8C1] to-[#5C3D2E]" />
            
            <div className="text-center mb-6">
              <span className="inline-block bg-[#FDFBF7] text-[#C89B7B] border border-[#EBD8C1] text-[10px] font-bold px-3 py-1 rounded-full mb-2">
                PORTAL LOGIN
              </span>
              <h2 className="text-xl font-black text-[#5C3D2E]">製菓衛生師 過去問ログイン</h2>
              <p className="text-xs text-gray-400 mt-1">学籍番号とパスワードを入力してください</p>
            </div>

            {loginError && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">学籍番号</label>
                <input 
                  type="text" required placeholder="例: 202601"
                  value={loginStudentId} onChange={(e) => setLoginStudentId(e.target.value)}
                  className="w-full px-4 py-3 bg-[#FDFBF7] border border-[#EBD8C1] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C89B7B] text-[#4A3225]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">パスワード</label>
                <input 
                  type="password" required placeholder="パスワードを入力"
                  value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-[#FDFBF7] border border-[#EBD8C1] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C89B7B] text-[#4A3225]"
                />
              </div>

              <button 
                type="submit" 
                className="w-full py-3.5 bg-[#5C3D2E] hover:bg-[#442C21] transition text-[#FFFDF9] font-bold rounded-xl shadow-md text-sm tracking-widest mt-6"
              >
                ログイン
              </button>
            </form>

            <div className="mt-6 text-center border-t border-dashed border-[#EBD8C1] pt-4">
              <button 
                onClick={() => {
                  setForgotStep(1);
                  setForgotError('');
                  setForgotSuccess('');
                  setCurrentScreen('FORGOT_PASSWORD');
                }}
                className="text-xs text-[#C89B7B] font-bold hover:underline"
              >
                パスワードを忘れた場合（変更申請）
              </button>
            </div>
          </div>
        )}

        {/* ==========================================
            SCREEN: FORGOT_PASSWORD (パスワード再設定画面)
           ========================================== */}
        {currentScreen === 'FORGOT_PASSWORD' && (
          <div className="bg-white rounded-2xl p-6 shadow-xl border border-[#EBD8C1] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-[#C89B7B]" />
            <h2 className="text-lg font-bold text-[#5C3D2E] mb-1">パスワードの再設定</h2>
            <p className="text-xs text-gray-400 mb-4 leading-relaxed">
              本人以外のパスワード変更を防ぐため、学籍番号、氏名、ひらがなの一致を確認いたします。
            </p>

            {forgotError && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{forgotError}</span>
              </div>
            )}

            {forgotSuccess && (
              <div className="mb-4 bg-green-50 border border-green-200 text-green-700 text-xs p-3 rounded-xl">
                {forgotSuccess}
              </div>
            )}

            {forgotStep === 1 ? (
              <form onSubmit={handlePasswordResetStep1} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">学籍番号</label>
                  <input 
                    type="text" required placeholder="例: S202601"
                    value={forgotStudentId} onChange={(e) => setForgotStudentId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#FDFBF7] border border-[#EBD8C1] rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">氏名 (フルネーム漢字)</label>
                  <input 
                    type="text" required placeholder="例: 山田 花子"
                    value={forgotFullName} onChange={(e) => setForgotFullName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#FDFBF7] border border-[#EBD8C1] rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">ふりがな</label>
                  <input 
                    type="text" required placeholder="例: やまだ はなこ"
                    value={forgotFurigana} onChange={(e) => setForgotFurigana(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#FDFBF7] border border-[#EBD8C1] rounded-xl text-sm"
                  />
                </div>
                <div className="pt-2 flex space-x-3">
                  <button 
                    type="button" onClick={() => setCurrentScreen('LOGIN')}
                    className="flex-1 py-2.5 border border-[#EBD8C1] text-gray-600 font-bold rounded-xl text-xs"
                  >
                    ログインへ戻る
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-2.5 bg-[#5C3D2E] text-white font-bold rounded-xl text-xs shadow-sm"
                  >
                    確認する
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handlePasswordResetStep2} className="space-y-4">
                <div className="p-3 bg-green-50 text-green-800 rounded-xl text-xs font-semibold mb-2">
                  ✓ 本人確認に成功しました。新しいパスワードを設定してください。
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">新しいパスワード</label>
                  <input 
                    type="password" required placeholder="4文字以上"
                    value={forgotNewPassword} onChange={(e) => setForgotNewPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#FDFBF7] border border-[#EBD8C1] rounded-xl text-sm"
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full py-3 bg-[#5C3D2E] text-white font-bold rounded-xl text-sm shadow-md"
                >
                  パスワードを変更する
                </button>
              </form>
            )}
          </div>
        )}

        {/* ==========================================
            SCREEN: HOME (メインメニュー)
           ========================================== */}
        {currentScreen === 'HOME' && currentUser && (
          <div className="space-y-5 animate-fade-in">
            
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#EBD8C1] flex items-center space-x-4 relative overflow-hidden">
              <div className="bg-[#FDFBF7] p-3 rounded-full border border-[#EBD8C1] text-[#C89B7B]">
                <User className="w-8 h-8" />
              </div>
              <div className="flex-grow">
                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">製菓衛生師 過去問ポータル</p>
                <h3 className="text-base font-black text-[#5C3D2E]">{currentUser.name} 様</h3>
                <p className="text-xs text-gray-500 mt-0.5">学籍番号: {currentUser.studentId}</p>
              </div>
            </div>

            {/* ナビゲーションメニュー */}
            <div className="space-y-3.5">
              
              <button 
                onClick={() => setCurrentScreen('PORTAL_SELECT')}
                className="w-full p-4 bg-white hover:bg-[#FDFBF7] transition border-2 border-[#EBD8C1] hover:border-[#C89B7B] rounded-2xl text-left flex items-center space-x-4 shadow-sm group"
              >
                <div className="bg-[#EBD8C1] group-hover:bg-[#C89B7B] p-3 rounded-xl transition text-[#5C3D2E]">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div className="flex-grow">
                  <h4 className="font-bold text-[#5C3D2E] text-sm">過去問を解く</h4>
                  <p className="text-[11px] text-gray-500 mt-0.5">地域・年度指定や、特定条件で問題を絞って演習を行います。</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
              </button>

              <button 
                onClick={() => setCurrentScreen('REPORT_CARD')}
                className="w-full p-4 bg-white hover:bg-[#FDFBF7] transition border-2 border-[#EBD8C1] hover:border-[#C89B7B] rounded-2xl text-left flex items-center space-x-4 shadow-sm group"
              >
                <div className="bg-[#EBD8C1] group-hover:bg-[#C89B7B] p-3 rounded-xl transition text-[#5C3D2E]">
                  <Award className="w-6 h-6" />
                </div>
                <div className="flex-grow">
                  <h4 className="font-bold text-[#5C3D2E] text-sm">成績表を確認</h4>
                  <p className="text-[11px] text-gray-500 mt-0.5">あなたの弱点レーダーチャートや、これまでの正誤一覧を確認します。</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
              </button>

              {/* 授業用問題 */}
              {currentUser.role === 'admin' ? (
                <button 
                  onClick={() => setCurrentScreen('CLASSROOM')}
                  className="w-full p-4 bg-[#FFF6F0] hover:bg-[#FFFDF9] transition border-2 border-[#EBD8C1] hover:border-[#C89B7B] rounded-2xl text-left flex items-center space-x-4 shadow-sm group"
                >
                  <div className="bg-[#C89B7B] p-3 rounded-xl text-white">
                    {activeClassroomSheet ? <Unlock className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
                  </div>
                  <div className="flex-grow">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-bold text-[#5C3D2E] text-sm">授業用問題管理</h4>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${activeClassroomSheet ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                        {activeClassroomSheet ? '授業用問題（公開中）' : '授業用問題（非公開）'}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5">授業中に生徒に配信する問題を管理・公開します。</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[#C89B7B]" />
                </button>
              ) : (
                <button 
                  disabled={!activeClassroomSheet}
                  onClick={() => startClassroomExam(activeClassroomSheet)}
                  className={`w-full p-4 rounded-2xl text-left flex items-center space-x-4 shadow-sm transition group border-2 ${
                    activeClassroomSheet 
                      ? 'bg-white hover:bg-[#FDFBF7] border-[#EBD8C1] hover:border-[#C89B7B]' 
                      : 'bg-gray-100 border-gray-200 cursor-not-allowed opacity-60'
                  }`}
                >
                  <div className={`p-3 rounded-xl ${activeClassroomSheet ? 'bg-[#EBD8C1] text-[#5C3D2E]' : 'bg-gray-300 text-gray-500'}`}>
                    {activeClassroomSheet ? <Unlock className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
                  </div>
                  <div className="flex-grow">
                    <div className="flex items-center space-x-2">
                      <h4 className={`font-bold text-sm ${activeClassroomSheet ? 'text-[#5C3D2E]' : 'text-gray-400'}`}>
                        授業用問題
                      </h4>
                      {!activeClassroomSheet && (
                        <span className="text-[9px] bg-gray-200 text-gray-600 px-1 rounded">ロック中</span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      {activeClassroomSheet ? '先生が公開した授業用の問題を解くことができます。' : '現在授業用問題は配信されていません。'}
                    </p>
                  </div>
                  {activeClassroomSheet && <ChevronRight className="w-5 h-5 text-gray-400" />}
                </button>
              )}

            </div>

            {/* ログアウト */}
            <div className="pt-4">
              <button 
                onClick={handleLogoutClick}
                className="w-full py-3 border border-red-200 text-red-600 bg-red-50/50 hover:bg-red-50 rounded-xl text-xs font-bold flex items-center justify-center space-x-1 transition"
              >
                <LogOut className="w-4 h-4" />
                <span>ログアウトする</span>
              </button>
            </div>
          </div>
        )}

        {/* ==========================================
            SCREEN: PORTAL_SELECT (アコーディオン選択)
           ========================================== */}
        {currentScreen === 'PORTAL_SELECT' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#5C3D2E]">問題選択ポータル</h2>
              <button 
                onClick={() => navigateWithGuard('HOME')}
                className="text-xs font-bold text-[#C89B7B] hover:underline"
              >
                ホームに戻る
              </button>
            </div>

            {/* A・B共通：ランダムトグル */}
            <div className="bg-white p-3.5 rounded-xl border border-[#EBD8C1] flex items-center justify-between shadow-xs">
              <span className="text-[11px] font-bold text-gray-700">「地域＆年度指定」の出題順をランダムにする</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={portalRandomize} 
                  onChange={(e) => setPortalRandomize(e.target.checked)} 
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:bg-[#5C3D2E] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#C89B7B]"></div>
              </label>
            </div>

            {/* アコーディオン */}
            <div className="space-y-3">
              
              {/* Accordion 1: 地域＆年度を指定 */}
              <div className="bg-white rounded-xl border border-[#EBD8C1] shadow-xs overflow-hidden">
                <button 
                  onClick={() => setActiveAccordion(activeAccordion === 'region-year' ? null : 'region-year')}
                  className="w-full p-4 flex items-center justify-between bg-white hover:bg-[#FDFBF7] transition text-left"
                >
                  <div>
                    <h3 className="font-bold text-[#5C3D2E] text-xs">地域＆年度を指定して解く</h3>
                    <p className="text-[10px] text-gray-400 mt-0.5">年度ごとの全問演習（一問一答 or 全解答後振り返り）</p>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${activeAccordion === 'region-year' ? 'rotate-180' : ''}`} />
                </button>

                {activeAccordion === 'region-year' && (
                  <div className="p-4 border-t border-[#F1E8DC] bg-[#FDFBF7]/40 space-y-3 animate-fade-in">
                    <div className="grid grid-cols-1 gap-2.5">
                      {portalRegionsYears.map((item, index) => (
                        <div key={index} className="bg-white p-3 rounded-xl border border-[#EBD8C1] shadow-xs flex flex-col space-y-2">
                          <span className="font-bold text-[#5C3D2E] text-xs">{item.region} {item.year}</span>
                          <div className="grid grid-cols-2 gap-2">
                            <button 
                              onClick={() => startRegionYearExam(item.region, item.year, 'qa')}
                              className="py-2 bg-[#5C3D2E] text-white rounded-lg text-[11px] font-bold hover:bg-[#442C21]"
                            >
                              一問一答形式
                            </button>
                            <button 
                              onClick={() => startRegionYearExam(item.region, item.year, 'review-after')}
                              className="py-2 bg-[#C89B7B] text-white rounded-lg text-[11px] font-bold hover:bg-[#b08565]"
                            >
                              振り返り形式
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Accordion 2: 特定の問題を解く */}
              <div className="bg-white rounded-xl border border-[#EBD8C1] shadow-xs overflow-hidden">
                <button 
                  onClick={() => setActiveAccordion(activeAccordion === 'specific' ? null : 'specific')}
                  className="w-full p-4 flex items-center justify-between bg-white hover:bg-[#FDFBF7] transition text-left"
                >
                  <div>
                    <h3 className="font-bold text-[#5C3D2E] text-xs">特定の問題を解く (条件絞り込み)</h3>
                    <p className="text-[10px] text-gray-400 mt-0.5">条件を指定しランダムに抽出された過去問演習</p>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${activeAccordion === 'specific' ? 'rotate-180' : ''}`} />
                </button>

                {activeAccordion === 'specific' && (
                  <div className="p-4 border-t border-[#F1E8DC] bg-[#FDFBF7]/40 space-y-4 animate-fade-in">
                    
                    <div className="flex space-x-2">
                      <button 
                        type="button" onClick={selectAllSpecific}
                        className="flex-1 py-1 bg-white hover:bg-gray-100 border border-gray-300 rounded text-[10px] font-bold text-gray-700"
                      >
                        全て選択する
                      </button>
                      <button 
                        type="button" onClick={clearAllSpecific}
                        className="flex-1 py-1 bg-white hover:bg-gray-100 border border-gray-300 rounded text-[10px] font-bold text-gray-700"
                      >
                        全ての選択を解除する
                      </button>
                    </div>

                    {/* 地域 */}
                    <div>
                      <span className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center space-x-1">
                        <ListFilter className="w-3 h-3" />
                        <span>地域指定</span>
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {uniqueRegions.map(r => {
                          const active = selectedRegions.includes(r);
                          return (
                            <button 
                              key={r} type="button"
                              onClick={() => setSelectedRegions(prev => active ? prev.filter(x !== r) : [...prev, r])}
                              className={`px-3 py-1 rounded-full text-[10px] font-bold transition ${active ? 'bg-[#5C3D2E] text-white' : 'bg-white border border-[#EBD8C1] text-gray-600'}`}
                            >
                              {r}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* 年度 */}
                    <div>
                      <span className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center space-x-1">
                        <ListFilter className="w-3 h-3" />
                        <span>年度指定</span>
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {uniqueYears.map(y => {
                          const active = selectedYears.includes(y);
                          return (
                            <button 
                              key={y} type="button"
                              onClick={() => setSelectedYears(prev => active ? prev.filter(x !== y) : [...prev, y])}
                              className={`px-3 py-1 rounded-full text-[10px] font-bold transition ${active ? 'bg-[#5C3D2E] text-white' : 'bg-white border border-[#EBD8C1] text-gray-600'}`}
                            >
                              {y}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* 科目 */}
                    <div>
                      <span className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center space-x-1">
                        <ListFilter className="w-3 h-3" />
                        <span>科目指定</span>
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {uniqueSubjects.map(s => {
                          const active = selectedSubjects.includes(s);
                          return (
                            <button 
                              key={s} type="button"
                              onClick={() => setSelectedSubjects(prev => active ? prev.filter(x !== s) : [...prev, s])}
                              className={`px-3 py-1 rounded-full text-[10px] font-bold transition ${active ? 'bg-[#5C3D2E] text-white' : 'bg-white border border-[#EBD8C1] text-gray-600'}`}
                            >
                              {s}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* 出題数設定 */}
                    <div className="bg-white p-3 rounded-lg border border-[#EBD8C1]">
                      <div className="flex justify-between text-[11px] font-bold text-gray-700 mb-1">
                        <span>出題数</span>
                        <span className="text-[#5C3D2E]">{specificQuestionCount}問 (対象: {maxSpecificCount}問)</span>
                      </div>
                      <input 
                        type="range" min={maxSpecificCount === 0 ? 0 : 1} max={maxSpecificCount || 1}
                        disabled={maxSpecificCount === 0}
                        value={specificQuestionCount}
                        onChange={(e) => setSpecificQuestionCount(Number(e.target.value))}
                        className="w-full accent-[#5C3D2E] cursor-pointer"
                      />
                    </div>

                    <button 
                      onClick={startSpecificExam}
                      disabled={maxSpecificCount === 0}
                      className={`w-full py-3 rounded-xl font-bold text-xs shadow-xs transition ${maxSpecificCount > 0 ? 'bg-[#5C3D2E] hover:bg-[#442C21] text-white' : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'}`}
                    >
                      {maxSpecificCount > 0 ? 'ランダム演習を開始する' : '条件に合う問題を選択してください'}
                    </button>
                  </div>
                )}
              </div>

              {/* Accordion 3: 過去に間違えた問題を復習する */}
              <div className="bg-white rounded-xl border border-[#EBD8C1] shadow-xs overflow-hidden">
                <button 
                  onClick={() => setActiveAccordion(activeAccordion === 'wrong' ? null : 'wrong')}
                  className="w-full p-4 flex items-center justify-between bg-white hover:bg-[#FDFBF7] transition text-left"
                >
                  <div>
                    <h3 className="font-bold text-[#5C3D2E] text-xs">過去に間違えた問題を復習する</h3>
                    <p className="text-[10px] text-gray-400 mt-0.5">直近の解答で間違えた問題から条件を絞り込んで復習</p>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${activeAccordion === 'wrong' ? 'rotate-180' : ''}`} />
                </button>

                {activeAccordion === 'wrong' && (
                  <div className="p-4 border-t border-[#F1E8DC] bg-[#FDFBF7]/40 space-y-4 animate-fade-in">
                    
                    <div className="flex space-x-2">
                      <button 
                        type="button" onClick={selectAllWrong}
                        className="flex-1 py-1 bg-white hover:bg-gray-100 border border-gray-300 rounded text-[10px] font-bold text-gray-700"
                      >
                        全て選択する
                      </button>
                      <button 
                        type="button" onClick={clearAllWrong}
                        className="flex-1 py-1 bg-white hover:bg-gray-100 border border-gray-300 rounded text-[10px] font-bold text-gray-700"
                      >
                        全ての選択を解除する
                      </button>
                    </div>

                    {/* 地域 */}
                    <div>
                      <span className="block text-xs font-bold text-gray-700 mb-1.5">地域指定</span>
                      <div className="flex flex-wrap gap-1.5">
                        {uniqueRegions.map(r => {
                          const active = selectedWrongRegions.includes(r);
                          return (
                            <button 
                              key={r} type="button"
                              onClick={() => setSelectedWrongRegions(prev => active ? prev.filter(x !== r) : [...prev, r])}
                              className={`px-3 py-1 rounded-full text-[10px] font-bold transition ${active ? 'bg-red-700 text-white' : 'bg-white border border-red-200 text-gray-600'}`}
                            >
                              {r}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* 科目 */}
                    <div>
                      <span className="block text-xs font-bold text-gray-700 mb-1.5">科目指定</span>
                      <div className="flex flex-wrap gap-1.5">
                        {uniqueSubjects.map(s => {
                          const active = selectedWrongSubjects.includes(s);
                          return (
                            <button 
                              key={s} type="button"
                              onClick={() => setSelectedWrongSubjects(prev => active ? prev.filter(x !== s) : [...prev, s])}
                              className={`px-3 py-1 rounded-full text-[10px] font-bold transition ${active ? 'bg-red-700 text-white' : 'bg-white border border-red-200 text-gray-600'}`}
                            >
                              {s}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* 出題数 */}
                    <div className="bg-white p-3 rounded-lg border border-red-100">
                      <div className="flex justify-between text-[11px] font-bold text-gray-700 mb-1">
                        <span>復習出題数</span>
                        <span className="text-red-700 font-bold">{wrongQuestionCount}問 (対象: {maxWrongCount}問)</span>
                      </div>
                      <input 
                        type="range" min={maxWrongCount === 0 ? 0 : 1} max={maxWrongCount || 1}
                        disabled={maxWrongCount === 0}
                        value={wrongQuestionCount}
                        onChange={(e) => setWrongQuestionCount(Number(e.target.value))}
                        className="w-full accent-red-600 cursor-pointer"
                      />
                    </div>

                    <button 
                      onClick={startWrongExam}
                      disabled={maxWrongCount === 0}
                      className={`w-full py-3 rounded-xl font-bold text-xs shadow-xs transition ${maxWrongCount > 0 ? 'bg-red-700 hover:bg-red-800 text-white' : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'}`}
                    >
                      {maxWrongCount > 0 ? '復習を開始する' : '復習する問題を選択してください'}
                    </button>
                  </div>
                )}
              </div>

            </div>

            <div className="pt-4 flex justify-center">
              <button 
                onClick={() => navigateWithGuard('HOME')}
                className="px-6 py-2 bg-white border border-[#EBD8C1] text-gray-700 text-xs font-bold rounded-xl shadow-xs"
              >
                戻る
              </button>
            </div>
          </div>
        )}

        {/* ==========================================
            SCREEN: CLASSROOM (管理者用 授業公開/管理)
           ========================================== */}
        {currentScreen === 'CLASSROOM' && currentUser && currentUser.role === 'admin' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[#5C3D2E]">授業用問題の一覧(管理者管理)</h2>
              <button 
                onClick={() => setCurrentScreen('HOME')}
                className="text-xs font-bold text-[#C89B7B] hover:underline"
              >
                ホームへ
              </button>
            </div>

            <p className="text-xs text-gray-500 leading-normal bg-white p-3.5 rounded-xl border border-[#EBD8C1]">
              授業用シート(`授業用_`) をタップして公開 status を切り替えます。公開時は生徒メニューからアクセスできるようになります。
            </p>

            <div className="space-y-3">
              {Object.keys(classroomQuestions).map(sheetName => {
                const status = classroomStatus[sheetName] || 'unpublish';
                const isPublished = status === 'publish';
                
                return (
                  <div 
                    key={sheetName}
                    onClick={() => handleToggleClassroomPublish(sheetName, status)}
                    className={`p-4 bg-white rounded-xl border-2 cursor-pointer transition shadow-xs flex items-center justify-between ${
                      isPublished ? 'border-green-300 bg-green-50/20' : 'border-gray-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="font-bold text-xs text-[#5C3D2E]">{sheetName}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          isPublished ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {isPublished ? '公開中' : '非公開'}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1">問題数: {classroomQuestions[sheetName].length} 問</p>
                    </div>

                    <span className="text-[10px] text-[#C89B7B] font-bold hover:underline">
                      ステータス切替
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 flex justify-center">
              <button 
                onClick={() => {
                  syncDataWithGAS(); // 情報の再読み込み
                  setCurrentScreen('HOME');
                }}
                className="px-6 py-2 bg-white border border-[#EBD8C1] text-gray-700 text-xs font-bold rounded-xl"
              >
                ホームに戻る
              </button>
            </div>
          </div>
        )}

        {/* ==========================================
            SCREEN: REPORT_CARD (成績表 ＆ 苦手克服)
           ========================================== */}
        {currentScreen === 'REPORT_CARD' && currentUser && (
          <div className="space-y-5 animate-fade-in">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[#5C3D2E]">成績表 ＆ 苦手克服</h2>
              <button 
                onClick={() => navigateWithGuard('HOME')}
                className="text-xs font-bold text-[#C89B7B] hover:underline"
              >
                ホームへ戻る
              </button>
            </div>

            {/* 苦手分野お勧めカード */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-[#EBD8C1] relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-[#C89B7B]" />
              <h3 className="text-xs font-bold text-[#5C3D2E] mb-2 flex items-center space-x-1">
                <TrendingUp className="w-3.5 h-3.5 text-[#C89B7B]" />
                <span>苦手分野の診断</span>
              </h3>

              {weakestCategory ? (
                <div className="space-y-3.5">
                  <p className="text-xs text-gray-700 leading-normal">
                    あなたの現在の苦手分野は、<span className="text-red-700 font-extrabold text-xs bg-red-50 px-2 py-0.5 rounded border border-red-200">{weakestCategory}</span> です。<br />
                    苦手克服演習を開始しましょう！
                  </p>
                  
                  <div className="bg-[#FFFDF9] p-2.5 rounded-lg border border-[#EBD8C1] flex justify-between items-center text-[10px]">
                    <div>
                      <span className="text-gray-500">回答数:</span>{' '}
                      <span className="font-bold text-[#5C3D2E]">{categoryStats[weakestCategory].total}問</span>
                    </div>
                    <div>
                      <span className="text-gray-500">正解数:</span>{' '}
                      <span className="font-bold text-green-700">{categoryStats[weakestCategory].correct}問</span>
                    </div>
                    <div>
                      <span className="text-gray-500">正答率:</span>{' '}
                      <span className="font-bold text-red-600">
                        {Math.round((categoryStats[weakestCategory].correct / categoryStats[weakestCategory].total) * 100)}%
                      </span>
                    </div>
                  </div>

                  <button 
                    onClick={() => startWeaknessExam(weakestCategory)}
                    className="w-full py-2.5 bg-[#5C3D2E] hover:bg-[#442C21] text-white text-[11px] font-bold rounded-xl shadow-xs transition"
                  >
                    「{weakestCategory}」の苦手分野演習を開始する
                  </button>
                </div>
              ) : (
                <p className="text-xs text-gray-500 py-2 font-medium">
                  🎉 おめでとうございます！現在、苦手分野はありません。この調子で学習を続けましょう！
                </p>
              )}
            </div>

            {/* 分野別進捗度 */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-[#EBD8C1]">
              <h3 className="text-[11px] font-bold text-gray-400 mb-3 uppercase tracking-wider">分野別正答率一覧</h3>
              <div className="space-y-2.5">
                {Object.keys(categoryStats).map(subj => {
                  const stats = categoryStats[subj];
                  const rate = stats.total > 0 ? stats.correct / stats.total : 0;
                  const percent = Math.round(rate * 100);
                  return (
                    <div key={subj} className="space-y-0.5">
                      <div className="flex justify-between text-[11px]">
                        <span className="font-bold text-gray-700">{subj}</span>
                        <span className="text-gray-500">
                          {stats.total > 0 ? `${percent}% (${stats.correct}/${stats.total}問)` : "未解答"}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                        <div 
                          style={{ width: `${stats.total > 0 ? percent : 0}%` }}
                          className={`h-full rounded-full transition-all duration-500 ${
                            rate >= 0.8 ? 'bg-emerald-500' : rate >= 0.5 ? 'bg-amber-500' : 'bg-rose-500'
                          }`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 成績一覧テーブル */}
            <div className="bg-white rounded-2xl shadow-sm border border-[#EBD8C1] overflow-hidden">
              <div className="bg-[#5C3D2E] text-white p-3 flex justify-between items-center text-xs">
                <span className="font-bold">問題ごとの最新回答状況</span>
                <span className="text-[10px] opacity-80">再挑戦はリンクをタップ</span>
              </div>
              
              <div className="overflow-x-auto max-h-[250px] overflow-y-auto">
                <table className="w-full text-[11px] text-left">
                  <thead className="bg-[#FDFBF7] border-b border-[#EBD8C1] font-bold text-gray-700 sticky top-0">
                    <tr>
                      <th className="p-2.5">科目</th>
                      <th className="p-2.5">年度・地域</th>
                      <th className="p-2.5 text-center">直近状況</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {questions.map((q, idx) => {
                      const key = `${q.region}_${q.year}_${q.subject}_${q.questionNo}`;
                      const record = userHistoryMap[key];
                      
                      return (
                        <tr key={idx} className="hover:bg-[#FDFBF7]/40 transition">
                          <td className="p-2.5 font-semibold text-gray-600">{q.subject}</td>
                          <td className="p-2.5">
                            <button 
                              onClick={() => handleRetakeSingleQuestion(q)}
                              className="text-left text-[#C89B7B] font-bold hover:underline block truncate max-w-[150px]"
                            >
                              {q.year} {q.region} Q{q.questionNo}: {q.question.slice(0, 10)}...
                            </button>
                          </td>
                          <td className="p-2.5 text-center">
                            {record ? (
                              record.isCorrect ? (
                                <span className="text-emerald-600 font-bold" title={record.date}>⭕</span>
                              ) : (
                                <span className="text-rose-600 font-bold" title={record.date}>❌</span>
                              )
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-2 flex justify-center">
              <button 
                onClick={() => navigateWithGuard('HOME')}
                className="px-6 py-2 bg-white border border-[#EBD8C1] text-gray-700 text-xs font-bold rounded-xl"
              >
                ホーム画面に戻る
              </button>
            </div>
          </div>
        )}

        {/* ==========================================
            SCREEN: EXAM_SESSION (過去問演習画面)
           ========================================== */}
        {currentScreen === 'EXAM_SESSION' && examSession && (
          <div className="space-y-4 animate-fade-in flex-grow flex flex-col justify-between">
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-[#5C3D2E] bg-[#EBD8C1]/30 px-2.5 py-1 rounded-full">
                  {examSession.title}
                </span>
                
                <button 
                  onClick={() => navigateWithGuard('PORTAL_SELECT')}
                  className="text-xs font-bold text-[#C89B7B] hover:underline"
                >
                  解くのをやめる
                </button>
              </div>

              {!examSession.isFinished && (
                <div className="w-full bg-gray-100 rounded-full h-1.5 mb-3 border border-gray-200 overflow-hidden">
                  <div 
                    className="bg-[#C89B7B] h-full transition-all duration-300"
                    style={{ width: `${((examSession.currentIndex + 1) / examSession.questions.length) * 100}%` }}
                  />
                </div>
              )}
            </div>

            {/* 問題進行中 */}
            {!examSession.isFinished ? (
              <div className="bg-white rounded-2xl p-5 border border-[#EBD8C1] shadow-xs space-y-4.5 flex-grow flex flex-col justify-between">
                
                <div>
                  <div className="flex justify-between items-center mb-2.5 text-[10px]">
                    <span className="bg-[#5C3D2E] text-white px-2 py-0.5 rounded font-bold">
                      {examSession.questions[examSession.currentIndex]?.subject || "一般"}
                    </span>
                    <span className="text-gray-400 font-extrabold">
                      問題 {examSession.currentIndex + 1} / {examSession.questions.length}
                    </span>
                  </div>
                  
                  <h3 className="text-xs font-bold text-[#4A3225] leading-relaxed">
                    {examSession.questions[examSession.currentIndex]?.question || "問題の読み込みに失敗しました。"}
                  </h3>
                </div>

                {/* 選択肢 */}
                <div className="space-y-2.5">
                  {getOptionsArray(examSession.questions[examSession.currentIndex]?.options || "").map((opt, idx) => {
                    const cleanOpt = opt.trim();
                    // 先頭から選択肢番号（数字）を正確にパース。NaNになる場合は配列インデックスの並び順（idx + 1）をフォールバックとして採用！
                    const parsedNo = parseInt(cleanOpt.match(/^\d+/)?.[0]);
                    const optIndex = isNaN(parsedNo) ? (idx + 1) : parsedNo;
                    const optText = cleanOpt.replace(/^\d+[:.\s]*/, '');
                    
                    const isSelected = examSession.answers[examSession.currentIndex] === optIndex;
                    const isAnswered = examSession.answers[examSession.currentIndex] !== undefined;
                    const isCorrectAnswer = optIndex === (examSession.questions[examSession.currentIndex]?.answerNo || 0);

                    let btnStyle = "bg-[#FFFDF9] border-[#EBD8C1] text-gray-700 hover:bg-[#FDFBF7]";
                    
                    if (examSession.mode === 'qa') {
                      if (isAnswered) {
                        if (isSelected) {
                          btnStyle = isCorrectAnswer ? "bg-emerald-50 border-emerald-500 text-emerald-800 font-bold" : "bg-rose-50 border-rose-400 text-rose-800 font-bold";
                        } else if (isCorrectAnswer) {
                          btnStyle = "bg-emerald-50 border-emerald-400 text-emerald-800 font-bold";
                        } else {
                          btnStyle = "bg-gray-50 border-gray-200 text-gray-400 opacity-60";
                        }
                      }
                    } else {
                      if (isSelected) {
                        btnStyle = "bg-[#C89B7B]/20 border-[#C89B7B] text-[#5C3D2E] font-bold";
                      }
                    }

                    return (
                      <button
                        key={opt}
                        type="button"
                        disabled={isAnswered && examSession.mode === 'qa'}
                        onClick={() => handleSelectAnswer(optIndex)}
                        className={`w-full p-3 text-left text-xs rounded-xl border-2 transition active:scale-[0.99] flex items-start space-x-2 ${btnStyle}`}
                      >
                        <span className="font-extrabold mt-0.5">{optIndex}.</span>
                        <span>{optText || cleanOpt}</span>
                      </button>
                    );
                  })}

                  {/* 自信がない・分からないボタン */}
                  <button
                    type="button"
                    disabled={examSession.answers[examSession.currentIndex] !== undefined && examSession.mode === 'qa'}
                    onClick={() => handleSelectAnswer('dont-know')}
                    className={`w-full p-2 text-center text-[11px] font-bold rounded-lg transition ${
                      examSession.answers[examSession.currentIndex] === 'dont-know'
                        ? 'bg-amber-100 border-amber-400 text-amber-800'
                        : 'bg-[#FFFDF9] border border-amber-200 text-amber-850'
                    }`}
                  >
                    分からない / 自信がない
                  </button>
                </div>

                {/* 解説＆進むボタン */}
                <div className="pt-3 border-t border-dashed border-[#EBD8C1] space-y-3">
                  
                  {examSession.mode === 'qa' && examSession.answers[examSession.currentIndex] !== undefined && (
                    <div className="bg-[#FDFBF7] p-3 rounded-xl border border-[#EBD8C1] space-y-1 text-xs animate-fade-in">
                      <div className="flex items-center space-x-1 font-bold">
                        {examSession.answers[examSession.currentIndex] === examSession.questions[examSession.currentIndex]?.answerNo ? (
                          <>
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700">正解！</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                            <span className="text-rose-700">
                              {examSession.answers[examSession.currentIndex] === 'dont-know' ? '解説を確認' : '不正解...'}
                            </span>
                          </>
                        )}
                        <span className="text-gray-400 text-[9px]">
                          (正解: {examSession.questions[examSession.currentIndex]?.answerNo || 1})
                        </span>
                      </div>
                      <p className="text-gray-500 text-[10px] leading-relaxed">
                        {examSession.questions[examSession.currentIndex]?.explanation || "解説は登録されていません。"}
                      </p>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[10px] text-gray-400">
                      {examSession.currentIndex === examSession.questions.length - 1 ? '最終問題' : '次へ進んでください'}
                    </span>

                    <button
                      type="button"
                      disabled={examSession.answers[examSession.currentIndex] === undefined}
                      onClick={handleNextQuestion}
                      className={`px-6 py-2 rounded-lg text-xs font-bold shadow-xs transition ${
                        examSession.answers[examSession.currentIndex] !== undefined
                          ? 'bg-[#5C3D2E] hover:bg-[#442C21] text-white'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {examSession.currentIndex === examSession.questions.length - 1
                        ? (examSession.mode === 'review-after' ? '回答を終了する' : '結果を見る')
                        : '次へ →'
                      }
                    </button>
                  </div>
                </div>

              </div>
            ) : (
              
              // ==========================================
              // 演習終了結果画面 (全問解説の一括スクロール)
              // ==========================================
              <div className="space-y-4 flex-grow flex flex-col justify-start animate-fade-in">
                
                {/* スコアカード */}
                <div className="bg-white rounded-2xl p-5 border border-[#EBD8C1] shadow-xs text-center space-y-2">
                  <span className="bg-[#EBD8C1] text-[#5C3D2E] text-[10px] font-black px-3 py-1 rounded-full">
                    RESULT
                  </span>
                  <h3 className="text-base font-black text-[#5C3D2E]">演習結果</h3>
                  
                  <div className="py-2 flex items-baseline justify-center space-x-1">
                    <span className="text-4xl font-black text-[#5C3D2E]">
                      {examSession.questions.filter((q, idx) => examSession.answers[idx] === q.answerNo).length}
                    </span>
                    <span className="text-gray-400 font-bold">/</span>
                    <span className="text-lg font-bold text-gray-500">{examSession.questions.length}問</span>
                    <span className="text-xs font-bold text-gray-700 ml-2">正解</span>
                  </div>

                  <p className="text-[10px] text-gray-400">
                    解答状況はスプレッドシート（履歴）に自動記録されました。
                  </p>
                </div>

                {/* 苦手確認(weakness-test) 終了時の追加選択肢 */}
                {examSession.type === 'weakness-test' && (
                  <div className="bg-[#FFFDF9] p-3.5 rounded-xl border border-[#C89B7B] space-y-3">
                    <h4 className="text-xs font-bold text-[#5C3D2E]">次のアクションを選択してください</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => startWeaknessExam(examSession.originalConfig.subject)}
                        className="py-2 bg-[#5C3D2E] text-white text-[10px] font-bold rounded-lg shadow-xs"
                      >
                        引き続き今の分野を解く
                      </button>
                      <button
                        onClick={() => {
                          const sortedStats = Object.keys(categoryStats)
                            .map(subj => ({
                              subject: subj,
                              rate: categoryStats[subj].total > 0 ? categoryStats[subj].correct / categoryStats[subj].total : 1.01
                            }))
                            .filter(x => x.rate < 1.0)
                            .sort((a, b) => a.rate - b.rate);

                          const nextWeakest = sortedStats.find(x => x.subject !== examSession.originalConfig.subject);
                          if (nextWeakest) {
                            startWeaknessExam(nextWeakest.subject);
                          } else {
                            startWeaknessExam(examSession.originalConfig.subject);
                          }
                        }}
                        className="py-2 bg-[#C89B7B] text-white text-[10px] font-bold rounded-lg shadow-xs"
                      >
                        別の苦手分野の演習へ
                      </button>
                    </div>
                  </div>
                )}

                {/* 苦手克服一問一答(weakness) 終了時 */}
                {examSession.type === 'weakness' && (
                  <div className="bg-[#FFFDF9] p-3.5 rounded-xl border border-[#C89B7B] space-y-3">
                    <h4 className="text-xs font-bold text-[#5C3D2E]">次のアクションを選択してください</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => startWeaknessTest(examSession.originalConfig.subject)}
                        className="py-2 bg-[#5C3D2E] text-white text-[10px] font-bold rounded-lg"
                      >
                        確認問題を解く (テスト5問)
                      </button>
                      <button
                        onClick={() => startWeaknessExam(examSession.originalConfig.subject)}
                        className="py-2 bg-[#C89B7B] text-white text-[10px] font-bold rounded-lg"
                      >
                        別の問題で再チャレンジ
                      </button>
                    </div>
                  </div>
                )}

                {/* 全問題一括振り返り(縦長スクロール) */}
                <h4 className="text-xs font-bold text-gray-400 tracking-wider">解答解説一覧</h4>
                
                <div className="space-y-3 overflow-y-auto max-h-[280px] pr-1">
                  {examSession.questions.map((q, idx) => {
                    const userAns = examSession.answers[idx];
                    const isCorrect = userAns === q.answerNo;
                    
                    return (
                      <div key={idx} className={`p-4 bg-white rounded-xl border-2 shadow-xs ${isCorrect ? 'border-emerald-200' : 'border-rose-200'}`}>
                        <div className="flex justify-between items-center text-xs mb-1">
                          <span className="font-bold text-gray-400">問題 {idx + 1}</span>
                          <span className={`font-bold px-2 py-0.5 rounded text-[9px] ${isCorrect ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>
                            {isCorrect ? '正解 ⭕' : '不正解 ❌'}
                          </span>
                        </div>
                        
                        <p className="text-xs font-bold text-gray-700 mb-2">{q.question}</p>
                        
                        <div className="bg-gray-50 p-2.5 rounded-lg text-[10px] space-y-1 mb-2">
                          <div>
                            <span className="text-gray-400">選んだ解答:</span>{' '}
                            <span className={`font-bold ${isCorrect ? 'text-emerald-700' : 'text-rose-600'}`}>
                              {userAns === 'dont-know' ? '分からない' : userAns || '未回答'}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-400">正解:</span>{' '}
                            <span className="font-bold text-emerald-700">{q.answerNo}</span>
                          </div>
                        </div>

                        <div className="bg-[#FDFBF7] p-2 rounded-lg border border-[#EBD8C1] text-[10px] text-gray-500 leading-normal">
                          {q.explanation || "解説は登録されていません。"}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-2">
                  <button 
                    onClick={() => {
                      setExamSession(null);
                      setCurrentScreen('PORTAL_SELECT');
                    }}
                    className="w-full py-3 bg-[#5C3D2E] text-white font-bold rounded-xl text-xs"
                  >
                    ポータル選択に戻る
                  </button>
                </div>

              </div>
            )}

          </div>
        )}

      </main>

      {/* プレミアム・コピーライト */}
      <footer className="bg-[#5C3D2E] text-[#EBD8C1] py-4 text-center text-[11px] border-t border-[#C89B7B] mt-auto">
        <p className="font-semibold tracking-wider">製菓衛生師 過去問システム</p>
        <p className="text-[9px] opacity-80 mt-1">© 2026 ハッピー製菓調理専門学校</p>
      </footer>

      {/* 全画面共通モーダル */}
      {customModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-[#EBD8C1] space-y-4">
            <div className="flex items-center space-x-2.5 text-amber-700">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 text-[#C89B7B]" />
              <h4 className="font-extrabold text-xs text-[#5C3D2E]">{customModal.title}</h4>
            </div>
            
            <p className="text-xs text-gray-600 leading-relaxed font-medium">
              {customModal.message}
            </p>

            <div className="flex space-x-2 pt-2 text-xs">
              <button
                type="button" onClick={customModal.onCancel}
                className="flex-1 py-2 border border-[#EBD8C1] hover:bg-gray-50 text-gray-700 font-bold rounded-xl"
              >
                {customModal.cancelText}
              </button>
              <button
                type="button" onClick={customModal.onConfirm}
                className="flex-1 py-2 bg-[#5C3D2E] text-white font-bold rounded-xl shadow-md"
              >
                {customModal.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}