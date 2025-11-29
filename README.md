# 📈 SMS (Stock Management Service)

> AI 기반 주식 리밸런싱 추천 애플리케이션  
> 효율적인 포트폴리오 관리 솔루션

{메인 앱 스크린샷}

## 📑 목차

- [프로젝트 소개](#-프로젝트-소개)
- [주요 기능](#-주요-기능)
- [기술 스택](#-기술-스택)
- [핵심 알고리즘](#-핵심-알고리즘)
- [프로젝트 구조](#-프로젝트-구조)
- [설치 및 실행](#-설치-및-실행)
- [사용자 시나리오](#-사용자-시나리오)
- [개발 팀](#-개발-팀)

---

## 🎯 프로젝트 소개

### 리밸런싱이란?

**"목표 자산 비중에 맞춰 정기적으로 조정하는 투자 전략"**

**간단한 예시:**
- 목표: 주식 60% : 채권 40%
- 한 달 후: 시장 변화로 주식 70% : 채권 30%가 됨
- → 다시 60% : 40%로 **재조정** (리밸런싱)

{리밸런싱 효과 그래프}

### 시장 배경 및 필요성

#### 📊 투자 시장 변화
- **개인투자자 급증**: MZ세대 투자 참여 **3배 증가** (2020~2024)
- **모바일 접근성 향상**: 모바일 증권앱 활성화
- **시장 변동성 확대**: 일중 변동폭 평균 2.1% → 3.4% 증가

#### 💡 MZ세대 재테크 인식
| 연령별 관심도 | 비율 |
|:-------------|:-----|
| 1위 30~34세 | 77.7% |
| 2위 25~29세 | 64.3% |
| 3위 19~24세 | 58.4% |

**선호하는 재테크 수단:**
- 주식/채권: 37.5%
- 예적금: 33.0%
- 리셀·아트·뮤직테크 등: 10.3%

#### ⚠️ 기존 문제점
- **감정적 투자 결정**: 개인투자자 90% → 수익 구간 조기 매도, 손실 구간 보유 연장
- **체계적 리스크 관리 부재**
- **장기 안정 수익 추구 어려움**

---

## ✨ 주요 기능

### 🎯 차별화 포인트

#### 1. AI 기반 통합 분석
- **3대 알고리즘 결합**: GNN + DDPG + Dijkstra
- **5-Factor 모델**: Fama-French 기반 종목 간 상관관계 정밀 분석
- **다차원 리스크 관리**: 집중도·상관관계·섹터·감정·ESG 리스크
- **종합 등급 시스템**: A~D 등급으로 직관적 제공

{AI 분석 화면 스크린샷}

#### 2. 최소 거래비용 보장
- **Dijkstra 알고리즘 활용**
- **거래비용 15% 절감**
- **최적 거래 경로 자동 탐색**

#### 3. NLP 기반 감정 분석
- **ESG 뉴스 기반 주식 분석**
- **VADER + TextBlob + 금융 특화 키워드**
- **실시간 감정 점수 및 재료성 평가**

{NLP 분석 결과 스크린샷}

#### 4. 개인화된 사용자 경험
- **MZ세대 맞춤 직관적 UI/UX**
- **투자 초보자도 쉬운 접근성**
- **자연어 기반 투자 가이드**

### 📱 핵심 기능 목록

#### 계좌 관리
- ✅ 다중 증권사 계좌 연동 (CODEF API)
- ✅ 실시간 잔고 및 보유 종목 조회
- ✅ 원화/달러 자동 환율 변환

#### 포트폴리오 분석
- ✅ AI 기반 리밸런싱 추천
- ✅ 5차원 리스크 분석
- ✅ ESG 감정 점수 평가
- ✅ 종합 등급 (A~D) 제공

#### 리밸런싱 실행
- ✅ 최적 거래 경로 계산
- ✅ 거래비용 최소화
- ✅ 원클릭 리밸런싱 지원
- ✅ 리밸런싱 기록 저장 및 추적

#### 투자 교육
- ✅ NLP 기반 투자 가이드
- ✅ 포트폴리오 격차 분석
- ✅ 맞춤형 투자 제안

---

## 🛠 기술 스택

### Frontend
```
- React Native (Expo)
- TypeScript
- React Navigation
- Axios
```

### Backend
```
- Flask (Python)
- PyTorch (Deep Learning)
- SQLite (Database)
- CODEF API (금융 데이터)
```

### AI/ML
```
- Temporal Graph Neural Network (TGNN)
- Deep Deterministic Policy Gradient (DDPG)
- Natural Language Processing (NLP)
  - VADER Sentiment Analysis
  - TextBlob
  - BeautifulSoup4 (Web Scraping)
```

### Infrastructure
```
- Git/GitHub
- Notion (프로젝트 관리)
```

---

## 🧠 핵심 알고리즘

### 1. 데이터 전처리: Fama-French 5-Factor 모델

**입력 데이터:**
- 주가/거래량 시계열 데이터
- 기술적 지표 (RSI, MACD 등)
- 재무 데이터 (PBR, PER, ROE, ROA)
- 산업 연관성 (Sector, Industry)

**처리 결과:**
- 한국 주식: 2,879개
- 미국 주식: 6,909개
- 총 종목: 9,788개

{전처리 파이프라인 다이어그램}

### 2. TGNN (Temporal Graph Neural Network)

**GCN → TGNN 개선**

| 구분 | GCN (기존) | TGNN (개선) |
|:-----|:----------|:-----------|
| 시간적 모델링 | 정적 상관관계만 포착 | 동적 관계 + 시계열 패턴 동시 학습 |
| 적응성 | 시장 변화에 지연 반응 | 실시간 관계 변화 감지 |
| Over-smoothing | 깊은 레이어에서 문제 발생 | 시간 정보로 노드 특성 보존 |

**주요 특징:**
- **노드**: 개별 주식
- **엣지**: Pearson 상관관계 가중치
- **Attention 메커니즘**: 동적 관계 가중치 학습
- **과거 패턴 학습**: 주기성 포착

{TGNN 아키텍처 다이어그램}

**출력:**
- 종목별 GNN_Score
- 리밸런싱 우선순위 (상관계수: -0.5860)

### 3. DDPG (Deep Deterministic Policy Gradient)

**강화학습 기반 포트폴리오 최적화**

**구성 요소:**
```
State (상태)
  ├─ 포트폴리오 현황
  ├─ GNN_Score
  ├─ 주가/거래량 시계열
  └─ 기술적 지표

Action (행동)
  └─ 종목별 투자 비중

Reward (보상)
  ├─ 샤프 비율 최적화
  ├─ 리스크-리턴 균형
  ├─ 거래비용 최소화
  └─ 분산 투자 제약
```

**DDPG 아키텍처:**
- **Actor Network**: 상태 → 행동 매핑 (포트폴리오 가중치 결정)
- **Critic Network**: Q-값 추정 (행동 가치 평가)
- **Experience Replay Buffer**: 무작위 샘플링으로 학습 안정화
- **ICVaR 리스크 관리**

{DDPG 백테스팅 결과 그래프}

**백테스팅 성과 (2024.07~2025.05):**

| 전략 | 총 수익률 | 월간 평균 수익률 | 월간 변동성 |
|:-----|:---------|:---------------|:-----------|
| DRL 가중치 (월별) | -14.1% | -1.20% | 3.87% |
| DRL 가중치 (분기별) | -14.7% | -1.28% | 3.79% |
| DRL 가중치 (반기별) | -17.5% | -1.53% | 4.23% |
| DRL 가중치 (리밸런싱 없음) | -16.8% | -1.64% | 4.27% |
| 동일 비중 (리밸런싱 없음) | -17.6% | -1.64% | 4.33% |

**주요 인사이트:**
- ✅ 리밸런싱 주기가 짧을수록 수익률 개선
- ✅ 변동성 감소 효과 확인
- ✅ 동일 비중 전략 대비 우수한 성과

### 4. Dijkstra 알고리즘 (거래 경로 최적화)

**거래 그래프 구성:**
```
노드 설정
  ├─ 각 종목 개별 노드
  ├─ 현금 포지션 별도 노드
  └─ 거래 중간 상태 노드

엣지 가중치
  ├─ 거래 수수료
  ├─ 시장 충격 비용
  └─ 스프레드 비용 (호가 차이)
```

**실행 프로세스:**
1. 현재 포트폴리오를 시작점으로 설정
2. 우선순위 큐로 최소 비용 경로 탐색
3. 목표 포트폴리오 도달까지 반복
4. 최소 비용 거래 경로 역추적
5. 예상 총 거래 비용 계산

**결과:**
- **거래비용 15% 절감**
- 최적화된 리밸런싱 실행 계획

{거래 경로 최적화 다이어그램}

### 5. NLP 기반 ESG 감정 분석

**ESG 뉴스 분석 시스템 v6.5**

**6개 핵심 모듈:**
- `WebScrapingStockDataCollector`: 데이터 수집
- `WebScrapingStockClassifier`: 주식 분류
- `WebScrapingPortfolioAnalyzer`: 포트폴리오 분석
- `WebScrapingInvestmentAdvisor`: 투자 제안
- `WebScrapingPortfolioGrader`: 종합 등급
- `WebScrapingCurrencyConverter`: 환율 변환

**특징:**
- ✅ 100% 웹 크롤링 (API 키 불필요)
- ✅ 실시간 환율 (다중 소스 자동 수집)
- ✅ 감정 분석: VADER + TextBlob + 금융 특화
- ✅ ESG 강화: SASB 기준 + 재료성 평가
- ✅ 다단계 백업 시스템

**감정 분석 프로세스:**
```python
class AdvancedESGSentimentAnalyzer:
    def analyze_comprehensive_sentiment(self, news_list):
        # VADER + TextBlob + 금융 특화 키워드
        vader_score = self.vader_analyzer.polarity_scores(text)
        textblob_score = TextBlob(text).sentiment.polarity
        financial_score = self._calculate_financial_keyword_sentiment(text)
        
        # ESG 부정 키워드 패널티
        esg_penalty = self._calculate_esg_negative_penalty(text)
        
        final_score = (
            vader_score * 0.4 + 
            textblob_score * 0.3 + 
            financial_score * 0.3
        ) + esg_penalty
```

**주식 분류 시스템:**
```python
class WebScrapingStockClassifier:
    def _is_esg_stock(self, esg_analysis):
        keyword_count = esg_analysis.get('esg_keyword_count', 0)
        news_count = esg_analysis.get('esg_news_count', 0)
        materiality_score = sentiment_analysis.get('materiality_score', 0.0)
        
        return (
            keyword_count >= 3 and
            news_count >= 3 and
            materiality_score >= 0.5
        )
    
    def _classify_as_esg(self, stock_data, esg_analysis):
        category = f"{size} {sector_style} ESG(E:{env_count}/S:{social_count}/G:{gov_count})"
```

**분석 결과 예시:**

| 종목 | 분류 | 감정 점수 | 재료성 점수 | ESG 품질 | 뉴스 수 |
|:-----|:-----|:---------|:-----------|:--------|:-------|
| Apple | 초대형 기술주 ESG+(E:4/S:5/G:3) | 0.65 | 0.78 | Positive | 8개 |
| Tesla | 대형 기술주 ESG+(E:8/S:3/G:2) | 0.82 | 0.91 | Positive | 12개 |
| NVIDIA | 초대형 기술주 ESG+(E:2/S:4/G:4) | - | - | - | - |
| SK이노베이션 | 대형 에너지주 ESG(E:3/S:2/G:1) | - | - | - | - |

**종합 성과:**
- 📊 **종합 등급**: A- (우수)
- 🎯 **종합 점수**: 0.82/1.00
- 📈 **ESG 점수**: 0.75 (투자 비중 60%)
- 📰 **뉴스 품질**: 0.83 (총 34개 뉴스)
- 💭 **감정 분석**: 0.78 (긍정적 ESG 품질)
- 🎨 **다양성**: 0.91 (6개 카테고리 균형)

{NLP 분석 결과 화면}

---

## 📁 프로젝트 구조

```
SMS_Project/
├── Front/
│   └── ReactNative/
│       ├── src/
│       │   ├── components/      # UI 컴포넌트
│       │   ├── screens/         # 화면 컴포넌트
│       │   ├── navigation/      # 네비게이션 설정
│       │   ├── api/            # API 통신
│       │   ├── data/           # 더미 데이터
│       │   ├── constants/      # 상수 및 설정
│       │   └── types/          # TypeScript 타입
│       ├── assets/             # 이미지, 폰트 등
│       └── package.json
│
├── Back/
│   ├── CODEF_API/              # 증권 계좌 연동
│   │   ├── app.py
│   │   └── .env
│   ├── AI_Model/               # AI 모델
│   │   ├── TGNN/              # 시계열 GNN
│   │   ├── DDPG/              # 강화학습
│   │   ├── Dijkstra/          # 경로 최적화
│   │   └── NLP/               # 감정 분석
│   └── database/              # SQLite DB
│
├── docs/                      # 문서
│   ├── 04_프레젠테이션(SMS).pdf
│   └── 04_프레젠테이션(NLP).pdf
│
└── README.md
```

---

## 🚀 설치 및 실행

### 사전 요구사항

```bash
# Node.js 18+ 설치 확인
node --version

# Python 3.9+ 설치 확인
python --version

# Expo CLI 설치
npm install -g expo-cli
```

### Frontend 설정

```bash
# 프로젝트 클론
git clone https://github.com/sehyun00/SMS_Project.git
cd SMS_Project/Front/ReactNative

# 의존성 설치
npm install

# Expo 앱 실행
npm start
```

### Backend 설정

```bash
cd SMS_Project/Back

# 가상환경 생성 (권장)
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# 환경변수 설정
cd CODEF_API
cp .env.example .env
# .env 파일에 CODEF API 키 입력

# Flask 서버 실행
python app.py
```

### CODEF API 더미 모드 (개발/테스트용)

> **⚠️ 주의**: CODEF API가 작동하지 않는 기간에만 사용

#### Frontend 더미 모드 활성화

```typescript
// Front/ReactNative/src/constants/config.ts
export const USE_CODEF_DUMMY_DATA = true; // 더미 모드 활성화
```

#### Backend 더미 모드 활성화

```bash
# Back/CODEF_API/.env
USE_CODEF_DUMMY=true
```

#### 더미 모드 상태 확인

```bash
curl http://localhost:5000/dummy-mode/status
```

#### 정상 모드로 변경

1. `config.ts`에서 `USE_CODEF_DUMMY_DATA = false`로 변경
2. `.env`에서 `USE_CODEF_DUMMY=false`로 변경 또는 해당 줄 삭제
3. 서버 재시작

**더미 데이터 관리:**
- 모든 더미 데이터는 `Front/ReactNative/src/data/dummyData.ts`에서 중앙 관리
- 필요시 해당 파일에서 더미 데이터 수정 가능

---

## 📱 사용자 시나리오

### 1. 계좌 연동

{계좌 연동 스크린샷 시리즈}

**단계:**
1. "계좌 연동하기" 버튼 클릭
2. 증권사 선택 (NH투자증권, 나무증권 등)
3. 증권 앱 아이디/비밀번호 입력
4. 계좌번호 선택
5. 계좌 비밀번호 입력
6. 연동 완료

### 2. 자산 확인

{자산 화면 스크린샷}

**주요 정보:**
- 총 보유자산
- 보유 종목 목록
- 원화/달러 전환
- 현금 비중
- 국내/해외 주식 비중

### 3. 리밸런싱 분석

{리밸런싱 화면 스크린샷}

**분석 프로세스:**
1. 계좌 선택
2. "분석하기" 버튼 클릭
3. AI 기반 포트폴리오 분석 실행
4. 종합 등급 및 리스크 평가 확인
5. 최적 리밸런싱 제안 확인

### 4. 리밸런싱 실행 및 기록

{리밸런싱 기록 스크린샷}

**기능:**
- 포트폴리오 이름 설정
- 목표 비중 입력
- 리밸런싱 실행
- 기록 저장 및 추적
- 수익률 모니터링

---

## 🎯 목표 성과 지표

| 구분 | 현재 | 목표 | 개선율 |
|:-----|:-----|:-----|:------|
| 수익률 | 기준 | +1.5~3%p | - |
| 변동성 | 기준 | -10~15% | - |
| 거래비용 | 기준 | -15% | ✅ 달성 |
| 의사결정 시간 | 기준 | -90% | - |

---

## 🌟 수익 모델

### 구독 기반 플랜

| 플랜 | 월 구독료 | 핵심 기능 | 타겟 |
|:-----|:---------|:---------|:-----|
| **Basic** | ₩9,900 | AI 분석 + ESG | 투자 입문자 |
| **Premium** | ₩19,900 | 전 기능 + 상담 | 적극적 투자자 |

**특징:**
- ✅ 예측 가능한 수익 창출
- ✅ 개인화된 포트폴리오 분석
- ✅ 실시간 AI 기반 리밸런싱 추천
- ✅ 투자 교육 콘텐츠 제공

---

## 📈 기대 효과

### 시장 확장

**1단계: 얼리어답터 확보 (0~6개월)**
- 대학생/직장 초년생 대상 베타 서비스
- 무료 체험 3개월 제공
- 입소문 마케팅 중심 확산

**2단계: 주류 시장 진입 (6~18개월)**
- MZ세대 전체로 타겟 확장
- 인플루언서 협업 및 소셜미디어 마케팅
- 증권사 파트너십 구축

**3단계: 시장 리더십 확보 (18개월~)**
- 전 연령층으로 서비스 확장
- 기업 고객 B2B 진출
- 해외 시장 진출 검토

### 사회적 영향

**시장 확대 효과:**
- 리밸런싱 인지도 30% → 70% 향상 목표
- 신규 투자자 유입 월 1,000명 달성
- 투자 서비스 시장 점유율 5% 확보

**금융 이해력 개선:**
- 투자 초보자 금융 리터러시 40% 향상
- 장기 투자 문화 확산 기여
- 건전한 투자 생태계 조성

---

## 👥 개발 팀

**Team 우상향 (Woosanghyang)**

- 선문대학교 컴퓨터공학부

---

## 📞 문의

- **GitHub**: [sehyun00](https://github.com/sehyun00)
- **Repository**: [SMS_Project](https://github.com/sehyun00/SMS_Project)
- **email**: [sh000917@gmail.com].

---

## 🙏 참고 자료

### 논문 및 기술 참조

1. **DeepPocket**: Soleymani, Farzan, and Eric Paquet. "Deep graph convolutional reinforcement learning for financial portfolio management-DeepPocket." Expert Systems with Applications 182 (2021): 115127.

2. **S&P100 Analysis with GNNs**: [GitHub Repository](https://github.com/timothewt/SP100AnalysisWithGNNs)

3. **Fama-French 5-Factor Model**: Eugene F. Fama and Kenneth R. French (2015)

### 데이터 출처

- **MZ세대 재테크 인식 조사**: 전국경제인연합회 "MZ세대 특성 심화 보고서"
- **시장 데이터**: CODEF API, 네이버 금융
- **ESG 뉴스**: 다중 웹 소스 크롤링

---

<p align="center">
  <img src="https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Flask-000000?style=for-the-badge&logo=flask&logoColor=white" />
  <img src="https://img.shields.io/badge/PyTorch-EE4C2C?style=for-the-badge&logo=pytorch&logoColor=white" />
  <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" />
</p>

<p align="center">
  Made with ❤️ by Team 우상향
</p>
