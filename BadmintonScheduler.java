package org.casbin;

import java.util.*;

public class BadmintonScheduler {

    private static final int PLAYER_COUNT = 18;
    private static final int COURT_COUNT = 3;
    private static final int GROUP_SIZE = 4;
    private static final int MAX_GAMES_PER_PLAYER = (COURT_COUNT * GROUP_SIZE * 9) / PLAYER_COUNT;

    public static void main(String[] args) {
        List<Integer> players = new ArrayList<>();
        for (int i = 1; i <= PLAYER_COUNT; i++) {
            players.add(i);
        }
        Collections.shuffle(players);
        Map<Integer, Set<Integer>> partners = new HashMap<>();
        for (int i = 1; i <= PLAYER_COUNT; i++) {
            partners.put(i, new HashSet<>());
        }

        Map<Integer, Deque<Boolean>> recentPlays = new HashMap<>();
        for (int i = 1; i <= PLAYER_COUNT; i++) {
            recentPlays.put(i, new ArrayDeque<>(Arrays.asList(false, false, false)));
        }

        Map<Integer, Integer> playCount = new HashMap<>();
        for (int i = 1; i <= PLAYER_COUNT; i++) {
            playCount.put(i, 0);
        }

        List<List<List<Integer>>> schedule = new ArrayList<>();

        while (true) {
            Set<Integer> used = new HashSet<>();
            List<List<Integer>> roundGroups = new ArrayList<>();
            for (int court = 0; court < COURT_COUNT; court++) {
                List<Integer> group = selectGroup(players, partners, used, recentPlays, playCount);
                if (group == null) {
                    break;
                }
                roundGroups.add(group);
                used.addAll(group);
                for (int i = 0; i < GROUP_SIZE; i++) {
                    for (int j = 0; j < GROUP_SIZE; j++) {
                        if (i != j) {
                            partners.get(group.get(i)).add(group.get(j));
                        }
                    }
                }
            }
            // 只要有一组没安排上，整轮作废，跳出
            if (roundGroups.size() < COURT_COUNT) {
                break;
            }
            schedule.add(roundGroups);

            for (int i = 1; i <= PLAYER_COUNT; i++) {
                Deque<Boolean> dq = recentPlays.get(i);
                if (dq.size() == 3) {
                    dq.pollFirst();
                }
                dq.addLast(used.contains(i));
                if (used.contains(i)) {
                    playCount.put(i, playCount.get(i) + 1);
                }
            }

            boolean allFull = playCount.values().stream()
                .allMatch(cnt -> cnt >= MAX_GAMES_PER_PLAYER);
            if (allFull) {
                break;
            }
        }

        // 补齐阶段：每次只能补满4人组，不能只补部分人
        while (playCount.values().stream().anyMatch(cnt -> cnt < MAX_GAMES_PER_PLAYER)) {
            List<Integer> needPlayers = new ArrayList<>();
            for (int i = 1; i <= PLAYER_COUNT; i++) {
                if (playCount.get(i) < MAX_GAMES_PER_PLAYER) {
                    needPlayers.add(i);
                }
            }
            if (needPlayers.size() < GROUP_SIZE) {
                break; // 不足4人无法补齐
            }
            boolean arranged = false;
            for (int i = 0; i + 3 < needPlayers.size(); i += 4) {
                List<Integer> group = needPlayers.subList(i, i + 4);
                boolean canArrange = true;
                for (int p : group) {
                    if (isPlayedLastThree(recentPlays.get(p))) {
                        canArrange = false;
                        break;
                    }
                }
                if (!canArrange) {
                    continue;
                }
                List<List<Integer>> roundGroups = new ArrayList<>();
                roundGroups.add(new ArrayList<>(group));
                schedule.add(roundGroups);
                for (int p : group) {
                    Deque<Boolean> dq = recentPlays.get(p);
                    if (dq.size() == 3) {
                        dq.pollFirst();
                    }
                    dq.addLast(true);
                    playCount.put(p, playCount.get(p) + 1);
                }
                for (int i2 = 1; i2 <= PLAYER_COUNT; i2++) {
                    if (!group.contains(i2)) {
                        Deque<Boolean> dq = recentPlays.get(i2);
                        if (dq.size() == 3) {
                            dq.pollFirst();
                        }
                        dq.addLast(false);
                    }
                }
                arranged = true;
            }
            if (!arranged) {
                break;
            }
        }
        // 更灵活地合并最后的单组轮次，尽量不浪费场地
        int maxMerge = COURT_COUNT;
        int mergeCount = 0;
        List<List<Integer>> mergeGroups = new ArrayList<>();
        for (int i = schedule.size() - 1; i >= 0; i--) {
            List<List<Integer>> round = schedule.get(i);
            if (round.size() == 1) {
                mergeGroups.add(round.get(0));
                mergeCount++;
                if (mergeCount == maxMerge) {
                    break;
                }
            } else {
                break;
            }
        }
        if (mergeCount > 1) {
            // 移除这些轮次
            for (int i = 0; i < mergeCount; i++) {
                schedule.remove(schedule.size() - 1);
            }
            // 合并为一轮，分配到不同场地
            List<List<Integer>> mergedRound = new ArrayList<>();
            for (int j = mergeGroups.size() - 1; j >= 0; j--) {
                mergedRound.add(mergeGroups.get(j));
            }
            schedule.add(mergedRound);
        }
        // 输出排班结果
        for (int r = 0; r < schedule.size(); r++) {
            System.out.printf("第%d轮：\n", r + 1);
            for (int c = 0; c < schedule.get(r).size(); c++) {
                List<Integer> g = schedule.get(r).get(c);
                System.out.printf("  场地%d: %s\n", c + 1, g);
            }
        }
        System.out.println("每人上场次数：");
        for (int i = 1; i <= PLAYER_COUNT; i++) {
            System.out.printf("玩家%d: %d场\n", i, playCount.get(i));
        }
        // 检查是否所有人都满8场
        if (playCount.values().stream().anyMatch(cnt -> cnt < MAX_GAMES_PER_PLAYER)) {
            System.out.println("注意：部分玩家无法打满"+MAX_GAMES_PER_PLAYER+"场，受限于排班条件。");
        }
        getPlayerMatches(12, schedule).forEach(System.out::println);
    }

