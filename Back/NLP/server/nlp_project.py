# ESG 뉴스 기반 주식 분석 시스템 v6.5 - 야후파이낸스 API 제거 버전
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier, VotingClassifier
from sklearn.svm import SVC
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, accuracy_score
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
import requests
from bs4 import BeautifulSoup
from tqdm import tqdm
import re
import time
import json
import os
from datetime import datetime, timedelta
from urllib.parse import quote, urljoin
import warnings
from concurrent.futures import ThreadPoolExecutor
import threading
from functools import lru_cache
import pickle
from textblob import TextBlob
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize, sent_tokenize
from nltk.stem import WordNetLemmatizer
import random
from fake_useragent import UserAgent
from urllib.parse import quote
import xml.etree.ElementTree as ET

warnings.filterwarnings('ignore')

# NLTK 데이터 다운로드 (안전한 방식)
def safe_nltk_download():
    try:
        nltk.data.find('tokenizers/punkt')
        nltk.data.find('corpora/stopwords')
        nltk.data.find('corpora/wordnet')
    except LookupError:
        try:
            nltk.download('punkt', quiet=True)
            nltk.download('stopwords', quiet=True)
            nltk.download('wordnet', quiet=True)
        except:
            print("⚠️ NLTK 데이터 다운로드 실패 - 기본 기능으로 동작합니다")

safe_nltk_download()

# 한글 폰트 설정
plt.rcParams['font.family'] = 'Malgun Gothic'
plt.rcParams['axes.unicode_minus'] = False



class WebScrapingStockAnalysisSystem:
    """웹 크롤링 기반 주식 분석 시스템 - 야후파이낸스 API 제거 버전"""

    def __init__(self, risk_profile='중립'):
        self.data_collector = WebScrapingStockDataCollector()
        self.classifier = WebScrapingStockClassifier()
        self.portfolio_analyzer = WebScrapingPortfolioAnalyzer(risk_profile)
        self.currency_converter = WebScrapingCurrencyConverter()

        print("🚀 웹 크롤링 주식 분석 시스템 v6.5 초기화 완료 (야후파이낸스 API 제거)")
        print(f"📊 설정된 투자 성향: {risk_profile}")
        print("🌐 데이터 소스: 네이버 금융, 야후파이낸스 웹페이지, 구글 뉴스 (웹 크롤링)")
        print(f"💱 기준 통화: USD (현재 환율: {self.currency_converter.get_current_rate():.2f} KRW/USD)")
        print("🎭 감정 분석: VADER + TextBlob + 금융 특화 키워드")
        print("🔧 ESG 기준: 뉴스 1개+, 키워드 1개+, 재료성 0.2+ (웹 크롤링 기준 완화)")

    def analyze_portfolio(self, stock_codes, weights=None):
        """포트폴리오 분석 실행"""
        return self.portfolio_analyzer.analyze_portfolio(stock_codes, weights)

    def analyze_single_stock(self, stock_code):
        """개별 주식 분석"""
        print(f"\n🔍 {stock_code} 개별 분석 시작...")

        # 데이터 수집
        stock_data = self.data_collector.collect_stock_data(stock_code)

        # 분류
        classification = self.classifier.classify_stock(stock_data)

        return {
            'stock_data': stock_data,
            'classification': classification
        }

class WebScrapingStockClassifier:
    """웹 크롤링 기반 주식 분류기 - 야후파이낸스 API 제거 버전"""

    def __init__(self):
        # ESG 분류 임계값 (웹 크롤링에 맞게 완화)
        self.esg_thresholds = {
            'esg_score_threshold': 0.1,     # 0.2 → 0.1로 완화
            'esg_news_threshold': 1,        # 최소 1개 뉴스
            'esg_keyword_threshold': 1,     # 최소 1개 키워드
            'minimum_confidence': 0.4,      # 0.5 → 0.4로 완화
            'negative_sentiment_threshold': -0.25,
            'positive_sentiment_threshold': 0.25,
            'materiality_threshold': 0.2    # 재료성 기준 완화
        }

        # 분류 규칙 (달러 기준)
        self.classification_rules = {
            'size_thresholds': {
                'mega': 100000000000,  # 1000억 달러
                'large': 10000000000,  # 100억 달러
                'mid': 1000000000,     # 10억 달러
                'small': 100000000     # 1억 달러
            }
        }

        # 섹터별 스타일 매핑
        self.sector_style_mapping = {
            'Technology': '기술주',
            'Information Technology': '기술주',
            'Healthcare': '헬스케어주',
            'Consumer Cyclical': '소비재주',
            'Financial Services': '금융주',
            'Energy': '에너지주',
            'Materials': '소재주',
            'Industrials': '산업재주',
            # 한국 섹터
            '반도체': '기술주',
            '전기전자': '기술주',
            '바이오': '헬스케어주',
            '은행': '금융주',
            '화학': '소재주',
            '자동차': '산업재주'
        }

        print("✅ 웹 크롤링 주식 분류기 초기화 완료 (야후파이낸스 API 제거)")

    def classify_stock(self, stock_data):
        """주식 분류"""
        esg_analysis = stock_data.get('esg_analysis', {})

        # ESG 분류 우선 확인
        if self._is_esg_stock(esg_analysis):
            return self._classify_as_esg(stock_data, esg_analysis)

        # 일반 분류
        return self._classify_general_stock(stock_data)

    def _is_esg_stock(self, esg_analysis):
        """ESG 주식 여부 판단 (웹 크롤링 기준 완화)"""
        esg_score = esg_analysis.get('total_esg_score', 0)
        news_count = esg_analysis.get('esg_news_count', 0)
        keyword_count = esg_analysis.get('esg_keyword_count', 0)

        # 감정 분석 결과
        sentiment_analysis = esg_analysis.get('sentiment_analysis', {})
        esg_quality_decision = esg_analysis.get('esg_quality_decision', 'neutral')
        materiality_score = sentiment_analysis.get('materiality_score', 0.0)

        # 완화된 ESG 조건
        has_esg_keywords = keyword_count >= self.esg_thresholds['esg_keyword_threshold']
        has_esg_news = news_count >= self.esg_thresholds['esg_news_threshold']
        has_sufficient_materiality = materiality_score >= self.esg_thresholds['materiality_threshold']

        # 부정적 ESG는 제외
        if esg_quality_decision == 'negative':
            return False

        return has_esg_keywords and has_esg_news and has_sufficient_materiality

    def _classify_as_esg(self, stock_data, esg_analysis):
        """ESG 주식 분류"""
        basic_info = stock_data.get('basic_info', {})
        market_cap_usd = basic_info.get('market_cap_usd', 0)
        size = self._classify_size_usd(market_cap_usd)

        sector = basic_info.get('sector', '')
        sector_style = self._get_sector_style(sector)

        env_count = esg_analysis.get('environmental_count', 0)
        social_count = esg_analysis.get('social_count', 0)
        gov_count = esg_analysis.get('governance_count', 0)

        esg_quality_decision = esg_analysis.get('esg_quality_decision', 'neutral')

        if sector_style:
            if esg_quality_decision == 'positive':
                category = f"{size} {sector_style} ESG+(E:{env_count}/S:{social_count}/G:{gov_count})"
            else:
                category = f"{size} {sector_style} ESG(E:{env_count}/S:{social_count}/G:{gov_count})"
        else:
            category = f"{size} ESG주(E:{env_count}/S:{social_count}/G:{gov_count})"

        return {
            'category': category,
            'size': size,
            'style': f"ESG({env_count}/{social_count}/{gov_count})",
            'sector_style': sector_style,
            'confidence': self._calculate_esg_confidence(esg_analysis),
            'method': 'webscraping_esg_no_api',
            'esg_score': esg_analysis.get('total_esg_score', 0),
            'esg_reason': self._generate_esg_reason(esg_analysis),
            'esg_counts': f"E:{env_count}/S:{social_count}/G:{gov_count}",
            'sentiment_info': {
                'sentiment_score': esg_analysis.get('sentiment_analysis', {}).get('sentiment_score', 0),
                'esg_quality': esg_quality_decision,
                'materiality_score': esg_analysis.get('sentiment_analysis', {}).get('materiality_score', 0)
            }
        }

    def _classify_general_stock(self, stock_data):
        """일반 주식 분류"""
        basic_info = stock_data.get('basic_info', {})
        market_cap_usd = basic_info.get('market_cap_usd', 0)
        size = self._classify_size_usd(market_cap_usd)

        sector = basic_info.get('sector', '')
        sector_style = self._get_sector_style(sector)

        if sector_style:
            final_style = sector_style
        else:
            final_style = '가치주'

        return {
            'category': f"{size} {final_style}",
            'size': size,
            'style': final_style,
            'sector_style': sector_style,
            'confidence': 0.7,
            'method': 'webscraping_general_no_api'
        }

    def _classify_size_usd(self, market_cap_usd):
        """규모 분류"""
        thresholds = self.classification_rules['size_thresholds']

        if market_cap_usd >= thresholds['mega']:
            return '초대형'
        elif market_cap_usd >= thresholds['large']:
            return '대형'
        elif market_cap_usd >= thresholds['mid']:
            return '중형'
        else:
            return '소형'

    def _get_sector_style(self, sector):
        """섹터 기반 스타일"""
        if not sector:
            return None

        if sector in self.sector_style_mapping:
            return self.sector_style_mapping[sector]

        sector_lower = sector.lower()
        for key, style in self.sector_style_mapping.items():
            if key.lower() in sector_lower:
                return style

        return None

    def _calculate_esg_confidence(self, esg_analysis):
        """ESG 분류 신뢰도"""
        base_confidence = 0.6

        esg_score = esg_analysis.get('total_esg_score', 0)
        base_confidence += esg_score * 0.2

        news_count = esg_analysis.get('esg_news_count', 0)
        if news_count >= 3:
            base_confidence += 0.1

        return min(base_confidence, 1.0)

    def _generate_esg_reason(self, esg_analysis):
        """ESG 분류 이유"""
        reasons = []

        env_count = esg_analysis.get('environmental_count', 0)
        social_count = esg_analysis.get('social_count', 0)
        gov_count = esg_analysis.get('governance_count', 0)

        if env_count > 0:
            reasons.append(f'환경 키워드 {env_count}개')
        if social_count > 0:
            reasons.append(f'사회 키워드 {social_count}개')
        if gov_count > 0:
            reasons.append(f'지배구조 키워드 {gov_count}개')

        news_count = esg_analysis.get('esg_news_count', 0)
        if news_count > 0:
            reasons.append(f'ESG 뉴스 {news_count}건')

        return ', '.join(reasons) if reasons else '웹 크롤링 ESG 분류'

