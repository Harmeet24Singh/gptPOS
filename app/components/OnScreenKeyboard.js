"use client";

import { useState, useEffect } from "react";
import styled from "styled-components";

const KeyboardContainer = styled.div`
  background: #2c3e50;
  border-radius: 8px;
  padding: 0.5rem;
  height: 100%;
  display: flex;
  flex-direction: column;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const KeyboardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.2rem;
  color: white;
`;

const KeyboardTitle = styled.h5`
  margin: 0;
  color: #3498db;
  font-size: 0.9rem;
`;

const CloseButton = styled.button`
  background: #e74c3c;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;

  &:hover {
    background: #c0392b;
  }
`;

const ModeToggleButton = styled.button`
  background: #f39c12;
  color: white;
  border: none;
  padding: 0.4rem 0.8rem;
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;
  font-size: 0.8rem;
  transition: all 0.2s ease;

  &:hover {
    background: #e67e22;
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
`;

const KeyboardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const Key = styled.button`
  background: ${(props) => (props.special ? "#34495e" : "#ecf0f1")};
  color: ${(props) => (props.special ? "white" : "#2c3e50")};
  border: 1px solid ${(props) => (props.special ? "#3498db" : "#bdc3c7")};
  padding: 0.3rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: bold;
  transition: all 0.2s;
  grid-column: ${(props) => (props.wide ? "span 2" : "span 1")};
  min-height: 32px;
  pointer-events: auto;
  user-select: none;
  -webkit-tap-highlight-color: transparent;

  &:hover {
    background: ${(props) => (props.special ? "#3498db" : "#d5dbdb")};
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
  }
`;

const NumberRow = styled.div`
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 0.2rem;
  margin-bottom: 0.3rem;
`;

const LetterRows = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
`;

const LetterRow = styled.div`
  display: flex;
  gap: 0.3rem;
  justify-content: center;
`;

const SpaceRow = styled.div`
  display: flex;
  gap: 0.3rem;
  margin-top: 0.5rem;