    // 选择未合作过且未连打四局且未超场次的4人组
    private static List<Integer> selectGroup(List<Integer> players,
        Map<Integer, Set<Integer>> partners,
        Set<Integer> used, Map<Integer, Deque<Boolean>> recentPlays,
        Map<Integer, Integer> playCount) {
        List<Integer> sorted = new ArrayList<>(players);
        sorted.sort(Comparator.comparingInt(playCount::get));
        // 1. 优先选搭档全新组合
        for (int i = 0; i < sorted.size(); i++) {
            int a = sorted.get(i);
            if (used.contains(a) || isPlayedLastThree(recentPlays.get(a))
                || playCount.get(a) >= MAX_GAMES_PER_PLAYER) {
                continue;
            }
            for (int j = i + 1; j < sorted.size(); j++) {
                int b = sorted.get(j);
                if (used.contains(b) || isPlayedLastThree(recentPlays.get(b))
                    || playCount.get(b) >= MAX_GAMES_PER_PLAYER) {
                    continue;
                }
                for (int k = j + 1; k < sorted.size(); k++) {
                    int c = sorted.get(k);
                    if (used.contains(c) || isPlayedLastThree(recentPlays.get(c))
                        || playCount.get(c) >= MAX_GAMES_PER_PLAYER) {
                        continue;
                    }
                    for (int l = k + 1; l < sorted.size(); l++) {
                        int d = sorted.get(l);
                        if (used.contains(d) || isPlayedLastThree(recentPlays.get(d))
                            || playCount.get(d) >= MAX_GAMES_PER_PLAYER) {
                            continue;
                        }
                        int[] group = {a, b, c, d};
                        if (isValidGroup(group, partners)) {
                            return Arrays.asList(a, b, c, d);
                        }
                    }
                }
            }
        }
        // 2. 允许有搭档重复（只要不是全部都合作过）
        for (int i = 0; i < sorted.size(); i++) {
            int a = sorted.get(i);
            if (used.contains(a) || isPlayedLastThree(recentPlays.get(a))
                || playCount.get(a) >= MAX_GAMES_PER_PLAYER) {
                continue;
            }
            for (int j = i + 1; j < sorted.size(); j++) {
                int b = sorted.get(j);
                if (used.contains(b) || isPlayedLastThree(recentPlays.get(b))
                    || playCount.get(b) >= MAX_GAMES_PER_PLAYER) {
                    continue;
                }
                for (int k = j + 1; k < sorted.size(); k++) {
                    int c = sorted.get(k);
                    if (used.contains(c) || isPlayedLastThree(recentPlays.get(c))
                        || playCount.get(c) >= MAX_GAMES_PER_PLAYER) {
                        continue;
                    }
                    for (int l = k + 1; l < sorted.size(); l++) {
                        int d = sorted.get(l);
                        if (used.contains(d) || isPlayedLastThree(recentPlays.get(d))
                            || playCount.get(d) >= MAX_GAMES_PER_PLAYER) {
                            continue;
                        }
                        int[] group = {a, b, c, d};
                        // 只要不是全部都互为搭档即可
                        if (!isAllPartnered(group, partners)) {
                            return Arrays.asList(a, b, c, d);
                        }
                    }
                }
            }
        }
        return null;
    }

    // 判断4人组是否全部互为搭档
    private static boolean isAllPartnered(int[] group, Map<Integer, Set<Integer>> partners) {
        for (int i = 0; i < group.length; i++) {
            for (int j = i + 1; j < group.length; j++) {
                if (!partners.get(group[i]).contains(group[j])) {
                    return false;
                }
            }
        }
        return true;
    }

    private static boolean isValidGroup(int[] group, Map<Integer, Set<Integer>> partners) {
        for (int i = 0; i < group.length; i++) {
            for (int j = i + 1; j < group.length; j++) {
                if (partners.get(group[i]).contains(group[j])) {
                    return false;
                }
            }
        }
        return true;
    }

    private static boolean isPlayedLastThree(Deque<Boolean> dq) {
        return dq.size() == 3 && dq.stream().allMatch(Boolean::booleanValue);
    }

    public static List<String> getPlayerMatches(int playerId, List<List<List<Integer>>> schedule) {
        List<String> result = new ArrayList<>();
        for (int r = 0; r < schedule.size(); r++) {
            List<List<Integer>> round = schedule.get(r);
            for (int c = 0; c < round.size(); c++) {
                List<Integer> group = round.get(c);
                if (group.contains(playerId)) {
                    result.add(String.format("第%d轮 场地%d 队友: %s", r + 1, c + 1, group));
                }
            }
        }
        return result;
    }
}