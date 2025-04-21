package com.upwardright.rebalancing.reblancing.controller;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;



@RestController
public class ReblancingController {

    @GetMapping("/upwardright/mystockaccount")
    public String myStockAccount(Authentication authentication) {
        // 인증된 사용자의 ID 가져오기
        String userId = authentication.getName();

        // 사용자별 계좌 정보 조회 로직
        return "계정 " + userId + "의 주식 계좌 정보";
    }
    
    @GetMapping("/upwardright/addstockaccount")
    public String addStockAccount(Authentication authentication) {
        return "add account";
    }

    @GetMapping("/upwardright/mystockaccount/reblancing")
    public String reblancing(Authentication authentication) {
        return "reblancing";
    }

    @PostMapping("/upwardright/addstockaccount")
    public String addStockAccountProcess(@RequestBody String entity) {
        //TODO: 계좌 정보 받아서 codef api 처리 
        return entity;
    }

    @PostMapping("/upwardright/mystockaccount")
    public String myStockAccount(@RequestBody String entity) {
        //TODO: 계좌 정보 표현? 아마도?
        return entity;
    }

    @PostMapping("/upwardright/mystockaccount/reblancing")
    public String reblancingProcess(@RequestBody String entity) {
        //TODO: AI모델을 통해 리벨런싱 처리 진행
        return entity;
    }
    
}
