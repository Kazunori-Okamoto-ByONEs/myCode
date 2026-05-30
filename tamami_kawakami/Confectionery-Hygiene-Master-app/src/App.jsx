import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Award, 
  Users, 
  LogIn, 
  LogOut, 
  ChevronRight, 
  RotateCcw, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  ArrowLeft, 
  ChevronDown, 
  ChevronUp, 
  Sliders, 
  Check, 
  Sparkles,
  HelpCircle,
  Database,
  RefreshCw
} from 'lucide-react';

// =================================================================
// 💡 【超重要】ここにGASで作成したウェブアプリURLを貼り付けてください！
// 空白のままで保存した場合は、自動的にデモ用の内蔵データで安全に起動します。
// =================================================================
const GAS_API_URL = "https://script.google.com/macros/s/AKfycbwbQZreiwk24bA6k5DD_x0wyXS5RZSk6B5Wz1ktGs-kHFeomGXIj23a12lgR-QzHtSTRg/exec"; 

// --- 初期ビルトインデータ（GAS接続がない場合のテスト・フォールバック用） ---
const DEFAULT_PAST_QUESTIONS = [
  {
    id: "q1",
    region: "東京都",
    year: "令和7年度",
    subject: "製菓理論",
    number: "1",
    question: "小麦粉の主要なタンパク質であるグリアジンとグルテニンに水を加えて捏ねることで形成される、弾力性と粘性を持つ物質は次のうちどれか。",
    options: ["デンプン", "グルテン", "ペクチン", "ゼラチン"],
    answerIndex: 1,
    explanation: "小麦粉に含まれるグリアジン（粘性）とグルテニン（弾力性）が水と結合して「グルテン」を形成します。"
  },
  {
    id: "q2",
    region: "東京都",
    year: "令和7年度",
    subject: "製菓実技",
    number: "2",
    question: "洋菓子製造において、卵白に砂糖を加えて泡立て、気泡性を高めた製菓材料を何と呼ぶか。",
    options: ["カスタード", "ガナッシュ", "メレンゲ", "プラリネ"],
    answerIndex: 2,
    explanation: "卵白を泡立てたものは「メレンゲ」です。"
  }
];

const DEFAULT_ACCOUNTS = [
  { id: "admin", name: "管理者先生", furigana: "かんりしゃせんせい", role: "admin" },
  { id: "1001", name: "山田　花子", furigana: "やまだ　はなこ", role: "student" }
];

