package com.upwardright.rebalancing.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import jakarta.annotation.PostConstruct; // javax 대신 jakarta 사용
import java.io.File;
import java.io.FileOutputStream;
import java.nio.file.Files;
import java.security.*;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import javax.crypto.Cipher;
import java.util.Base64;

@Component
public class RSAUtil {

    private static final String RSA = "RSA";

    @Value("${rsa.key.directory:./keys}")
    private String keyDirectory;

    private PublicKey publicKey;
    private PrivateKey privateKey;

    @PostConstruct
    public void init() {
        try {
            File directory = new File(keyDirectory);
            if (!directory.exists()) {
                directory.mkdirs();
            }

            File publicKeyFile = new File(directory, "public.key");
            File privateKeyFile = new File(directory, "private.key");

            // 키 파일이 없으면 새로 생성
            if (!publicKeyFile.exists() || !privateKeyFile.exists()) {
                generateAndSaveKeys(publicKeyFile, privateKeyFile);
            } else {
                // 기존 키 파일에서 로드
                loadKeys(publicKeyFile, privateKeyFile);
            }

        } catch (Exception e) {
            throw new RuntimeException("RSA 키 초기화 실패", e);
        }
    }

    private void generateAndSaveKeys(File publicKeyFile, File privateKeyFile) throws Exception {
        // 키 쌍 생성
        KeyPairGenerator keyPairGenerator = KeyPairGenerator.getInstance(RSA);
        keyPairGenerator.initialize(2048);
        KeyPair keyPair = keyPairGenerator.generateKeyPair();

        this.publicKey = keyPair.getPublic();
        this.privateKey = keyPair.getPrivate();

        // 공개키 저장
        try (FileOutputStream fos = new FileOutputStream(publicKeyFile)) {
            fos.write(publicKey.getEncoded());
        }

        // 개인키 저장
        try (FileOutputStream fos = new FileOutputStream(privateKeyFile)) {
            fos.write(privateKey.getEncoded());
        }
    }

    private void loadKeys(File publicKeyFile, File privateKeyFile) throws Exception {
        // 공개키 로드
        byte[] publicKeyBytes = Files.readAllBytes(publicKeyFile.toPath());
        X509EncodedKeySpec publicKeySpec = new X509EncodedKeySpec(publicKeyBytes);
        KeyFactory keyFactory = KeyFactory.getInstance(RSA);
        this.publicKey = keyFactory.generatePublic(publicKeySpec);

        // 개인키 로드
        byte[] privateKeyBytes = Files.readAllBytes(privateKeyFile.toPath());
        PKCS8EncodedKeySpec privateKeySpec = new PKCS8EncodedKeySpec(privateKeyBytes);
        this.privateKey = keyFactory.generatePrivate(privateKeySpec);
    }

    // 공개키 getter
    public PublicKey getPublicKey() {
        return this.publicKey;
    }

    // 암호화 메서드
    public String encrypt(String plainText) throws Exception {
        Cipher cipher = Cipher.getInstance(RSA);
        cipher.init(Cipher.ENCRYPT_MODE, this.publicKey);
        byte[] encryptedBytes = cipher.doFinal(plainText.getBytes());
        return Base64.getEncoder().encodeToString(encryptedBytes);
    }

    // 복호화 메서드
    public String decrypt(String encryptedText) throws Exception {
        Cipher cipher = Cipher.getInstance(RSA);
        cipher.init(Cipher.DECRYPT_MODE, this.privateKey);
        byte[] decryptedBytes = cipher.doFinal(Base64.getDecoder().decode(encryptedText));
        return new String(decryptedBytes);
    }
}
