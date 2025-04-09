package com.upwardright.reblancing1.member.controller;

import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class SignController {

    @GetMapping("/upwardright/signup")
    public String signup(Model model) {
        model.addAttribute("signup_test", "회원가입 페이지입니다.");
        return "signup";
    }
    

    @PostMapping("/upwardright/signup")
    public String signup(@RequestBody String entity) {
        //TODO: 사용자가 입력한 값 처리 -> service에서 만들기 
        return entity;
    }
}
