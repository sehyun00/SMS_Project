import requests
import json
import urllib.parse
import base64
from Crypto.PublicKey import RSA
from Crypto.Cipher import PKCS1_v1_5 as Cipher_PKCS1_v1_5

def publicEncRSA(publicKey, data):
    try:
        # publicKey 매개변수 사용 (pubKey가 아님)
        keyDER = base64.b64decode(publicKey)
        keyPub = RSA.importKey(keyDER)
        cipher = Cipher_PKCS1_v1_5.new(keyPub)
        cipher_text = cipher.encrypt(data.encode())

        encryptedData = base64.b64encode(cipher_text)
        # 문자열로 디코딩하여 출력
        print('encryptedData = ' + encryptedData.decode('utf-8'))

        return encryptedData.decode('utf-8')  # 문자열로 반환
    except Exception as e:
        print(f"암호화 오류: {e}")
        return None


# CODEF 공개키
public_key = "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAigkIMqekH94rBU787WJJQs/UNgb2+V+MOBfEX30jox8/bC6jXsEjl05JEDDg4krz+0MfoTGtBrTb2yOD38jG2Y4dyk9MCU8rINpDRgiDlSXvh2uzcZtyF7xU9lBV5wDWo1YIiee5pM27YbsKVgZVBEZVmjYvdmA5TWtE//zB5zs65T5ykdkdsTusKPMeKkdckj/K0dfWA1R/8dbo/nUKhGHQvoJOlw4N5w8CAgtuwSVl4O+4CNSR5izeAYF1haC94aKP0DgfusJTgMWXCXDCZzZ0D2bWVy6IyunM/2cnUI+iUk7dhL8x+q48sfiZiR+fQcaeQmHrMTSA02v30AAjUQIDAQAB"

# 비밀번호 암호화
password = "Plmoknqaz15!"  # 실제 비밀번호
encrypted_password = publicEncRSA(public_key, password)

# 암호화된 비밀번호 출력해서 확인
print("암호화된 비밀번호:", encrypted_password)

# API 요청 데이터
payload = {
    'accountList': [
        {
            'countryCode': "KR",
            'businessType': 'ST',
            'organization': '0243',
            'loginType': '1',
            'clientType': 'P',
            'id': 'lks2800',
            'password': encrypted_password
        }
    ]
}

# API 요청
url = "https://development.codef.io/v1/account/create"
headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZXJ2aWNlX3R5cGUiOiIxIiwic2NvcGUiOlsicmVhZCIsIndyaXRlIl0sInNlcnZpY2Vfbm8iOiIwMDAwMDU0NTQwMDIiLCJleHAiOjE3NDU1MDE4NDUsImF1dGhvcml0aWVzIjpbIklOU1VSQU5DRSIsIlBVQkxJQyIsIkJBTksiLCJFVEMiLCJTVE9DSyIsIkNBUkQiXSwianRpIjoiMjgwMjgwZjAtYTBlZS00NDE2LThiMmYtODY5YTYxNWEyZTlhIiwiY2xpZW50X2lkIjoiMTA3ZGUyM2EtOGQ2YS00YTllLTgyNmMtMTMxZDNlMTJkM2ZjIn0.TbNMX9KezFmz27ciUDbBUMYqIlhj52EE7kctz1LKqPSYQzkseYBhnQCYa9aBkHnH2W1o4TW1ig99xGodbg0yv-VzzB2viBL8WB-HO6KmaI1wwkzfw8B5Yl52gqiGdPetaJQOzFa8u0dmJm2kq_sg9dHwGXDld8JZIgvUaubKt6D2EkAiTI2WwLyHbGKE0DsGnJe5vIxNeqGT1dpXtAVTk9ty72FevFSUTDOAQpnAkQBetmtGP6xOG6a7nfe694kW2REijYeiqt8-NOHh1mbEJWlhYH3NywzMB15p2qVJa6BWMUS-MAGUrN9S5zYF0GCJuneLi-9iOHWt02FkQYpsKA'
}

response = requests.post(url, headers=headers, json=payload)  # data= 대신 json= 사용
decoded_response = urllib.parse.unquote(response.text)
json_response = json.loads(decoded_response)
print(json.dumps(json_response, indent=2, ensure_ascii=False))