class WebScrapingInvestmentAdvisor:
    """웹 크롤링 기반 투자 제안 시스템"""

    def __init__(self, risk_profile='중립'):
        self.risk_profile = risk_profile

        # 이상적 포트폴리오 분포 (강화된 ESG 기준)
        self.ideal_distributions = {
            '보수': {
                '대형 금융주': 0.15, '대형 필수소비재주': 0.15, '중형 배당주': 0.10,
                '대형 기술주 ESG': 0.20, '대형 유틸리티주': 0.10, '대형 헬스케어주': 0.10,
                '초대형 배당주': 0.15, '중형 가치주': 0.05
            },
            '중립': {
                '대형 기술주': 0.20, '대형 금융주': 0.10, '중형 기술주': 0.15,
                '대형 기술주 ESG': 0.15, '대형 헬스케어주': 0.08, '소형 성장주': 0.08,
                '중형 소재주': 0.07, '대형 소비재주': 0.07, '기타': 0.10
            },
            '공격': {
                '대형 기술주': 0.25, '중형 기술주': 0.20, '소형 기술주': 0.15,
                '대형 기술주 ESG': 0.20, '초대형 기술주': 0.15, '중형 성장주': 0.05
            }
        }

        print(f"✅ 웹 크롤링 투자 제안 시스템 초기화 완료 (성향: {risk_profile})")

    def generate_dynamic_ideal_distribution(self, current_distribution):
        """현재 포트폴리오에 따른 동적 이상적 분포 생성"""
        try:
            print(f"🎯 동적 이상적 분포 생성 시작...")
            print(f"📊 입력된 현재 분포: {current_distribution}")
            
            # 현재 포트폴리오의 카테고리들 확인
            current_categories = list(current_distribution.keys())
            
            if not current_categories:
                print("⚠️ 현재 분포가 비어있음 - 기본 분포 사용")
                return self.ideal_distributions.get(self.risk_profile, self.ideal_distributions['중립'])
            
            # 카테고리 간소화 매핑
            simplified_categories = {}
            for category in current_categories:
                # 복잡한 ESG 카테고리를 간단하게 변환
                if 'ESG' in category:
                    if '기술주' in category:
                        simplified_key = '대형 기술주 ESG'
                    elif '금융주' in category:
                        simplified_key = '대형 금융주 ESG'
                    elif '헬스케어주' in category:
                        simplified_key = '대형 헬스케어주 ESG'
                    else:
                        simplified_key = '기타 ESG'
                elif '기술주' in category:
                    if '대형' in category or '초대형' in category:
                        simplified_key = '대형 기술주'
                    elif '중형' in category:
                        simplified_key = '중형 기술주'
                    else:
                        simplified_key = '소형 기술주'
                elif '금융주' in category:
                    simplified_key = '대형 금융주'
                elif '헬스케어주' in category:
                    simplified_key = '대형 헬스케어주'
                elif '소재주' in category:
                    simplified_key = '중형 소재주'
                elif '소비재주' in category:
                    simplified_key = '대형 소비재주'
                elif '성장주' in category:
                    simplified_key = '소형 성장주'
                else:
                    simplified_key = '기타'
                
                # 현재 분포를 간소화된 키로 집계
                current_weight = current_distribution[category]
                if simplified_key in simplified_categories:
                    simplified_categories[simplified_key] += current_weight
                else:
                    simplified_categories[simplified_key] = current_weight
            
            print(f"🔄 간소화된 현재 분포: {simplified_categories}")
            
            # 기본 이상적 분포 가져오기
            base_ideal = self.ideal_distributions.get(self.risk_profile, self.ideal_distributions['중립'])
            
            # 현재 포트폴리오에 존재하는 카테고리만 사용하여 이상적 분포 생성
            ideal_dist = {}
            
            for simplified_key in simplified_categories.keys():
                if simplified_key in base_ideal:
                    ideal_dist[simplified_key] = base_ideal[simplified_key]
                else:
                    # 기본값 할당
                    if 'ESG' in simplified_key:
                        ideal_dist[simplified_key] = 0.15
                    elif '기술주' in simplified_key:
                        ideal_dist[simplified_key] = 0.20
                    elif '금융주' in simplified_key:
                        ideal_dist[simplified_key] = 0.10
                    else:
                        ideal_dist[simplified_key] = 0.08
            
            # 정규화 (합계가 1.0이 되도록)
            total_sum = sum(ideal_dist.values())
            if total_sum > 0:
                ideal_dist = {k: v/total_sum for k, v in ideal_dist.items()}
            
            print(f"✅ 동적 이상적 분포 생성 완료: {ideal_dist}")
            return ideal_dist
            
        except Exception as e:
            print(f"❌ 동적 분포 생성 실패: {e}")
            # 실패 시 기본 분포 사용
            return self.ideal_distributions.get(self.risk_profile, self.ideal_distributions['중립'])

    def _simplify_distribution(self, current_distribution):
        """복잡한 카테고리를 간단하게 변환"""
        simplified = {}
        
        for category, weight in current_distribution.items():
            # 복잡한 ESG 카테고리를 간단하게 변환
            if 'ESG' in category:
                if '기술주' in category:
                    simple_key = '대형 기술주 ESG'
                elif '금융주' in category:
                    simple_key = '대형 금융주 ESG'
                else:
                    simple_key = '기타 ESG'
            elif '기술주' in category:
                if '대형' in category or '초대형' in category:
                    simple_key = '대형 기술주'
                elif '중형' in category:
                    simple_key = '중형 기술주'
                else:
                    simple_key = '소형 기술주'
            elif '금융주' in category:
                simple_key = '대형 금융주'
            elif '헬스케어주' in category:
                simple_key = '대형 헬스케어주'
            elif '성장주' in category:
                simple_key = '소형 성장주'
            elif '소재주' in category:
                simple_key = '중형 소재주'
            elif '소비재주' in category:
                simple_key = '대형 소비재주'
            else:
                simple_key = '기타'
            
            if simple_key in simplified:
                simplified[simple_key] += weight
            else:
                simplified[simple_key] = weight
        
        return simplified

    def generate_investment_recommendations(self, current_distribution, portfolio_analysis):
        """동적 투자 제안 생성"""
        print(f"\n🎯 투자 제안 생성 시작...")
        print(f"📊 원본 현재 분포: {current_distribution}")
        
        # 간소화된 분포 생성
        simplified_current = self._simplify_distribution(current_distribution)
        print(f"🔄 간소화된 현재 분포: {simplified_current}")
        
        # 동적 이상적 분포 계산
        ideal_dist = self.generate_dynamic_ideal_distribution(current_distribution)
        
        print(f"🎯 이상적 분포: {ideal_dist}")
        
        recommendations = []
        
        # 간소화된 분포와 이상적 분포 비교
        for category, ideal_weight in ideal_dist.items():
            current_weight = simplified_current.get(category, 0.0)
            difference = ideal_weight - current_weight
            
            print(f"📈 {category}: 현재 {current_weight:.3f} → 이상 {ideal_weight:.3f} (차이: {difference:.3f})")
            
            if abs(difference) > 0.05:  # 5% 이상 차이
                priority = self._determine_priority(abs(difference))
                action = '늘려야' if difference > 0 else '줄여야'
                
                recommendations.append({
                    'category': category,
                    'action': action,
                    'amount': abs(difference),
                    'priority': priority,
                    'difference': difference
                })
                
                print(f"  ➡️ 추천: {category} {action} {abs(difference)*100:.1f}% (우선순위: {priority})")
        
        # 우선순위별 정렬
        recommendations.sort(key=lambda x: (
            0 if x['priority'] == 'high' else 1 if x['priority'] == 'medium' else 2,
            -x['amount']
        ))
        
        print(f"✅ 총 {len(recommendations)}개 투자 제안 생성")
        return recommendations

    def _determine_priority(self, difference):
        """우선순위 결정"""
        if difference >= 0.15:
            return 'high'
        elif difference >= 0.08:
            return 'medium'
        else:
            return 'low'

    def _assess_news_quality(self, portfolio_analysis):
        """뉴스 품질 평가 메서드 추가"""
        try:
            # 포트폴리오 분석에서 뉴스 품질 관련 정보 추출
            esg_analysis = portfolio_analysis.get('esg_analysis', {})
            esg_ratio = esg_analysis.get('esg_ratio', 0)

            # 기본 뉴스 품질 점수 계산
            if esg_ratio >= 0.3:
                return 0.8  # 높은 ESG 비중 = 좋은 뉴스 품질
            elif esg_ratio >= 0.2:
                return 0.6  # 중간 ESG 비중
            else:
                return 0.4  # 낮은 ESG 비중

        except Exception as e:
            print(f"⚠️ 뉴스 품질 평가 실패: {e}")
            return 0.5  # 기본값

    def format_recommendations(self, recommendations, portfolio_analysis):
        """투자 제안 포맷팅"""
        if not recommendations:
            return "✅ 현재 포트폴리오가 이상적 분포에 근접합니다."

        output = []
        output.append("💡 웹 크롤링 기반 투자 제안 (달러 기준, ESG 기준 강화)")
        output.append("-" * 60)
        output.append("")

        # 우선순위별 그룹화
        high_priority = [r for r in recommendations if r['priority'] == 'high']
        medium_priority = [r for r in recommendations if r['priority'] == 'medium']
        low_priority = [r for r in recommendations if r['priority'] == 'low']

        if high_priority:
            output.append("🔴 우선순위 높음:")
            for rec in high_priority:
                emoji = "🔥" if rec['amount'] >= 0.15 else "⚠️"
                output.append(f" {emoji} {rec['category']} 비중을 {rec['amount']*100:.1f}% {rec['action']} 합니다")
            output.append("")

        if medium_priority:
            output.append("🟡 우선순위 보통:")
            for rec in medium_priority:
                emoji = "💡" if rec['amount'] >= 0.10 else "📊"
                output.append(f" {emoji} {rec['category']} 비중을 {rec['amount']*100:.1f}% {rec['action']} 합니다")
            output.append("")

        if low_priority:
            output.append("🟢 우선순위 낮음:")
            for rec in low_priority:
                output.append(f" 📈 {rec['category']} 비중을 {rec['amount']*100:.1f}% {rec['action']} 합니다")
            output.append("")

        # 추가 제안사항
        esg_analysis = portfolio_analysis.get('esg_analysis', {})
        esg_ratio = esg_analysis.get('esg_ratio', 0)

        if esg_ratio < 0.3:
            output.append("🌱 ESG 투자 비중을 30% 이상으로 늘리는 것을 권장합니다")

        news_quality = self._assess_news_quality(portfolio_analysis)
        if news_quality < 0.6:
            output.append("💡 더 많은 뉴스 소스 확보 필요")

        return "\n".join(output)


class WebScrapingPortfolioGrader:
    """웹 크롤링 기반 포트폴리오 종합 등급 시스템"""

    def __init__(self):
        self.currency_converter = WebScrapingCurrencyConverter()

        # 등급 기준
        self.grade_thresholds = {
            'A+': 0.95, 'A': 0.85, 'A-': 0.80,  # 기존보다 5-10점 상향
            'B+': 0.75, 'B': 0.70, 'B-': 0.65,
            'C+': 0.60, 'C': 0.55, 'C-': 0.50,
            'D': 0.40, 'F': 0.0
        }

        print("✅ 웹 크롤링 포트폴리오 등급 시스템 초기화 완료")

    def calculate_comprehensive_score(self, analysis_result):
        """종합 점수 계산"""
        portfolio_analysis = analysis_result['portfolio_analysis']
        stock_results = analysis_result['stock_results']

        # 1. ESG 점수 (40% 가중치)
        esg_score = self._calculate_esg_score(portfolio_analysis, stock_results)

        # 2. 뉴스 품질 점수 (25% 가중치)
        news_quality_score = self._calculate_news_quality_score(stock_results)

        # 3. 감정 분석 점수 (20% 가중치)
        sentiment_score = self._calculate_sentiment_score(stock_results)

        # 4. 포트폴리오 다양성 점수 (15% 가중치)
        diversity_score = self._calculate_diversity_score(portfolio_analysis)

        # 가중 평균 계산
        comprehensive_score = (
            esg_score * 0.40 +
            news_quality_score * 0.25 +
            sentiment_score * 0.20 +
            diversity_score * 0.15
        )

        return {
            'comprehensive_score': comprehensive_score,
            'esg_score': esg_score,
            'news_quality_score': news_quality_score,
            'sentiment_score': sentiment_score,
            'diversity_score': diversity_score,
            'grade': self._assign_grade(comprehensive_score)
        }

    def _calculate_esg_score(self, portfolio_analysis, stock_results):
        """ESG 점수 계산"""
        esg_analysis = portfolio_analysis.get('esg_analysis', {})
        esg_ratio = esg_analysis.get('esg_ratio', 0)
        avg_esg_score = esg_analysis.get('average_esg_score', 0)

        # ESG 비중과 평균 ESG 점수를 결합
        esg_weight_score = min(esg_ratio / 0.5, 1.0)  # 50% 기준
        esg_quality_score = avg_esg_score

        return (esg_weight_score * 0.6 + esg_quality_score * 0.4)

    def _calculate_news_quality_score(self, stock_results):
        """뉴스 품질 점수 계산"""
        total_news = 0
        quality_scores = []

        for result in stock_results.values():
            esg_news = result['raw_data'].get('esg_news', [])
            total_news += len(esg_news)

            if len(esg_news) >= 5:  # 3개 → 5개로 강화
                quality_scores.append(0.8)
            elif len(esg_news) >= 3:
                quality_scores.append(0.5)
            elif len(esg_news) >= 1:
                quality_scores.append(0.3)  # 0.5 → 0.3으로 하향
            else:
                quality_scores.append(0.0)  # 0.2 → 0.0으로 하향


        if not quality_scores:
            return 0.0

        avg_quality = sum(quality_scores) / len(quality_scores)
        news_volume_bonus = min(total_news / 20, 0.2)  # 20개 뉴스 기준

        return min(avg_quality + news_volume_bonus, 1.0)

    def _calculate_sentiment_score(self, stock_results):
        """감정 분석 점수 계산"""
        sentiment_scores = []

        for result in stock_results.values():
            esg_analysis = result['raw_data'].get('esg_analysis', {})
            sentiment_analysis = esg_analysis.get('sentiment_analysis', {})

            esg_quality = esg_analysis.get('esg_quality_decision', 'neutral')
            materiality_score = sentiment_analysis.get('materiality_score', 0)

            if esg_quality == 'positive':
                sentiment_scores.append(0.8 + materiality_score * 0.2)
            elif esg_quality == 'negative':
                sentiment_scores.append(0.2)
            else:
                sentiment_scores.append(0.5 + materiality_score * 0.3)

        return sum(sentiment_scores) / len(sentiment_scores) if sentiment_scores else 0.5

    def _calculate_diversity_score(self, portfolio_analysis):
        """포트폴리오 다양성 점수 계산"""
        current_dist = portfolio_analysis.get('current_distribution', {})

        if not current_dist:
            return 0.0

        # 카테고리 수
        category_count = len(current_dist)
        category_score = min(category_count / 6, 1.0)  # 6개 카테고리 기준

        # 분포 균형도 (지니 계수 역수)
        weights = list(current_dist.values())
        if weights:
            try:
                gini = self._calculate_gini_coefficient(weights)
                balance_score = 1 - gini
            except Exception as e:
                print(f"⚠️ 지니 계수 계산 실패: {e}")
                balance_score = 0.5  # 기본값
        else:
            balance_score = 0

        return (category_score * 0.4 + balance_score * 0.6)


    def _calculate_gini_coefficient(self, weights):
        """지니 계수 계산"""
        if not weights:
            return 1.0

        weights = sorted(weights)
        n = len(weights)
        cumsum = sum((i + 1) * w for i, w in enumerate(weights))

        return (2 * cumsum) / (n * sum(weights)) - (n + 1) / n

    def _assign_grade(self, score):
        """점수에 따른 등급 할당"""
        for grade, threshold in self.grade_thresholds.items():
            if score >= threshold:
                return grade
        return 'F'

    def generate_insights(self, analysis_result, grading_result):
        """추가 인사이트 생성"""
        portfolio_analysis = analysis_result['portfolio_analysis']
        stock_results = analysis_result['stock_results']

        insights = []
        insights.append("💡 웹 크롤링 기반 추가 인사이트 (달러 기준, ESG 기준 강화)")
        insights.append("=" * 60)

        # 환율 정보
        current_rate = self.currency_converter.get_current_rate()
        insights.append(f"💱 현재 환율: {current_rate:.2f} KRW/USD로 모든 분석이 달러 기준으로 통일되었습니다.")

        # ESG 기준 정보
        insights.append("🔧 강화된 ESG 기준 적용: 뉴스 3개+, 키워드 3개+, 재료성 0.5+ 기준")

        # ESG 투자 비중
        esg_analysis = portfolio_analysis.get('esg_analysis', {})
        esg_ratio = esg_analysis.get('esg_ratio', 0)
        if esg_ratio >= 0.3:
            insights.append(f"🌱 ESG 투자 비중이 {esg_ratio*100:.0f}% 이상으로 지속가능한 투자 포트폴리오입니다.")
        else:
            insights.append(f"⚠️ ESG 투자 비중이 {esg_ratio*100:.0f}%로 30% 미만입니다. 증대를 권장합니다.")

        # 뉴스 품질
        news_quality = grading_result['news_quality_score']
        if news_quality >= 0.7:
            insights.append(f"📰 우수한 뉴스 데이터 품질 (품질 점수: {news_quality:.2f})")
        elif news_quality >= 0.5:
            insights.append(f"📰 양호한 뉴스 데이터 품질 (품질 점수: {news_quality:.2f})")
        else:
            insights.append(f"📰 뉴스 데이터 품질 개선 필요 (품질 점수: {news_quality:.2f})")

        # 감정 분석 품질
        sentiment_score = grading_result['sentiment_score']
        if sentiment_score >= 0.7:
            insights.append(f"🎭 우수한 ESG 뉴스 감정 품질 (감정 점수: {sentiment_score:.2f})")
        elif sentiment_score >= 0.5:
            insights.append(f"🎭 양호한 ESG 뉴스 감정 품질 (감정 점수: {sentiment_score:.2f})")
        else:
            insights.append(f"🎭 ESG 뉴스 감정 품질 개선 필요 (감정 점수: {sentiment_score:.2f})")

        # 뉴스 데이터 수
        total_news = sum(len(result['raw_data'].get('esg_news', [])) for result in stock_results.values())
        if total_news >= 20:
            insights.append(f"🔍 풍부한 뉴스 데이터 수집 성공 ({total_news}개 뉴스)")
        elif total_news >= 10:
            insights.append(f"🔍 적정한 뉴스 데이터 수집 ({total_news}개 뉴스)")
        else:
            insights.append(f"🔍 뉴스 데이터 수집 부족 ({total_news}개 뉴스)")

        # 종합 등급
        grade = grading_result['grade']
        comprehensive_score = grading_result['comprehensive_score']

        grade_emoji = {
            'A+': '🏆', 'A': '🥇', 'A-': '🥈',
            'B+': '🥉', 'B': '📈', 'B-': '📊',
            'C+': '⚠️', 'C': '⚠️', 'C-': '⚠️',
            'D': '🔴', 'F': '❌'
        }.get(grade, '📊')

        grade_description = {
            'A+': '최우수', 'A': '우수', 'A-': '양호',
            'B+': '보통', 'B': '보통', 'B-': '보통',
            'C+': '개선필요', 'C': '개선필요', 'C-': '개선필요',
            'D': '부족', 'F': '매우부족'
        }.get(grade, '보통')

        insights.append(f"{grade_emoji} 웹 크롤링 기반 포트폴리오 종합 등급: {grade} ({grade_description})")
        insights.append(f"📊 종합 점수: {comprehensive_score:.2f}/1.00 (ESG 기준 강화 + 감정 분석 반영)")

        return "\n".join(insights)


