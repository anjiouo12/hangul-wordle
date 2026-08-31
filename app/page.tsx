"use client";

import { useState, useEffect } from "react";
import { disassemble } from "es-hangul";
import confetti from "canvas-confetti";
import { ALL_WORDS, getRandomWordByJamoCount } from "./words";

// ㅖ 우측에 백스페이스(⌫) 배치
const KEYBOARD_ROWS = [
  ["ㅃ", "ㅉ", "ㄸ", "ㄲ", "ㅆ", "", "ㅒ", "ㅖ", "⌫"],
  ["ㅂ", "ㅈ", "ㄷ", "ㄱ", "ㅅ", "ㅛ", "ㅕ", "ㅑ", "ㅐ", "ㅔ"],
  ["ㅁ", "ㄴ", "ㅇ", "ㄹ", "ㅎ", "ㅗ", "ㅓ", "ㅏ", "ㅣ"],
  ["ㅋ", "ㅌ", "ㅍ", "ㅊ", "ㅠ", "ㅜ", "ㅡ"],
];

interface Stats {
  played: number;
  won: number;
  currentStreak: number;
  maxStreak: number;
}

// 난이도 설정 (쉬움: 5 / 보통: 6 / 어려움: 7)
const DIFFICULTY_MAP = [
  { label: "쉬움", count: 5 },
  { label: "보통", count: 6 },
  { label: "어려움", count: 7 },
];

