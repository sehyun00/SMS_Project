# 기술적 지표 라이브러리 설치 가이드

## 🚀 빠른 설치 (추천)

가장 쉬운 방법부터 시도해보세요:

```bash
# 방법 1: 쉬운 설치 (추천)
pip install pandas-ta ta

# 방법 2: 기본 requirements.txt
pip install -r requirements.txt
```

## 📊 지원 라이브러리

Ver5는 다음 라이브러리들을 **자동으로** 감지하여 사용합니다:

1. **pandas-ta** (추천) ✅
2. **ta** (Technical Analysis) ✅  
3. **TA-Lib** (고급) ⚠️
4. **수동 계산** (항상 작동) ✅

## 🔧 상세 설치 방법

### 1️⃣ pandas-ta (추천 - 쉬움)

```bash
pip install pandas-ta
```

### 2️⃣ ta 라이브러리 (쉬움)

```bash
pip install ta
```

### 3️⃣ TA-Lib (고급 - 어려울 수 있음)

#### Windows:
```bash
# conda 사용 (추천)
conda install -c conda-forge ta-lib

# 또는 pip (문제 발생 가능)
pip install TA-Lib
```

#### macOS:
```bash
# Homebrew로 의존성 설치
brew install ta-lib
pip install TA-Lib
```

#### Linux:
```bash
# 의존성 설치
sudo apt-get update
sudo apt-get install build-essential
wget http://prdownloads.sourceforge.net/ta-lib/ta-lib-0.4.0-src.tar.gz
tar -xzf ta-lib-0.4.0-src.tar.gz
cd ta-lib/
./configure --prefix=/usr
make
sudo make install
pip install TA-Lib
```

## ✅ 설치 확인

```python
python daily_factor_model_ver5.py
```

실행 시 다음과 같은 메시지가 표시됩니다:

```
✅ pandas-ta 사용 가능
✅ ta 라이브러리 사용 가능
✅ TA-Lib 사용 가능
```

## ❌ 설치 실패 시

**전혀 문제없습니다!** Ver5는 어떤 라이브러리도 없이 작동합니다:

```
⚠️ 기술적 지표 라이브러리 미설치 - 수동 계산 방법 사용
```

수동 계산 방법도 **동일한 정확도**를 제공합니다.

## 🚨 TA-Lib 문제 해결

### Windows에서 "Microsoft Visual C++ 14.0 is required"
```bash
# Visual Studio Build Tools 설치 또는
conda install -c conda-forge ta-lib
```

### "No module named '_talib'" 오류
```bash
# pandas-ta와 ta 사용 (더 쉬움)
pip install pandas-ta ta
```

## 💡 성능 비교

| 라이브러리 | 설치 난이도 | 성능 | 정확도 |
|------------|-------------|------|---------|
| pandas-ta  | ⭐ 쉬움     | 빠름 | 100% |
| ta         | ⭐ 쉬움     | 빠름 | 100% |
| TA-Lib     | ⭐⭐⭐ 어려움 | 매우 빠름 | 100% |
| 수동 계산   | ⭐ 쉬움     | 보통 | 100% |

## 🎯 권장 사항

1. **초보자**: `pip install pandas-ta ta`
2. **개발자**: requirements.txt 사용
3. **고급자**: TA-Lib 설치 도전
4. **문제 시**: 그냥 실행 (수동 계산) 
4. **정확도**: 수동 계산과 TA-Lib 결과는 동일 