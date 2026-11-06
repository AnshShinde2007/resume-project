import type { Language, LanguageOption, Problem, EditorSettings } from '@/types/editor';

// ─── Language Definitions ────────────────────────────────────────────────────

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { id: 'javascript', label: 'JavaScript', monacoLang: 'javascript', icon: 'JS', extension: '.js' },
  { id: 'typescript', label: 'TypeScript', monacoLang: 'typescript', icon: 'TS', extension: '.ts' },
  { id: 'python',     label: 'Python',     monacoLang: 'python',     icon: 'PY', extension: '.py' },
  { id: 'java',       label: 'Java',       monacoLang: 'java',       icon: 'JV', extension: '.java' },
  { id: 'cpp',        label: 'C++',        monacoLang: 'cpp',        icon: 'C+', extension: '.cpp' },
  { id: 'go',         label: 'Go',         monacoLang: 'go',         icon: 'GO', extension: '.go' },
];

export const LANGUAGE_MAP: Record<Language, LanguageOption> = Object.fromEntries(
  LANGUAGE_OPTIONS.map((l) => [l.id, l])
) as Record<Language, LanguageOption>;

// ─── Starter Code Templates ──────────────────────────────────────────────────

export const STARTER_CODE: Record<Language, string> = {
  javascript: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
function solve(nums, target) {
  // Your solution here
  
}
`,
  typescript: `/**
 * @param nums - Input array of numbers
 * @param target - Target sum
 * @returns Indices of the two numbers
 */
function solve(nums: number[], target: number): number[] {
  // Your solution here
  
}
`,
  python: `from typing import List

class Solution:
    def solve(self, nums: List[int], target: int) -> List[int]:
        # Your solution here
        pass
`,
  java: `import java.util.*;

class Main {
    public int[] solve(int[] nums, int target) {
        // Your solution here
        return new int[]{};
    }

    public static void main(String[] args) {
        Main solution = new Main();
        // Test your solution here
    }
}
`,
  cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> solve(vector<int>& nums, int target) {
        // Your solution here
        return {};
    }
};

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    
    Solution sol;
    // Test your solution here
    return 0;
}
`,
  go: `package main

import "fmt"

func solve(nums []int, target int) []int {
    // Your solution here
    return []int{}
}

func main() {
    // Test your solution here
    result := solve([]int{2, 7, 11, 15}, 9)
    fmt.Println(result)
}
`,
};

// ─── Editor Defaults ─────────────────────────────────────────────────────────

export const DEFAULT_FONT_SIZE = 14;
export const MIN_FONT_SIZE = 10;
export const MAX_FONT_SIZE = 24;
export const DEFAULT_CONSOLE_HEIGHT = 220;
export const MIN_CONSOLE_HEIGHT = 80;
export const MAX_CONSOLE_HEIGHT = 480;

export const DEFAULT_SETTINGS: EditorSettings = {
  language: 'javascript',
  code: { ...STARTER_CODE },
  fontSize: DEFAULT_FONT_SIZE,
  theme: 'dark',
  activeConsoleTab: 'console',
  wordWrap: false,
  consoleHeight: DEFAULT_CONSOLE_HEIGHT,
};

export const STORAGE_KEY = 'ai-interview-editor-settings';

// ─── Monaco Theme Names ──────────────────────────────────────────────────────

export const MONACO_DARK_THEME = 'interview-dark';
export const MONACO_LIGHT_THEME = 'interview-light';

// ─── Sample Problem ──────────────────────────────────────────────────────────

export const SAMPLE_PROBLEM: Problem = {
  id: 'two-sum',
  title: 'Two Sum',
  difficulty: 'Easy',
  estimatedTime: '15 min',
  tags: ['Array', 'Hash Table'],
  description: `Given an array of integers \`nums\` and an integer \`target\`, return **indices** of the two numbers such that they add up to \`target\`.

You may assume that each input would have **exactly one solution**, and you may not use the same element twice.

You can return the answer in any order.`,
  examples: [
    {
      id: 1,
      input: 'nums = [2, 7, 11, 15], target = 9',
      output: '[0, 1]',
      explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].',
    },
    {
      id: 2,
      input: 'nums = [3, 2, 4], target = 6',
      output: '[1, 2]',
    },
    {
      id: 3,
      input: 'nums = [3, 3], target = 6',
      output: '[0, 1]',
    },
  ],
  constraints: [
    '2 ≤ nums.length ≤ 10⁴',
    '-10⁹ ≤ nums[i] ≤ 10⁹',
    '-10⁹ ≤ target ≤ 10⁹',
    'Only one valid answer exists.',
  ],
};
