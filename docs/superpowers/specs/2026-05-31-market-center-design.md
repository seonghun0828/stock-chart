# Market Center Clone Design

## Goal

LS증권 모의투자 API를 사용해 6개 섹터의 실시간 시세를 반영하는 "마켓중심" 스타일 웹 페이지를 구현한다. 평가 핵심인 장중 실시간 반영과 정렬 정확도를 우선하며, 화면은 제공된 예시 PNG 구조를 최대한 가깝게 따른다.

## Scope

- 프론트엔드: React
- 백엔드: Node.js + Express
- 백엔드와 프론트 간 통신:
  - REST: 초기 스냅샷, 상태 확인
  - WebSocket: 실시간 시세 반영
- 시세 원천: LS증권 모의투자 API
- 대상 섹터: 6개
  - 반도체
  - 조선
  - 방산
  - 바이오
  - 전력기기
  - 금융

## Non-Goals

- 로그인
- 검색 기능
- DB 저장
- 주문 기능
- 별도 관리자 화면
- 뉴스 API를 추가로 붙이기 위한 범위 확장

## Architecture

단일 저장소 기반 모노레포로 구성한다.

- `apps/frontend`
  - React SPA
  - 초기 화면 로딩 시 백엔드 REST 호출
  - 이후 백엔드 WebSocket 수신값으로 화면 갱신
- `apps/backend`
  - Express REST API
  - Express 서버 위에 WebSocket 서버 제공
  - LS증권 REST/WebSocket 연동
  - 섹터/종목 상태 메모리 보관
  - 정렬 및 집계 계산 수행

초기 구현에서는 `packages/shared`를 두지 않는다. 현재 범위에서는 프론트가 백엔드 응답 계약을 기준으로 UI를 구현하면 충분하며, 공용 패키지는 타입/유틸 중복이 실제로 발생할 때만 도입한다.

## Deployment Assumption

- 프론트엔드: Vercel
- 백엔드: Render
- 제출 URL은 외부에서 인증 없이 접근 가능해야 한다.
- HTTPS는 호스팅 기본 제공 기능을 사용한다.

## Why Express

백엔드 요구사항은 소수의 REST 엔드포인트, 하나의 WebSocket 채널, LS증권 연동, 정렬 계산이 핵심이다. NestJS도 가능하지만 현재 범위에서는 Express가 더 작고 빠르며 배포와 디버깅이 단순하다.

## Data Source Strategy

### Sector Membership

섹터별 종목군은 백엔드 설정 파일에서 고정 관리한다.

예시 구조:

```ts
export const SECTOR_STOCKS = {
  semiconductor: ['005930', '000660'],
  shipbuilding: ['009540', '329180'],
  defense: ['012450', '079550'],
  biotech: ['207940', '068270'],
  powerEquipment: ['010120', '272290'],
  finance: ['105560', '055550'],
} as const;
```

이 구조를 택한 이유:

- 과제 요구 섹터를 정확히 통제 가능
- 실시간 구독 대상이 명확함
- 정렬 검증이 쉬움
- LS증권의 별도 섹터 분류 기준에 종속되지 않음

### Initial Load and Realtime

1. 백엔드 시작 시 섹터별 종목코드 목록 로드
2. LS증권 REST로 후보 종목 기본 시세를 1회 조회해 초기 화면과 정렬 기준을 채움
3. 메모리에 종목 상태 저장
4. LS증권 WebSocket으로 후보 종목 실시간 시세 구독
5. 실시간 수신값이 들어오면 메모리 상태만 갱신
6. 갱신 직후 섹터별 정렬과 집계 재계산
7. 프론트에 최신 스냅샷 브로드캐스트

중요:

- WebSocket 수신 후 LS증권 REST를 다시 호출하지 않는다.
- 프론트가 처음 접속했을 때 빈 카드가 보이지 않도록 초기 REST 조회는 기본 흐름에 포함한다.
- LS증권 WebSocket 재연결 자체는 WebSocket으로 처리한다.
- WebSocket 재연결 직후 상태가 오래되었거나 수신 누락이 의심될 때만 REST를 1회 재조회해 메모리 상태를 보정할 수 있다.
- REST 보정은 실시간 틱마다 수행하는 로직이 아니라 예외적인 동기화 수단이다.

## In-Memory State

백엔드는 DB 없이 메모리 기반 상태를 유지한다.

예시 개념:

