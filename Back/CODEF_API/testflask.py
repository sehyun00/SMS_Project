from flask import Flask, request, jsonify
import base64
from Crypto.PublicKey import RSA
from Crypto.Cipher import PKCS1_v1_5 as Cipher_PKCS1_v1_5
import requests
import json
import urllib.parse
from dotenv import load_dotenv
import os

# .env 파일 로드
load_dotenv()

app = Flask(__name__)

# 환경변수에서 설정 로드
CLIENT_ID = os.getenv('CODEF_CLIENT_ID')
CLIENT_SECRET = os.getenv('CODEF_CLIENT_SECRET')
PUBLIC_KEY = os.getenv('CODEF_PUBLIC_KEY')

# 환경변수 검증
if not all([CLIENT_ID, CLIENT_SECRET, PUBLIC_KEY]):
    raise Exception("필요한 환경변수가 설정되지 않았습니다. .env 파일을 확인해주세요.")


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
        required_fields = ['organization', 'connectedId', 'account', 'accountPassword']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'error': f'필수 필드가 누락되었습니다: {field}'
                }), 400

        # 계좌 비밀번호 암호화
        encrypted_password = publicEncRSA(PUBLIC_KEY, data['accountPassword'])
        if not encrypted_password:
            return jsonify({
                'error': '비밀번호 암호화 실패'
            }), 500

        # API 요청 데이터
        payload = {
            'organization': data['organization'],
            'connectedId': data['connectedId'],
            'account': data['account'],
            'accountPassword': encrypted_password,
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

        return jsonify(json.loads(decoded_response))

    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500


if __name__ == '__main__':
    app.run(debug=True)