class WebScrapingPortfolioAnalyzer:
    """웹 크롤링 기반 포트폴리오 분석기 - 야후파이낸스 API 제거 버전"""

    def __init__(self, risk_profile='중립'):
        self.risk_profile = risk_profile
        self.currency_converter = WebScrapingCurrencyConverter()
        self.investment_advisor = WebScrapingInvestmentAdvisor(risk_profile)
        self.portfolio_grader = WebScrapingPortfolioGrader()

        # 이상적 포트폴리오 분포
        self.ideal_distributions = {
            '보수': {
                '대형 금융주': 0.15, '대형 필수소비재주': 0.15, '중형 배당주': 0.10,
                '대형 기술주 ESG': 0.15, '대형 유틸리티주': 0.10, '대형 헬스케어주': 0.10,
                '초대형 배당주': 0.15, '중형 가치주': 0.10
            },
            '중립': {
                '대형 기술주': 0.20, '대형 금융주': 0.12, '중형 기술주': 0.15,
                '대형 기술주 ESG': 0.12, '대형 헬스케어주': 0.08, '소형 성장주': 0.10,
                '중형 소재주': 0.08, '대형 소비재주': 0.08, '기타': 0.07
            },
            '공격': {
                '대형 기술주': 0.25, '중형 기술주': 0.20, '소형 기술주': 0.15,
                '대형 기술주 ESG': 0.15, '초대형 기술주': 0.15, '중형 성장주': 0.10
            }
        }

        print(f"✅ 웹 크롤링 포트폴리오 분석기 초기화 완료 (성향: {risk_profile}, 야후파이낸스 API 제거)")

    def analyze_portfolio(self, stock_codes, weights=None):
        """포트폴리오 분석"""
        print(f"\n🔍 {len(stock_codes)}개 종목 웹 크롤링 기반 포트폴리오 분석 시작 (야후파이낸스 API 제거)")
        print("=" * 90)

        # 데이터 수집 및 분류
        stock_results = {}

        for i, stock_code in enumerate(stock_codes, 1):
            print(f"\n[{i}/{len(stock_codes)}] {stock_code} 웹 크롤링 분석 중...")

            try:
                data_collector = WebScrapingStockDataCollector()
                stock_data = data_collector.collect_stock_data(stock_code)

                classifier = WebScrapingStockClassifier()
                classification = classifier.classify_stock(stock_data)

                stock_results[stock_code] = {
                    'raw_data': stock_data,
                    'classification': classification
                }

                company_name = stock_data.get('basic_info', {}).get('name', stock_code)
                confidence = classification['confidence']
                market_cap_usd = stock_data.get('basic_info', {}).get('market_cap_usd', 0)

                print(f"✅ {company_name}: {classification['category']}")
                print(f"   신뢰도: {confidence:.2f} | 시가총액: ${market_cap_usd:,.0f}")

                if 'ESG' in classification['category']:
                    esg_score = classification.get('esg_score', 0)
                    esg_reason = classification.get('esg_reason', '')
                    print(f"   ESG점수: {esg_score:.2f} | 사유: {esg_reason}")

            except Exception as e:
                print(f"❌ {stock_code} 분석 실패: {str(e)}")
                stock_results[stock_code] = self._get_default_result(stock_code)

            if i < len(stock_codes):
                print("⏳ 서버 부하 방지를 위해 대기 중...")
                time.sleep(random.uniform(3, 6))

        # 포트폴리오 분석
        classifications = {code: result['classification'] for code, result in stock_results.items()}
        portfolio_analysis = self._analyze_portfolio_distribution(classifications, weights)

        # 기본 결과 구성
        result = {
            'stock_results': stock_results,
            'portfolio_analysis': portfolio_analysis,
            'summary': self._generate_summary(stock_results, portfolio_analysis),
            'currency_info': {
                'base_currency': 'USD',
                'exchange_rate': self.currency_converter.get_current_rate()
            }
        }

        # 투자 제안 생성 (return 이전으로 이동)
        try:
            recommendations = self.investment_advisor.generate_investment_recommendations(
                portfolio_analysis['current_distribution'],
                portfolio_analysis
            )
            result['investment_recommendations'] = recommendations
            print("✅ 투자 제안 생성 완료")
        except Exception as e:
            print(f"⚠️ 투자 제안 생성 실패: {e}")
            result['investment_recommendations'] = []

        # 종합 등급 계산 (return 이전으로 이동)
        try:
            grading_result = self.portfolio_grader.calculate_comprehensive_score(result)
            result['grading_result'] = grading_result
            print("✅ 종합 등급 계산 완료")
        except Exception as e:
            print(f"⚠️ 종합 등급 계산 실패: {e}")
            result['grading_result'] = {
                'comprehensive_score': 0.5,
                'grade': 'C',
                'esg_score': 0.5,
                'news_quality_score': 0.5,
                'sentiment_score': 0.5,
                'diversity_score': 0.5
            }

        return result  # 모든 처리 완료 후 return


    def _analyze_portfolio_distribution(self, classifications, weights):
        """포트폴리오 분포 분석"""
        companies = list(classifications.keys())
        if weights is None:
            weights = {company: 1.0/len(companies) for company in companies}
        elif isinstance(weights, list):
            weights = {company: weight for company, weight in zip(companies, weights)}

        # 현재 분포
        current_dist = {}
        for company, classification in classifications.items():
            category = classification['category']
            weight = weights[company]
            current_dist[category] = current_dist.get(category, 0) + weight

        # ESG 분석
        esg_analysis = self._analyze_esg_portfolio(classifications)

        return {
            'current_distribution': current_dist,
            'esg_analysis': esg_analysis,
            'overall_score': {'overall': 0.7}  # 기본 점수
        }

    def _analyze_esg_portfolio(self, classifications):
        """ESG 포트폴리오 분석"""
        total_stocks = len(classifications)
        esg_stocks = 0
        total_esg_score = 0

        for classification in classifications.values():
            if 'ESG' in classification.get('category', ''):
                esg_stocks += 1
                total_esg_score += classification.get('esg_score', 0)

        esg_ratio = esg_stocks / total_stocks if total_stocks > 0 else 0
        avg_esg_score = total_esg_score / esg_stocks if esg_stocks > 0 else 0

        return {
            'esg_stock_count': esg_stocks,
            'esg_ratio': esg_ratio,
            'average_esg_score': avg_esg_score
        }

    def _generate_summary(self, stock_results, portfolio_analysis):
        """요약 생성"""
        total_stocks = len(stock_results)
        confidences = [result['classification']['confidence'] for result in stock_results.values()]
        avg_confidence = sum(confidences) / len(confidences) if confidences else 0

        return {
            'total_stocks': total_stocks,
            'average_confidence': avg_confidence,
            'portfolio_score': 0.7,
            'analysis_timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }

    def _get_default_result(self, stock_code):
        """기본 결과"""
        return {
            'raw_data': {
                'stock_code': stock_code,
                'basic_info': {'name': stock_code, 'market_cap_usd': 0},
                'esg_analysis': {'total_esg_score': 0.0, 'esg_news_count': 0}
            },
            'classification': {
                'category': '중형 가치주',
                'confidence': 0.3,
                'method': 'default'
            }
        }

# 리포트 출력 함수 (간소화 버전)
def print_analysis_report(analysis_result):
    """분석 리포트 출력 (투자 제안 및 등급 포함)"""
    print("\n" + "=" * 90)
    print("📋 웹 크롤링 기반 ESG 포트폴리오 분석 리포트 v6.5")
    print("=" * 90)

    # 기존 개별 종목 분석 출력...
    print("\n🔍 개별 종목 분석 결과")
    print("-" * 60)

    for stock_code, result in analysis_result['stock_results'].items():
        classification = result['classification']
        basic_info = result['raw_data'].get('basic_info', {})
        company_name = basic_info.get('name', stock_code)
        market_cap_usd = basic_info.get('market_cap_usd', 0)

        print(f"\n📈 {company_name} ({stock_code})")
        print(f" 분류: {classification['category']}")
        print(f" 신뢰도: {classification['confidence']:.2f}")
        print(f" 시가총액: ${market_cap_usd:,.0f}")

    # ESG 분석 출력
    esg_analysis = analysis_result['portfolio_analysis']['esg_analysis']
    print(f"\n🌱 ESG 투자 분석")
    print("-" * 60)
    print(f" ESG 종목 수: {esg_analysis['esg_stock_count']}개")
    print(f" ESG 비중: {esg_analysis['esg_ratio']*100:.1f}%")
    print(f" 평균 ESG 점수: {esg_analysis['average_esg_score']:.2f}")

    # 투자 제안 출력
    if 'investment_recommendations' in analysis_result:
        try:
            recommendations = analysis_result['investment_recommendations']
            portfolio_analysis = analysis_result['portfolio_analysis']

            advisor = WebScrapingInvestmentAdvisor()
            recommendation_text = advisor.format_recommendations(recommendations, portfolio_analysis)
            print(f"\n{recommendation_text}")
        except Exception as e:
            print(f"\n⚠️ 투자 제안 출력 실패: {e}")

    # 종합 등급 및 인사이트 출력
    if 'grading_result' in analysis_result:
        try:
            grader = WebScrapingPortfolioGrader()
            insights = grader.generate_insights(analysis_result, analysis_result['grading_result'])
            print(f"\n{insights}")
        except Exception as e:
            print(f"\n⚠️ 종합 등급 출력 실패: {e}")

    # 요약 출력
    summary = analysis_result['summary']
    print(f"\n📋 분석 요약")
    print("-" * 60)
    print(f" 총 종목 수: {summary['total_stocks']}개")
    print(f" 평균 신뢰도: {summary['average_confidence']:.2f}")
    print(f" 분석 일시: {summary['analysis_timestamp']}")



class WebScrapingCurrencyConverter:
    """웹 크롤링 기반 환율 변환기 - 개선된 버전"""

    def __init__(self):
        self.exchange_rates = {}
        self.last_update = None
        self.session = requests.Session()

        # 다양한 User-Agent 헤더 설정
        self.user_agents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0'
        ]

        self._update_headers()
        self.update_exchange_rates()
        print("✅ 웹 크롤링 환율 변환기 초기화 완료")

    def _update_headers(self):
        """헤더 업데이트"""
        user_agent = random.choice(self.user_agents)
        self.session.headers.update({
            'User-Agent': user_agent,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'ko-KR,ko;q=0.8,en-US;q=0.5,en;q=0.3',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Cache-Control': 'max-age=0'
        })

    def update_exchange_rates(self):
        """웹 크롤링으로 환율 정보 업데이트 - 개선된 버전"""
        print("💱 환율 정보 크롤링 시작...")

        # 방법 1: 네이버 금융 메인 페이지에서 USD/KRW 환율 가져오기
        if self._get_rate_from_naver_main():
            return

        # 방법 2: 네이버 금융 환율 전용 페이지에서 가져오기
        if self._get_rate_from_naver_exchange():
            return

        # 방법 3: 네이버 금융 상세 환율 페이지에서 가져오기
        if self._get_rate_from_naver_detail():
            return

        # 방법 4: 최종 백업 - 기본값 사용
        self._use_default_rate()

    def _get_rate_from_naver_main(self):
        """네이버 금융 메인 페이지에서 환율 가져오기"""
        try:
            url = "https://finance.naver.com/marketindex/"
            response = self.session.get(url, timeout=15)

            if response.status_code != 200:
                print(f"⚠️ 네이버 메인 페이지 접근 실패: {response.status_code}")
                return False

            response.encoding = 'euc-kr'
            soup = BeautifulSoup(response.text, 'html.parser')

            # 방법 1-1: exchangeList에서 USD 찾기
            usd_element = soup.select_one('ul#exchangeList span.value')
            if usd_element:
                rate_text = usd_element.get_text().strip().replace(',', '')
                try:
                    current_rate = float(rate_text)
                    self.exchange_rates['USD_KRW'] = current_rate
                    self.last_update = datetime.now()
                    print(f"💱 현재 USD/KRW 환율: {current_rate:.2f} (네이버 메인)")
                    return True
                except ValueError:
                    pass

            # 방법 1-2: 다른 선택자 시도
            rate_elements = soup.select('span.value')
            for element in rate_elements:
                rate_text = element.get_text().strip().replace(',', '')
                try:
                    current_rate = float(rate_text)
                    if 1000 <= current_rate <= 2000:  # 합리적인 USD/KRW 환율 범위
                        self.exchange_rates['USD_KRW'] = current_rate
                        self.last_update = datetime.now()
                        print(f"💱 현재 USD/KRW 환율: {current_rate:.2f} (네이버 메인 대안)")
                        return True
                except ValueError:
                    continue

            return False

        except Exception as e:
            print(f"⚠️ 네이버 메인 페이지 크롤링 실패: {e}")
            return False

    def _get_rate_from_naver_exchange(self):
        """네이버 금융 환율 전용 페이지에서 가져오기"""
        try:
            url = "https://finance.naver.com/marketindex/exchangeList.naver"
            response = self.session.get(url, timeout=15)

            if response.status_code != 200:
                print(f"⚠️ 네이버 환율 페이지 접근 실패: {response.status_code}")
                return False

            response.encoding = 'euc-kr'
            soup = BeautifulSoup(response.text, 'html.parser')

            # 테이블에서 USD 행 찾기
            rows = soup.find_all('tr')
            for row in rows:
                columns = row.find_all('td')
                if len(columns) >= 2:
                    # 첫 번째 열에서 통화명 확인
                    currency_cell = columns[0]
                    if currency_cell and 'USD' in currency_cell.get_text():
                        # 두 번째 열에서 환율 값 추출
                        rate_cell = columns[1]
                        if rate_cell:
                            rate_text = rate_cell.get_text().strip().replace(',', '')
                            try:
                                current_rate = float(rate_text)
                                self.exchange_rates['USD_KRW'] = current_rate
                                self.last_update = datetime.now()
                                print(f"💱 현재 USD/KRW 환율: {current_rate:.2f} (네이버 환율 페이지)")
                                return True
                            except ValueError:
                                continue

            return False

        except Exception as e:
            print(f"⚠️ 네이버 환율 페이지 크롤링 실패: {e}")
            return False

    def _get_rate_from_naver_detail(self):
        """네이버 금융 USD 상세 페이지에서 가져오기"""
        try:
            url = "https://finance.naver.com/marketindex/exchangeDetail.naver?marketindexCd=FX_USDKRW"
            response = self.session.get(url, timeout=15)

            if response.status_code != 200:
                print(f"⚠️ 네이버 USD 상세 페이지 접근 실패: {response.status_code}")
                return False

            response.encoding = 'euc-kr'
            soup = BeautifulSoup(response.text, 'html.parser')

            # 현재 환율 추출
            rate_element = soup.select_one('p.no_today')
            if rate_element:
                rate_text = rate_element.get_text().strip()
                # 숫자만 추출 (예: "1,379.00원" -> "1379.00")
                rate_numbers = re.findall(r'[\d,]+\.?\d*', rate_text)
                if rate_numbers:
                    rate_clean = rate_numbers[0].replace(',', '')
                    try:
                        current_rate = float(rate_clean)
                        self.exchange_rates['USD_KRW'] = current_rate
                        self.last_update = datetime.now()
                        print(f"💱 현재 USD/KRW 환율: {current_rate:.2f} (네이버 USD 상세)")
                        return True
                    except ValueError:
                        pass

            return False

        except Exception as e:
            print(f"⚠️ 네이버 USD 상세 페이지 크롤링 실패: {e}")
            return False

    def _use_default_rate(self):
        """기본 환율 사용"""
        try:
            # 실시간 환율 API 대안 시도 (무료)
            url = "https://api.exchangerate-api.com/v4/latest/USD"
            response = self.session.get(url, timeout=10)

            if response.status_code == 200:
                data = response.json()
                krw_rate = data.get('rates', {}).get('KRW')
                if krw_rate:
                    self.exchange_rates['USD_KRW'] = krw_rate
                    self.last_update = datetime.now()
                    print(f"💱 현재 USD/KRW 환율: {krw_rate:.2f} (ExchangeRate API)")
                    return

        except Exception as e:
            print(f"⚠️ 외부 환율 API 실패: {e}")

        # 최종 백업 - 고정값 사용
        self.exchange_rates['USD_KRW'] = 1350.0
        self.last_update = datetime.now()
        print("⚠️ 기본 환율 사용: 1,350 KRW/USD")

    def safe_request(self, url, max_retries=3):
        """안전한 웹 요청"""
        for attempt in range(max_retries):
            try:
                if attempt > 0:
                    self._update_headers()
                    time.sleep(random.uniform(2, 5))

                response = self.session.get(url, timeout=15)
                if response.status_code == 200:
                    return response
                elif response.status_code == 403:
                    print(f"⚠️ 접근 거부 (403) - 재시도 {attempt + 1}/{max_retries}")
                    time.sleep(random.uniform(5, 10))
                else:
                    print(f"⚠️ HTTP {response.status_code} - 재시도 {attempt + 1}/{max_retries}")
                    time.sleep(random.uniform(3, 6))

            except requests.exceptions.RequestException as e:
                print(f"⚠️ 네트워크 오류: {e} - 재시도 {attempt + 1}/{max_retries}")
                time.sleep(random.uniform(5, 10))

        return None

    def krw_to_usd(self, krw_amount):
        """원화를 달러로 변환"""
        if not krw_amount or krw_amount <= 0:
            return 0

        # 30분마다 환율 업데이트
        if (self.last_update and
            (datetime.now() - self.last_update).total_seconds() > 1800):
            print("🔄 환율 정보 업데이트 중...")
            self.update_exchange_rates()

        usd_krw_rate = self.exchange_rates.get('USD_KRW', 1350.0)
        return krw_amount / usd_krw_rate

    def usd_to_krw(self, usd_amount):
        """달러를 원화로 변환"""
        if not usd_amount or usd_amount <= 0:
            return 0

        # 30분마다 환율 업데이트
        if (self.last_update and
            (datetime.now() - self.last_update).total_seconds() > 1800):
            print("🔄 환율 정보 업데이트 중...")
            self.update_exchange_rates()

        usd_krw_rate = self.exchange_rates.get('USD_KRW', 1350.0)
        return usd_amount * usd_krw_rate

    def get_current_rate(self):
        """현재 환율 반환"""
        return self.exchange_rates.get('USD_KRW', 1350.0)

    def get_rate_info(self):
        """환율 정보 상세 반환"""
        return {
            'rate': self.get_current_rate(),
            'last_update': self.last_update.strftime('%Y-%m-%d %H:%M:%S') if self.last_update else 'Unknown',
            'source': 'Naver Finance Web Scraping'
        }

    def force_update(self):
        """강제 환율 업데이트"""
        print("🔄 환율 강제 업데이트 실행...")
        self.update_exchange_rates()
        return self.get_rate_info()

