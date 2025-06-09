from flask import Flask, request, jsonify
import base64
from Crypto.PublicKey import RSA
from Crypto.Cipher import PKCS1_v1_5 as Cipher_PKCS1_v1_5
import requests
import json
import urllib.parse
from dotenv import load_dotenv
import os
from flask_cors import CORS
import time

# .env 파일 로드
load_dotenv()

app = Flask(__name__)
CORS(app)

# 환경변수에서 설정 로드
CLIENT_ID = os.getenv('CODEF_CLIENT_ID')
CLIENT_SECRET = os.getenv('CODEF_CLIENT_SECRET')
PUBLIC_KEY = os.getenv('CODEF_PUBLIC_KEY')

# 더미 모드 설정 (11일까지 API 작동 안함)
USE_DUMMY_MODE = os.getenv('USE_CODEF_DUMMY', 'true').lower() == 'true'

# 환경변수 검증 (더미 모드가 아닐 때만)
if not USE_DUMMY_MODE and not all([CLIENT_ID, CLIENT_SECRET, PUBLIC_KEY]):
    raise Exception("필요한 환경변수가 설정되지 않았습니다. .env 파일을 확인해주세요.")

# 더미 데이터 정의
DUMMY_ACCOUNT_LISTS = {
    '0247': ['20901920648'],  # NH투자증권
    '1247': ['20901920648'],  # NH투자증권 모바일증권 나무  
    '0240': ['716229952301']  # 삼성증권
}

DUMMY_BALANCE_DATA = {
    '20901920648': {
        'result': {
            'code': 'CF-00000',
            'message': '성공'
        },
        'data': {
            'resAccount': '20901920648',
            'resAccountName': 'NH투자증권 계좌',
            'rsTotAmt': '1,250,000',
            'resDepositReceived': '150,000',
            'resItemList': [
                {
                    'resIsName': '삼성전자',
                    'resPrice': '72,500',
                    'resQuantity': '10',
                    'resAmount': '725,000',
                    'resAvailQuantity': '10'
                },
                {
                    'resIsName': 'LG에너지솔루션',
                    'resPrice': '425,000',
                    'resQuantity': '1',
                    'resAmount': '425,000', 
                    'resAvailQuantity': '1'
                }
            ]
        }
    },
    '716229952301': {
        'result': {
            'code': 'CF-00000',
            'message': '성공'
        },
        'data': {
            'resAccount': '716229952301',
            'resAccountName': '삼성증권 계좌',
            'rsTotAmt': '2,340,000',
            'resDepositReceived': '340,000',
            'resItemList': [
                {
                    'resIsName': 'SK하이닉스',
                    'resPrice': '125,000',
                    'resQuantity': '8', 
                    'resAmount': '1,000,000',
                    'resAvailQuantity': '8'
                },
                {
                    'resIsName': 'NAVER',
                    'resPrice': '200,000',
                    'resQuantity': '5',
                    'resAmount': '1,000,000',
                    'resAvailQuantity': '5'
                }
            ]
        }
    }
}

def simulate_api_delay():
    """API 호출을 시뮬레이션하기 위한 지연"""
    time.sleep(0.5)

def get_access_token():
    try:
        token_url = "https://oauth.codef.io/oauth/token"

        # Basic Auth 사용
        response = requests.post(
            token_url,
            auth=(CLIENT_ID, CLIENT_SECRET),  # Basic Auth
            headers={
                "Content-Type": "application/x-www-form-urlencoded"
            },
            data={
                "grant_type": "client_credentials"
            }
        )

        token_data = response.json()

        if 'access_token' in token_data:
            return token_data['access_token']
        else:
            raise Exception("토큰 발급 실패: " + str(token_data))

    except Exception as e:
        print(f"토큰 발급 오류: {e}")
        return None

def publicEncRSA(publicKey, data):
    try:
        keyDER = base64.b64decode(publicKey)
        keyPub = RSA.importKey(keyDER)
        cipher = Cipher_PKCS1_v1_5.new(keyPub)
        cipher_text = cipher.encrypt(data.encode())
        encryptedData = base64.b64encode(cipher_text)
        return encryptedData.decode('utf-8')
    except Exception as e:
        print(f"암호화 오류: {e}")
        return None


@app.route('/create_account', methods=['POST'])
def create_account():
    try:
        # 액세스 토큰 발급
        access_token = get_access_token()
        if not access_token:
            return jsonify({
                'error': '토큰 발급 실패'
            }), 500

        # JSON 데이터 받기
        data = request.get_json()

        # 필수 필드 확인
        required_fields = ['id', 'password', 'organization']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'error': f'필수 필드가 누락되었습니다: {field}'
                }), 400

        # 비밀번호 암호화
        encrypted_password = publicEncRSA(PUBLIC_KEY, data['password'])

        # API 요청 데이터
        payload = {
            'accountList': [
                {
                    'countryCode': "KR",
                    'businessType': 'ST',
                    'organization': data['organization'],
                    'loginType': '1',
                    'clientType': 'A',
                    'id': data['id'],
                    'password': encrypted_password
                }
            ]
        }

        # API 요청
        url = "https://development.codef.io/v1/account/create"
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {access_token}'
        }

        response = requests.post(url, headers=headers, json=payload)
        decoded_response = urllib.parse.unquote(response.text)

        return jsonify(json.loads(decoded_response))

    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500


