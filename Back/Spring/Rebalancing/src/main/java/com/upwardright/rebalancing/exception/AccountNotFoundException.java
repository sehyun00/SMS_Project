package com.upwardright.rebalancing.exception;

/*
    계좌를 불러올 수 없을 때 예외처리
 */
public class AccountNotFoundException extends RuntimeException {
    public AccountNotFoundException(String message) {
        super(message);
    }
}
