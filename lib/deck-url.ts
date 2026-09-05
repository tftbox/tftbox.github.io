import type { PlacedUnit } from './types'

/**
 * 배치 상태를 URL에 담기 위한 인코더.
 *
 * 저장하지 않고도 링크만으로 배치를 넘길 수 있게 하려는 것이라
 * 사람이 읽을 필요는 없고 짧기만 하면 된다. 반복되는 접두사를 떼고
 * 배열 형태로 줄인 뒤 base64url로 감싼다.
 */

const CHAMP_PREFIX = /^TFT\d+_/
const ITEM_PREFIX = /^TFT\d*_Item_/

type Packed = [string, number, number, number, string[]]

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(text: string): string {
  const padded = text.replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4))
  const bytes = Uint8Array.from(binary, (ch) => ch.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

export function encodeUnits(units: PlacedUnit[], setNumber: number): string {
  const packed: Packed[] = units.map((u) => [
    u.id.replace(CHAMP_PREFIX, ''),
    u.row,
    u.col,
    u.star,
    u.items.map((i) => i.replace(ITEM_PREFIX, '')),
  ])
  return toBase64Url(JSON.stringify([setNumber, packed]))
}

/**
 * 링크에서 배치를 복원한다.
 * 접두사를 떼면서 잃어버린 정보는 실제 id 목록과 대조해서 되살린다.
 */
export function decodeUnits(code: string, knownChampionIds: string[], knownItemIds: string[]): PlacedUnit[] | null {
  try {
    const [, packed] = JSON.parse(fromBase64Url(code)) as [number, Packed[]]
    if (!Array.isArray(packed)) return null

    const champLookup = new Map(knownChampionIds.map((id) => [id.replace(CHAMP_PREFIX, ''), id]))
    const itemLookup = new Map(knownItemIds.map((id) => [id.replace(ITEM_PREFIX, ''), id]))

    const units: PlacedUnit[] = []
    for (const [champ, row, col, star, items] of packed) {
      const id = champLookup.get(champ)
      if (!id) continue
      units.push({
        id,
        row,
        col,
        star,
        items: (items || []).map((i) => itemLookup.get(i)).filter((i): i is string => !!i),
      })
    }
    return units
  } catch {
    return null
  }
}