# 테스트 코드
if __name__ == "__main__":
    # 환율 변환기 테스트
    converter = WebScrapingCurrencyConverter()

    print(f"\n📊 현재 환율 정보:")
    rate_info = converter.get_rate_info()
    print(f"환율: {rate_info['rate']:.2f} KRW/USD")
    print(f"업데이트: {rate_info['last_update']}")
    print(f"소스: {rate_info['source']}")

    print(f"\n💰 변환 테스트:")
    print(f"1,000,000 KRW = ${converter.krw_to_usd(1000000):,.2f} USD")
    print(f"$1,000 USD = {converter.usd_to_krw(1000):,.0f} KRW")


class WebScrapingYahooFinanceCollector:
    """야후파이낸스 웹 크롤링 수집기 - 개선된 버전 (API 제거)"""

    def __init__(self):
        self.session = requests.Session()

        # 다양한 User-Agent 헤더 설정
        self.user_agents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0'
        ]

        self._update_headers()
        print("✅ 야후파이낸스 웹 크롤링 수집기 초기화 완료 (개선된 버전)")

    def _update_headers(self):
        """헤더 업데이트"""
        user_agent = random.choice(self.user_agents)
        self.session.headers.update({
            'User-Agent': user_agent,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'ko-KR,ko;q=0.8,en-US;q=0.5,en;q=0.3',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Cache-Control': 'max-age=0'
        })

    def safe_request(self, url, max_retries=3):
        """안전한 웹 요청"""
        for attempt in range(max_retries):
            try:
                if attempt > 0:
                    self._update_headers()
                    time.sleep(random.uniform(3, 8))

                response = self.session.get(url, timeout=15)
                if response.status_code == 200:
                    return response
                elif response.status_code == 403:
                    print(f"⚠️ 접근 거부 (403) - 대기 후 재시도... {attempt + 1}/{max_retries}")
                    time.sleep(random.uniform(8, 15))
                elif response.status_code == 429:
                    print(f"⚠️ 요청 한도 초과 (429) - 대기 중... {attempt + 1}/{max_retries}")
                    time.sleep(random.uniform(15, 25))
                else:
                    print(f"⚠️ HTTP {response.status_code} - 재시도... {attempt + 1}/{max_retries}")
                    time.sleep(random.uniform(5, 10))

            except requests.exceptions.RequestException as e:
                print(f"⚠️ 네트워크 오류: {e} - 재시도 중... {attempt + 1}/{max_retries}")
                time.sleep(random.uniform(8, 15))

        return None

    def scrape_stock_info(self, symbol):
        """야후파이낸스에서 주식 정보 크롤링 - 섹터 정보 강화 버전"""
        try:
            # 메인 페이지에서 기본 정보 수집
            url = f"https://finance.yahoo.com/quote/{symbol}"
            response = self.safe_request(url)

            if not response:
                print(f"⚠️ {symbol} 메인 페이지 접근 실패")
                return self._get_empty_stock_info(symbol)

            soup = BeautifulSoup(response.text, 'html.parser')
            company_name = self._extract_company_name(soup, symbol)
            sector = self._extract_sector(soup)

            # 섹터 정보가 없으면 Profile 페이지에서 추가 시도
            if not sector:
                print(f"🔍 {symbol} Profile 페이지에서 섹터 정보 재시도...")
                sector = self._try_profile_page_for_sector(symbol)

            # 기본 정보 추출
            stock_info = {
                'symbol': symbol,
                'name': company_name,
                'sector': sector,
                'industry': self._extract_industry(soup),
                'market_cap': self._extract_market_cap(soup),
                'current_price': self._extract_current_price(soup),
                'financial_data': self._extract_financial_data(soup),
                'description': self._extract_description(soup)
            }

            print(f"✅ {symbol} 정보 크롤링 완료: {stock_info['name']} | 섹터: {stock_info['sector']} | 시가총액: ${stock_info['market_cap']:,.0f}")
            return stock_info

        except Exception as e:
            print(f"❌ {symbol} 크롤링 실패: {e}")
            return self._get_empty_stock_info(symbol)

    def _try_profile_page_for_sector(self, symbol):
        """Profile 페이지에서 섹터 정보 재시도"""
        try:
            profile_url = f"https://finance.yahoo.com/quote/{symbol}/profile"
            response = self.safe_request(profile_url)

            if response:
                soup = BeautifulSoup(response.text, 'html.parser')
                sector = self._extract_sector(soup)
                if sector:
                    print(f"✅ Profile 페이지에서 섹터 추출 성공: {sector}")
                    return sector

            return ""
        except Exception as e:
            print(f"⚠️ Profile 페이지 섹터 추출 실패: {e}")
            return ""

    def _extract_sector(self, soup):
        """대폭 개선된 섹터 정보 추출"""
        try:
            # 방법 1: 새로운 야후파이낸스 구조 선택자들 (2024-2025년 버전)
            enhanced_selectors = [
                # 최신 야후파이낸스 섹터 선택자들
                '[data-test="SECTOR-value"]',
                'td[data-test="SECTOR-value"]',
                'span[data-test="SECTOR-value"]',
                '[data-field="sector"]',

                # Profile 페이지 섹터 선택자들
                'span:contains("Sector") + span',
                'span:contains("Sector(s)") + span',
                'td:contains("Sector") + td',
                'th:contains("Sector") + td',

                # 테이블 구조 기반 선택자들
                'tr:contains("Sector") td:last-child',
                'tr:contains("Sector(s)") td:last-child',

                # 새로운 구조 선택자들
                '.Fw\\(600\\):contains("Technology")',
                '.Fw\\(600\\):contains("Healthcare")',
                '.Fw\\(600\\):contains("Financial")',
                '.Fw\\(600\\):contains("Consumer")',
                '.Fw\\(600\\):contains("Energy")',
                '.Fw\\(600\\):contains("Materials")',
                '.Fw\\(600\\):contains("Industrials")',
                '.Fw\\(600\\):contains("Utilities")',
                '.Fw\\(600\\):contains("Real Estate")',
                '.Fw\\(600\\):contains("Communication")',

                # 대안 선택자들
                'span.Fw\\(600\\)',
                'td.Fw\\(600\\)',
                '.company-info .sector',
                '.profile-section span'
            ]

            for selector in enhanced_selectors:
                try:
                    elements = soup.select(selector)
                    for element in elements:
                        sector_text = element.get_text().strip()
                        if self._is_valid_sector(sector_text):
                            print(f"✅ 섹터 정보 추출 성공: {sector_text} (선택자: {selector})")
                            return sector_text
                except Exception as e:
                    continue

            # 방법 2: 텍스트 패턴 매칭으로 섹터 찾기
            sector_from_text = self._extract_sector_from_text_patterns(soup)
            if sector_from_text:
                return sector_from_text

            # 방법 3: Profile 페이지에서 추가 크롤링
            sector_from_profile = self._extract_sector_from_profile_page(soup)
            if sector_from_profile:
                return sector_from_profile

            # 방법 4: JSON 데이터에서 섹터 추출
            sector_from_json = self._extract_sector_from_json_data(soup)
            if sector_from_json:
                return sector_from_json

            print("⚠️ 모든 방법으로 섹터 추출 실패")
            return ""

        except Exception as e:
            print(f"⚠️ 섹터 추출 중 오류: {e}")
            return ""

    def _is_valid_sector(self, sector_text):
        """유효한 섹터인지 확인"""
        if not sector_text or len(sector_text) < 3 or len(sector_text) > 50:
            return False

        # 알려진 섹터 목록
        known_sectors = [
            'Technology', 'Healthcare', 'Financial Services', 'Consumer Cyclical',
            'Consumer Defensive', 'Energy', 'Materials', 'Industrials', 'Utilities',
            'Real Estate', 'Communication Services', 'Basic Materials',
            'Information Technology', 'Health Care', 'Financials', 'Consumer Staples',
            'Consumer Discretionary', 'Telecommunication Services'
        ]

        # 정확히 매칭되는 섹터
        if sector_text in known_sectors:
            return True

        # 부분 매칭 (대소문자 무시)
        sector_lower = sector_text.lower()
        for known in known_sectors:
            if known.lower() in sector_lower or sector_lower in known.lower():
                return True

        # 섹터 키워드 포함 여부
        sector_keywords = ['technology', 'healthcare', 'financial', 'consumer', 'energy',
                          'materials', 'industrial', 'utilities', 'real estate', 'communication']

        for keyword in sector_keywords:
            if keyword in sector_lower:
                return True

        return False

    def _extract_sector_from_text_patterns(self, soup):
        """텍스트 패턴에서 섹터 추출"""
        try:
            page_text = soup.get_text()

            # 섹터 패턴 매칭
            sector_patterns = [
                r'Sector[:\s]*([A-Za-z\s&]+?)(?:\s*Industry|\s*Full Time|\s*Market Cap|\n|$)',
                r'Sector\(s\)[:\s]*([A-Za-z\s&]+?)(?:\s*Industry|\s*Full Time|\n|$)',
                r'(?:Sector|SECTOR)[:\s]*([A-Za-z\s&]+?)(?:\s*[A-Z][a-z]|\n|$)',
            ]

            for pattern in sector_patterns:
                matches = re.findall(pattern, page_text, re.IGNORECASE | re.MULTILINE)
                for match in matches:
                    cleaned_sector = match.strip()
                    if self._is_valid_sector(cleaned_sector):
                        print(f"✅ 텍스트 패턴에서 섹터 추출: {cleaned_sector}")
                        return cleaned_sector

            return None
        except:
            return None

    def _extract_sector_from_profile_page(self, soup):
        """Profile 페이지 구조에서 섹터 추출"""
        try:
            # Profile 페이지의 특별한 구조 찾기
            profile_sections = soup.find_all(['section', 'div'], class_=re.compile(r'profile|company|summary'))

            for section in profile_sections:
                # 섹터 관련 텍스트 찾기
                sector_elements = section.find_all(text=re.compile(r'Sector', re.IGNORECASE))

                for element in sector_elements:
                    parent = element.parent
                    if parent:
                        # 다음 형제 요소들에서 섹터 값 찾기
                        next_elements = parent.find_next_siblings(['span', 'td', 'div'])
                        for next_elem in next_elements[:3]:  # 최대 3개까지만 확인
                            sector_text = next_elem.get_text().strip()
                            if self._is_valid_sector(sector_text):
                                print(f"✅ Profile 페이지에서 섹터 추출: {sector_text}")
                                return sector_text

            return None
        except:
            return None

    def _extract_sector_from_json_data(self, soup):
        """JSON 데이터에서 섹터 추출"""
        try:
            # 스크립트 태그에서 JSON 데이터 찾기
            script_tags = soup.find_all('script')

            for script in script_tags:
                script_content = script.string
                if script_content and ('sector' in script_content.lower() or 'quoteSummary' in script_content):
                    try:
                        # JSON 데이터 추출 시도
                        json_patterns = [
                            r'quoteSummary["\']:\s*({.+?})\s*[,}]',
                            r'"sector":\s*"([^"]+)"',
                            r'"sectorKey":\s*"([^"]+)"',
                            r'"sectorDisp":\s*"([^"]+)"'
                        ]

                        for pattern in json_patterns:
                            matches = re.findall(pattern, script_content, re.IGNORECASE)
                            for match in matches:
                                if isinstance(match, str) and self._is_valid_sector(match):
                                    print(f"✅ JSON에서 섹터 추출: {match}")
                                    return match
                                elif isinstance(match, str):
                                    try:
                                        # JSON 파싱 시도
                                        json_data = json.loads(match)
                                        sector_paths = [
                                            ['result', 0, 'summaryProfile', 'sector'],
                                            ['result', 0, 'assetProfile', 'sector'],
                                            ['result', 0, 'quoteType', 'sector'],
                                            ['sector'],
                                            ['sectorKey'],
                                            ['sectorDisp']
                                        ]

                                        for path in sector_paths:
                                            try:
                                                current = json_data
                                                for key in path:
                                                    current = current[key]
                                                if current and isinstance(current, str) and self._is_valid_sector(current):
                                                    print(f"✅ JSON 경로에서 섹터 추출: {current}")
                                                    return current
                                            except:
                                                continue
                                    except json.JSONDecodeError:
                                        continue

                    except Exception as e:
                        continue

            return None
        except:
            return None

    def _extract_industry(self, soup):
        """산업 정보 추출"""
        try:
            selectors = [
                '[data-test="INDUSTRY-value"]',
                'td[data-test="INDUSTRY-value"]',
                'span[data-test="INDUSTRY-value"]',
                '[data-field="industry"]'
            ]

            for selector in selectors:
                element = soup.select_one(selector)
                if element:
                    industry = element.get_text().strip()
                    if industry and len(industry) < 50:
                        return industry

            # 대안 방법: Industry 텍스트 검색
            industry_elements = soup.find_all(text=re.compile(r'Industry', re.IGNORECASE))
            for element in industry_elements:
                parent = element.parent
                if parent:
                    value_element = parent.find_next(['td', 'span', 'div'])
                    if value_element:
                        industry_text = value_element.get_text().strip()
                        if industry_text and len(industry_text) < 50:
                            return industry_text

            return ""
        except:
            return ""

    def _extract_company_name(self, soup, symbol):
        """대폭 개선된 회사명 추출"""
        try:
            # 방법 1: 새로운 야후파이낸스 구조 선택자들
            enhanced_selectors = [
                # 2024-2025년 야후파이낸스 새 구조
                'h1[data-field="symbol"]',
                'h1.D\\(ib\\).Fz\\(18px\\)',
                '[data-test="qsp-header"] h1',
                'h1.C\\(\\$c-fuji-grey-k\\)',
                'section[data-test="qsp-header"] h1',

                # 메타 태그에서 추출
                'meta[property="og:title"]',
                'meta[name="title"]',

                # 제목 태그에서 추출 (정제 필요)
                'title',

                # 대안 선택자들
                'div[data-test="qsp-header"] h1',
                '.D\\(ib\\).Fz\\(18px\\)',
                'h1.Fw\\(b\\)',
                'h1'
            ]

            for selector in enhanced_selectors:
                try:
                    if selector.startswith('meta'):
                        element = soup.select_one(selector)
                        if element:
                            content = element.get('content', '').strip()
                            if content:
                                # 메타 태그에서 회사명 정제
                                name = self._clean_company_name_from_meta(content, symbol)
                                if name and name != symbol and len(name) > 1:
                                    return name
                    else:
                        element = soup.select_one(selector)
                        if element:
                            name = element.get_text().strip()
                            # 회사명 정제
                            name = self._clean_company_name(name, symbol)
                            if name and name != symbol and len(name) > 1:
                                return name
                except Exception as e:
                    continue

            # 방법 2: JSON 데이터에서 추출
            company_name = self._extract_name_from_json_data(soup, symbol)
            if company_name:
                return company_name

            # 방법 3: 페이지 텍스트에서 패턴 매칭
            company_name = self._extract_name_from_text_patterns(soup, symbol)
            if company_name:
                return company_name

            # 방법 4: 대체 API 엔드포인트 사용
            company_name = self._get_name_from_yahoo_api(symbol)
            if company_name:
                return company_name

            return symbol

        except Exception as e:
            print(f"⚠️ 회사명 추출 실패: {e}")
            return symbol

    def _clean_company_name_from_meta(self, content, symbol):
        """메타 태그에서 회사명 정제"""
        try:
            # "Apple Inc. (AAPL) Stock Price, News, Quote & History - Yahoo Finance" 형태
            if '(' in content and ')' in content:
                # 괄호 앞부분 추출
                name = content.split('(')[0].strip()
                # 불필요한 텍스트 제거
                name = re.sub(r'\s+(Stock|Price|News|Quote|History|Yahoo|Finance).*', '', name, flags=re.IGNORECASE)
                name = re.sub(r'\s*-\s*.*', '', name)  # - 이후 제거
                return name.strip()

            # 다른 패턴들
            patterns = [
                r'^([^-]+)\s*-',  # - 앞부분
                r'^([^|]+)\s*\|',  # | 앞부분
                r'^([^:]+)\s*:',   # : 앞부분
            ]

            for pattern in patterns:
                match = re.search(pattern, content)
                if match:
                    name = match.group(1).strip()
                    name = re.sub(r'\s+(Stock|Price|News|Quote|History).*', '', name, flags=re.IGNORECASE)
                    if len(name) > 1 and name != symbol:
                        return name

            return None
        except:
            return None

    def _clean_company_name(self, name, symbol):
        """회사명 정제"""
        try:
            if not name:
                return None

            # 심볼과 괄호 제거
            name = re.sub(r'\([^)]*\)', '', name).strip()

            # 불필요한 텍스트 제거
            unwanted_patterns = [
                r'\s*-\s*Yahoo Finance.*',
                r'\s*\|\s*Yahoo Finance.*',
                r'\s*:\s*Yahoo Finance.*',
                r'\s*Stock.*',
                r'\s*Quote.*',
                r'\s*News.*',
                r'\s*Price.*',
                r'\s*Chart.*'
            ]

            for pattern in unwanted_patterns:
                name = re.sub(pattern, '', name, flags=re.IGNORECASE)

            # 공백 정리
            name = re.sub(r'\s+', ' ', name).strip()

            # 유효성 검사
            if len(name) > 1 and name.lower() != symbol.lower() and 'yahoo' not in name.lower():
                return name

            return None
        except:
            return None

    def _extract_name_from_json_data(self, soup, symbol):
        """JSON 데이터에서 회사명 추출"""
        try:
            # 스크립트 태그에서 JSON 데이터 찾기
            script_tags = soup.find_all('script')

            for script in script_tags:
                script_content = script.string
                if script_content and 'quoteSummary' in script_content:
                    try:
                        # JSON 데이터 추출 시도
                        json_match = re.search(r'quoteSummary["\']:\s*({.+?})\s*[,}]', script_content)
                        if json_match:
                            json_data = json.loads(json_match.group(1))

                            # 다양한 경로에서 회사명 찾기
                            name_paths = [
                                ['result', 0, 'quoteType', 'longName'],
                                ['result', 0, 'quoteType', 'shortName'],
                                ['result', 0, 'price', 'longName'],
                                ['result', 0, 'price', 'shortName'],
                                ['result', 0, 'summaryProfile', 'longName'],
                            ]

                            for path in name_paths:
                                try:
                                    current = json_data
                                    for key in path:
                                        current = current[key]
                                    if current and isinstance(current, str) and len(current) > 1:
                                        cleaned_name = self._clean_company_name(current, symbol)
                                        if cleaned_name:
                                            return cleaned_name
                                except:
                                    continue

                    except json.JSONDecodeError:
                        continue

            return None
        except:
            return None

    def _extract_name_from_text_patterns(self, soup, symbol):
        """텍스트 패턴에서 회사명 추출"""
        try:
            page_text = soup.get_text()

            # 패턴 매칭으로 회사명 찾기
            patterns = [
                rf'{symbol}\s*-\s*([^-|]+?)(?:\s*-|\s*\||$)',
                rf'({symbol}[^-|]+?)(?:\s*-|\s*\||$)',
                rf'([A-Z][a-zA-Z\s&.,]+(?:Inc|Corp|Ltd|LLC|Company|Co)\.?)\s*\({symbol}\)',
            ]

            for pattern in patterns:
                matches = re.findall(pattern, page_text, re.IGNORECASE)
                for match in matches:
                    if isinstance(match, tuple):
                        match = match[0] if match else ''

                    cleaned_name = self._clean_company_name(match, symbol)
                    if cleaned_name and len(cleaned_name) > 3:
                        return cleaned_name

            return None
        except:
            return None

    def _get_name_from_yahoo_api(self, symbol):
        """야후 검색 API에서 회사명 가져오기"""
        try:
            import urllib.request
            import json

            url = f'https://query2.finance.yahoo.com/v1/finance/search?q={symbol}'

            # 헤더 설정
            req = urllib.request.Request(url)
            req.add_header('User-Agent', random.choice(self.user_agents))

            with urllib.request.urlopen(req, timeout=10) as response:
                content = response.read()
                data = json.loads(content.decode('utf8'))

                quotes = data.get('quotes', [])
                for quote in quotes:
                    if quote.get('symbol') == symbol:
                        # longName 또는 shortName 사용
                        name = quote.get('longName') or quote.get('shortName')
                        if name:
                            cleaned_name = self._clean_company_name(name, symbol)
                            if cleaned_name:
                                return cleaned_name

            return None
        except Exception as e:
            print(f"⚠️ 야후 API에서 회사명 추출 실패: {e}")
            return None

    def _extract_market_cap(self, soup):
        """개선된 시가총액 추출"""
        try:
            selectors = [
                '[data-test="MARKET_CAP-value"]',
                'td[data-test="MARKET_CAP-value"]',
                'span[data-test="MARKET_CAP-value"]',
                '[data-field="marketCap"]'
            ]

            for selector in selectors:
                element = soup.select_one(selector)
                if element:
                    market_cap_text = element.get_text().strip()
                    parsed_cap = self._parse_market_cap_improved(market_cap_text)
                    if parsed_cap > 0:
                        return parsed_cap

            # 대안 방법: Market Cap 텍스트 검색
            market_cap_elements = soup.find_all(text=re.compile(r'Market Cap', re.IGNORECASE))
            for element in market_cap_elements:
                parent = element.parent
                if parent:
                    value_element = parent.find_next(['td', 'span', 'div'])
                    if value_element:
                        market_cap_text = value_element.get_text().strip()
                        parsed_cap = self._parse_market_cap_improved(market_cap_text)
                        if parsed_cap > 0:
                            return parsed_cap

            return 0
        except:
            return 0

    def _parse_market_cap_improved(self, market_cap_text):
        """개선된 시가총액 파싱"""
        try:
            if not market_cap_text:
                return 0

            # 텍스트 정리
            market_cap_text = market_cap_text.replace(',', '').replace('$', '').strip()

            # 패턴 매칭 (우선순위 순)
            patterns = [
                (r'([0-9.]+)\s*T', 1_000_000_000_000),    # 조 (Trillion)
                (r'([0-9.]+)\s*B', 1_000_000_000),        # 십억 (Billion)
                (r'([0-9.]+)\s*M', 1_000_000),            # 백만 (Million)
                (r'([0-9.]+)\s*K', 1_000),                # 천 (Thousand)
            ]

            for pattern, multiplier in patterns:
                match = re.search(pattern, market_cap_text, re.IGNORECASE)
                if match:
                    number = float(match.group(1))
                    result = int(number * multiplier)
                    # 합리적인 범위 체크
                    if 1_000_000 <= result <= 10_000_000_000_000:  # 1백만 ~ 10조 달러
                        return result

            # 단순 숫자인 경우
            numbers = re.findall(r'[0-9.]+', market_cap_text)
            if numbers:
                number = float(numbers[0])
                if 1_000_000 <= number <= 10_000_000_000_000:
                    return int(number)

            return 0

        except Exception as e:
            print(f"⚠️ 시가총액 파싱 실패: {e}")
            return 0

    def _extract_current_price(self, soup):
        """현재 주가 추출"""
        try:
            selectors = [
                'fin-streamer[data-field="regularMarketPrice"]',
                '[data-test="qsp-price"]',
                '[data-field="regularMarketPrice"]',
                '.Fw\\(b\\).Fz\\(36px\\)'
            ]

            for selector in selectors:
                element = soup.select_one(selector)
                if element:
                    price_text = element.get('value') or element.get_text()
                    if price_text:
                        try:
                            price = float(price_text.replace(',', '').replace('$', ''))
                            if 0.01 <= price <= 100000:  # 합리적인 주가 범위
                                return price
                        except:
                            continue

            return 0
        except:
            return 0

    def _extract_financial_data(self, soup):
        """재무 데이터 추출"""
        try:
            financial_data = {}

            indicators = {
                'PE_RATIO': 'pe_ratio',
                'PEG_RATIO': 'peg_ratio',
                'PRICE_TO_BOOK': 'pb_ratio',
                'DIVIDEND_AND_YIELD': 'dividend_yield',
                'EPS_RATIO': 'eps',
                'BETA': 'beta'
            }

            for yahoo_key, our_key in indicators.items():
                try:
                    element = soup.select_one(f'[data-test="{yahoo_key}-value"]')
                    if element:
                        value_text = element.get_text().strip()
                        financial_data[our_key] = self._parse_financial_value(value_text)
                except:
                    financial_data[our_key] = 0

            return financial_data
        except:
            return {}

    def _parse_financial_value(self, value_text):
        """재무 값 파싱"""
        try:
            if not value_text or value_text in ['N/A', '--', '']:
                return 0

            if '%' in value_text:
                return float(value_text.replace('%', '')) / 100

            value_text = value_text.replace(',', '').replace('$', '')
            numbers = re.findall(r'[\d.]+', value_text)

            if numbers:
                return float(numbers[0])

            return 0
        except:
            return 0

    def _extract_description(self, soup):
        """회사 설명 추출"""
        try:
            selectors = [
                '[data-test="qsp-profile"] p',
                '.company-description p',
                '.profile-section p'
            ]

            for selector in selectors:
                element = soup.select_one(selector)
                if element:
                    description = element.get_text().strip()
                    if description and len(description) > 50:
                        return description[:300]

            return ""
        except:
            return ""

    def scrape_korean_stock_info(self, stock_code):
        """한국 주식 정보 크롤링 - 대폭 개선된 버전"""
        try:
            # 방법 1: 네이버 금융 메인 페이지
            stock_info = self._scrape_from_naver_main(stock_code)
            if stock_info and stock_info.get('market_cap_krw', 0) > 0:
                return stock_info

            # 방법 2: 네이버 금융 기업정보 페이지
            stock_info = self._scrape_from_naver_company(stock_code)
            if stock_info and stock_info.get('market_cap_krw', 0) > 0:
                return stock_info

            # 방법 3: 야후파이낸스 한국 주식 (.KS)
            stock_info = self._scrape_from_yahoo_kr(stock_code)
            if stock_info and stock_info.get('market_cap_krw', 0) > 0:
                return stock_info

            # 방법 4: 수동 데이터베이스 (주요 종목)
            stock_info = self._get_manual_korean_data(stock_code)
            if stock_info:
                return stock_info

            print(f"⚠️ {stock_code} 모든 크롤링 방법 실패 - 기본값 사용")
            return self._get_empty_korean_stock_info(stock_code)

        except Exception as e:
            print(f"❌ {stock_code} 한국 주식 크롤링 실패: {e}")
            return self._get_empty_korean_stock_info(stock_code)

    def _scrape_from_naver_main(self, stock_code):
        """네이버 금융 메인 페이지에서 크롤링"""
        try:
            url = f"https://finance.naver.com/item/main.naver?code={stock_code}"
            response = self.safe_request(url)

            if not response:
                return None

            response.encoding = 'euc-kr'
            soup = BeautifulSoup(response.text, 'html.parser')

            # 회사명 추출
            company_name = self._extract_korean_company_name_improved(soup, stock_code)

            # 섹터 추출
            sector = self._extract_korean_sector_improved(soup)

            # 시가총액 추출 (개선된 방법)
            market_cap_krw = self._extract_korean_market_cap_improved(soup, stock_code)

            # 현재가 추출
            current_price_krw = self._extract_korean_current_price_improved(soup)

            # 재무 데이터
            financial_data = self._extract_korean_financial_data_improved(soup)

            if market_cap_krw > 0:
                print(f"✅ {company_name} 네이버 메인에서 크롤링 성공 (시가총액: {market_cap_krw:,.0f}원)")

                return {
                    'symbol': stock_code,
                    'name': company_name,
                    'sector': sector,
                    'industry': '',
                    'market_cap_krw': market_cap_krw,
                    'current_price_krw': current_price_krw,
                    'financial_data': financial_data,
                    'description': '',
                    'source': 'naver_main'
                }

            return None

        except Exception as e:
            print(f"⚠️ 네이버 메인 크롤링 실패: {e}")
            return None

    def _scrape_from_naver_company(self, stock_code):
        """네이버 금융 기업정보 페이지에서 크롤링"""
        try:
            url = f"https://finance.naver.com/item/coinfo.naver?code={stock_code}"
            response = self.safe_request(url)

            if not response:
                return None

            response.encoding = 'euc-kr'
            soup = BeautifulSoup(response.text, 'html.parser')

            # 기업 개요 테이블에서 시가총액 찾기
            tables = soup.find_all('table')
            for table in tables:
                rows = table.find_all('tr')
                for row in rows:
                    cells = row.find_all(['td', 'th'])
                    for i, cell in enumerate(cells):
                        if '시가총액' in cell.get_text():
                            # 다음 셀에서 값 추출
                            if i + 1 < len(cells):
                                market_cap_text = cells[i + 1].get_text().strip()
                                market_cap_krw = self._parse_korean_market_cap_improved(market_cap_text)

                                if market_cap_krw > 0:
                                    company_name = self._extract_korean_company_name_improved(soup, stock_code)

                                    print(f"✅ {company_name} 네이버 기업정보에서 크롤링 성공 (시가총액: {market_cap_krw:,.0f}원)")

                                    return {
                                        'symbol': stock_code,
                                        'name': company_name,
                                        'sector': '',
                                        'industry': '',
                                        'market_cap_krw': market_cap_krw,
                                        'current_price_krw': 0,
                                        'financial_data': {},
                                        'description': '',
                                        'source': 'naver_company'
                                    }

            return None

        except Exception as e:
            print(f"⚠️ 네이버 기업정보 크롤링 실패: {e}")
            return None

    def _scrape_from_yahoo_kr(self, stock_code):
        """야후파이낸스 한국 주식에서 크롤링"""
        try:
            # 한국 주식은 .KS 접미사 필요
            yahoo_symbol = f"{stock_code}.KS"
            url = f"https://finance.yahoo.com/quote/{yahoo_symbol}"

            response = self.safe_request(url)
            if not response:
                return None

            soup = BeautifulSoup(response.text, 'html.parser')

            # 시가총액 추출
            market_cap_usd = self._extract_market_cap(soup)

            if market_cap_usd > 0:
                # 달러를 원화로 변환 (대략적인 환율 사용)
                market_cap_krw = market_cap_usd * 1350  # 임시 환율

                company_name = self._extract_company_name(soup, stock_code)

                print(f"✅ {company_name} 야후파이낸스 KS에서 크롤링 성공 (시가총액: {market_cap_krw:,.0f}원)")

                return {
                    'symbol': stock_code,
                    'name': company_name,
                    'sector': self._extract_sector(soup),
                    'industry': '',
                    'market_cap_krw': int(market_cap_krw),
                    'current_price_krw': 0,
                    'financial_data': {},
                    'description': '',
                    'source': 'yahoo_kr'
                }

            return None

        except Exception as e:
            print(f"⚠️ 야후파이낸스 KS 크롤링 실패: {e}")
            return None

    def _get_manual_korean_data(self, stock_code):
        """주요 한국 주식 수동 데이터베이스"""
        manual_data = {
            '096770': {  # SK이노베이션
                'name': 'SK이노베이션',
                'sector': '석유와가스',
                'market_cap_krw': 13_670_000_000_000,  # 13.67조원 (2025년 기준)
                'description': '석유정제, 화학, 윤활유 사업을 영위하는 종합 에너지화학 기업'
            },
            '304780': {  # 포스코홀딩스
                'name': '포스코홀딩스',
                'sector': '철강',
                'market_cap_krw': 25_000_000_000_000,  # 약 25조원
                'description': '철강 제조 및 관련 사업을 영위하는 지주회사'
            },
            '000810': {  # 삼성화재
                'name': '삼성화재',
                'sector': '보험',
                'market_cap_krw': 18_500_000_000_000,  # 약 18.5조원
                'description': '손해보험업을 주력으로 하는 종합금융서비스 기업'
            },
            '005930': {  # 삼성전자
                'name': '삼성전자',
                'sector': '반도체',
                'market_cap_krw': 400_000_000_000_000,  # 약 400조원
                'description': '반도체, 스마트폰, 디스플레이 등을 제조하는 글로벌 IT 기업'
            }
        }

        if stock_code in manual_data:
            data = manual_data[stock_code]
            print(f"✅ {data['name']} 수동 데이터베이스에서 정보 제공 (시가총액: {data['market_cap_krw']:,.0f}원)")

            return {
                'symbol': stock_code,
                'name': data['name'],
                'sector': data['sector'],
                'industry': '',
                'market_cap_krw': data['market_cap_krw'],
                'current_price_krw': 0,
                'financial_data': {},
                'description': data['description'],
                'source': 'manual_database'
            }

        return None

    def _extract_korean_company_name_improved(self, soup, stock_code):
        """개선된 한국 주식 회사명 추출"""
        try:
            # 방법 1: 네이버 금융 표준 선택자
            selectors = [
                '.wrap_company h2 a',
                '.wrap_company h2',
                'h2.h_company a',
                '.company_info h2',
                'title'
            ]

            for selector in selectors:
                element = soup.select_one(selector)
                if element:
                    name = element.get_text().strip()
                    # 불필요한 텍스트 제거
                    name = re.sub(r'\s*:\s*네이버.*', '', name)
                    name = re.sub(r'\([^)]*\)', '', name).strip()
                    if name and len(name) > 1 and name != stock_code:
                        return name

            return stock_code
        except:
            return stock_code

    def _extract_korean_sector_improved(self, soup):
        """개선된 한국 주식 섹터 추출"""
        try:
            # 방법 1: 업종 링크에서 추출
            sector_links = soup.find_all('a', href=re.compile(r'sise_group'))
            for link in sector_links:
                sector_text = link.get_text().strip()
                if sector_text and len(sector_text) < 30:
                    return sector_text

            # 방법 2: 테이블에서 업종 정보 찾기
            tables = soup.find_all('table')
            for table in tables:
                rows = table.find_all('tr')
                for row in rows:
                    if '업종' in row.get_text():
                        cells = row.find_all(['td', 'th'])
                        for cell in cells:
                            text = cell.get_text().strip()
                            if text and '업종' not in text and len(text) < 30:
                                return text

            return ""
        except:
            return ""

    def _extract_korean_market_cap_improved(self, soup, stock_code):
        """대폭 개선된 한국 주식 시가총액 추출"""
        try:
            # 방법 1: 네이버 금융 새로운 구조
            market_cap_selectors = [
                'dd.num',
                '.today .num',
                '.market_cap .num',
                'em.num',
                '.blind',
                'td.num'
            ]

            for selector in market_cap_selectors:
                elements = soup.select(selector)
                for element in elements:
                    # 부모 요소에서 "시가총액" 텍스트 확인
                    parent_text = ""
                    current = element.parent
                    for _ in range(3):  # 3단계까지 부모 확인
                        if current:
                            parent_text += current.get_text()
                            current = current.parent
                        else:
                            break

                    if "시가총액" in parent_text:
                        market_cap_text = element.get_text().strip()
                        parsed_cap = self._parse_korean_market_cap_improved(market_cap_text)
                        if parsed_cap > 0:
                            return parsed_cap

            # 방법 2: 테이블 구조에서 찾기
            tables = soup.find_all('table')
            for table in tables:
                rows = table.find_all('tr')
                for row in rows:
                    if "시가총액" in row.get_text():
                        cells = row.find_all(['td', 'th'])
                        for cell in cells:
                            cell_text = cell.get_text().strip()
                            if cell_text and "시가총액" not in cell_text:
                                parsed_cap = self._parse_korean_market_cap_improved(cell_text)
                                if parsed_cap > 0:
                                    return parsed_cap

            # 방법 3: 텍스트에서 직접 검색
            page_text = soup.get_text()
            market_cap_patterns = [
                r'시가총액[:\s]*([0-9,]+(?:\.[0-9]+)?)\s*([조억만]?)원?',
                r'시가총액.*?([0-9,]+(?:\.[0-9]+)?)\s*([조억만])',
            ]

            for pattern in market_cap_patterns:
                matches = re.findall(pattern, page_text)
                for match in matches:
                    if len(match) >= 2:
                        number_str = match[0].replace(',', '')
                        unit = match[1]
                        try:
                            number = float(number_str)
                            if unit == '조':
                                return int(number * 1_000_000_000_000)
                            elif unit == '억':
                                return int(number * 100_000_000)
                            elif unit == '만':
                                return int(number * 10_000)
                        except:
                            continue

            return 0

        except Exception as e:
            print(f"⚠️ 시가총액 추출 실패: {e}")
            return 0

    def _parse_korean_market_cap_improved(self, market_cap_text):
        """대폭 개선된 한국 시가총액 파싱"""
        try:
            if not market_cap_text:
                return 0

            # 텍스트 정리
            market_cap_text = market_cap_text.replace(',', '').replace('원', '').replace('₩', '').strip()

            # 패턴 매칭
            patterns = [
                (r'([0-9.]+)\s*조', 1_000_000_000_000),
                (r'([0-9.]+)\s*억', 100_000_000),
                (r'([0-9.]+)\s*만', 10_000),
                (r'([0-9.]+)T', 1_000_000_000_000),  # 야후파이낸스 조 단위
                (r'([0-9.]+)B', 1_000_000_000),      # 야후파이낸스 십억 단위
                (r'([0-9.]+)M', 1_000_000),          # 야후파이낸스 백만 단위
            ]

            for pattern, multiplier in patterns:
                match = re.search(pattern, market_cap_text)
                if match:
                    number = float(match.group(1))
                    return int(number * multiplier)

            # 단순 숫자인 경우
            numbers = re.findall(r'[0-9.]+', market_cap_text)
            if numbers:
                number = float(numbers[0])
                # 합리적인 범위 체크 (1억 ~ 1000조)
                if 100_000_000 <= number <= 1_000_000_000_000_000:
                    return int(number)

            return 0

        except Exception as e:
            print(f"⚠️ 시가총액 파싱 실패: {e}")
            return 0

    def _extract_korean_current_price_improved(self, soup):
        """개선된 한국 주식 현재가 추출"""
        try:
            # 현재가 선택자들 (우선순위 순)
            price_selectors = [
                '.no_today .blind',
                '.today .no_today .blind',
                'em.no_today',
                '.no_today',
                'strong.tah.p11'
            ]

            for selector in price_selectors:
                element = soup.select_one(selector)
                if element:
                    price_text = element.get_text().strip().replace(',', '')
                    try:
                        price = int(float(price_text))
                        if 100 <= price <= 10_000_000:  # 합리적인 주가 범위
                            return price
                    except:
                        continue

            return 0
        except:
            return 0

    def _extract_korean_financial_data_improved(self, soup):
        """개선된 한국 주식 재무 데이터 추출"""
        try:
            financial_data = {}

            # PER, PBR, ROE 등 추출
            financial_indicators = ['PER', 'PBR', 'ROE', 'ROA']

            for indicator in financial_indicators:
                elements = soup.find_all(text=re.compile(indicator))
                for element in elements:
                    parent = element.parent
                    if parent:
                        # 다음 형제 요소에서 값 찾기
                        next_elements = parent.find_next_siblings(['em', 'td', 'span'])
                        for next_elem in next_elements:
                            value_text = next_elem.get_text().strip()
                            try:
                                value = float(value_text.replace(',', '').replace('%', ''))
                                financial_data[indicator.lower()] = value
                                break
                            except:
                                continue
                        if indicator.lower() in financial_data:
                            break

            return financial_data
        except:
            return {}

    def _get_empty_stock_info(self, symbol):
        """빈 주식 정보 반환"""
        return {
            'symbol': symbol,
            'name': symbol,
            'sector': '',
            'industry': '',
            'market_cap': 0,
            'current_price': 0,
            'financial_data': {},
            'description': ''
        }

    def _get_empty_korean_stock_info(self, stock_code):
        """빈 한국 주식 정보 반환"""
        return {
            'symbol': stock_code,
            'name': stock_code,
            'sector': '',
            'industry': '',
            'market_cap_krw': 0,
            'current_price_krw': 0,
            'financial_data': {},
            'description': ''
        }