@app.route('/delete_account', methods=['DELETE'])
def delete_account():
    try:
        print("요청 시작")

        data = request.get_json()
        print("받은 데이터:", data)

        access_token = get_access_token()
        print("액세스 토큰:", access_token)

        # 필수 파라미터 검증
        if 'connectedId' not in data:
            return jsonify({
                'error': 'connectedId가 필요합니다.'
            }), 400

        if 'organization' not in data:
            return jsonify({
                'error': '기관코드(organization)가 필요합니다.'
            }), 400

        # API 문서에 맞게 payload 형식 수정
        payload = {
            'accountList': [{
                'countryCode': 'KR',
                'businessType': 'ST',
                'clientType': 'A',
                'organization': data['organization'],  # 클라이언트에서 전달받은 기관코드 사용
                'loginType': '1'
            }],
            'connectedId': data['connectedId']
        }
        print("페이로드:", payload)

        url = "https://development.codef.io/v1/account/delete"
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {access_token}'
        }

        response = requests.post(url, headers=headers, json=payload)
        print("응답 상태 코드:", response.status_code)
        print("응답 헤더:", response.headers)
        print("API 응답:", response.text)

        if not response.text:
            return jsonify({
                'error': 'API 응답이 비어있습니다.',
                'status_code': response.status_code
            }), 500

        decoded_response = urllib.parse.unquote(response.text)
        print("디코딩된 응답:", decoded_response)

        return jsonify(json.loads(decoded_response))

    except Exception as e:
        print("에러 발생:", str(e))
        return jsonify({
            'error': str(e)
        }), 500


@app.route('/stock/account-list', methods=['POST'])
def get_stock_account_list():
    try:
        # 액세스 토큰 발급
        access_token = get_access_token()
        if not access_token:
            return jsonify({
                'error': '토큰 발급 실패'
            }), 500

        # JSON 데이터 받기
        data = request.get_json()

        # 필수 필드 확인
        required_fields = ['organization', 'connectedId']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'error': f'필수 필드가 누락되었습니다: {field}'
                }), 400

        # API 요청 데이터
        payload = {
            'organization': data['organization'],
            'connectedId': data['connectedId']
        }

        # API 요청
        url = "https://development.codef.io/v1/kr/stock/a/account/account-list"
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {access_token}'
        }

        response = requests.post(url, headers=headers, json=payload)
        decoded_response = urllib.parse.unquote(response.text)
        response_data = json.loads(decoded_response)

        if response_data.get('result', {}).get('code') == 'CF-00000':
            account_list = []
            if 'data' in response_data:
                if isinstance(response_data['data'], list):
                    # 여러 계좌인 경우
                    for account in response_data['data']:
                        if 'resAccount' in account:
                            account_list.append(account['resAccount'])
                else:
                    # 단일 계좌인 경우
                    if 'resAccount' in response_data['data']:
                        account_list.append(response_data['data']['resAccount'])

            return jsonify({'accountList': account_list})

        return jsonify(response_data)

    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500

@app.route('/stock/balance', methods=['POST'])
def stock_balance():
    # 더미 모드가 활성화된 경우
    if USE_DUMMY_MODE:
        try:
            print("더미 모드: 계좌 잔고 더미 데이터 반환")
            data = request.get_json()
            account = data.get('account', '20901920648')
            
            # API 호출 시뮬레이션을 위한 지연
            simulate_api_delay()
            
            # 해당 계좌의 더미 데이터 반환, 없으면 기본 데이터
            dummy_response = DUMMY_BALANCE_DATA.get(account, DUMMY_BALANCE_DATA['20901920648'])
            return jsonify(dummy_response)
            
        except Exception as e:
            return jsonify({
                'error': f'더미 모드 에러: {str(e)}'
            }), 500

    try:
        # 액세스 토큰 발급
        access_token = get_access_token()
        if not access_token:
            return jsonify({
                'error': '토큰 발급 실패'
            }), 500

        # JSON 데이터 받기
        data = request.get_json()

        # 필수 필드 확인
        required_fields = ['organization', 'connectedId', 'account', 'account_password']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'error': f'필수 필드가 누락되었습니다: {field}'
                }), 400

        # 계좌 비밀번호 암호화
        encrypted_password = publicEncRSA(PUBLIC_KEY, data['account_password'])
        if not encrypted_password:
            return jsonify({
                'error': '비밀번호 암호화 실패'
            }), 500
        

        # API 요청 데이터
        payload = {
            'organization': data['organization'],
            'connectedId': data['connectedId'],
            'account': data['account'],
            'account_password': encrypted_password,
            'id': data.get('id', ''),  # 선택적 필드
            'add_password': data.get('add_password', '')  # 선택적 필드
        }

        # API 요청
        url = "https://development.codef.io/v1/kr/stock/a/account/balance-inquiry"
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {access_token}'
        }

        response = requests.post(url, headers=headers, json=payload)
        decoded_response = urllib.parse.unquote(response.text)
        print(jsonify(json.loads(decoded_response)))
        return jsonify(json.loads(decoded_response))

    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500

