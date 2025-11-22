package com.example.quickagenda.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class FormSubmitRequest {
    private String email;
    private Map<String, Object> answers; // key can be field id or a slug; we'll use field id as string
}
