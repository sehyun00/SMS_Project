package com.upwardright.rebalancing.exception;


/*
    유저 오류 예외처리
 */
public class UserException extends RuntimeException {
    public UserException(String message) {
        super(message);
    }
}