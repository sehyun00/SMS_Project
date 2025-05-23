package com.upwardright.rebalancing.rebalancing.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

@RequiredArgsConstructor
@RestController
public class RebalancingRecordConroller {

    @GetMapping("/upwardright/mystockaccount/record")
    public String reblancingRecord(@RequestParam String param) {
        return "reblancing list";
    }

    @GetMapping("/upwardright/mystockaccount/record/{date}")
    public String reblancingRecordDetail(@RequestParam String param) {
        return "reblancing Date";
    }
    
    
    
}
