package com.upwardright.rebalancing.exception;

public enum UserExceptionType {
    SEND_MAIL_FAILED("이메일 발송에 실패했습니다");

    private final String message;

    UserExceptionType(String message) {
        this.message = message;
    }

    public String getMessage() {
        return message;
    }
}