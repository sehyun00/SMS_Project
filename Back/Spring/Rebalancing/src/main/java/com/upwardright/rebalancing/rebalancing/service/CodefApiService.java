package com.upwardright.rebalancing.rebalancing.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.upwardright.rebalancing.rebalancing.util.RsaEncryptionUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CodefApiService {
    private final RestTemplate restTemplate = new RestTemplate();
    private final RsaEncryptionUtil rsaEncryptionUtil;
    private final ObjectMapper objectMapper = new ObjectMapper();

    // CODEF API 토큰 및 설정 정보
    private static final String CODEF_API_URL = "https://development.codef.io/";
    private static final String CODEF_API_TOKEN = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZXJ2aWNlX3R5cGUiOiIxIiwic2NvcGUiOlsicmVhZCIsIndyaXRlIl0sInNlcnZpY2Vfbm8iOiIwMDAwMDU0NTQwMDIiLCJleHAiOjE3NDYxOTQ5OTUsImF1dGhvcml0aWVzIjpbIklOU1VSQU5DRSIsIlBVQkxJQyIsIkJBTksiLCJFVEMiLCJTVE9DSyIsIkNBUkQiXSwianRpIjoiYzZhYzBhZjMtMzMxMy00NjQ3LTg0NTMtOTljZTQ4Yjk3NGRmIiwiY2xpZW50X2lkIjoiMTA3ZGUyM2EtOGQ2YS00YTllLTgyNmMtMTMxZDNlMTJkM2ZjIn0.eEDZagLRTe7bsJzKiuVXplVaUQk7mROyQLEAsjfCplEeGwh2eYRevco8p-YFFYphzl2MY_YpwoKNJYZcRHyFK9o4ZGhc46QsYXruc_wpuuxc9TmCox6BDqJQPTE-0zSgnVsZM78tsdPS2M8WJ7pegYdDfZWGm7oeDsfjSVkQoxXw6G0HEnFpHotgYs1P99I0NJE3hX9kSZFsCV4LBqjPPI67PC3EW4k33R0N_LkNypBnQIbuPZzZCzt9eJ5_x203t7GDTvNNTvgoRK-mzd-QiHoQEsjTVbD7e2lmq93ELBAsvKD7CtUqbXxkrlTAO2nsBk546qQKJabo80b_M8mOyQ";
    private static final String CODEF_PUBLIC_KEY = "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAigkIMqekH94rBU787WJJQs/UNgb2+V+MOBfEX30jox8/bC6jXsEjl05JEDDg4krz+0MfoTGtBrTb2yOD38jG2Y4dyk9MCU8rINpDRgiDlSXvh2uzcZtyF7xU9lBV5wDWo1YIiee5pM27YbsKVgZVBEZVmjYvdmA5TWtE//zB5zs65T5ykdkdsTusKPMeKkdckj/K0dfWA1R/8dbo/nUKhGHQvoJOlw4N5w8CAgtuwSVl4O+4CNSR5izeAYF1haC94aKP0DgfusJTgMWXCXDCZzZ0D2bWVy6IyunM/2cnUI+iUk7dhL8x+q48sfiZiR+fQcaeQmHrMTSA02v30AAjUQIDAQAB";

    /**
     * 계좌 정보 검증 및 잔액 조회
     */
    public boolean validateAccount(String company, String account, String password) {
        try {
            // 비밀번호 RSA 암호화
            String encryptedPassword = rsaEncryptionUtil.encryptRSA(CODEF_PUBLIC_KEY, password);

            // API 요청 데이터 구성
            Map<String, Object> payload = new HashMap<>();
            payload.put("organization", company);
            payload.put("connectedId", "bon0PVqiALjbFybD96Oat7"); // 실제 환경에서는 사용자별 connectedId 사용
            payload.put("account", account);
            payload.put("accountPassword", encryptedPassword);
            payload.put("id", "");
            payload.put("add_password", "");

            // API 요청 헤더 설정
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Bearer " + CODEF_API_TOKEN);

            // API 호출
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);
            ResponseEntity<String> response = restTemplate.exchange(
                    CODEF_API_URL + "v1/kr/stock/a/account/balance-inquiry",
                    HttpMethod.POST,
                    entity,
                    String.class
            );

            // URL 디코딩 및 JSON 파싱
            String decodedResponse = URLDecoder.decode(response.getBody(), StandardCharsets.UTF_8);
            Map<String, Object> responseMap = objectMapper.readValue(decodedResponse, Map.class);

            // 응답 확인
            System.out.println("API 응답: " + decodedResponse);

            // 응답 코드 확인 (예: 성공은 "CF-00000")
            String code = (String) responseMap.get("code");
            return "CF-00000".equals(code);

        } catch (Exception e) {
            System.err.println("CODEF API 호출 중 오류 발생: " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }

    /**
     * 간단한 계좌 검증 (비밀번호 없이)
     */
    public boolean validateAccount(String company, String account) {
        // 실제 환경에서는 항상 비밀번호가 필요할 수 있습니다.
        // 테스트 목적으로 간단하게 true 반환하거나, 다른 API 엔드포인트를 사용할 수 있습니다.
        return true;
    }

    /**
     * 계좌 잔액 및 보유 종목 상세 정보 조회
     */
    public Map<String, Object> getAccountDetails(String company, String account, String password) {
        try {
            // 비밀번호 RSA 암호화
            String encryptedPassword = rsaEncryptionUtil.encryptRSA(CODEF_PUBLIC_KEY, password);

            // API 요청 데이터 구성
            Map<String, Object> payload = new HashMap<>();
            payload.put("organization", company);
            payload.put("connectedId", "bon0PVqiALjbFybD96Oat7"); // 실제 환경에서는 사용자별 connectedId 사용
            payload.put("account", account);
            payload.put("accountPassword", encryptedPassword);
            payload.put("id", "");
            payload.put("add_password", "");

            // API 요청 헤더 설정
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Bearer " + CODEF_API_TOKEN);

            // API 호출
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);
            ResponseEntity<String> response = restTemplate.exchange(
                    CODEF_API_URL + "v1/kr/stock/a/account/balance-inquiry",
                    HttpMethod.POST,
                    entity,
                    String.class
            );

            // URL 디코딩 및 JSON 파싱
            String decodedResponse = URLDecoder.decode(response.getBody(), StandardCharsets.UTF_8);
            return objectMapper.readValue(decodedResponse, Map.class);

        } catch (Exception e) {
            throw new RuntimeException("계좌 정보 조회 중 오류 발생: " + e.getMessage(), e);
        }
    }
}
