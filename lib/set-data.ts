import { readFile } from 'node:fs/promises'
import path from 'node:path'
import type { SetData } from './types'

/**
 * 현재 시즌 번호.
 * 다음 시즌으로 넘어갈 때는 `SET=18 npm run sync-data` 로 데이터를 받은 뒤
 * 이 값만 바꾸면 된다.
 */
export const CURRENT_SET = 18

/** 하위 경로에 배포될 때(GitHub Pages) 아이콘 주소 앞에 붙는 값 */
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || ''

let cached: SetData | null = null

/**
 * 서버에서 세트 데이터를 읽는다. 한 번 읽으면 프로세스 안에서 재사용한다.
 *
 * 아이콘 경로는 데이터에 "/img/..." 로 들어 있는데, 하위 경로에 배포하면
 * 그대로는 찾지 못한다. 화면에서 쓰기 전에 여기서 한 번에 붙여 준다.
 */
export async function getSetData(): Promise<SetData> {
  if (cached) return cached

  const file = path.join(process.cwd(), 'public', 'data', `set${CURRENT_SET}.json`)
  const data = JSON.parse(await readFile(file, 'utf8')) as SetData

  if (BASE_PATH) {
    const prefix = (icon: string | null) => (icon ? `${BASE_PATH}${icon}` : icon)

    for (const champion of data.champions) champion.icon = prefix(champion.icon)
    for (const trait of data.traits) trait.icon = prefix(trait.icon)
    for (const group of Object.values(data.items)) {
      for (const item of group) {
        item.icon = prefix(item.icon)
        for (const source of item.from) source.icon = prefix(source.icon)
      }
    }
  }

  cached = data
  return cached
}
