package com.example.quickagenda.controller;

import com.example.quickagenda.dto.FormConfigResponse;
import com.example.quickagenda.dto.FormSubmitRequest;
import com.example.quickagenda.dto.FormUpsertRequest;
import com.example.quickagenda.service.FormService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/events/{code}/form")
public class FormController {

    private final FormService formService;

    public FormController(FormService formService) {
        this.formService = formService;
    }

    // Organizer endpoints (no auth in this MVP)
    @GetMapping("/admin")
    public ResponseEntity<FormConfigResponse> getAdmin(@PathVariable("code") String code) {
        return ResponseEntity.ok(formService.getAdminForm(code));
    }

    @PutMapping("/admin")
    public ResponseEntity<Void> upsert(@PathVariable("code") String code,
                                       @RequestBody FormUpsertRequest req) {
        formService.upsertForm(code, req);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }

    // Public endpoints (invitees)
    @GetMapping
    public ResponseEntity<FormConfigResponse> getPublic(@PathVariable("code") String code,
                                                        @RequestParam("email") String email) {
        return ResponseEntity.ok(formService.getPublicForm(code, email));
    }

    @PostMapping("/submit")
    public ResponseEntity<Void> submit(@PathVariable("code") String code,
                                       @RequestBody FormSubmitRequest body) {
        formService.submit(code, body);
        return ResponseEntity.ok().build();
    }
}
