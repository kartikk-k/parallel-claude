import { SessionStatus } from '../stores/SessionManagerStore';

interface ParseResult {
  status: SessionStatus;
  confidence: number;
}

/**
 * Analyzes terminal content to determine the current session status
 * @param content - The terminal content as a string
 * @returns The determined session status
 */
export function parseTerminalStatus(content: string): SessionStatus {
  if (!content || content.trim().length === 0) {
    return 'idle';
  }

  // Get the last 50 lines for more accurate recent status detection
  const lines = content.split('\n').slice(-50);
  const recentContent = lines.join('\n');
  const lastLines = lines.slice(-10).join('\n');

  // Check for various status patterns
  const patterns = [
    detectWaitingForInput(lastLines),
    detectRunning(lastLines),
    detectCompleted(lastLines),
    detectError(lastLines),
  ];

  // Sort by confidence and return the highest confidence status
  patterns.sort((a, b) => b.confidence - a.confidence);

  return patterns[0].confidence > 0.3 ? patterns[0].status : 'idle';
}

/**
 * Detects if the terminal is waiting for user input
 */
function detectWaitingForInput(content: string): ParseResult {
  let confidence = 0;

  // Check for common input prompts
  const inputPatterns = [
    /\?\s*$/,                                    // Ends with ?
    /\?.*\n/,                                    // Question mark followed by newline
    /\(y\/n\)/i,                                 // (y/n) prompts
    /press\s+any\s+key/i,                        // Press any key
    /enter\s+to\s+continue/i,                    // Enter to continue
    /waiting\s+for\s+(input|response)/i,         // Waiting for input/response
    /please\s+(enter|provide|input|type)/i,      // Please enter/provide/input
    /^\s*>\s*$/m,                                // Prompt symbol >
    /^\s*\$\s*$/m,                               // Shell prompt $
    /:\s*$/,                                     // Ends with colon (prompts)
    /AskUserQuestion/,                           // Claude Code specific - asking question
    /Would you like/i,                           // Would you like...
    /Do you want/i,                              // Do you want...
    /Which\s+\w+.*\?/i,                          // Which ... ?
    /What\s+\w+.*\?/i,                           // What ... ?
    /How\s+\w+.*\?/i,                            // How ... ?
    /Should\s+\w+.*\?/i,                         // Should ... ?
    /❯/,                                         // Selection cursor
    /\[\s*\]/,                                   // Checkboxes [ ]
    /^\s*\d+\.\s+\[/m,                           // Numbered menu items with checkboxes
    /\bNext\b|\bPrevious\b/,                     // Navigation indicators
    /Select.*:/i,                                // Select prompts
    /Choose.*:/i,                                // Choose prompts
  ];

  for (const pattern of inputPatterns) {
    if (pattern.test(content)) {
      confidence += 0.3;
    }
  }

  // Strongly boost confidence if selection cursor is present (interactive menu)
  if (content.includes('❯')) {
    confidence += 0.5;
  }

  // Boost confidence if there's no recent activity indicators
  if (!content.includes('⏺') && !content.includes('...') && !content.includes('Processing')) {
    confidence += 0.1;
  }

  return { status: 'waiting_input', confidence: Math.min(confidence, 1.0) };
}

/**
 * Detects if an agent/process is currently running
 */
function detectRunning(content: string): ParseResult {
  let confidence = 0;

  // Check for running indicators
  const runningPatterns = [
    /⏺\s/,                                        // Tool execution symbol
    /\.\.\./,                                     // Loading dots
    /processing/i,                                // Processing text
    /executing/i,                                 // Executing
    /running/i,                                   // Running
    /in progress/i,                               // In progress
    /working on/i,                                // Working on
    /analyzing/i,                                 // Analyzing
    /searching/i,                                 // Searching
    /loading/i,                                   // Loading
    /⎿/,                                          // Tool output symbol
    /TodoWrite/,                                  // Claude Code tool usage
    /Reading|Writing|Editing|Bash|Grep|Glob/,    // Claude Code tools
    /\[.*\.\.\.\]/,                               // [loading...]
    /█/,                                          // Progress bars
    /▓/,                                          // Progress blocks
    /spinner/i,                                   // Spinner indicators
  ];

  for (const pattern of runningPatterns) {
    if (pattern.test(content)) {
      confidence += 0.25;
    }
  }

  // Check for timestamp patterns (recent activity)
  const hasTimestamp = /\d{2}:\d{2}:\d{2}/.test(content);
  if (hasTimestamp) {
    confidence += 0.1;
  }

  return { status: 'running', confidence: Math.min(confidence, 1.0) };
}

/**
 * Detects if a task has been completed
 */
function detectCompleted(content: string): ParseResult {
  let confidence = 0;

  // Check for completion indicators
  const completedPatterns = [
    /✓|✔|✅/,                                     // Checkmarks
    /completed|finished|done/i,                   // Completion words
    /successfully/i,                              // Successfully
    /task\s+(complete|finished)/i,                // Task complete/finished
    /all\s+set/i,                                 // All set
    /ready/i,                                     // Ready
    /\[.*complete.*\]/i,                          // [complete]
    /\[.*done.*\]/i,                              // [done]
    /^Done/m,                                     // Done at start of line
    /Summary:/i,                                  // Summary sections
    /Changes Made:/i,                             // Changes made sections
    /Implementation complete/i,                   // Implementation complete
    /Refactoring complete/i,                      // Refactoring complete
  ];

  for (const pattern of completedPatterns) {
    if (pattern.test(content)) {
      confidence += 0.3;
    }
  }

  // Decrease confidence if there are active indicators
  if (content.includes('⏺') || content.includes('...')) {
    confidence -= 0.2;
  }

  // Strongly decrease confidence if there's a selection cursor (waiting for input)
  if (content.includes('❯')) {
    confidence -= 0.6;
  }

  return { status: 'completed', confidence: Math.min(Math.max(confidence, 0), 1.0) };
}

/**
 * Detects if there's an error state
 */
function detectError(content: string): ParseResult {
  let confidence = 0;

  // Check for error indicators
  const errorPatterns = [
    /error:/i,                                    // Error:
    /exception/i,                                 // Exception
    /failed/i,                                    // Failed
    /✗|✘|❌/,                                     // Error symbols
    /\[error\]/i,                                 // [ERROR]
    /\[fail\]/i,                                  // [FAIL]
    /cannot|can't/i,                              // Cannot/can't
    /invalid/i,                                   // Invalid
    /undefined/i,                                 // Undefined
    /not found/i,                                 // Not found
    /permission denied/i,                         // Permission denied
    /syntax error/i,                              // Syntax error
    /fatal/i,                                     // Fatal
  ];

  for (const pattern of errorPatterns) {
    if (pattern.test(content)) {
      confidence += 0.35;
    }
  }

  return { status: 'error', confidence: Math.min(confidence, 1.0) };
}

/**
 * Debounced version of status parser to avoid excessive updates
 */
let parseTimeout: NodeJS.Timeout | null = null;
export function parseTerminalStatusDebounced(
  content: string,
  callback: (status: SessionStatus) => void,
  delay: number = 500
): void {
  if (parseTimeout) {
    clearTimeout(parseTimeout);
  }

  parseTimeout = setTimeout(() => {
    const status = parseTerminalStatus(content);
    callback(status);
  }, delay);
}