export default function Home() {
  const [targetJamoCount, setTargetJamoCount] = useState<number>(6);
  const [targetWord, setTargetWord] = useState("");
  const [targetJamo, setTargetJamo] = useState<string[]>([]);
  const [inputWord, setInputWord] = useState("");
  const [guesses, setGuesses] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [isGameOver, setIsGameOver] = useState(false);

  // 통계 데이터 및 모달 상태
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [stats, setStats] = useState<Stats>({
    played: 0,
    won: 0,
    currentStreak: 0,
    maxStreak: 0,
  });

  // 로컬스토리지에서 기존 기록 로드
  useEffect(() => {
    const savedStats = localStorage.getItem("korean_wordle_stats");
    if (savedStats) {
      setStats(JSON.parse(savedStats));
    }
  }, []);

  useEffect(() => {
    startNewGame(targetJamoCount);
  }, [targetJamoCount]);

  const startNewGame = (count: number) => {
    const selectedWord = getRandomWordByJamoCount(count);
    const disassembled = disassemble(selectedWord).split("");
    
    setTargetWord(selectedWord);
    setTargetJamo(disassembled);
    setGuesses([]);
    setInputWord("");
    setMessage("");
    setIsGameOver(false);

    // 🎯 콘솔창에 정답 및 자모 길이 출력
    console.log(`🎯 [정답 단어]: ${selectedWord} (총 ${disassembled.length}자모)`);
  };

  // 승패 기록 저장 함수
  const updateStats = (isWin: boolean) => {
    setStats((prev) => {
      const newStats: Stats = {
        played: prev.played + 1,
        won: prev.won + (isWin ? 1 : 0),
        currentStreak: isWin ? prev.currentStreak + 1 : 0,
        maxStreak: isWin ? Math.max(prev.maxStreak, prev.currentStreak + 1) : prev.maxStreak,
      };
      localStorage.setItem("korean_wordle_stats", JSON.stringify(newStats));
      return newStats;
    });
  };

  // 결과 클립보드 복사 함수
  const handleShare = () => {
    const currentDifficulty = DIFFICULTY_MAP.find((d) => d.count === targetJamoCount)?.label || "일반";
    let resultEmoji = `오늘의 한글 워들 [${currentDifficulty}] ${guesses.length}/6\n\n`;

    guesses.forEach((guess) => {
      const guessJamos = disassemble(guess).split("");
      guessJamos.forEach((jamo, idx) => {
        if (targetJamo[idx] === jamo) {
          resultEmoji += "🟩";
        } else if (targetJamo.includes(jamo)) {
          resultEmoji += "🟨";
        } else {
          resultEmoji += "⬛";
        }
      });
      resultEmoji += "\n";
    });

    navigator.clipboard.writeText(resultEmoji);
    alert("결과가 클립보드에 복사되었습니다! 원하는 곳에 붙여넣어 공유해 보세요.");
  };

  const getJamoStatusMap = () => {
    const statusMap: Record<string, "green" | "yellow" | "gray"> = {};

    guesses.forEach((guess) => {
      const guessJamos = disassemble(guess).split("");
      guessJamos.forEach((jamo, idx) => {
        if (targetJamo[idx] === jamo) {
          statusMap[jamo] = "green";
        } else if (targetJamo.includes(jamo) && statusMap[jamo] !== "green") {
          statusMap[jamo] = "yellow";
        } else if (!targetJamo.includes(jamo) && !statusMap[jamo]) {
          statusMap[jamo] = "gray";
        }
      });
    });

    return statusMap;
  };

  const jamoStatusMap = getJamoStatusMap();

  const getJamoStatus = (jamo: string, index: number) => {
    if (targetJamo[index] === jamo) return "bg-green-500 text-white border-green-500";
    if (targetJamo.includes(jamo)) return "bg-amber-400 text-white border-amber-400";
    return "bg-gray-400 text-white border-gray-400";
  };

  // 가상 키보드 클릭 이벤트
  const handleVirtualKeyClick = (key: string) => {
    if (isGameOver || !key) return;

    if (key === "⌫") {
      setInputWord((prev) => prev.slice(0, -1));
    } else {
      // 자모 개수가 목표 개수를 넘지 않도록 제한
      const currentInputJamos = disassemble(inputWord + key).split("");
      if (currentInputJamos.length <= targetJamo.length) {
        setInputWord((prev) => prev + key);
      }
    }
  };

  const handleSubmit = () => {
    if (isGameOver) return;

    const trimmed = inputWord.trim();
    if (!trimmed) return;

    const currentJamo = disassemble(trimmed).split("");

    if (currentJamo.length !== targetJamo.length) {
      setMessage(`⚠️ 자모 ${targetJamo.length}개를 모두 채워주세요! (현재 ${currentJamo.length}개)`);
      return;
    }

    const newGuesses = [...guesses, trimmed];
    setGuesses(newGuesses);
    setInputWord("");
    setMessage("");

    if (trimmed === targetWord) {
      setMessage("🎉 축하합니다! 정답입니다!");
      setIsGameOver(true);
      updateStats(true);
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    } else if (newGuesses.length >= 6) {
      setMessage(`😭 아쉽네요! 정답은 [${targetWord}] 이었습니다.`);
      setIsGameOver(true);
      updateStats(false);
    }
  };

  const winRate = stats.played > 0 ? Math.round((stats.won / stats.played) * 100) : 0;

  return (
    <main className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white p-6 rounded-2xl shadow-xl flex flex-col items-center">
        {/* 상단 제목 & 통계 버튼 */}
        <div className="flex justify-between items-center w-full mb-2 px-1">
          <h1 className="text-3xl font-black text-gray-800">오늘의 한글 워들 🎯</h1>
          <button
            type="button"
            onClick={() => setShowStatsModal(true)}
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-base"
            title="통계 보기"
          >
            📊
          </button>
        </div>

        {/* 난이도 선택 버튼 (쉬움 / 보통 / 어려움) */}
        <div className="flex gap-2 mb-4 w-full justify-center">
          {DIFFICULTY_MAP.map(({ label, count }) => (
            <button
              key={label}
              onClick={() => setTargetJamoCount(count)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                targetJamoCount === count
                  ? "bg-blue-600 text-white shadow-md scale-105"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <p className="text-xs text-gray-500 mb-6">
          {targetJamo.length}자모 단어 맞추기 (남은 기회: {6 - guesses.length}번)
        </p>

        {/* 단어 입력 그리드 타일 */}
        <div className="flex flex-col gap-2 mb-6">
          {Array.from({ length: 6 }).map((_, rowIndex) => {
            const isCurrentRow = rowIndex === guesses.length;
            const guess = guesses[rowIndex];

            // 제출된 이전 시도 vs 현재 작성 중인 자모 배열
            const currentJamos = isCurrentRow ? disassemble(inputWord).split("") : [];
            const guessJamos = guess ? disassemble(guess).split("") : [];

            return (
              <div key={rowIndex} className="flex gap-1.5">
                {Array.from({ length: targetJamo.length }).map((_, colIndex) => {
                  let displayJamo = "";
                  let colorClass = "bg-white border-gray-300 text-black";

                  if (guess) {
                    displayJamo = guessJamos[colIndex] || "";
                    colorClass = getJamoStatus(displayJamo, colIndex);
                  } else if (isCurrentRow) {
                    displayJamo = currentJamos[colIndex] || "";
                    if (displayJamo) {
                      colorClass = "bg-white border-gray-600 text-black shadow-sm";
                    }
                  }

                  return (
                    <div
                      key={colIndex}
                      className={`w-10 h-10 border-2 rounded-lg flex items-center justify-center text-lg font-bold transition-all sm:w-12 sm:h-12 sm:text-xl ${colorClass}`}
                    >
                      {displayJamo}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* 메시지 및 게임 종료 버튼 출력 영역 */}
        {message && (
          <div className="flex flex-col items-center gap-2 mb-4">
            <p className="font-bold text-sm text-amber-600">{message}</p>
            {isGameOver && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleShare}
                  className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-2 rounded-lg font-bold shadow"
                >
                  🔗 결과 공유하기
                </button>
                <button
                  type="button"
                  onClick={() => startNewGame(targetJamoCount)}
                  className="bg-gray-700 hover:bg-gray-800 text-white text-xs px-3 py-2 rounded-lg font-bold shadow"
                >
                  🔄 다시 하기
                </button>
              </div>
            )}
          </div>
        )}

        {/* 4줄 가상 키보드 자판 + 하단 넓은 제출 버튼 */}
        <div className="flex flex-col gap-1.5 w-full items-center bg-gray-50 p-3 rounded-xl border border-gray-200">
          {KEYBOARD_ROWS.map((row, rowIdx) => (
            <div key={rowIdx} className="flex gap-1 justify-center w-full">
              {row.map((key, keyIdx) => {
                // 빈 칸 처리
                if (key === "") {
                  return <div key={keyIdx} className="flex-1 min-w-[20px] max-w-[36px] h-10" />;
                }

                const status = jamoStatusMap[key];
                let btnColor = "bg-white text-gray-800 border-gray-300 hover:bg-gray-100";

                if (key === "⌫") {
                  btnColor = "bg-gray-200 text-gray-800 border-gray-300 hover:bg-gray-300 font-bold";
                } else if (status === "green") {
                  btnColor = "bg-green-500 text-white border-green-500 font-bold";
                } else if (status === "yellow") {
                  btnColor = "bg-amber-400 text-white border-amber-400 font-bold";
                } else if (status === "gray") {
                  btnColor = "bg-gray-300 text-gray-500 border-gray-300";
                }

                return (
                  <button
                    key={keyIdx}
                    type="button"
                    onClick={() => handleVirtualKeyClick(key)}
                    className={`flex-1 min-w-[20px] max-w-[36px] h-10 border rounded-md flex items-center justify-center text-xs sm:text-sm font-semibold select-none transition-colors ${btnColor}`}
                  >
                    {key}
                  </button>
                );
              })}
            </div>
          ))}

          {/* 키보드 넓이 및 한 줄 높이(h-10)의 제출 버튼 */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isGameOver}
            className="w-full h-10 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700 disabled:bg-gray-300 transition-colors shadow-sm mt-1"
          >
            제출
          </button>
        </div>
      </div>

      {/* 통계 보기 모달 팝업 */}
      {showStatsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-2xl max-w-xs w-full flex flex-col items-center shadow-2xl">
            <h2 className="text-xl font-black text-gray-800 mb-4">📊 나의 게임 통계</h2>

            <div className="grid grid-cols-4 gap-2 text-center w-full mb-6">
              <div className="bg-gray-50 p-2 rounded-lg">
                <p className="text-base font-bold text-gray-800">{stats.played}</p>
                <p className="text-[10px] text-gray-500">도전</p>
              </div>
              <div className="bg-gray-50 p-2 rounded-lg">
                <p className="text-base font-bold text-blue-600">{winRate}%</p>
                <p className="text-[10px] text-gray-500">정답률</p>
              </div>
              <div className="bg-gray-50 p-2 rounded-lg">
                <p className="text-base font-bold text-green-600">{stats.currentStreak}</p>
                <p className="text-[10px] text-gray-500">연승</p>
              </div>
              <div className="bg-gray-50 p-2 rounded-lg">
                <p className="text-base font-bold text-purple-600">{stats.maxStreak}</p>
                <p className="text-[10px] text-gray-500">최다연승</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowStatsModal(false)}
              className="bg-gray-800 text-white px-6 py-2 rounded-lg font-bold text-sm"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </main>
  );
}