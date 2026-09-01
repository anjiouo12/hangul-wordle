"use client";

import { useState, useEffect } from "react";
import { disassemble, assemble } from "es-hangul";
import confetti from "canvas-confetti";
import { ALL_WORDS, getRandomWordByJamoCount, WordItem } from "./words";

// ㅖ 우측에 백스페이스(⌫) 배치
const KEYBOARD_ROWS = [
  ["ㅃ", "ㅉ", "ㄸ", "ㄲ", "ㅆ", "", "ㅒ", "ㅖ", "⌫"],
  ["ㅂ", "ㅈ", "ㄷ", "ㄱ", "ㅅ", "ㅛ", "ㅕ", "ㅑ", "ㅐ", "ㅔ"],
  ["ㅁ", "ㄴ", "ㅇ", "ㄹ", "ㅎ", "ㅗ", "ㅓ", "ㅏ", "ㅣ"],
  ["ㅋ", "ㅌ", "ㅊ", "ㅍ", "ㅠ", "ㅜ", "ㅡ"],
];

// QWERTY 키보드 매핑 (영문 입력 상태일 때도 한글 자모로 변환)
const KEY_MAP: Record<string, string> = {
  KeyQ: "ㅂ", KeyW: "ㅈ", KeyE: "ㄷ", KeyR: "ㄱ", KeyT: "ㅅ", KeyY: "ㅛ", KeyU: "ㅕ", KeyI: "ㅑ", KeyO: "ㅐ", KeyP: "ㅔ",
  KeyA: "ㅁ", KeyS: "ㄴ", KeyD: "ㅇ", KeyF: "ㄹ", KeyG: "ㅎ", KeyH: "ㅗ", KeyJ: "ㅓ", KeyK: "ㅏ", KeyL: "ㅣ",
  KeyZ: "ㅋ", KeyX: "ㅌ", KeyC: "ㅊ", KeyV: "ㅍ", KeyB: "ㅠ", KeyN: "ㅜ", KeyM: "ㅡ",
  ShiftKeyQ: "ㅃ", ShiftKeyW: "ㅉ", ShiftKeyE: "ㄸ", ShiftKeyR: "ㄲ", ShiftKeyT: "ㅆ", ShiftKeyO: "ㅒ", ShiftKeyP: "ㅖ"
};

interface Stats {
  played: number;
  won: number;
  currentStreak: number;
  maxStreak: number;
}

// 난이도별 자모 수 범위 설정 (쉬움: 4~5 / 보통: 6~8 / 어려움: 9~12)
const DIFFICULTY_MAP = [
  { label: "쉬움", min: 4, max: 5 },
  { label: "보통", min: 6, max: 8 },
  { label: "어려움", min: 9, max: 12 },
];

