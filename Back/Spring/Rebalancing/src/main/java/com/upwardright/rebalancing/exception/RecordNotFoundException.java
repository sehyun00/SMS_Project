package com.upwardright.rebalancing.exception;

/*
    리벨런싱 기록을 불러올 수 없을 때 예외처리
 */
public class RecordNotFoundException extends RuntimeException {
    public RecordNotFoundException(String message) {
        super(message);
    }
}