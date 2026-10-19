package com.ems.event;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
@RestController @RequestMapping("/events") public class PingController { @GetMapping("/ping") public Map<String,String> ping(){return Map.of("service","event-service","status","UP");} }
