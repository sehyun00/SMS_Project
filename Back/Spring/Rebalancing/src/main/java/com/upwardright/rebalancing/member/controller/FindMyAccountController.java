package com.upwardright.rebalancing.member.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;



@RestController
public class FindMyAccountController {
    
    @GetMapping("/upwardright/findmyaccount")
    public String findMyAccount() {
        return "next auth email";
    }

    @GetMapping("/upwardright/findmyaccount/authemailsuccess/{userid}")
    public String changePassword() {
        return "changepassword";
    }

    @PostMapping("upwardright/findmyaccount/authemailsuccess/{userid}")
    public String changePasswordProcess(@RequestBody String entity) {
        //TODO: 비밀번호 변경 처리 ->service에서
        return entity;
    }
    
}
