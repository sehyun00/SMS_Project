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

    // CODEF API 토큰 및 설정 정보 (실제 환경에서는 설정 파일에서 관리)
    private static final String CODEF_API_URL = "https://development.codef.io";
    private static final String CODEF_API_TOKEN = "your-token-here";

    // 매개변수를 2개만 받도록 수정
    public boolean validateAccount(String company, String account) {
        try {
            // API 요청 데이터 구성 (ID와 비밀번호 없이 간소화된 버전)
            Map<String, Object> accountInfo = new HashMap<>();
            accountInfo.put("countryCode", "KR");
            accountInfo.put("businessType", "ST");
            accountInfo.put("organization", company);
            accountInfo.put("account", account);

            Map<String, Object> payload = new HashMap<>();
            payload.put("accountList", new Object[] { accountInfo });

            // API 요청 헤더 설정
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Bearer " + CODEF_API_TOKEN);

            // API 호출
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);
            ResponseEntity<Map> response = restTemplate.exchange(
                    CODEF_API_URL + "/v1/account/verify", // 계좌 검증용 가상 엔드포인트
                    HttpMethod.POST,
                    entity,
                    Map.class
            );

            // 응답 처리
            Map<String, Object> responseBody = response.getBody();
            return validateResponse(responseBody, account);
        } catch (Exception e) {
            throw new RuntimeException("CODEF API 호출 중 오류 발생: " + e.getMessage());
        }
    }

    private boolean validateResponse(Map<String, Object> response, String account) {
        // API 응답을 검증하는 로직 구현
        // 예: 계좌 번호가 일치하는지 확인
        return true; // 실제 구현에서는 응답 데이터 검증 후 반환
    }
}
