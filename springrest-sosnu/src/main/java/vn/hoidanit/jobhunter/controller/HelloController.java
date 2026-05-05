package vn.hoidanit.JobZone.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import vn.hoidanit.JobZone.util.error.IdInvalidException;

@RestController
public class HelloController {

    @GetMapping("/")
    public String getHelloWorld() throws IdInvalidException {

        return "Hello World (Hỏi Dân IT & SOS Nu)";
    }
}
