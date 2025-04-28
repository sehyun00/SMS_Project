package com.upwardright.rebalancing.rebalancing.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CodefApiService {
    private final RestTemplate restTemplate = new RestTemplate();

    // CODEF API 기본 URL 및 인증 정보
    private static final String CODEF_API_URL = "https://development.codef.io";
    private static final String CODEF_API_USERNAME = "107de23a-8d6a-4a9e-826c-131d3e12d3fc";
    private static final String CODEF_API_PASSWORD = "a7ec91b2-2c31-40b7-a000-09f92b9a3899";

    /**
     * 증권사 계좌 정보 조회
     */
    public Map<String, Object> getStockAccountInfo(String securitiesCompany, String accountNumber, String password) {
        try {
            // API 요청 데이터 구성
            Map<String, Object> accountInfo = new HashMap<>();
            accountInfo.put("countryCode", "KR");
            accountInfo.put("businessType", "ST");
            accountInfo.put("organization", securitiesCompany);
            accountInfo.put("account", accountNumber);
            accountInfo.put("password", password);

            Map<String, Object> payload = new HashMap<>();
            payload.put("accountList", new Object[] { accountInfo });

            // API 요청 헤더 설정 - Basic Auth 사용
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBasicAuth(CODEF_API_USERNAME, CODEF_API_PASSWORD);

            // API 호출
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);
            ResponseEntity<Map> response = restTemplate.exchange(
                    CODEF_API_URL + "/v1/account/securities",  // 증권사 계좌 조회 엔드포인트
                    HttpMethod.POST,
                    entity,
                    Map.class
            );

            return response.getBody();
        } catch (Exception e) {
            throw new RuntimeException("CODEF API 호출 중 오류 발생: " + e.getMessage());
        }
    }
}