`;

const OnScreenKeyboard = ({
  show,
  onClose,
  onKeyPress,
  inputRef,
  mode = "full",
}) => {
  const [shift, setShift] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [keyboardMode, setKeyboardMode] = useState(mode);

  // Update internal state when mode prop changes
  useEffect(() => {
    setKeyboardMode(mode);
  }, [mode]);

  const isNumericMode = keyboardMode === "numeric";

  const numberKeys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];
  const topRow = ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"];
  const middleRow = ["A", "S", "D", "F", "G", "H", "J", "K", "L"];
  const bottomRow = ["Z", "X", "C", "V", "B", "N", "M"];

  const handleKeyClick = (key) => {
    console.log("🎯 OnScreenKeyboard handleKeyClick:", {
      key,
      inputRef,
      inputRefCurrent: inputRef?.current,
      inputRefCurrentValue: inputRef?.current?.value,
      inputRefCurrentType: inputRef?.current?.type,
    });

    if (!inputRef?.current) {
      console.error(
        "❌ OnScreenKeyboard: No input ref or current element found"
      );
      return;
    }

    const input = inputRef.current;
    console.log("✅ OnScreenKeyboard: Input element found:", input);

    // Ensure input is focused and get cursor position immediately
    input.focus();

    // Set a simple flag to indicate virtual keyboard is being used
    document.body.setAttribute("data-virtual-keyboard-active", "true");

    const start = input.selectionStart || input.value.length;
    const end = input.selectionEnd || input.value.length;
    const value = input.value || "";

    console.log("Virtual key input:", {
      key,
      inputType: input.type,
      currentValue: value,
      cursorStart: start,
      cursorEnd: end,
    });

    let keyToInsert = key;

    // Handle shift/caps logic
    if (key.match(/[A-Za-z]/)) {
      keyToInsert = shift || capsLock ? key.toUpperCase() : key.toLowerCase();
    }

    // Handle shift for numbers and symbols
    if (shift && numberKeys.includes(key)) {
      const shiftedNumbers = {
        1: "!",
        2: "@",
        3: "#",
        4: "$",
        5: "%",
        6: "^",
        7: "&",
        8: "*",
        9: "(",
        0: ")",
      };
      keyToInsert = shiftedNumbers[key];
    }

    // Create new value with character inserted at cursor position
    const beforeCursor = value.substring(0, start);
    const afterCursor = value.substring(end);
    const newValue = beforeCursor + keyToInsert + afterCursor;
    const newCursorPos = start + keyToInsert.length;

    console.log("Virtual key calculation:", {
      beforeCursor,
      keyToInsert,
      afterCursor,
      newValue,
      newCursorPos,
      isDecimalPoint: keyToInsert === ".",
    });

    // Update value using React-compatible method
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value"
    ).set;
    nativeInputValueSetter.call(input, newValue);

    // For decimal point inputs - simplified handling
    if (keyToInsert === ".") {
      console.log("🔣 Decimal point detected");
    }

    // Dispatch input event for React state update immediately
    const inputEvent = new Event("input", { bubbles: true });
    input.dispatchEvent(inputEvent);

    // Dispatch a custom event to notify about virtual keyboard usage
    const virtualKeyboardEvent = new CustomEvent("virtualKeyboardInput", {
      bubbles: true,
      detail: { key: keyToInsert, value: newValue },
    });
    input.dispatchEvent(virtualKeyboardEvent);

    // Set cursor position after the input event is processed
    requestAnimationFrame(() => {
      input.focus();
      // Only set cursor position for text inputs, not number inputs
      if (input.type !== "number" && input.setSelectionRange) {
        try {
          input.setSelectionRange(newCursorPos, newCursorPos);
        } catch (e) {
          console.log("Could not set cursor position:", e.message);
        }
      }
      console.log(
        "Cursor positioned at:",
        newCursorPos,
        "Final value:",
        input.value
      );
    });

    if (onKeyPress) {
      onKeyPress(key);
    }

    // Reset shift after key press (but not caps lock)
    if (shift && !capsLock) {
      setShift(false);
    }

    // Clear the virtual keyboard flag after processing
    setTimeout(() => {
      document.body.removeAttribute("data-virtual-keyboard-active");
    }, 100);
  };

  const handleSpecialKey = (action) => {
    console.log("Special key pressed:", action); // Debug log
    if (!inputRef?.current) {
      console.log("No input ref available"); // Debug log
      return;
    }

    const input = inputRef.current;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const value = input.value;

    switch (action) {
      case "backspace":
        console.log("Backspace case triggered", { start, end, value }); // Debug log
        if (start > 0 || end > start) {
          const newValue =
            start > 0
              ? value.substring(0, start - 1) + value.substring(end)
              : value.substring(end);

          console.log("New value after backspace:", newValue); // Debug log

          // Use React-compatible method to update input value
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype,
            "value"
          ).set;
          nativeInputValueSetter.call(input, newValue);

          // Trigger React-compatible input event
          const event = new Event("input", { bubbles: true });
          input.dispatchEvent(event);

          // Set cursor position after deletion
          const newCursorPos = start > 0 ? start - 1 : 0;
          setTimeout(() => {
            input.focus();
            if (input.type !== "number" && input.setSelectionRange) {
              try {
                input.setSelectionRange(newCursorPos, newCursorPos);
              } catch (e) {
                console.log("Could not set cursor position:", e.message);
              }
            }
          }, 0);
        } else if (value.length > 0) {
          // If cursor is at beginning but there's text, clear the last character
          const newValue = value.substring(0, value.length - 1);
          console.log("Clearing last character:", newValue); // Debug log

          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype,
            "value"
          ).set;
          nativeInputValueSetter.call(input, newValue);

          const event = new Event("input", { bubbles: true });
          input.dispatchEvent(event);

          setTimeout(() => {
            input.focus();
            if (input.type !== "number" && input.setSelectionRange) {
              try {
                input.setSelectionRange(newValue.length, newValue.length);
              } catch (e) {
                console.log("Could not set cursor position:", e.message);
              }
            }
          }, 0);
        }
        break;
      case "space":
        const newValue = value.substring(0, start) + " " + value.substring(end);

        // Use React-compatible method to update input value
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          "value"
        ).set;
        nativeInputValueSetter.call(input, newValue);

        // Trigger React-compatible input event
        const event = new Event("input", { bubbles: true });
        input.dispatchEvent(event);

        // Set cursor position after space
        setTimeout(() => {
          input.focus();
          if (input.type !== "number" && input.setSelectionRange) {
            try {
              input.setSelectionRange(start + 1, start + 1);
            } catch (e) {
              console.log("Could not set cursor position:", e.message);
            }
          }
        }, 0);
        break;
      case "shift":
        setShift(!shift);
        return;
      case "caps":
        setCapsLock(!capsLock);
        return;
      case "enter":
        const enterEvent = new KeyboardEvent("keydown", {
          key: "Enter",
          bubbles: true,
        });
        input.dispatchEvent(enterEvent);
        return;
    }
  };

  return (
    <KeyboardContainer mode={keyboardMode}>
      <KeyboardHeader>
        <ModeToggleButton
          onClick={() =>
            setKeyboardMode(keyboardMode === "full" ? "numeric" : "full")
          }
        >
          {isNumericMode ? "🔤 ABC" : "🔢 123"}
        </ModeToggleButton>
        <KeyboardTitle>
          {isNumericMode ? "Number Pad" : "Virtual Keyboard"}
        </KeyboardTitle>
        <div style={{ width: "80px" }}></div> {/* Spacer for centering */}
      </KeyboardHeader>

      {isNumericMode ? (
        // Numeric Mode - Simple number pad
        <>
          {/* Numbers 7-9 */}
          <NumberRow>
            <Key
              onClick={(e) => {
                e.preventDefault();
                handleKeyClick("7");
              }}
            >
              7
            </Key>
            <Key
              onClick={(e) => {
                e.preventDefault();
                handleKeyClick("8");
              }}
            >
              8
            </Key>
            <Key
              onClick={(e) => {
                e.preventDefault();
                handleKeyClick("9");
              }}
            >
              9
            </Key>
            <Key
              special
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log("Clear button clicked"); // Debug log
                handleSpecialKey("backspace");
              }}
              wide
            >
              ⌫ Clear
            </Key>
          </NumberRow>

          {/* Numbers 4-6 */}
          <NumberRow>
            <Key
              onClick={(e) => {
                e.preventDefault();
                handleKeyClick("4");
              }}
            >
              4
            </Key>
            <Key
              onClick={(e) => {
                e.preventDefault();
                handleKeyClick("5");
              }}
            >
              5
            </Key>
            <Key
              onClick={(e) => {
                e.preventDefault();
                handleKeyClick("6");
              }}
            >
              6
            </Key>
            <Key
              onClick={(e) => {
                e.preventDefault();
                handleKeyClick(".");
              }}
            >
              .
            </Key>
          </NumberRow>

          {/* Numbers 1-3 */}
          <NumberRow>
            <Key
              onClick={(e) => {
                e.preventDefault();
                handleKeyClick("1");
              }}
            >
              1
            </Key>
            <Key
              onClick={(e) => {
                e.preventDefault();
                handleKeyClick("2");
              }}
            >
              2
            </Key>
            <Key
              onClick={(e) => {
                e.preventDefault();
                handleKeyClick("3");
              }}
            >
              3
            </Key>
            <Key
              onClick={(e) => {
                e.preventDefault();
                handleKeyClick("+");
              }}
              special
            >
              +
            </Key>
          </NumberRow>

          {/* 0 and common symbols */}
          <NumberRow>
            <Key
              onClick={(e) => {
                e.preventDefault();
                handleKeyClick("0");
              }}
              wide
            >
              0
            </Key>
            <Key
              onClick={(e) => {
                e.preventDefault();
                handleKeyClick("-");
              }}
              special
            >
              -
            </Key>
            <Key
              special
              onClick={(e) => {
                e.preventDefault();
                handleSpecialKey("enter");
              }}
              wide
            >
              ✓ Enter
            </Key>
          </NumberRow>
        </>
      ) : (
        // Full Keyboard Mode
        <>
          {/* Number Row */}
          <NumberRow>
            {numberKeys.map((num) => (
              <Key key={num} onClick={() => handleKeyClick(num)}>
                {shift
                  ? {
                      1: "!",
                      2: "@",
                      3: "#",
                      4: "$",
                      5: "%",
                      6: "^",
                      7: "&",
                      8: "*",
                      9: "(",
                      0: ")",
                    }[num]
                  : num}
              </Key>
            ))}
          </NumberRow>

          {/* Letter Rows */}
          <LetterRows>
            <LetterRow>
              {topRow.map((letter) => (
                <Key
                  key={letter}
                  onClick={() => handleKeyClick(letter)}
                  style={{ flex: 1 }}
                >
                  {shift || capsLock ? letter : letter.toLowerCase()}
                </Key>
              ))}
            </LetterRow>

            <LetterRow>
              {middleRow.map((letter) => (
                <Key
                  key={letter}
                  onClick={() => handleKeyClick(letter)}
                  style={{ flex: 1 }}
                >
                  {shift || capsLock ? letter : letter.toLowerCase()}
                </Key>
              ))}
            </LetterRow>

            <LetterRow>
              <Key
                special
                onClick={() => handleSpecialKey("shift")}
                style={{ flex: 1.5, background: shift ? "#3498db" : "#34495e" }}
              >
                ⇧ Shift
              </Key>
              {bottomRow.map((letter) => (
                <Key
                  key={letter}
                  onClick={() => handleKeyClick(letter)}
                  style={{ flex: 1 }}
                >
                  {shift || capsLock ? letter : letter.toLowerCase()}
                </Key>
              ))}
              <Key
                special
                onClick={() => handleSpecialKey("backspace")}
                style={{ flex: 1.5 }}
              >
                ⌫ Back
              </Key>
            </LetterRow>
          </LetterRows>

          {/* Special Keys Row */}
          <SpaceRow>
            <Key
              special
              onClick={() => handleSpecialKey("caps")}
              style={{ flex: 1, background: capsLock ? "#3498db" : "#34495e" }}
            >
              ⇪ Caps
            </Key>
            <Key onClick={() => handleKeyClick(",")}>,</Key>
            <Key
              special
              onClick={() => handleSpecialKey("space")}
              style={{ flex: 4 }}
            >
              Space
            </Key>
            <Key onClick={() => handleKeyClick(".")}>.</Key>
            <Key
              special
              onClick={() => handleSpecialKey("enter")}
              style={{ flex: 1 }}
            >
              ↵ Enter
            </Key>
          </SpaceRow>

          {/* Common POS Symbols */}
          <SpaceRow>
            <Key onClick={() => handleKeyClick("$")}>$</Key>
            <Key onClick={() => handleKeyClick("-")}>-</Key>
            <Key onClick={() => handleKeyClick("+")}>+</Key>
            <Key onClick={() => handleKeyClick("=")}>+</Key>
            <Key onClick={() => handleKeyClick("/")}>/</Key>
            <Key onClick={() => handleKeyClick("*")}>×</Key>
            <Key onClick={() => handleKeyClick("(")}>(</Key>
            <Key onClick={() => handleKeyClick(")")}>)</Key>
            <Key onClick={() => handleKeyClick("%")}>%</Key>
            <Key onClick={() => handleKeyClick("@")}>@</Key>
          </SpaceRow>
        </>
      )}
    </KeyboardContainer>
  );
};

export default OnScreenKeyboard;
