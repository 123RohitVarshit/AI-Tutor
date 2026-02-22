# DSA - Data Structures and Algorithms for Placements

## Arrays
The most fundamental data structure.

**Key Operations:**
- Access: O(1)
- Search: O(n)
- Insert/Delete (end): O(1)
- Insert/Delete (middle): O(n)

**Common Interview Patterns:**
- Two Pointer Technique
- Sliding Window
- Prefix Sum
- Kadane's Algorithm (Maximum Subarray)

```javascript
// Kadane's Algorithm
function maxSubarray(nums) {
  let maxSum = nums[0], currentSum = nums[0];
  for (let i = 1; i < nums.length; i++) {
    currentSum = Math.max(nums[i], currentSum + nums[i]);
    maxSum = Math.max(maxSum, currentSum);
  }
  return maxSum;
}
```

## Linked Lists
- Singly Linked List: each node points to next
- Doubly Linked List: each node points to next and prev

**Common Problems:**
- Reverse a linked list
- Detect cycle (Floyd's Algorithm)
- Find middle node (fast/slow pointer)
- Merge two sorted lists

## Stacks and Queues
**Stack (LIFO):** Used for function call stack, backtracking, balanced parentheses
**Queue (FIFO):** Used for BFS, task scheduling

## Trees
**Binary Search Tree (BST):**
- Left subtree < node < right subtree
- Inorder traversal gives sorted order

**Time Complexity:**
- Search/Insert/Delete: O(h) where h = height
- Balanced tree: O(log n); Skewed: O(n)

**Tree Traversals:**
```javascript
// Inorder (Left → Root → Right)
function inorder(node) {
  if (!node) return;
  inorder(node.left);
  console.log(node.val);
  inorder(node.right);
}
```

## Graphs
**Representations:**
- Adjacency Matrix: O(V²) space
- Adjacency List: O(V + E) space (preferred)

**BFS (Breadth-First Search):** Shortest path in unweighted graph
**DFS (Depth-First Search):** Cycle detection, topological sort

## Sorting Algorithms

| Algorithm | Best | Average | Worst | Space | Stable |
|-----------|------|---------|-------|-------|--------|
| Bubble Sort | O(n) | O(n²) | O(n²) | O(1) | Yes |
| Merge Sort | O(n log n) | O(n log n) | O(n log n) | O(n) | Yes |
| Quick Sort | O(n log n) | O(n log n) | O(n²) | O(log n) | No |
| Heap Sort | O(n log n) | O(n log n) | O(n log n) | O(1) | No |

## Dynamic Programming
Break problems into overlapping subproblems and cache results.

**Classic DP Problems:**
1. Fibonacci (memoization)
2. 0/1 Knapsack
3. Longest Common Subsequence (LCS)
4. Longest Increasing Subsequence (LIS)
5. Coin Change Problem
6. Matrix Chain Multiplication

```javascript
// Fibonacci with Memoization
const memo = {};
function fib(n) {
  if (n <= 1) return n;
  if (memo[n]) return memo[n];
  memo[n] = fib(n - 1) + fib(n - 2);
  return memo[n];
}
```

## Big O Cheat Sheet
- O(1): Hash map lookup
- O(log n): Binary search
- O(n): Linear scan
- O(n log n): Merge sort
- O(n²): Bubble sort, nested loops
- O(2ⁿ): Recursive Fibonacci (without memo)
