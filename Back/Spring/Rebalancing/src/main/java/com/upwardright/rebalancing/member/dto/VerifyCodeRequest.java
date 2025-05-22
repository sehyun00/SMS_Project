package com.upwardright.rebalancing.member.dto;

import jakarta.validation.constraints.Email;

public record VerifyCodeRequest(@Email String email, String code) {}