export default function Home() {
  const [selectedDifficulty, setSelectedDifficulty] = useState(DIFFICULTY_MAP[1]); // 기본: 보통 (6~8자모)
  const [targetWord, setTargetWord] = useState("");
  const [targetDescription, setTargetDescription] = useState(""); // 정답 설명 상태 추가
  const [targetJamo, setTargetJamo] = useState<string[]>([]);
  const [inputWord, setInputWord] = useState("");
  const [guesses, setGuesses] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [isGameOver, setIsGameOver] = useState(false);

  const [showStatsModal, setShowStatsModal] = useState(false);
  const [stats, setStats] = useState<Stats>({
    played: 0,
    won: 0,
    currentStreak: 0,
    maxStreak: 0,
  });

  useEffect(() => {
    const savedStats = localStorage.getItem("korean_wordle_stats");
    if (savedStats) {
      setStats(JSON.parse(savedStats));
    }
  }, []);

  useEffect(() => {
    startNewGame(selectedDifficulty.min, selectedDifficulty.max);
  }, [selectedDifficulty]);

  const startNewGame = (min: number, max: number) => {
    const selectedItem: WordItem = getRandomWordByJamoCount(min, max);
    const disassembled = disassemble(selectedItem.word).split("");
    
    setTargetWord(selectedItem.word);
    setTargetDescription(selectedItem.description);
    setTargetJamo(disassembled);
    setGuesses([]);
    setInputWord("");
    setMessage("");
    setIsGameOver(false);

    console.log(`🎯 [정답 단어]: ${selectedItem.word} (${selectedItem.description})`);
  };

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

  const handleShare = () => {
    let resultEmoji = `오늘의 소방 워들 [${selectedDifficulty.label}] ${guesses.length}/6\n\n`;

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

  const handleInputKey = (key: string) => {
    if (isGameOver) return;

    if (key === "⌫" || key === "Backspace") {
      setInputWord((prev) => prev.slice(0, -1));
    } else {
      setInputWord((prev) => {
        const currentInputJamos = disassemble(prev + key).split("");
        if (currentInputJamos.length <= targetJamo.length) {
          return prev + key;
        }
        return prev;
      });
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

    const assembledInput = assemble(currentJamo);

    const newGuesses = [...guesses, assembledInput];
    setGuesses(newGuesses);
    setInputWord("");
    setMessage("");

    if (assembledInput === targetWord || trimmed === targetJamo.join("")) {
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isGameOver || showStatsModal) return;

      if (e.key === "Enter") {
        e.preventDefault();
        handleSubmit();
        return;
      }

      if (e.key === "Backspace") {
        e.preventDefault();
        handleInputKey("Backspace");
        return;
      }

      const disassembledKey = disassemble(e.key);
      if (disassembledKey && /^[ㄱ-ㅎㅏ-ㅣ가-힣]+$/.test(e.key)) {
        e.preventDefault();
        const jamos = disassembledKey.split("");
        jamos.forEach((jamo) => handleInputKey(jamo));
        return;
      }

      const mapKey = e.shiftKey ? `Shift${e.code}` : e.code;
      if (KEY_MAP[mapKey]) {
        e.preventDefault();
        handleInputKey(KEY_MAP[mapKey]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [inputWord, isGameOver, showStatsModal, targetJamo, targetWord, guesses]);

  const winRate = stats.played > 0 ? Math.round((stats.won / stats.played) * 100) : 0;

  return (
    <main className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white p-6 rounded-2xl shadow-xl flex flex-col items-center">
        {/* 상단 제목 & 통계 버튼 */}
        <div className="flex justify-between items-center w-full mb-2 px-1">
          <h1 className="text-3xl font-black text-gray-800">오늘의 소방 워들 🎯</h1>
          <button
            type="button"
            onClick={() => setShowStatsModal(true)}
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-base"
            title="통계 보기"
          >
            📊
          </button>
        </div>

        {/* 난이도 선택 버튼 */}
        <div className="flex gap-2 mb-4 w-full justify-center">
          {DIFFICULTY_MAP.map((diff) => (
            <button
              key={diff.label}
              onClick={() => setSelectedDifficulty(diff)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedDifficulty.label === diff.label
                  ? "bg-blue-600 text-white shadow-md scale-105"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {diff.label}
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

            const currentJamos = isCurrentRow ? disassemble(inputWord).split("") : [];
            const guessJamos = guess ? disassemble(guess).split("") : [];

            return (
              <div key={rowIndex} className="flex gap-1.5 justify-center">
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
                      className={`w-8 h-8 border-2 rounded-lg flex items-center justify-center text-sm font-bold transition-all sm:w-10 sm:h-10 sm:text-lg ${colorClass}`}
                    >
                      {displayJamo}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* 메시지 및 정답 설명 / 게임 종료 영역 */}
        {message && (
          <div className="flex flex-col items-center gap-2 mb-4 w-full text-center">
            <p className="font-bold text-sm text-amber-600">{message}</p>
            
            {/* 정답 단어 설명 표시 박스 */}
            {isGameOver && targetDescription && (
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl w-full my-1">
                <p className="text-xs font-bold text-blue-900 mb-1">💡 [{targetWord}] 뜻풀이</p>
                <p className="text-xs text-blue-800 leading-relaxed">{targetDescription}</p>
              </div>
            )}

            {isGameOver && (
              <div className="flex gap-2 mt-1">
                <button
                  type="button"
                  onClick={handleShare}
                  className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-2 rounded-lg font-bold shadow"
                >
                  🔗 결과 공유하기
                </button>
                <button
                  type="button"
                  onClick={() => startNewGame(selectedDifficulty.min, selectedDifficulty.max)}
                  className="bg-gray-700 hover:bg-gray-800 text-white text-xs px-3 py-2 rounded-lg font-bold shadow"
                >
                  🔄 다시 하기
                </button>
              </div>
            )}
          </div>
        )}

        {/* 가상 키보드 자판 + 제출 버튼 */}
        <div className="flex flex-col gap-1.5 w-full items-center bg-gray-50 p-3 rounded-xl border border-gray-200 mb-6">
          {KEYBOARD_ROWS.map((row, rowIdx) => (
            <div key={rowIdx} className="flex gap-1 justify-center w-full">
              {row.map((key, keyIdx) => {
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
                    onClick={() => handleInputKey(key)}
                    className={`flex-1 min-w-[20px] max-w-[36px] h-10 border rounded-md flex items-center justify-center text-xs sm:text-sm font-semibold select-none transition-colors ${btnColor}`}
                  >
                    {key}
                  </button>
                );
              })}
            </div>
          ))}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isGameOver}
            className="w-full h-10 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700 disabled:bg-gray-300 transition-colors shadow-sm mt-1"
          >
            제출
          </button>
        </div>

        {/* 게임 설명 영역 */}
        <div className="w-full bg-gray-50 p-4 rounded-xl border border-gray-200 text-xs text-gray-600 flex flex-col gap-3">
          <h2 className="font-extrabold text-sm text-gray-800 flex items-center gap-1.5">
            📖 게임 설명
          </h2>
          
          <ul className="list-disc pl-4 space-y-1.5 leading-relaxed">
            <li>
              <b>총 6번의 기회</b> 안에 숨겨진 <b>소방 관련 단어</b>를 맞춰보세요.
            </li>
            <li>
              단어는 글자 수가 아닌 <b>자모(초성·중성·종성) 단위</b>로 나누어 입력됩니다.
              <br />
              <span className="text-gray-400 font-mono text-[11px]">(예: 소방관 ➔ ㅅ, ㅗ, ㅂ, ㅏ, ㅇ, ㄱ, ㅘ, ㄴ)</span>
            </li>
            <li>
              제출 후 각 타일의 색상이 변경되며 정답에 대한 힌트를 제공합니다.
            </li>
          </ul>

          <hr className="border-gray-200 my-1" />

          {/* 색상 힌트 가이드 */}
          <div className="flex flex-col gap-2">
            <span className="font-bold text-gray-700">💡 타일 색상 안내</span>
            
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-green-500 text-white font-bold flex items-center justify-center text-[10px] shrink-0">
                ㅅ
              </span>
              <span><b>초록색:</b> 자모가 정답에 포함되어 있고 <b>위치도 일치</b>합니다.</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-amber-400 text-white font-bold flex items-center justify-center text-[10px] shrink-0">
                ㅗ
              </span>
              <span><b>노란색:</b> 자모가 정답에 포함되어 있지만 <b>위치가 다릅니다</b>.</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-gray-400 text-white font-bold flex items-center justify-center text-[10px] shrink-0">
                ㅂ
              </span>
              <span><b>회색:</b> 해당 자모는 정답에 <b>포함되지 않습니다</b>.</span>
            </div>
          </div>
        </div>
      </div>

      {/* 통계 모달 */}
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