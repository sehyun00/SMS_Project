package com.upwardright.rebalancing.reblancing.controller;

import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;


@RestController
public class ReblancingRecordConroller {

    @GetMapping("/upwardright/mystockaccount/record")
    public String reblancingRecord(@RequestParam String param) {
        return "reblancing list";
    }

    @GetMapping("/upwardright/mystockaccount/record/{date}")
    public String reblancingRecordDetail(@RequestParam String param) {
        return "reblancing Date";
    }
    
    
    
}
