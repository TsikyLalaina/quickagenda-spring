package com.example.quickagenda.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "form_responses", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"form_id", "email"})
})
public class FormResponse {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "form_id", nullable = false)
    private Form form;

    @Column(nullable = false)
    private String email;

    @Column(name = "answers_json", columnDefinition = "text")
    private String answersJson;

    @Column(columnDefinition = "timestamptz")
    private OffsetDateTime createdAt;

    @Column(columnDefinition = "timestamptz")
    private OffsetDateTime updatedAt;
}