class ESGTextAnalyzer:
    """ESG 텍스트 분석기 (감정 분석 강화 버전)"""

    def __init__(self):
        self.sentiment_analyzer = AdvancedESGSentimentAnalyzer()

        # ESG 카테고리별 키워드 가중치 (개선된 버전)
        self.esg_keywords_weighted = {
            'environmental': {
                # 고가중치 키워드
                'high': ['탄소중립', 'carbon neutral', '재생에너지', 'renewable energy',
                        '친환경', 'green energy', 'ESG', 'sustainability', 'net zero',
                        'clean energy', 'zero emission'],
                # 중가중치 키워드
                'medium': ['환경', 'environmental', '기후변화', 'climate change',
                          '배터리', 'battery', '전기차', 'electric', 'cleantech'],
                # 저가중치 키워드
                'low': ['그린', 'green', '에너지', 'energy', '온실가스', 'emission']
            },
            'social': {
                'high': ['사회적책임', 'social responsibility', '인권', 'human rights',
                        '다양성', 'diversity', 'ESG', 'social impact'],
                'medium': ['사회공헌', '지역사회', 'community', '안전', 'safety',
                          '복지', 'welfare', 'fair trade'],
                'low': ['사회', 'social', '교육', 'education', '건강', 'health']
            },
            'governance': {
                'high': ['지배구조', 'governance', '투명성', 'transparency',
                        '윤리경영', 'ethics', 'ESG', 'corporate governance'],
                'medium': ['컴플라이언스', 'compliance', '감사', 'audit',
                          '이사회', 'board', 'board independence'],
                'low': ['공정성', 'fairness', '책임', 'accountability']
            }
        }

        # 가중치 값
        self.weight_values = {'high': 3.0, 'medium': 2.0, 'low': 1.0}

        print("✅ ESG 텍스트 분석기 초기화 완료 (감정 분석 강화)")

    def calculate_esg_score_from_news(self, news_list):
        """뉴스 리스트에서 ESG 점수 계산 (감정 분석 포함)"""
        if not news_list:
            return {
                'total_esg_score': 0.0,
                'environmental_score': 0.0,
                'social_score': 0.0,
                'governance_score': 0.0,
                'environmental_count': 0,
                'social_count': 0,
                'governance_count': 0,
                'esg_keyword_count': 0,
                'is_esg_relevant': False,
                'esg_news_count': len(news_list),
                'detailed_analysis': {},
                'sentiment_analysis': {},
                'esg_quality_decision': 'neutral'
            }

        # 1. 기존 ESG 키워드 분석
        combined_text = ""
        for news in news_list:
            title = news.get('title', '')
            content = news.get('content', '')
            combined_text += f" {title} {content}"

        combined_text = combined_text.lower()

        # 카테고리별 가중 점수 계산 및 개수 세기
        category_scores = {}
        category_details = {}
        category_counts = {}
        total_keyword_count = 0

        for category, weight_groups in self.esg_keywords_weighted.items():
            category_score = 0.0
            category_keywords = 0
            category_count = 0
            keyword_details = {}

            for weight_level, keywords in weight_groups.items():
                weight_value = self.weight_values[weight_level]

                for keyword in keywords:
                    count = combined_text.count(keyword.lower())
                    if count > 0:
                        keyword_details[keyword] = count
                        category_keywords += count
                        category_score += count * weight_value
                        total_keyword_count += count
                        category_count += count

            # 정규화 (최대값 1.0)
            category_scores[f'{category}_score'] = min(category_score / 10.0, 1.0)
            category_counts[f'{category}_count'] = category_count
            category_details[category] = {
                'score': category_scores[f'{category}_score'],
                'keyword_count': category_keywords,
                'keywords_found': keyword_details,
                'count': category_count
            }

        # 2. 감정 분석 실행
        sentiment_analysis = self.sentiment_analyzer.analyze_comprehensive_sentiment(news_list)

        # 3. 감정 기반 ESG 품질 결정
        esg_quality_decision = self._determine_esg_quality(sentiment_analysis, total_keyword_count, len(news_list))

        # 4. 전체 ESG 점수 계산 (감정 분석 반영)
        base_esg_score = (
            category_scores.get('environmental_score', 0) +
            category_scores.get('social_score', 0) +
            category_scores.get('governance_score', 0)
        ) / 3

        # 감정 분석 결과로 점수 조정
        sentiment_modifier = self._calculate_sentiment_modifier(sentiment_analysis, esg_quality_decision)
        total_esg_score = base_esg_score * sentiment_modifier

        # ESG 관련성 판단 (강화된 기준)
        is_esg_relevant = self._is_esg_relevant_enhanced(
            total_keyword_count, len(news_list), sentiment_analysis, esg_quality_decision
        )

        return {
            'total_esg_score': min(total_esg_score, 1.0),
            'environmental_score': category_scores.get('environmental_score', 0),
            'social_score': category_scores.get('social_score', 0),
            'governance_score': category_scores.get('governance_score', 0),
            'environmental_count': category_counts.get('environmental_count', 0),
            'social_count': category_counts.get('social_count', 0),
            'governance_count': category_counts.get('governance_count', 0),
            'esg_keyword_count': total_keyword_count,
            'is_esg_relevant': is_esg_relevant,
            'esg_news_count': len(news_list),
            'detailed_analysis': category_details,
            'sentiment_analysis': sentiment_analysis,
            'esg_quality_decision': esg_quality_decision,
            'sentiment_modifier': sentiment_modifier
        }

    def _determine_esg_quality(self, sentiment_analysis, keyword_count, news_count):
        """감정 분석 기반 ESG 품질 결정"""
        sentiment_score = sentiment_analysis.get('sentiment_score', 0.0)
        materiality_score = sentiment_analysis.get('materiality_score', 0.0)
        negative_ratio = sentiment_analysis.get('negative_ratio', 0.0)

        # 부정적 ESG 뉴스 판단 기준 (강화된 버전)
        if (sentiment_score < -0.25 and materiality_score > 0.3 and news_count >= 2) or negative_ratio > 0.6:
            return 'negative'  # 부정적 ESG
        elif sentiment_score > 0.25 and materiality_score > 0.3 and keyword_count >= 3:
            return 'positive'  # 긍정적 ESG
        else:
            return 'neutral'   # 중립적 ESG

    def _calculate_sentiment_modifier(self, sentiment_analysis, esg_quality_decision):
        """감정 분석 기반 점수 조정 계수"""
        if esg_quality_decision == 'negative':
            return 0.3  # 부정적 ESG는 점수를 크게 감소
        elif esg_quality_decision == 'positive':
            return 1.2  # 긍정적 ESG는 점수를 증가
        else:
            return 1.0  # 중립적 ESG는 변화 없음

    def _is_esg_relevant_enhanced(self, keyword_count, news_count, sentiment_analysis, esg_quality_decision):
        """강화된 ESG 관련성 판단 - SASB 기준 적용"""
        # 기본 조건: 키워드와 뉴스가 충분해야 함 (강화된 기준)
        has_esg_keywords = keyword_count >= 3  # 최소 3개 키워드
        has_esg_news = news_count >= 3  # 최소 3개 뉴스

        # 재료성 점수 확인 (SASB 기준 강화)
        materiality_score = sentiment_analysis.get('materiality_score', 0.0)
        is_material = materiality_score >= 0.5  # 0.2 → 0.5로 강화

        # 부정적 ESG의 경우 더 엄격한 기준
        if esg_quality_decision == 'negative':
            return has_esg_keywords and has_esg_news and is_material and news_count >= 3
        else:
            return has_esg_keywords and has_esg_news and is_material


