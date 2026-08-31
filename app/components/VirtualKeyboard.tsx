"use client";

interface VirtualKeyboardProps {
  onKeyPress: (key: string) => void;
  onDelete: () => void;
  onSubmit: () => void;
}

export default function VirtualKeyboard({
  onKeyPress,
  onDelete,
  onSubmit,
}: VirtualKeyboardProps) {
  // 기존 키보드 레이아웃에 쌍자음과 쌍모음(ㅒ, ㅖ)을 자연스럽게 배치
  const keyboardRows = [
    ["ㅂ", "ㅃ", "ㅈ", "ㅉ", "ㄷ", "ㄸ", "ㄱ", "ㄲ", "ㅅ", "ㅆ", "ㅛ", "ㅕ", "ㅑ", "ㅐ", "ㅒ", "ㅔ", "ㅖ"],
    ["ㅁ", "ㄴ", "ㅇ", "ㄹ", "ㅎ", "ㅗ", "ㅓ", "ㅏ", "ㅣ"],
    ["ㅋ", "ㅌ", "ㅍ", "ㅊ", "ㅠ", "ㅜ", "ㅡ"],
  ];

  return (
    <div className="flex flex-col gap-1.5 w-full items-center bg-gray-50 p-3 rounded-xl border border-gray-200">
      {/* 1~3행 키 버튼 영역 */}
      {keyboardRows.map((row, rowIdx) => (
        <div key={rowIdx} className="flex gap-1 justify-center w-full flex-wrap sm:flex-nowrap">
          {row.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => onKeyPress(key)}
              className="flex-1 min-w-[28px] max-w-[36px] h-10 bg-white text-gray-800 border border-gray-300 rounded-md flex items-center justify-center text-sm font-semibold select-none hover:bg-gray-100 active:bg-gray-200 transition-colors shadow-sm"
            >
              {key}
            </button>
          ))}
        </div>
      ))}

      {/* 특수 기능 키 영역 (지우기 / 제출) */}
      <div className="flex gap-2 w-full mt-1">
        <button
          type="button"
          onClick={onDelete}
          className="flex-1 h-10 bg-gray-300 hover:bg-gray-400 active:bg-gray-500 text-gray-700 font-bold rounded-lg text-sm transition-colors shadow-sm"
        >
          지우기 ⌫
        </button>
        <button
          type="button"
          onClick={onSubmit}
          className="flex-2 h-10 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-lg text-sm transition-colors shadow-sm"
        >
          제출 (Enter)
        </button>
      </div>
    </div>
  );
}