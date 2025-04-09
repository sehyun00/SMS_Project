package com.upwardright.reblancing1.reblancing.controller;

import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;



@RestController
public class ReblancingController {
    
    @GetMapping("/upwardright/addstockaccount")
    public String addStockAccount(@RequestParam String param) {
        return "add account";
    }
    
    @GetMapping("/upwardright/mystockaccount")
    public String myStockAccount(){
        return "myStockAccount";
    }

    @GetMapping("/upwardright/mystockaccount/reblancing")
    public String reblancing(@RequestParam String param) {
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