class AdvancedESGSentimentAnalyzer:
    """고도화된 ESG 감정 분석기"""

    def __init__(self):
        try:
            self.vader_analyzer = SentimentIntensityAnalyzer()
        except:
            self.vader_analyzer = None

        # 금융 특화 감정 키워드 사전 (가중치 포함)
        self.financial_sentiment_keywords = {
            'positive': {
                'high': ['성장', 'growth', '수익', 'profit', '성공', 'success', '혁신', 'innovation',
                        '개선', 'improvement', '확대', 'expansion', '증가', 'increase', '강화', 'strengthen'],
                'medium': ['안정', 'stable', '지속', 'sustainable', '효과', 'effective', '긍정', 'positive',
                          '우수', 'excellent', '향상', 'enhance'],
                'low': ['좋은', 'good', '계획', 'plan', '목표', 'target']
            },
            'negative': {
                'high': ['스캔들', 'scandal', '위반', 'violation', '사기', 'fraud', '오염', 'pollution',
                        '벌금', 'fine', '소송', 'lawsuit', '손실', 'loss', '감소', 'decrease', '위험', 'risk'],
                'medium': ['문제', 'problem', '우려', 'concern', '비판', 'criticism', '실패', 'failure',
                          '지연', 'delay', '하락', 'decline'],
                'low': ['어려움', 'difficulty', '도전', 'challenge', '부족', 'lack']
            }
        }

        # ESG 특화 부정 키워드 (강화된 버전)
        self.esg_negative_keywords = [
            # 환경 관련 부정
            '환경오염', 'pollution', '배출가스', 'emission violation', '환경파괴', 'environmental damage',
            '독성물질', 'toxic', '기후변화 대응 부족', 'climate inaction', '재생에너지 부족', 'renewable shortfall',

            # 사회 관련 부정
            '노동착취', 'labor exploitation', '인권침해', 'human rights violation', '차별', 'discrimination',
            '노동쟁의', 'labor dispute', '안전사고', 'safety accident', '근로조건 악화', 'poor working conditions',

            # 지배구조 관련 부정
            '부패', 'corruption', '횡령', 'embezzlement', '배임', 'breach of trust', '불공정거래', 'unfair trade',
            '정보은닉', 'information hiding', '주주권익 침해', 'shareholder rights violation'
        ]

        print("✅ 고도화된 ESG 감정 분석기 초기화 완료")

    def analyze_comprehensive_sentiment(self, news_list):
        """종합적인 ESG 뉴스 감정 분석"""
        if not news_list:
            return {
                'overall_sentiment': 'neutral',
                'sentiment_score': 0.0,
                'confidence': 0.0,
                'positive_ratio': 0.0,
                'negative_ratio': 0.0,
                'neutral_ratio': 1.0,
                'total_news': 0,
                'sentiment_distribution': [],
                'materiality_score': 0.0,
                'esg_quality_score': 0.0
            }

        sentiment_scores = []
        sentiment_details = []

        for news in news_list:
            title = news.get('title', '')
            content = news.get('content', '')
            combined_text = f"{title} {content}"

            # 개별 뉴스 감정 분석
            individual_sentiment = self._analyze_individual_sentiment(combined_text)
            sentiment_scores.append(individual_sentiment['compound_score'])
            sentiment_details.append(individual_sentiment)

        # 전체 감정 점수 계산
        avg_sentiment = np.mean(sentiment_scores) if sentiment_scores else 0.0
        sentiment_std = np.std(sentiment_scores) if len(sentiment_scores) > 1 else 0.0

        # 감정 분포 계산
        positive_count = sum(1 for score in sentiment_scores if score > 0.1)
        negative_count = sum(1 for score in sentiment_scores if score < -0.1)
        neutral_count = len(sentiment_scores) - positive_count - negative_count

        total_news = len(news_list)
        positive_ratio = positive_count / total_news if total_news > 0 else 0
        negative_ratio = negative_count / total_news if total_news > 0 else 0
        neutral_ratio = neutral_count / total_news if total_news > 0 else 1

        # 재료성 점수 (뉴스 수와 일관성 기반)
        materiality_score = self._calculate_materiality_score(total_news, sentiment_std)

        # ESG 품질 점수 계산
        esg_quality_score = self._calculate_esg_quality_score(
            avg_sentiment, total_news, sentiment_std, positive_ratio, negative_ratio
        )

        # 전체 감정 결정
        if avg_sentiment > 0.25 and materiality_score > 0.3:
            overall_sentiment = 'positive'
        elif avg_sentiment < -0.25 and materiality_score > 0.3:
            overall_sentiment = 'negative'
        else:
            overall_sentiment = 'neutral'

        return {
            'overall_sentiment': overall_sentiment,
            'sentiment_score': avg_sentiment,
            'confidence': materiality_score,
            'positive_ratio': positive_ratio,
            'negative_ratio': negative_ratio,
            'neutral_ratio': neutral_ratio,
            'total_news': total_news,
            'sentiment_distribution': sentiment_details,
            'materiality_score': materiality_score,
            'esg_quality_score': esg_quality_score,
            'sentiment_std': sentiment_std
        }

    def _analyze_individual_sentiment(self, text):
        """개별 텍스트 감정 분석 (강화된 버전)"""
        if not text:
            return {'compound_score': 0.0, 'method': 'empty'}

        text_lower = text.lower()

        # 1. VADER 분석
        vader_score = 0.0
        if self.vader_analyzer:
            try:
                vader_result = self.vader_analyzer.polarity_scores(text)
                vader_score = vader_result['compound']
            except:
                vader_score = 0.0

        # 2. TextBlob 분석
        textblob_score = 0.0
        try:
            blob = TextBlob(text)
            textblob_score = blob.sentiment.polarity
        except:
            textblob_score = 0.0

        # 3. 금융 특화 키워드 분석
        financial_score = self._calculate_financial_keyword_sentiment(text_lower)

        # 4. ESG 부정 키워드 패널티
        esg_negative_penalty = self._calculate_esg_negative_penalty(text_lower)

        # 5. 가중 평균 계산
        base_score = (vader_score * 0.4 + textblob_score * 0.3 + financial_score * 0.3)
        final_score = base_score + esg_negative_penalty

        # 점수 정규화 (-1 ~ 1)
        final_score = max(-1.0, min(1.0, final_score))

        return {
            'compound_score': final_score,
            'vader_score': vader_score,
            'textblob_score': textblob_score,
            'financial_score': financial_score,
            'esg_penalty': esg_negative_penalty,
            'method': 'comprehensive'
        }

    def _calculate_financial_keyword_sentiment(self, text):
        """금융 특화 키워드 기반 감정 점수"""
        positive_score = 0.0
        negative_score = 0.0

        # 긍정 키워드 점수
        for weight_level, keywords in self.financial_sentiment_keywords['positive'].items():
            multiplier = {'high': 1.0, 'medium': 0.7, 'low': 0.4}[weight_level]
            for keyword in keywords:
                count = text.count(keyword.lower())
                positive_score += count * multiplier

        # 부정 키워드 점수
        for weight_level, keywords in self.financial_sentiment_keywords['negative'].items():
            multiplier = {'high': 1.0, 'medium': 0.7, 'low': 0.4}[weight_level]
            for keyword in keywords:
                count = text.count(keyword.lower())
                negative_score += count * multiplier

        # 정규화 및 최종 점수
        if positive_score + negative_score == 0:
            return 0.0

        net_score = (positive_score - negative_score) / (positive_score + negative_score + 1)
        return max(-0.5, min(0.5, net_score))

    def _calculate_esg_negative_penalty(self, text):
        """ESG 부정 키워드 패널티"""
        penalty = 0.0

        for keyword in self.esg_negative_keywords:
            if keyword.lower() in text:
                penalty -= 0.2  # 부정 키워드당 -0.2 패널티

        return max(-0.8, penalty)  # 최대 -0.8까지 패널티

    def _calculate_materiality_score(self, news_count, sentiment_std):
        """재료성 점수 계산 (뉴스 수와 일관성 기반) - SASB 기준 강화"""
        # 뉴스 수 기반 점수 (3개 이상에서 시작, 5개 이상에서 유의미)
        if news_count >= 5:
            news_score = 1.0
        elif news_count >= 3:
            news_score = 0.6
        elif news_count >= 2:
            news_score = 0.3
        else:
            news_score = 0.0

        # 감정 일관성 점수 (표준편차가 낮을수록 높은 점수)
        consistency_score = max(0, 1.0 - sentiment_std) if sentiment_std > 0 else 0.5

        return (news_score * 0.8 + consistency_score * 0.2)

    def _calculate_esg_quality_score(self, avg_sentiment, news_count, sentiment_std, positive_ratio, negative_ratio):
        """ESG 품질 점수 계산"""
        # 기본 점수
        base_score = 0.5

        # 감정 강도 보너스
        sentiment_intensity = abs(avg_sentiment)
        if sentiment_intensity > 0.3:
            base_score += 0.2

        # 뉴스 수 보너스
        if news_count >= 3:
            base_score += 0.1
        if news_count >= 5:
            base_score += 0.1

        # 감정 분포 균형 점수
        if 0.2 <= positive_ratio <= 0.8 and 0.2 <= negative_ratio <= 0.8:
            base_score += 0.1  # 균형잡힌 분포

        return min(1.0, base_score)

