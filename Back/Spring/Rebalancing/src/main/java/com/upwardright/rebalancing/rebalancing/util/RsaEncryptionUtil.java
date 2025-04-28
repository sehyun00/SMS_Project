package com.upwardright.rebalancing.rebalancing.util;

import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import java.security.KeyFactory;
import java.security.PublicKey;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;

@Component
public class RsaEncryptionUtil {

    /**
     * RSA 공개키로 데이터를 암호화합니다.
     * @param publicKeyString Base64 인코딩된 공개키
     * @param data 암호화할 데이터
     * @return Base64 인코딩된 암호화 데이터
     */
    public String encryptRSA(String publicKeyString, String data) {
        try {
            // Base64 디코딩하여 공개키 바이트 배열 얻기
            byte[] keyDER = Base64.getDecoder().decode(publicKeyString);

            // 공개키 객체 생성
            KeyFactory keyFactory = KeyFactory.getInstance("RSA");
            PublicKey publicKey = keyFactory.generatePublic(new X509EncodedKeySpec(keyDER));

            // RSA 암호화
            Cipher cipher = Cipher.getInstance("RSA/ECB/PKCS1Padding");
            cipher.init(Cipher.ENCRYPT_MODE, publicKey);
            byte[] encryptedBytes = cipher.doFinal(data.getBytes());

            // Base64 인코딩하여 결과 반환
            String encryptedData = Base64.getEncoder().encodeToString(encryptedBytes);
            System.out.println("encryptedData = " + encryptedData);

            return encryptedData;
        } catch (Exception e) {
            throw new RuntimeException("RSA 암호화 중 오류 발생: " + e.getMessage(), e);
        }
    }
}
