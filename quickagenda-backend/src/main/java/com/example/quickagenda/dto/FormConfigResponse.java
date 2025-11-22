package com.example.quickagenda.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class FormConfigResponse {
    private Long formId;
    private String title;
    private boolean active;
    private OffsetDateTime openAt;
    private OffsetDateTime closeAt;
    private List<FormFieldDto> fields;
}