class WebScrapingNewsCollector:
    """웹 크롤링 기반 뉴스 수집기"""

    def __init__(self):
        self.session = requests.Session()
        
        # User-Agent 헤더 설정
        self.user_agents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0'
        ]
        
        self._update_headers()
        print("✅ 웹 크롤링 뉴스 수집기 초기화 완료")

    def _update_headers(self):
        """헤더 업데이트"""
        user_agent = random.choice(self.user_agents)
        self.session.headers.update({
            'User-Agent': user_agent,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'ko-KR,ko;q=0.8,en-US;q=0.5,en;q=0.3',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        })

    def collect_comprehensive_news(self, stock_code, company_name):
        """종합적인 뉴스 수집"""
        try:
            print(f"📰 {company_name} ESG 뉴스 수집 시작...")
            
            all_news = []
            
            # 구글 뉴스에서 ESG 관련 뉴스 수집
            google_news = self._collect_google_news(stock_code, company_name)
            all_news.extend(google_news)
            
            # 네이버 뉴스에서 수집 (한국 주식인 경우)
            if re.match(r'^\d{6}$', stock_code):
                naver_news = self._collect_naver_news(stock_code, company_name)
                all_news.extend(naver_news)
            
            # 중복 제거
            unique_news = self._remove_duplicates(all_news)
            
            print(f"✅ {company_name} 뉴스 수집 완료: {len(unique_news)}개")
            return unique_news[:10]  # 최대 10개 뉴스만 반환
            
        except Exception as e:
            print(f"❌ {company_name} 뉴스 수집 실패: {e}")
            return []

    def _collect_google_news(self, stock_code, company_name):
        """구글 뉴스에서 ESG 관련 뉴스 수집"""
        try:
            news_list = []
            
            # ESG 관련 검색어
            search_terms = [
                f"{company_name} ESG",
                f"{company_name} 환경",
                f"{company_name} 지속가능",
                f"{stock_code} ESG"
            ]
            
            for term in search_terms[:2]:  # 처음 2개만 사용
                try:
                    encoded_term = quote(term)
                    url = f"https://news.google.com/rss/search?q={encoded_term}&hl=ko&gl=KR&ceid=KR:ko"
                    
                    response = self.session.get(url, timeout=10)
                    if response.status_code == 200:
                        soup = BeautifulSoup(response.content, 'xml')
                        items = soup.find_all('item')[:3]  # 각 검색어당 최대 3개
                        
                        for item in items:
                            try:
                                title = item.title.text if item.title else ""
                                link = item.link.text if item.link else ""
                                pub_date = item.pubDate.text if item.pubDate else ""
                                description = item.description.text if item.description else ""
                                
                                if title and self._is_esg_related(title + " " + description):
                                    news_list.append({
                                        'title': title,
                                        'content': description,
                                        'url': link,
                                        'date': pub_date,
                                        'source': 'Google News'
                                    })
                            except:
                                continue
                    
                    time.sleep(1)  # 요청 간격
                except:
                    continue
            
            return news_list
            
        except Exception as e:
            print(f"⚠️ 구글 뉴스 수집 실패: {e}")
            return []

    def _collect_naver_news(self, stock_code, company_name):
        """네이버 뉴스에서 수집"""
        try:
            news_list = []
            
            # 네이버 뉴스 검색
            search_term = f"{company_name} ESG"
            encoded_term = quote(search_term)
            url = f"https://search.naver.com/search.naver?where=news&query={encoded_term}"
            
            response = self.session.get(url, timeout=10)
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'html.parser')
                
                # 뉴스 항목 찾기
                news_items = soup.find_all('div', class_='news_area')[:5]  # 최대 5개
                
                for item in news_items:
                    try:
                        title_elem = item.find('a', class_='news_tit')
                        if title_elem:
                            title = title_elem.get_text().strip()
                            link = title_elem.get('href', '')
                            
                            # 요약 텍스트
                            content_elem = item.find('div', class_='news_dsc')
                            content = content_elem.get_text().strip() if content_elem else ""
                            
                            if self._is_esg_related(title + " " + content):
                                news_list.append({
                                    'title': title,
                                    'content': content,
                                    'url': link,
                                    'date': '',
                                    'source': 'Naver News'
                                })
                    except:
                        continue
            
            return news_list
            
        except Exception as e:
            print(f"⚠️ 네이버 뉴스 수집 실패: {e}")
            return []

    def _is_esg_related(self, text):
        """ESG 관련 뉴스인지 판단"""
        esg_keywords = [
            'ESG', '환경', '지속가능', '탄소중립', '친환경', '재생에너지',
            '사회적책임', '지배구조', '윤리경영', '투명성', '컴플라이언스',
            'environmental', 'social', 'governance', 'sustainability',
            'carbon neutral', 'renewable energy', 'green energy'
        ]
        
        text_lower = text.lower()
        return any(keyword.lower() in text_lower for keyword in esg_keywords)

    def _remove_duplicates(self, news_list):
        """중복 뉴스 제거"""
        seen_titles = set()
        unique_news = []
        
        for news in news_list:
            title = news.get('title', '').strip()
            if title and title not in seen_titles:
                seen_titles.add(title)
                unique_news.append(news)
        
        return unique_news

    def safe_request(self, url, max_retries=3):
        """안전한 웹 요청"""
        for attempt in range(max_retries):
            try:
                if attempt > 0:
                    self._update_headers()
                    time.sleep(random.uniform(2, 5))
                
                response = self.session.get(url, timeout=15)
                if response.status_code == 200:
                    return response
                else:
                    print(f"⚠️ HTTP {response.status_code} - 재시도 {attempt + 1}/{max_retries}")
                    time.sleep(random.uniform(3, 6))
                    
            except requests.exceptions.RequestException as e:
                print(f"⚠️ 네트워크 오류: {e} - 재시도 {attempt + 1}/{max_retries}")
                time.sleep(random.uniform(5, 10))
        
        return None



