package com.example.quickagenda.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class FormFieldDto {
    private Long id;
    private String type;
    private String label;
    private boolean required;
    private int orderIndex;
    private String optionsJson;
    private String configJson;
}