```ts
type MarketState = {
  sectors: SectorSnapshot[];
  stocksByCode: Record<string, StockRealtimeState>;
  lastUpdatedAt: string | null;
  connectionStatus: 'connecting' | 'open' | 'closed' | 'error';
};
```

이 상태를 유지하는 이유:

- 실시간 틱마다 외부 API 재조회 없이 즉시 재정렬 가능
- 과제 범위에서 가장 단순하고 빠름
- 프론트에 바로 전달 가능한 스냅샷 생성이 쉬움

## Sorting Rules

정렬 규칙은 과제 요구사항에 맞춰 서버에서 단일 기준으로 처리한다.

### Within Sector

- 각 섹터 내의 종목들을 등락률 기준 내림차순 정렬
- 동률이면 거래대금 내림차순
- 추가 동률이면 종목명 오름차순

### Across Sectors

- 각 섹터 정렬 결과의 상위 3개 종목 등락률 평균을 계산
- 이 평균값을 `sectorScore`로 사용
- `sectorScore` 기준 내림차순으로 섹터 정렬
- 동률이면 섹터 총 거래대금 내림차순
- 추가 동률이면 섹터명 오름차순

### Display Count

- 카드에 노출할 종목 수는 상수화한다.
- 초기값은 `4`
- 향후 숫자만 바꾸면 서버 집계와 프론트 렌더링이 함께 변경되어야 한다.

예시:

```ts
export const DISPLAY_STOCK_COUNT = 4;
export const SECTOR_SCORE_TOP_N = 3;
```

## UI Design

제공된 예시 PNG를 기준으로 구조를 맞춘다. 기능이 없는 UI는 임의로 추가하지 않는다.

### Top Area

- 좌측: `티마` 스타일 로고
- 중앙: 현재 시각
- 우측: 필수 기능이 아니므로 최소 장식 또는 생략 가능
- 검색 입력은 제외

### Main Grid

- 6개 섹터 카드
- 예시 PNG처럼 한 화면에서 카드 밀도가 높게 보이도록 배치
- 데스크톱에서는 화면 폭에 따라 2열 또는 3열 반응형 그리드 사용
- 좁은 화면에서는 1열 또는 2열로 자연스럽게 축소

### Sector Card

- 헤더 좌측: 섹터명
- 헤더 우측: 현재 노출 중인 종목들의 거래대금 합계
- 헤더 아래 첫 줄: 섹터 대표 뉴스 1건
  - LS증권 응답에 뉴스성 텍스트가 있으면 표시
  - 응답에 없으면 표시하지 않음
- 종목 목록: 백엔드에서 받는 만큼
- 반올림 했을 때 상한가(30%)에 도달한 행은 예시처럼 강조 배경(투명한 노란색)을 줄 수 있음

### Stock Row

각 행은 다음 정보를 표시한다.

- 종목명
- 현재가
- 등락률
- 거래대금
- 가로 캔들 차트

가로 캔들 차트는 일반적인 캔들 차트처럼 당일 가격 범위를 압축해서 보여주는 장식적 시각 요소로 둔다. LS증권 응답에서 시가, 고가, 저가, 현재가를 받을 수 있으면 해당 값으로 계산한다. 초기 구현에서 해당 필드가 부족하면 전일대비와 등락률 기반의 단순 바를 사용하되, 계산 함수는 별도로 분리한다.

### Bottom Area

- 공지/티커 1줄
- 하단 탭 스타일 UI는 예시를 참고한 정적 영역으로 반영
- 탭 클릭 기능은 범위 밖

## Backend Responsibilities

### REST API

- `GET /api/market`
  - 프론트 최초 렌더용 현재 마켓 스냅샷 반환
  - 서버가 계산한 섹터 정렬, 종목 정렬, 거래대금 합계를 포함
- `GET /api/health`
  - 배포/운영 확인 및 연결 상태 진단용
  - 서버 기동 상태, LS증권 인증 상태, LS증권 WebSocket 연결 상태 반환

REST는 초기 화면 렌더와 상태 확인만 담당한다. 장중 실시간 갱신은 WebSocket으로 처리한다.

### WebSocket

- 클라이언트 접속 성공 시 현재 최신 스냅샷 1회 전송
- 이후 LS증권 시세 수신으로 상태가 바뀌면 재계산된 최신 스냅샷 브로드캐스트
- 메시지는 프론트가 그대로 렌더링 가능한 형태로 제공

