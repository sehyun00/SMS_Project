package com.upwardright.reblancing1.member.controller;

import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;


@RestController
public class LoginController {

    @GetMapping("/upwardright/login")
    public String login(Model model) {

        model.addAttribute("test", "안녕하세요~!");
        return "index";
    }

    @PostMapping("/upwardright/login")
    public String loginProcess(@RequestBody String entity) {
        //TODO: 로그인 처리 ->service에서 만들어
        
        return entity;
    }
}
