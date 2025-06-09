# SMS_Project
Stcok Management Service Project

프로젝트 설명

## Codef API 더미 모드 (11일까지 API 작동 안함)

Codef API가 작동하지 않는 기간 동안 더미 데이터를 사용할 수 있습니다.

### 더미 데이터 중앙집중 관리
모든 더미 데이터는 `Front/ReactNative/src/data/dummyData.ts` 파일에서 관리됩니다:

- **Codef API 관련 더미 데이터**:
  - `DUMMY_CONNECTED_ACCOUNTS`: 연결된 계좌 목록
  - `DUMMY_STOCK_ACCOUNTS`: 증권 계좌 정보
  - `DUMMY_BALANCE_DATA`: 계좌 잔고 및 보유 주식 정보
  - `DUMMY_ACCOUNT_DATA`: 홈 화면용 계좌 데이터
  - `DUMMY_REBALANCING_RECORDS`: 리밸런싱 기록

- **헬퍼 함수들**:
  - `getCodefDummyBalance()`: 특정 계좌의 잔고 정보 반환
  - `getCodefConnectedAccounts()`: 연결된 계좌 목록 반환
  - `getOrganizationCodeByAccount()`: 계좌번호로 증권사 코드 매핑

### 프론트엔드 더미 모드 설정
`Front/ReactNative/src/constants/config.ts` 파일에서 다음 설정을 변경:
```typescript
export const USE_CODEF_DUMMY_DATA = true; // 더미 모드 활성화
```

### 백엔드 더미 모드 설정  
`Back/CODEF_API/` 디렉토리에 `.env` 파일 생성 후 추가:
```
USE_CODEF_DUMMY=true
```

### 더미 모드 상태 확인
```bash
curl http://localhost:5000/dummy-mode/status
```

### 11일 이후 정상 모드로 변경
1. `config.ts`에서 `USE_CODEF_DUMMY_DATA = false`로 변경
2. `.env`에서 `USE_CODEF_DUMMY=false`로 변경 또는 해당 줄 삭제
3. 서버 재시작

### 더미 데이터 수정
새로운 더미 데이터를 추가하거나 기존 데이터를 수정하려면 `dummyData.ts` 파일에서 해당 상수들을 직접 수정하면 됩니다.