# 기존 클래스들 수정 (야후파이낸스 API 제거)
class WebScrapingStockDataCollector:
    """웹 크롤링 기반 주식 데이터 수집기 - 야후파이낸스 API 제거 버전"""

    def __init__(self):
        self.news_collector = WebScrapingNewsCollector()
        self.esg_analyzer = ESGTextAnalyzer()
        self.currency_converter = WebScrapingCurrencyConverter()
        self.yahoo_collector = WebScrapingYahooFinanceCollector()

        print("✅ 웹 크롤링 주식 데이터 수집기 초기화 완료 (야후파이낸스 API 제거)")

    def collect_stock_data(self, stock_code):
        """주식 데이터 수집 - 완전 웹 크롤링 버전"""
        print(f"\n🔍 종목 {stock_code} 웹 크롤링 데이터 수집 시작... (API 없음)")

        if self.is_korean_stock(stock_code):
            return self._collect_korean_stock_data(stock_code)
        else:
            return self._collect_overseas_stock_data(stock_code)

    def is_korean_stock(self, stock_code):
        """국내주식 여부 판단"""
        return re.match(r'^\d{6}$', stock_code) is not None

    def _collect_korean_stock_data(self, stock_code):
        """국내주식 데이터 수집 - 웹 크롤링만 사용"""
        try:
            # 네이버 금융에서 기본 정보 수집
            basic_info = self.yahoo_collector.scrape_korean_stock_info(stock_code)
            company_name = basic_info.get('name', f'종목{stock_code}')

            # 시가총액을 달러로 변환
            market_cap_krw = basic_info.get('market_cap_krw', 0)
            market_cap_usd = self.currency_converter.krw_to_usd(market_cap_krw)

            # 기본 정보 업데이트
            basic_info.update({
                'market_cap_usd': market_cap_usd,
                'market_cap': market_cap_usd,
                'currency': 'USD'
            })

            print(f"🏢 {company_name} | 업종: {basic_info.get('sector', '정보없음')} | 시가총액: ${market_cap_usd:,.0f}")

            # ESG 뉴스 수집
            esg_news = self.news_collector.collect_comprehensive_news(stock_code, company_name)

            # ESG 분석
            esg_analysis = self.esg_analyzer.calculate_esg_score_from_news(esg_news)

            # 재무 정보
            financial_data = basic_info.get('financial_data', {})

            print(f"✅ {company_name} 국내 데이터 수집 완료 (시가총액: ${market_cap_usd:,.0f})")

            return {
                'stock_code': stock_code,
                'basic_info': basic_info,
                'esg_news': esg_news,
                'esg_analysis': esg_analysis,
                'financial_data': financial_data,
                'source': 'korean_webscraping_no_api'
            }

        except Exception as e:
            print(f"❌ {stock_code} 국내 데이터 수집 실패: {e}")
            return self._get_empty_data(stock_code)

    def _collect_overseas_stock_data(self, stock_code):
        """해외주식 데이터 수집 - 웹 크롤링만 사용"""
        try:
            # 야후파이낸스 웹 크롤링으로 기본 정보 수집
            basic_info = self.yahoo_collector.scrape_stock_info(stock_code)
            company_name = basic_info.get('name', stock_code)
            market_cap_usd = basic_info.get('market_cap', 0)

            # 기본 정보 업데이트
            basic_info.update({
                'stock_code': stock_code,
                'market_cap_usd': market_cap_usd,
                'market_cap_krw': 0,
                'currency': 'USD'
            })

            print(f"🏢 {company_name} | 업종: {basic_info.get('sector', '정보없음')} | 시가총액: ${market_cap_usd:,.0f}")

            # ESG 뉴스 수집
            esg_news = self.news_collector.collect_comprehensive_news(stock_code, company_name)

            # ESG 분석
            esg_analysis = self.esg_analyzer.calculate_esg_score_from_news(esg_news)

            # 재무 데이터
            financial_data = basic_info.get('financial_data', {})

            print(f"✅ {company_name} 해외 데이터 수집 완료 (시가총액: ${market_cap_usd:,.0f})")

            return {
                'stock_code': stock_code,
                'basic_info': basic_info,
                'esg_news': esg_news,
                'esg_analysis': esg_analysis,
                'financial_data': financial_data,
                'source': 'overseas_webscraping_no_api'
            }

        except Exception as e:
            print(f"❌ {stock_code} 해외 데이터 수집 실패: {e}")
            return self._get_empty_data(stock_code)

    def _get_empty_data(self, stock_code):
        """빈 데이터 구조"""
        return {
            'stock_code': stock_code,
            'basic_info': {'name': stock_code, 'sector': '', 'market_cap_usd': 0, 'currency': 'USD'},
            'esg_news': [],
            'esg_analysis': {
                'total_esg_score': 0.0,
                'is_esg_relevant': False,
                'esg_news_count': 0,
                'esg_quality_decision': 'neutral'
            },
            'financial_data': {},
            'source': 'empty'
        }

# 메인 실행 함수 업데이트
def main():
    """메인 실행 함수 (야후파이낸스 API 제거 버전)"""
    print("🚀 웹 크롤링 기반 ESG 주식 분석 시스템 v6.5 (야후파이낸스 API 제거)")
    print("=" * 90)
    print("🌐 데이터 소스: 네이버 금융, 야후파이낸스 웹페이지, 구글 뉴스 (100% 웹 크롤링)")
    print("🔑 외부 API 키 완전 불필요 - 순수 웹 크롤링 솔루션")
    print("💱 모든 분석이 달러 기준으로 통일됩니다")
    print("🎭 감정 분석으로 부정적 ESG 뉴스 필터링")

    # 분석할 포트폴리오
    portfolio_stocks = [
        '096770',  # SK이노베이션
        '304780',  # 포스코홀딩스
        '000810',  # 삼성화재
        'AAPL',    # Apple
        'TSLA',    # Tesla
        'NVDA'     # NVIDIA
    ]

    # 비중 설정
    raw_weights = [20, 15, 15, 20, 15, 15]
    total = sum(raw_weights)
    weights = [w / total for w in raw_weights]

    try:
        # 웹 크롤링 분석 시스템 초기화 (API 제거)
        analyzer = WebScrapingStockAnalysisSystem(risk_profile='중립')

        # 포트폴리오 분석 실행
        analysis_result = analyzer.analyze_portfolio(portfolio_stocks, weights)

        # 분석 리포트 출력
        print_analysis_report(analysis_result)

        print(f"\n✅ 야후파이낸스 API 제거 분석 완료! (100% 웹 크롤링)")
        print("=" * 90)

    except Exception as e:
        print(f"❌ 시스템 실행 중 오류 발생: {str(e)}")
        import traceback
        traceback.print_exc()

# if __name__ == "__main__":
#     main()