@app.route('/stock/create-and-list', methods=['POST'])
def create_account_and_list():
    # 더미 모드가 활성화된 경우
    if USE_DUMMY_MODE:
        try:
            print("더미 모드: 계좌 생성 및 목록 조회 더미 데이터 반환")
            data = request.get_json()
            organization = data.get('organization', '0247')
            
            # API 호출 시뮬레이션을 위한 지연
            simulate_api_delay()
            
            # 증권사에 따른 더미 계좌 목록 반환
            account_list = DUMMY_ACCOUNT_LISTS.get(organization, ['20901920648'])
            
            return jsonify({
                'connectedId': f'dummy_conn_{int(time.time())}',
                'accountList': account_list
            })
            
        except Exception as e:
            return jsonify({
                'error': f'더미 모드 에러: {str(e)}'
            }), 500

    try:
        # 액세스 토큰 발급
        access_token = get_access_token()
        if not access_token:
            return jsonify({
                'error': '토큰 발급 실패'
            }), 500

        # JSON 데이터 받기
        data = request.get_json()

        # 필수 필드 확인
        required_fields = ['id', 'password', 'organization']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'error': f'필수 필드가 누락되었습니다: {field}'
                }), 400

        # 비밀번호 암호화
        encrypted_password = publicEncRSA(PUBLIC_KEY, data['password'])

        # 계정 생성 API 요청 데이터
        create_payload = {
            'accountList': [
                {
                    'countryCode': "KR",
                    'businessType': 'ST',
                    'organization': data['organization'],
                    'loginType': '1',
                    'clientType': 'A',
                    'id': data['id'],
                    'password': encrypted_password
                }
            ]
        }

        # 계정 생성 API 요청
        create_url = "https://development.codef.io/v1/account/create"
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {access_token}'
        }

        create_response = requests.post(create_url, headers=headers, json=create_payload)
        print("create_response.text:", create_response.text)  # 응답 확인
        create_result = json.loads(urllib.parse.unquote(create_response.text))
        print("create_result:", create_result)

        # 계정 생성 실패 시
        if create_result.get('result', {}).get('code') != 'CF-00000':
            return jsonify(create_result), 400  # 400 등 클라이언트 에러로 반환

        # connectedId 추출
        connected_id = create_result.get('data', {}).get('connectedId')
        if not connected_id:
            print("connectedId 없음:", create_result)
            return jsonify({
                'error': 'connectedId를 찾을 수 없습니다.',
                'detail': create_result
            }), 500

        # 계좌 목록 조회 API 요청 데이터
        list_payload = {
            'organization': data['organization'],
            'connectedId': connected_id
        }

        # 계좌 목록 조회 API 요청
        list_url = "https://development.codef.io/v1/kr/stock/a/account/account-list"
        list_response = requests.post(list_url, headers=headers, json=list_payload)
        list_result = json.loads(urllib.parse.unquote(list_response.text))

        # 계좌 목록 추출
        account_list = []
        if list_result.get('result', {}).get('code') == 'CF-00000':
            if 'data' in list_result:
                if isinstance(list_result['data'], list):
                    for account in list_result['data']:
                        if 'resAccount' in account:
                            account_list.append(account['resAccount'])
                else:
                    if 'resAccount' in list_result['data']:
                        account_list.append(list_result['data']['resAccount'])

        return jsonify({
            'connectedId': connected_id,
            'accountList': account_list
        })

    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500

# 더미 모드 상태 확인 및 제어 엔드포인트
@app.route('/dummy-mode/status', methods=['GET'])
def get_dummy_mode_status():
    return jsonify({
        'dummyMode': USE_DUMMY_MODE,
        'message': '더미 모드가 활성화되어 있습니다.' if USE_DUMMY_MODE else 'Codef API가 정상 작동중입니다.'
    })

@app.route('/dummy-mode/toggle', methods=['POST'])
def toggle_dummy_mode():
    global USE_DUMMY_MODE
    USE_DUMMY_MODE = not USE_DUMMY_MODE
    return jsonify({
        'dummyMode': USE_DUMMY_MODE,
        'message': f'더미 모드가 {"활성화" if USE_DUMMY_MODE else "비활성화"}되었습니다.'
    })

if __name__ == '__main__':
    print(f"Flask 서버 시작 - 더미 모드: {'활성화' if USE_DUMMY_MODE else '비활성화'}")
    app.run(debug=True, host='0.0.0.0', port=5000)