REST와 WebSocket이 모두 스냅샷을 보낼 수 있지만 용도가 다르다. `GET /api/market`은 페이지 첫 렌더를 빠르게 채우는 기본 경로이고, WebSocket의 접속 직후 스냅샷은 실시간 채널 연결 시점의 상태 동기화 용도다. 프론트는 더 최신 스냅샷을 받으면 기존 화면 상태를 덮어쓴다.

### LS Integration Layer

백엔드 내부 역할 분리:

- 인증 토큰 발급/갱신
- 초기 시세 조회
- 실시간 구독 연결/재연결
- 종목코드 단위 실시간 이벤트 파싱
- 내부 상태 업데이트

## Frontend Responsibilities

- 앱 시작 시 `GET /api/market` 호출
- WebSocket 연결 후 실시간 메시지 수신
- 서버가 제공한 정렬 순서를 그대로 렌더링
- 금액/퍼센트/시간 포맷 처리
- 연결 끊김 시 상태 표시

프론트엔드는 계산보다 렌더링 책임에 집중한다. 정렬, 섹터 점수 계산, 총 거래대금 계산은 서버가 맡는다.

## API Contract Example

```ts
export type StockViewModel = {
  code: string;
  name: string;
  price: number;
  changeRate: number;
  tradeValue: number;
  priceRange: {
    open: number | null;
    high: number | null;
    low: number | null;
  };
};

export type SectorViewModel = {
  id:
    | 'semiconductor'
    | 'shipbuilding'
    | 'defense'
    | 'biotech'
    | 'powerEquipment'
    | 'finance';
  name: string;
  score: number;
  totalTradeValue: number;
  headline: string | null;
  stocks: StockViewModel[];
};

export type MarketSnapshot = {
  sectors: SectorViewModel[];
  lastUpdatedAt: string | null;
  connectionStatus: 'connecting' | 'open' | 'closed' | 'error';
};
```

이 타입은 공유 패키지 정의가 아니라, 백엔드 응답 형태의 예시다. 구현 시 프론트는 이 계약을 기준으로 화면을 그린다.

## Configuration

설정 파일로 분리할 항목:

- 섹터별 종목코드 목록
- 카드 표시 종목 수
- 섹터 점수 계산에 사용할 상위 종목 수
- 백엔드 포트
- 프론트엔드 공개 API URL
- LS증권 앱키/시크릿

## Error Handling

- LS증권 인증 실패 시 `health` 엔드포인트에서 상태 노출
- WebSocket 재연결 전략 필요
- WebSocket 업데이트는 전체 목록 교체가 아니라 종목 단위 patch로 처리
- 이미 메모리에 존재하는 종목은 새 WebSocket 이벤트가 오지 않아도 기존 값을 유지
- 아직 초기 REST나 WebSocket으로 한 번도 값이 들어오지 않은 종목만 정렬/표시 대상에서 제외
- 표시 가능한 종목 수가 카드 표시 개수보다 적을 때만 실제 수신된 종목 수만큼 표시
- 뉴스 텍스트 누락은 허용
- 일봉 스타일 미니 가격 바에 필요한 시가, 고가, 저가가 부족하면 미니 바를 숨기거나 단순 바 형태로 대체

## Testing Strategy

### Backend

- 정렬 규칙 단위 테스트
- 섹터 점수 계산 테스트
- 실시간 이벤트가 메모리 상태를 올바르게 갱신하는지 테스트
- REST 응답 스냅샷 구조 테스트

### Frontend

- 섹터 카드 렌더링 테스트
- 서버 정렬 순서를 그대로 그리는지 테스트
- 연결 상태 표시 테스트
- 종목 수 상수 변경 시 렌더 수가 함께 바뀌는지 테스트

## Open Items

- LS증권 응답에서 카드 첫 줄에 쓸 뉴스성 텍스트가 실제로 제공되는지 확인 필요
- 캔들 차트에 사용할 시가, 고가, 저가 필드 확인 필요
- 각 섹터 후보 종목코드 최종 목록 확정 필요
- 장 마감/휴장 상태 표현 여부는 구현 중 단순화 가능

## Implementation Notes

- 뉴스성 텍스트가 응답에 없으면 UI에서 해당 줄을 제거하거나 빈 상태를 허용한다.
- 계산은 항상 서버 기준으로 수행한다.
- 프론트는 서버 응답을 그대로 표시하는 얇은 클라이언트로 유지한다.
- 배포 시 프론트와 백엔드의 CORS 및 WebSocket URL 설정이 필요하다.
