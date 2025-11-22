package com.example.quickagenda.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "form_fields")
public class FormField {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "form_id", nullable = false)
    private Form form;

    @Column(nullable = false)
    private String type; // short_text, long_text, single_select, multi_select, yes_no, number, date, etc.

    @Column(nullable = false)
    private String label;

    @Column(name = "is_required")
    private boolean required;

    @Column(name = "order_index")
    private int orderIndex;

    @Column(name = "options_json", columnDefinition = "text")
    private String optionsJson; // JSON array of strings for select options

    @Column(name = "config_json", columnDefinition = "text")
    private String configJson; // extra per-type config as JSON
}
