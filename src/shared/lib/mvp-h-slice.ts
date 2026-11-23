/**
 * mvp-h(오독공) 조각 1 노출 스위치.
 * 켜면 N회독·풀이노트·1:1 수업노트 진입점이 보이고, 제출 뒤 풀이 화면이 풀이노트로 이어진다.
 * 끄면(기본) 운영 MVP-G 동선은 한 비트도 바뀌지 않는다.
 * NEXT_PUBLIC_ 값은 빌드 때 박히므로 켜고 끄려면 다시 빌드한다.
 */
export const isMvpHSliceEnabled = (): boolean =>
  process.env.NEXT_PUBLIC_MVPH_SLICE1 === 'on';
