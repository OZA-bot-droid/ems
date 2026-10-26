package com.ems.interaction.DbTest;

import java.util.Map;

import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

//db 연결 테스트용
@RestController
@RequestMapping("/interactions")
public class DbTestController {

    private final JdbcTemplate jdbcTemplate;

    public DbTestController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    // PostgreSQL 연결 상태 테스트
    @GetMapping("/db-test")
    public ResponseEntity<Map<String, Object>> dbTest() {

        try {
            // 실제 DB에 SQL 실행
            Integer result = jdbcTemplate.queryForObject(
                    "SELECT 1",
                    Integer.class
            );

            // DB 연결 성공
            if (Integer.valueOf(1).equals(result)) {
                return ResponseEntity.ok(
                        Map.of(
                                "service", "interaction-service",
                                "database", "PostgreSQL",
                                "status", "UP",
                                "message", "DB 연결 성공"
                        )
                );
            }

            return ResponseEntity.status(
                    HttpStatus.SERVICE_UNAVAILABLE
            ).body(Map.of(
                    "status", "DOWN",
                    "message", "DB 테스트 결과가 올바르지 않습니다."
            ));

        } catch (DataAccessException e) {

            // DB 연결 또는 SQL 실행 실패
            return ResponseEntity.status(
                    HttpStatus.SERVICE_UNAVAILABLE
            ).body(Map.of(
                    "service", "interaction-service",
                    "status", "DOWN",
                    "message", "DB 연결 실패"
            ));
        }
    }
}