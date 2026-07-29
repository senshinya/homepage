/**
 * bonsai.shinya.click 的公开只读接口。
 *
 * 这份接口刻意不返回仓库地址——脱敏层就是它存在的理由，所以主页这边
 * 没有「点进去看仓库」这回事，项目页是陈列而不是索引。
 */

export type BonsaiVisibility = 'full' | 'subject-only' | 'aggregate'

/** 由最后一次提交距今的天数推出：≤7 active，≤30 slowing，其余 idle */
export type BonsaiActivity = 'empty' | 'archived' | 'active' | 'slowing' | 'idle'

export interface BonsaiLanguage {
	name: string
	/** 0~1 的占比，不是百分数 */
	share: number
}

export interface BonsaiStats {
	commits: number
	commitsLast7d: number
	commitsLast30d: number
	streakDays: number
	firstCommitAt: string | null
	lastCommitAt: string | null
	stars: number
	languages: BonsaiLanguage[]
}

export interface BonsaiCommit {
	at: string
	subject: string
	/** 仅 visibility 为 full 时返回 */
	body?: string
	/** 仅 visibility 为 full 时返回 */
	author?: string
}

export interface BonsaiWeek {
	/** ISO 周，形如 2026-W29 */
	w: string
	c: number
}

export interface BonsaiProject {
	slug: string
	name: string
	description: string
	visibility: BonsaiVisibility
	activity: BonsaiActivity
	/** activity 为 empty 时是 null */
	svg: string | null
	stats: BonsaiStats
	weekly: BonsaiWeek[]
	/** visibility 为 aggregate 时是空数组 */
	commits: BonsaiCommit[]
}

export interface BonsaiResponse {
	generatedAt: string
	projects: BonsaiProject[]
}
