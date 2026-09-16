import type { PlacedUnit } from './types'
import type { SetIndex } from './synergy'

/**
 * 게임 안 "팀 계획표"(Team Planner) 붙여넣기용 코드를 만든다.
 *
 * lolchess.gg가 실제로 배포하는 코드를 직접 뜯어봐서 맞춘 형식이다 (공개된 문서는
 * 예전 시즌 기준이라 시즌 18엔 안 맞았다):
 *   "02" + 챔피언 10칸(각 16진수 3자리, 빈 칸은 "000") + "TFTSet{세트번호}"
 *
 * 이 코드는 배치판 위 "어떤 챔피언이 있는지"만 담는다 — 몇 번 칸에 놓았는지,
 * 성급, 아이템은 담기지 않는다. 게임에 붙여넣으면 챔피언만 채워지고 배치·성급·
 * 아이템은 직접 다시 정해야 한다.
 */
const CODE_VERSION = '02'
const SLOT_HEX_WIDTH = 3
const MAX_SLOTS = 10

export interface TeamCodeResult {
  code: string
  /** 코드에 실제로 들어간 챔피언 수 (10명 넘게 배치했으면 앞에서부터 10명만) */
  includedCount: number
  /** 팀 코드용 번호가 없어서(자동 소환 유닛 등) 아예 못 담은 챔피언 이름 */
  skippedNames: string[]
  /** 슬롯이 10개를 넘어서 코드에서 빠진 챔피언 이름 */
  overflowNames: string[]
}

export function buildTeamCode(units: PlacedUnit[], index: SetIndex, setNumber: number): TeamCodeResult | null {
  const seen = new Set<string>()
  const codes: string[] = []
  const skippedNames: string[] = []
  const overflowNames: string[] = []

  for (const unit of units) {
    const champ = index.championById.get(unit.id)
    if (!champ) continue

    // 럭스는 특성만 다른 변형이 여러 개인데, 팀 코드에는 기본형 하나로만 담긴다
    // (lolchess.gg도 똑같이 처리한다 — 변형별 번호 자체가 없다)
    const lookupId = champ.id.includes('Lux') ? 'DA_Lux18_Base' : champ.id
    if (seen.has(lookupId)) continue
    seen.add(lookupId)

    const code = champ.id.includes('Lux') ? index.championById.get(lookupId)?.teamPlannerCode : champ.teamPlannerCode
    if (!code) {
      skippedNames.push(champ.name)
      continue
    }
    if (codes.length >= MAX_SLOTS) {
      overflowNames.push(champ.name)
      continue
    }
    codes.push(code.padStart(SLOT_HEX_WIDTH, '0'))
  }

  if (codes.length === 0) return null

  const includedCount = codes.length
  while (codes.length < MAX_SLOTS) codes.push('0'.repeat(SLOT_HEX_WIDTH))

  return {
    code: CODE_VERSION + codes.join('') + `TFTSet${setNumber}`,
    includedCount,
    skippedNames,
    overflowNames,
  }
}