export default function App() {
  // --- 状態管理 ---
  const [currentUser, setCurrentUser] = useState(null);
  const [loginId, setLoginId] = useState("");
  const [loginError, setLoginError] = useState("");
  const [currentScreen, setCurrentScreen] = useState('login');
  const [isLoading, setIsLoading] = useState(false);
  const [isUsingGas, setIsUsingGas] = useState(false);

  // データマスター
  const [pastQuestions, setPastQuestions] = useState(DEFAULT_PAST_QUESTIONS);
  const [classroomQuestions, setClassroomQuestions] = useState([]);
  const [accounts, setAccounts] = useState(DEFAULT_ACCOUNTS);
  const [portalRegions, setPortalRegions] = useState([
    { region: "東京都", year: "令和7年度" }
  ]);
  const [history, setHistory] = useState([]);
  const [isClassroomPublished, setIsClassroomPublished] = useState(false);

  // ポータル制御
  const [activePortalSection, setActivePortalSection] = useState(null);
  const [quizMode, setQuizMode] = useState('one-by-one');
  const [isRandomSort, setIsRandomSort] = useState(false);

  // 特定の問題フィルタ用
  const [specificRegion, setSpecificRegion] = useState("すべて");
  const [specificYear, setSpecificYear] = useState("すべて");
  const [specificSubject, setSpecificSubject] = useState("すべて");
  const [specificLimit, setSpecificLimit] = useState(10);

  // 間違えた問題フィルタ用
  const [wrongRegion, setWrongRegion] = useState("すべて");
  const [wrongYear, setWrongYear] = useState("すべて");
  const [wrongSubject, setWrongSubject] = useState("すべて");
  const [wrongLimit, setWrongLimit] = useState(10);

  // クイズ本番データ
  const [currentQuestions, setCurrentQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userSelectedAnswers, setUserSelectedAnswers] = useState({});
  const [oneByOneState, setOneByOneState] = useState(null);
  const [quizFinished, setQuizFinished] = useState(false);
  const [quizSource, setQuizSource] = useState('past');

  // モーダル警告類
  const [showNavWarning, setShowNavWarning] = useState(false);
  const [pendingScreen, setPendingScreen] = useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);

  // 1. 最初期のデータ読み込み（GASがある場合は優先してロード）
  useEffect(() => {
    if (GAS_API_URL && GAS_API_URL.startsWith("http")) {
      setIsUsingGas(true);
      fetchMasterData();
    } else {
      // GASがない場合はローカルストレージから履歴のみ復元
      const localHist = localStorage.getItem('past_exam_history');
      if (localHist) setHistory(JSON.parse(localHist));
    }
  }, []);

  // ユーザーが変更されたら履歴を再ロード（GAS接続時）
  useEffect(() => {
    if (currentUser && isUsingGas) {
      fetchUserHistory(currentUser.id);
    }
  }, [currentUser]);

  // スプレッドシートからデータを取得する
  const fetchMasterData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${GAS_API_URL}?action=getInitData`);
      const res = await response.json();
      if (res.status === "success" && res.data) {
        const d = res.data;
        
        // スプレッドシートのデータをアプリ仕様のJSONに綺麗に成形
        if (d.pastQuestions) {
          const parsed = d.pastQuestions.map((q, idx) => ({
            id: `q_${idx}`,
            region: q["地域"] || "不明",
            year: q["年度"] || "不明",
            subject: q["科目"] || "不明",
            number: String(q["問題番号"] || "1"),
            question: q["問題"] || "",
            options: typeof q["選択肢"] === 'string' ? q["選択肢"].split(/[,、\n]/) : ["選択肢データなし"],
            answerIndex: Number(q["解答番号"] || 1) - 1, // 1始まりから0始まりへ変換
            explanation: q["解説"] || "解説は登録されていません。"
          }));
          setPastQuestions(parsed);
        }

        if (d.classroomQuestions) {
          const parsedClassroom = d.classroomQuestions.map((q, idx) => ({
            id: `cq_${idx}`,
            region: q["地域"] || "不明",
            year: q["年度"] || "不明",
            subject: q["科目"] || "不明",
            number: String(q["問題番号"] || "1"),
            question: q["問題"] || "",
            options: typeof q["選択肢"] === 'string' ? q["選択肢"].split(/[,、\n]/) : ["選択肢データなし"],
            answerIndex: Number(q["解答番号"] || 1) - 1,
            explanation: q["解説"] || "解説は登録されていません。"
          }));
          setClassroomQuestions(parsedClassroom);
        }

        if (d.accounts) {
          const parsedAccs = d.accounts.map(acc => ({
            id: String(acc["学籍番号"]),
            name: acc["名前"] || "名前未登録",
            furigana: acc["なまえ"] || "",
            role: String(acc["学籍番号"]).toLowerCase() === 'admin' ? 'admin' : 'student'
          }));
          setAccounts(parsedAccs);
        }

        if (d.portalRegions) {
          const parsedRegions = d.portalRegions.map(item => ({
            region: item["地域"] || "",
            year: item["年度"] || ""
          }));
          setPortalRegions(parsedRegions);
        }

        setIsClassroomPublished(!!d.classroomPublished);
      }
    } catch (e) {
      console.error("スプレッドシートの読み込みエラー。ローカルデモを使用します:", e);
      setIsUsingGas(false);
    } finally {
      setIsLoading(false);
    }
  };

  // スプレッドシートから履歴を取得
  const fetchUserHistory = async (studentId) => {
    try {
      const response = await fetch(`${GAS_API_URL}?action=getHistory&studentId=${studentId}`);
      const res = await response.json();
      if (res.status === "success" && res.data && res.data.history) {
        setHistory(res.data.history);
      }
    } catch (e) {
      console.error("履歴のロードに失敗しました:", e);
    }
  };

  // 解答履歴をスプレッドシート（またはローカル）に送信
  const saveAnswerHistory = async (question, selectedIndex, isCorrect) => {
    const questionKey = `${question.region}_${question.year}_${question.subject}_${question.number}`;
    const timestamp = new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
    const record = {
      historyId: `hist_${Date.now()}`,
      studentId: currentUser?.id || "guest",
      questionKey: questionKey,
      quizType: quizSource === 'classroom' ? "授業用" : "過去問",
      userAnswer: selectedIndex === -1 ? "分からない" : question.options[selectedIndex],
      isCorrect: isCorrect,
      answeredAt: timestamp
    };

    // 1. まずローカルのステートに反映
    const newHist = [record, ...history];
    setHistory(newHist);
    localStorage.setItem('past_exam_history', JSON.stringify(newHist));

    // 2. GAS経由でスプレッドシートに書き込み
    if (isUsingGas) {
      try {
        await fetch(GAS_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          mode: 'no-cors', // クロスオリジン対策
          body: JSON.stringify({
            action: "addHistory",
            ...record
          })
        });
      } catch (e) {
        console.error("スプレッドシートへの履歴書き込みエラー:", e);
      }
    }
  };

  // 授業用問題の公開フラグをGAS経由で更新
  const updateClassroomPublishStatus = async (published) => {
    setIsClassroomPublished(published);
    if (isUsingGas) {
      try {
        await fetch(GAS_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          mode: 'no-cors',
          body: JSON.stringify({
            action: "updatePublishStatus",
            published: published
          })
        });
      } catch (e) {
        console.error("公開ステータスの更新に失敗しました:", e);
      }
    }
  };

  // --- ログイン認証 ---
  const handleLogin = (e) => {
    e.preventDefault();
    const idClean = loginId.trim().toLowerCase();
    const account = accounts.find(acc => acc.id.toLowerCase() === idClean);
    if (account) {
      setCurrentUser(account);
      setLoginError("");
      setCurrentScreen('home');
    } else {
      setLoginError("この番号は登録されていません。（スプレッドシートの「アカウントマスター」をご確認ください）");
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setLoginId("");
    setCurrentScreen('login');
    setShowLogoutConfirm(false);
  };

  // --- 画面遷移コントロール ---
  const attemptNavigation = (targetScreen) => {
    const isOngoing = (currentScreen === 'quiz') && !quizFinished;
    if (isOngoing) {
      setPendingScreen(targetScreen);
      setShowNavWarning(true);
    } else {
      setCurrentScreen(targetScreen);
    }
  };

  const confirmNavigation = () => {
    setShowNavWarning(false);
    if (pendingScreen) {
      setQuizFinished(false);
      setUserSelectedAnswers({});
      setOneByOneState(null);
      setCurrentScreen(pendingScreen);
      setPendingScreen(null);
    }
  };

  // --- クイズロジック ---
  const startRegionYearQuiz = (region, year) => {
    let questions = pastQuestions.filter(q => q.region === region && q.year === year);
    if (questions.length === 0) return;

    if (isRandomSort) {
      questions = [...questions].sort(() => Math.random() - 0.5);
    }

    setCurrentQuestions(questions);
    setCurrentQuestionIndex(0);
    setUserSelectedAnswers({});
    setOneByOneState(null);
    setQuizFinished(false);
    setQuizSource('past');
    setCurrentScreen('quiz');
  };

  const startSpecificQuiz = () => {
    let questions = [...pastQuestions];
    if (specificRegion !== "すべて") questions = questions.filter(q => q.region === specificRegion);
    if (specificYear !== "すべて") questions = questions.filter(q => q.year === specificYear);
    if (specificSubject !== "すべて") questions = questions.filter(q => q.subject === specificSubject);

    questions.sort(() => Math.random() - 0.5);
    const limit = Math.min(specificLimit, questions.length);
    const finalQuestions = questions.slice(0, limit);

    if (finalQuestions.length === 0) {
      alert("該当する問題がありません。");
      return;
    }

    setCurrentQuestions(finalQuestions);
    setCurrentQuestionIndex(0);
    setUserSelectedAnswers({});
    setOneByOneState(null);
    setQuizFinished(false);
    setQuizSource('past');
    setCurrentScreen('quiz');
  };

  // 間違えた問題のみ抽出
  const getWrongQuestionsList = () => {
    const latestResultMap = {};
    const sortedHistory = [...history].sort((a, b) => new Date(a.answeredAt) - new Date(b.answeredAt));
    
    sortedHistory.forEach(h => {
      latestResultMap[h.questionKey] = h.isCorrect;
    });

    const wrongKeys = Object.keys(latestResultMap).filter(key => !latestResultMap[key]);

    let wrongQuestions = pastQuestions.filter(q => {
      const qKey = `${q.region}_${q.year}_${q.subject}_${q.number}`;
      return wrongKeys.includes(qKey);
    });

    if (wrongRegion !== "すべて") wrongQuestions = wrongQuestions.filter(q => q.region === wrongRegion);
    if (wrongYear !== "すべて") wrongQuestions = wrongQuestions.filter(q => q.year === wrongYear);
    if (wrongSubject !== "すべて") wrongQuestions = wrongQuestions.filter(q => q.subject === wrongSubject);

    return wrongQuestions;
  };

  const startWrongReviewQuiz = () => {
    let wrongQuestions = getWrongQuestionsList();
    if (wrongQuestions.length === 0) return;

    wrongQuestions.sort(() => Math.random() - 0.5);
    const limit = Math.min(wrongLimit, wrongQuestions.length);
    const finalQuestions = wrongQuestions.slice(0, limit);

    setCurrentQuestions(finalQuestions);
    setCurrentQuestionIndex(0);
    setUserSelectedAnswers({});
    setOneByOneState(null);
    setQuizFinished(false);
    setQuizSource('past');
    setCurrentScreen('quiz');
  };

  const startClassroomQuiz = () => {
    if (!isClassroomPublished && currentUser?.role !== 'admin') return;
    setCurrentQuestions(classroomQuestions);
    setCurrentQuestionIndex(0);
    setUserSelectedAnswers({});
    setOneByOneState(null);
    setQuizFinished(false);
    setQuizSource('classroom');
    setCurrentScreen('quiz');
  };

  const startSingleReplay = (question) => {
    setCurrentQuestions([question]);
    setCurrentQuestionIndex(0);
    setUserSelectedAnswers({});
    setOneByOneState(null);
    setQuizFinished(false);
    setQuizSource('past');
    setCurrentScreen('quiz');
  };

  // 解答処理
  const handleSelectOption = (optionIndex) => {
    const question = currentQuestions[currentQuestionIndex];
    const isCorrect = optionIndex === question.answerIndex;

    setUserSelectedAnswers(prev => ({ ...prev, [question.id]: optionIndex }));

    if (quizMode === 'one-by-one') {
      setOneByOneState({
        isAnswered: true,
        selectedIndex: optionIndex,
        isCorrect: isCorrect
      });
      saveAnswerHistory(question, optionIndex, isCorrect);
    } else {
      setOneByOneState({
        isAnswered: true,
        selectedIndex: optionIndex,
        isCorrect: null
      });
    }
  };

  const handleDontKnow = () => {
    const question = currentQuestions[currentQuestionIndex];
    setUserSelectedAnswers(prev => ({ ...prev, [question.id]: -1 }));

    if (quizMode === 'one-by-one') {
      setOneByOneState({
        isAnswered: true,
        selectedIndex: -1,
        isCorrect: false
      });
      saveAnswerHistory(question, -1, false);
    } else {
      setOneByOneState({
        isAnswered: true,
        selectedIndex: -1,
        isCorrect: null
      });
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < currentQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      const nextQ = currentQuestions[currentQuestionIndex + 1];
      const previousAnswer = userSelectedAnswers[nextQ.id];
      if (previousAnswer !== undefined) {
        setOneByOneState({
          isAnswered: true,
          selectedIndex: previousAnswer,
          isCorrect: quizMode === 'one-by-one' ? previousAnswer === nextQ.answerIndex : null
        });
      } else {
        setOneByOneState(null);
      }
    } else {
      if (quizMode === 'one-by-one') {
        setQuizFinished(true);
      } else {
        setShowFinishConfirm(true);
      }
    }
  };

  const confirmFinishAllQuiz = () => {
    setShowFinishConfirm(false);
    setQuizFinished(true);

    // 全問解答形式の場合は、終了時にまとめて履歴に保存
    currentQuestions.forEach(q => {
      const selectedIndex = userSelectedAnswers[q.id];
      const isCorrect = selectedIndex === q.answerIndex;
      saveAnswerHistory(q, selectedIndex === undefined ? -1 : selectedIndex, isCorrect);
    });
  };

  // --- 成績表マッピング ---
  const renderPerformanceTable = () => {
    const sortedHistory = [...history].sort((a, b) => new Date(a.answeredAt) - new Date(b.answeredAt));
    const uniqueDates = Array.from(new Set(sortedHistory.map(h => h.answeredAt.split(' ')[0])));
    const rowMap = {};

    sortedHistory.forEach(record => {
      const key = record.questionKey;
      if (!rowMap[key]) {
        let matchedQ = pastQuestions.find(q => `${q.region}_${q.year}_${q.subject}_${q.number}` === key);
        if (!matchedQ) {
          matchedQ = classroomQuestions.find(q => `${q.region}_${q.year}_${q.subject}_${q.number}` === key);
        }

        rowMap[key] = {
          questionKey: key,
          subject: matchedQ ? matchedQ.subject : key.split('_')[2] || "不明",
          region: matchedQ ? matchedQ.region : key.split('_')[0] || "",
          year: matchedQ ? matchedQ.year : key.split('_')[1] || "",
          qNumber: matchedQ ? matchedQ.number : key.split('_')[3] || "",
          questionText: matchedQ ? matchedQ.question : "問題データなし",
          fullQuestionObj: matchedQ,
          resultsByDate: {}
        };
      }
      const dateOnly = record.answeredAt.split(' ')[0];
      rowMap[key].resultsByDate[dateOnly] = record.isCorrect;
    });

    return { uniqueDates, rows: Object.values(rowMap) };
  };

  const { uniqueDates, rows: performanceRows } = renderPerformanceTable();

  return (
    <div className="min-h-screen bg-amber-50/40 text-stone-800 font-sans flex flex-col antialiased">
      
      {/* ヘッダー */}
      <header className="sticky top-0 z-40 bg-white border-b border-amber-100 shadow-sm px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="bg-amber-800 text-white p-1.5 rounded-lg flex items-center justify-center shadow-sm">
            <Sparkles className="w-5 h-5 text-amber-200" />
          </div>
          <div>
            <h1 className="text-base font-bold text-stone-900 tracking-tight flex items-center">
              製菓衛生師試験
              <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-semibold bg-amber-100 text-amber-950 rounded">過去問</span>
            </h1>
            {currentUser && (
              <p className="text-[10px] text-stone-500">
                👤 {currentUser.name} さん（学籍番号: {currentUser.id}）
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          {isUsingGas ? (
            <span className="px-2 py-1 rounded bg-emerald-100 text-emerald-800 text-[9px] font-bold flex items-center gap-1">
              <Database className="w-3 h-3" /> 連動中
            </span>
          ) : (
            <span className="px-2 py-1 rounded bg-stone-100 text-stone-500 text-[9px] font-bold">
              デモモード
            </span>
          )}
          
          {currentUser && (
            <button 
              onClick={() => setShowLogoutConfirm(true)}
              className="px-2 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition"
            >
              ログアウト
            </button>
          )}
        </div>
      </header>

      {/* ロード画面 */}
      {isLoading && (
        <div className="fixed inset-0 bg-white/80 z-50 flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="w-8 h-8 text-amber-800 animate-spin" />
          <p className="text-xs text-stone-600 font-bold">スプレッドシートからデータを取得中...</p>
        </div>
      )}

      {/* メイン画面 */}
      <main className="flex-1 max-w-md w-full mx-auto px-4 py-6 flex flex-col justify-start">
        
        {/* 1. ログイン */}
        {currentScreen === 'login' && (
          <div className="flex-1 flex flex-col justify-center py-4">
            <div className="bg-white rounded-2xl shadow-md border border-amber-100 p-6 space-y-6">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto shadow-inner text-amber-800">
                  <BookOpen className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold text-stone-950">ログイン</h2>
                <p className="text-xs text-stone-500">スプレッドシート上の学籍番号を入力してください。</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">学籍番号</label>
                  <input 
                    type="text"
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                    placeholder="例: 1001 または admin"
                    className="w-full px-4 py-3 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-base"
                    required
                  />
                  {loginError && (
                    <p className="text-xs text-rose-600 mt-1.5 flex items-center font-medium">
                      <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                      {loginError}
                    </p>
                  )}
                </div>

                <button 
                  type="submit"
                  className="w-full bg-gradient-to-r from-amber-800 to-amber-900 text-white font-bold py-3 px-4 rounded-xl shadow-md transition text-base"
                >
                  開始する
                </button>
              </form>

              {/* クイックログイン用リスト */}
              <div className="border-t border-dashed border-amber-100 pt-4">
                <p className="text-xs text-stone-400 font-bold mb-2">ログイン可能なアカウント一覧</p>
                <div className="grid grid-cols-2 gap-2">
                  {accounts.map(acc => (
                    <button
                      key={acc.id}
                      onClick={() => { setLoginId(acc.id); setLoginError(""); }}
                      className={`p-2 text-xs rounded-lg border text-left flex flex-col transition ${
                        loginId === acc.id ? 'border-amber-500 bg-amber-50' : 'border-stone-200 bg-white'
                      }`}
                    >
                      <span className="font-bold">{acc.name}</span>
                      <span className="text-[9px] text-stone-400">ID: {acc.id}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. ホーム */}
        {currentScreen === 'home' && (
          <div className="space-y-6 py-2">
            <div className="bg-gradient-to-br from-amber-900 to-stone-900 rounded-2xl p-5 text-white shadow-lg space-y-3">
              <div>
                <span className="text-[10px] bg-amber-500/30 text-amber-200 px-2 py-0.5 rounded-full font-bold">製菓衛生師</span>
                <h3 className="text-lg font-bold">合格を目指しましょう、{currentUser?.name}さん</h3>
              </div>
              <div className="bg-white/10 rounded-xl p-3 flex justify-between items-center text-xs">
                <div>
                  <p className="text-amber-200 text-[10px]">総解答履歴数</p>
                  <p className="text-base font-bold">{history.length} 回</p>
                </div>
                <div className="text-right">
                  <p className="text-amber-200 text-[10px]">直近正答率</p>
                  <p className="text-base font-bold text-emerald-300">
                    {history.length > 0 ? `${Math.round((history.filter(h => h.isCorrect).length / history.length) * 100)}%` : '0%'}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button 
                onClick={() => attemptNavigation('portal')}
                className="w-full bg-white border border-amber-100 p-4 rounded-xl shadow-sm text-left flex items-center justify-between transition group"
              >
                <div className="flex items-center space-x-3">
                  <div className="bg-amber-100 text-amber-900 p-3 rounded-xl">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-stone-900">過去問を解く</h4>
                    <p className="text-xs text-stone-500">条件指定や、苦手分野の集中演習</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-stone-400" />
              </button>

              <button 
                onClick={() => attemptNavigation('results')}
                className="w-full bg-white border border-amber-100 p-4 rounded-xl shadow-sm text-left flex items-center justify-between transition group"
              >
                <div className="flex items-center space-x-3">
                  <div className="bg-emerald-50 text-emerald-900 p-3 rounded-xl">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-stone-900">成績表を確認</h4>
                    <p className="text-xs text-stone-500">これまでの正誤表から直接問題にリベンジ</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-stone-400" />
              </button>

              {currentUser?.role === 'admin' ? (
                <div className="border border-amber-200 bg-amber-50/30 p-4 rounded-xl shadow-sm space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="bg-indigo-100 text-indigo-900 p-3 rounded-xl">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-stone-900">授業用問題の管理（先生メニュー）</h4>
                      <p className="text-xs text-stone-500">公開状態：{isClassroomPublished ? "🟢 公開中" : "⚪ 非公開"}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 border-t border-amber-100/60 pt-2">
                    <button 
                      onClick={() => setShowPublishConfirm(true)}
                      className="flex-1 py-2 rounded-lg text-xs font-bold bg-amber-800 text-white"
                    >
                      公開設定を切り替える
                    </button>
                    <button 
                      onClick={startClassroomQuiz}
                      className="py-2 px-4 rounded-lg text-xs font-bold bg-indigo-900 text-white"
                    >
                      テストプレイ
                    </button>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={isClassroomPublished ? startClassroomQuiz : null}
                  disabled={!isClassroomPublished}
                  className={`w-full border p-4 rounded-xl text-left flex items-center justify-between transition ${
                    isClassroomPublished ? 'bg-white border-amber-100 shadow-sm' : 'bg-stone-100 border-stone-200 text-stone-400 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-3 rounded-xl ${isClassroomPublished ? 'bg-indigo-100 text-indigo-900' : 'bg-stone-200'}`}>
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold">授業用問題 {!isClassroomPublished && "(非公開)"}</h4>
                      <p className="text-xs text-stone-500">先生が問題をアクティブにすると利用できます</p>
                    </div>
                  </div>
                  {isClassroomPublished && <ChevronRight className="w-5 h-5" />}
                </button>
              )}
            </div>
          </div>
        )}

        {/* 3. 過去問ポータル */}
        {currentScreen === 'portal' && (
          <div className="space-y-6 py-2">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-stone-900">過去問ポータル</h3>
              <button onClick={() => attemptNavigation('home')} className="text-xs font-bold text-amber-900">戻る</button>
            </div>

            <div className="space-y-3">
              {/* 地域＆年度で指定 */}
              <div className="border bg-white rounded-xl overflow-hidden">
                <button 
                  onClick={() => setActivePortalSection(activePortalSection === 'regionYear' ? null : 'regionYear')}
                  className="w-full p-4 flex items-center justify-between font-bold text-sm"
                >
                  <span>🎯 地域と年度を選択してじっくり解く</span>
                  {activePortalSection === 'regionYear' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {activePortalSection === 'regionYear' && (
                  <div className="p-4 bg-stone-50/50 border-t space-y-4 text-xs">
                    <div className="flex flex-wrap gap-2 items-center justify-between bg-white p-2.5 rounded-lg border">
                      <div className="flex items-center space-x-1">
                        <span className="font-bold">形式:</span>
                        <button onClick={() => setQuizMode('one-by-one')} className={`px-2 py-0.5 rounded ${quizMode === 'one-by-one' ? 'bg-amber-800 text-white font-bold' : 'bg-stone-100'}`}>一問一答</button>
                        <button onClick={() => setQuizMode('all-after')} className={`px-2 py-0.5 rounded ${quizMode === 'all-after' ? 'bg-amber-800 text-white font-bold' : 'bg-stone-100'}`}>後で確認</button>
                      </div>
                      <label className="flex items-center space-x-1 font-bold">
                        <input type="checkbox" checked={isRandomSort} onChange={(e) => setIsRandomSort(e.target.checked)} />
                        <span>出題順をランダム化</span>
                      </label>
                    </div>

                    <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                      {portalRegions.map((item, idx) => {
                        const count = pastQuestions.filter(q => q.region === item.region && q.year === item.year).length;
                        return (
                          <button 
                            key={idx} 
                            onClick={() => startRegionYearQuiz(item.region, item.year)}
                            className="w-full p-2.5 rounded border bg-white flex justify-between hover:border-amber-500"
                          >
                            <span className="font-bold">{item.region} ({item.year})</span>
                            <span className="text-[10px] bg-amber-100 px-1.5 py-0.5 rounded">{count}問</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* 特定の問題を解く */}
              <div className="border bg-white rounded-xl overflow-hidden">
                <button 
                  onClick={() => setActivePortalSection(activePortalSection === 'specific' ? null : 'specific')}
                  className="w-full p-4 flex items-center justify-between font-bold text-sm"
                >
                  <span>🔍 特定の科目を指定してランダム抽出</span>
                  {activePortalSection === 'specific' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {activePortalSection === 'specific' && (
                  <div className="p-4 bg-stone-50/50 border-t space-y-3 text-xs">
                    <div>
                      <label className="block font-bold mb-1">科目</label>
                      <select value={specificSubject} onChange={(e) => setSpecificSubject(e.target.value)} className="w-full p-2 border rounded-lg bg-white">
                        <option value="すべて">すべて</option>
                        <option value="製菓理論">製菓理論</option>
                        <option value="製菓実技">製菓実技</option>
                        <option value="食品衛生学">食品衛生学</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold mb-1">出題数</label>
                      <input type="number" min="1" value={specificLimit} onChange={(e) => setSpecificLimit(Number(e.target.value))} className="w-full p-2 border rounded-lg text-center font-bold" />
                    </div>
                    <button onClick={startSpecificQuiz} className="w-full bg-amber-800 text-white font-bold py-2 rounded-lg">この条件で出題</button>
                  </div>
                )}
              </div>

              {/* 間違えた問題 */}
              <div className="border bg-white rounded-xl overflow-hidden">
                <button 
                  onClick={() => setActivePortalSection(activePortalSection === 'reviewWrong' ? null : 'reviewWrong')}
                  className="w-full p-4 flex items-center justify-between font-bold text-sm text-rose-900"
                >
                  <span>⚠️ 過去に間違えた問題からリベンジ</span>
                  {activePortalSection === 'reviewWrong' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {activePortalSection === 'reviewWrong' && (
                  <div className="p-4 bg-rose-50/20 border-t space-y-3 text-xs">
                    <p className="font-bold text-rose-950">現在の苦手問題: {getWrongQuestionsList().length} 問</p>
                    <div>
                      <label className="block font-bold mb-1">科目</label>
                      <select value={wrongSubject} onChange={(e) => setWrongSubject(e.target.value)} className="w-full p-2 border rounded-lg bg-white">
                        <option value="すべて">すべて</option>
                        <option value="製菓理論">製菓理論</option>
                        <option value="製菓実技">製菓実技</option>
                      </select>
                    </div>
                    <button 
                      onClick={startWrongReviewQuiz} 
                      disabled={getWrongQuestionsList().length === 0}
                      className={`w-full font-bold py-2 rounded-lg ${getWrongQuestionsList().length === 0 ? 'bg-stone-200 text-stone-400' : 'bg-rose-600 text-white'}`}
                    >
                      苦手克服をスタートする
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 4. クイズ本番 */}
        {currentScreen === 'quiz' && currentQuestions.length > 0 && (
          <div className="space-y-4 py-2 flex flex-col flex-1">
            <div className="flex justify-between items-center bg-white p-3 border rounded-xl text-xs shadow-sm">
              <span className="font-bold text-amber-950">問 {currentQuestionIndex + 1} / {currentQuestions.length}</span>
              <button onClick={() => attemptNavigation('portal')} className="text-rose-600 font-bold">一時中断</button>
            </div>

            {!quizFinished ? (
              <div className="space-y-4 flex-1 flex flex-col justify-between">
                <div className="bg-white border rounded-2xl p-5 space-y-3 shadow-sm">
                  <div className="flex gap-1 text-[10px] font-bold">
                    <span className="bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded">{currentQuestions[currentQuestionIndex].region}</span>
                    <span className="bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded">{currentQuestions[currentQuestionIndex].subject}</span>
                  </div>
                  <p className="text-sm font-bold text-stone-900 leading-relaxed">{currentQuestions[currentQuestionIndex].question}</p>
                </div>

                <div className="space-y-2">
                  {currentQuestions[currentQuestionIndex].options.map((option, idx) => {
                    const isSelected = userSelectedAnswers[currentQuestions[currentQuestionIndex].id] === idx;
                    const showFeedback = quizMode === 'one-by-one' && oneByOneState?.isAnswered;
                    const isCorrectOption = idx === currentQuestions[currentQuestionIndex].answerIndex;

                    let style = "border-stone-200 bg-white hover:border-amber-400";
                    if (isSelected) style = "border-amber-500 bg-amber-50/50 font-bold";
                    if (showFeedback) {
                      if (isCorrectOption) style = "border-emerald-500 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500 font-bold";
                      else if (isSelected) style = "border-rose-500 bg-rose-50 text-rose-950 font-bold";
                      else style = "border-stone-100 bg-stone-50 text-stone-400";
                    }

                    return (
                      <button 
                        key={idx} 
                        onClick={() => !showFeedback && handleSelectOption(idx)}
                        disabled={showFeedback}
                        className={`w-full text-left p-3.5 rounded-xl border text-xs transition flex justify-between items-center ${style}`}
                      >
                        <span>{idx + 1}. {option}</span>
                        {showFeedback && isCorrectOption && <CheckCircle className="w-4 h-4 text-emerald-600" />}
                      </button>
                    );
                  })}

                  <div className="flex gap-2 pt-2">
                    <button 
                      onClick={handleDontKnow} 
                      disabled={quizMode === 'one-by-one' && oneByOneState?.isAnswered}
                      className="flex-1 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-xs transition"
                    >
                      自信がない / 分からない
                    </button>

                    {(quizMode === 'all-after' || oneByOneState?.isAnswered) && (
                      <button onClick={handleNextQuestion} className="flex-1 py-3 bg-amber-800 text-white font-bold rounded-xl text-xs">
                        {currentQuestionIndex === currentQuestions.length - 1 ? '最終回答を提出' : '次の問題へ'}
                      </button>
                    )}
                  </div>
                </div>

                {quizMode === 'one-by-one' && oneByOneState?.isAnswered && (
                  <div className="bg-amber-50/60 border border-amber-200 p-4 rounded-xl space-y-2 text-xs">
                    <p className="font-bold text-amber-950">💡 解説</p>
                    <p className="text-stone-700 leading-relaxed">{currentQuestions[currentQuestionIndex].explanation}</p>
                  </div>
                )}
              </div>
            ) : (
              // 終了後振り返り画面
              <div className="space-y-4 flex-1 flex flex-col justify-between">
                <div className="bg-emerald-800 text-white rounded-2xl p-4 text-center">
                  <Award className="w-8 h-8 mx-auto mb-1 text-emerald-200" />
                  <h4 className="font-bold">演習が完了しました！</h4>
                  <p className="text-xs text-emerald-100 mt-1">スコア: {currentQuestions.filter(q => userSelectedAnswers[q.id] === q.answerIndex).length} / {currentQuestions.length}</p>
                </div>

                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 flex-1">
                  {currentQuestions.map((q, idx) => {
                    const sel = userSelectedAnswers[q.id];
                    const corr = sel === q.answerIndex;
                    return (
                      <div key={idx} className="bg-white p-3.5 border rounded-xl space-y-2 text-xs">
                        <div className="flex justify-between font-bold">
                          <span>問 {idx + 1}</span>
                          <span className={corr ? 'text-emerald-700' : 'text-rose-600'}>{corr ? '⭕ 正解' : '❌ 不正解'}</span>
                        </div>
                        <p className="font-bold text-stone-900">{q.question}</p>
                        <p className="text-[11px] text-stone-500">正解: {q.options[q.answerIndex]} / あなたの回答: {sel === -1 ? "分からない" : q.options[sel] || "未記入"}</p>
                        <div className="bg-amber-50/50 p-2.5 rounded border text-[11px] text-stone-600">{q.explanation}</div>
                      </div>
                    );
                  })}
                </div>

                <button onClick={() => setCurrentScreen('portal')} className="w-full py-3 bg-amber-800 hover:bg-amber-900 text-white font-bold rounded-xl text-xs">ポータルに戻る</button>
              </div>
            )}
          </div>
        )}

        {/* 5. 成績表 */}
        {currentScreen === 'results' && (
          <div className="space-y-4 py-2 flex flex-col flex-1">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold text-stone-900">解答状況・成績一覧</h3>
              <button onClick={() => attemptNavigation('home')} className="text-xs font-bold text-amber-900">戻る</button>
            </div>

            {performanceRows.length === 0 ? (
              <div className="text-center py-12 bg-white border rounded-xl">
                <p className="text-xs text-stone-400 font-bold">まだデータがありません。問題を解くとここに蓄積されます。</p>
              </div>
            ) : (
              <div className="space-y-4 flex-1 flex flex-col justify-between">
                <div className="w-full overflow-x-auto border rounded-xl bg-white max-h-80">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-stone-50 border-b sticky top-0">
                      <tr>
                        <th className="p-3 font-bold whitespace-nowrap">科目</th>
                        <th className="p-3 font-bold">問題（リンクをタップで解き直し）</th>
                        {uniqueDates.map(d => <th key={d} className="p-3 font-bold text-center whitespace-nowrap">{d.substring(5)}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {performanceRows.map((row, idx) => (
                        <tr key={idx} className="border-b hover:bg-stone-50/50">
                          <td className="p-3 font-bold text-stone-800 whitespace-nowrap">{row.subject}</td>
                          <td className="p-3">
                            <button 
                              onClick={() => row.fullQuestionObj && startSingleReplay(row.fullQuestionObj)}
                              className="text-left font-bold text-amber-900 hover:underline line-clamp-1 block"
                            >
                              {row.year} {row.region} 問{row.qNumber} ({row.questionText.substring(0, 10)}...)
                            </button>
                          </td>
                          {uniqueDates.map(d => {
                            const ans = row.resultsByDate[d];
                            return (
                              <td key={d} className="p-3 text-center text-sm">
                                {ans === undefined ? "—" : ans ? "⭕" : "❌"}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <button onClick={() => attemptNavigation('home')} className="w-full py-3 bg-stone-100 hover:bg-stone-200 font-bold rounded-xl text-xs text-stone-700">ホームに戻る</button>
              </div>
            )}
          </div>
        )}

      </main>

      {/* --- カスタム確認モーダル群 --- */}
      {showNavWarning && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl border">
            <h4 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">⚠️ 中断してもよろしいですか？</h4>
            <p className="text-xs text-stone-600">別の画面に切り替わります。今の回答状況はすべて破棄されますが、よろしいですか？</p>
            <div className="flex space-x-2">
              <button onClick={() => setShowNavWarning(false)} className="flex-1 bg-stone-100 py-2 rounded-lg text-xs font-bold text-stone-700">キャンセル</button>
              <button onClick={confirmNavigation} className="flex-1 bg-rose-600 py-2 rounded-lg text-xs font-bold text-white">はい（終了する）</button>
            </div>
          </div>
        </div>
      )}

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl border">
            <h4 className="text-sm font-bold text-stone-900">🚪 ログアウトしますか？</h4>
            <p className="text-xs text-stone-600">ログアウトしますが、よろしいですか？</p>
            <div className="flex space-x-2">
              <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 bg-stone-100 py-2 rounded-lg text-xs font-bold text-stone-700">キャンセル</button>
              <button onClick={handleLogout} className="flex-1 bg-amber-800 py-2 rounded-lg text-xs font-bold text-white">はい</button>
            </div>
          </div>
        </div>
      )}

      {showPublishConfirm && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl border">
            <h4 className="text-sm font-bold text-stone-900">📢 授業用問題の公開設定変更</h4>
            <p className="text-xs text-stone-600">この問題を{isClassroomPublished ? "【非公開】" : "【公開】"}にしますか？</p>
            <div className="flex space-x-2">
              <button onClick={() => setShowPublishConfirm(false)} className="flex-1 bg-stone-100 py-2 rounded-lg text-xs font-bold text-stone-700">キャンセル</button>
              <button onClick={() => { updateClassroomPublishStatus(!isClassroomPublished); setShowPublishConfirm(false); }} className="flex-1 bg-amber-800 py-2 rounded-lg text-xs font-bold text-white">はい</button>
            </div>
          </div>
        </div>
      )}

      {showFinishConfirm && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl border">
            <h4 className="text-sm font-bold text-emerald-800">📋 回答終了確認</h4>
            <p className="text-xs text-stone-600">回答を終了しますがよろしいですか？（各問題の解説画面に移ります）</p>
            <div className="flex space-x-2">
              <button onClick={() => setShowFinishConfirm(false)} className="flex-1 bg-stone-100 py-2 rounded-lg text-xs font-bold text-stone-700">キャンセル</button>
              <button onClick={confirmFinishAllQuiz} className="flex-1 bg-emerald-600 py-2 rounded-lg text-xs font-bold text-white">はい</button>
            </div>
          </div>
        </div>
      )}

      <footer className="py-4 text-[10px] text-center text-stone-400 bg-white border-t mt-auto">
        <p>© 2026 製菓衛生師合格サポート. All Rights Reserved.</p>
      </footer>

    </div>
  );
}