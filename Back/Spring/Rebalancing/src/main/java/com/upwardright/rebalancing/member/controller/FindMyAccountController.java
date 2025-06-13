package com.upwardright.rebalancing.member.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

/*
    추후 개발 사항 사용자 정보 변경
 */
@RequiredArgsConstructor
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
