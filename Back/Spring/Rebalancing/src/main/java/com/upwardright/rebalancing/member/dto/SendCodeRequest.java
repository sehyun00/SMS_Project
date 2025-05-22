package com.upwardright.rebalancing.member.dto;

import jakarta.validation.constraints.Email;

public record SendCodeRequest(@Email String email) {}
